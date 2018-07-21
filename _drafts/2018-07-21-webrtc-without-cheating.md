---
layout: post
title: WebRTC file transfer sample without cheating
permalink: webrtc-without-cheating
date: 2018-07-21
---

WebRTC is a real time communication API built into modern browsers. It enables developers to build audio and video conferencing peer2peer web applications, and exchange of arbitrary data. Most modern browsers implement the WebRTC specification allowing cross browsers audio and video calls. There already are very good sample applications showing how to implement various features on [https://webrtc.github.io/samples/][1], and an extensive reference on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API).

This post basically re-implements the file transfer sample, but without cheating.

## "Cheating"

The WebRTC file transfer sample (and all other samples on [https://webrtc.github.io/samples/][1]) cheat by making all peer2peer exchanges from the local browser to the local browser. They still use the WebRTC API for the application, however they circumvent the implementation of the "signaling" layer by simply managing two WebRTC endpoints on the same web page.

### Signaling

The "signaling" layer in any real time communication application is the mechanism through which the two peers are initially put into contact with each other, independently of the peer2peer connection that will follow.

Most RTC applications rely on peers to establish a direct connection with each other and exchange data directly, without any data relay[^1]. The peer2peer negotiation attempts to achieve two main goals: (1) direct peer2peer connectivity, (2) establishment of one or more data/media channels.

Before any of that can happen, the two peers must be first put into contact with each other via independent, implementation specific means. For example, a chat application may maintain some concept of "account" or "identity" and have a system in place to publish user status across the system (e.g. "online", "offline" etc). It may choose to leverage the same delivery system to begin a peer2peer negotiation between two separate such "identities".

Hence my greivance with the way the samples circumvent the need for signaling by making both peer endpoints local: it does not represent a real-life example of how you could put peers into contact and enable them to begin negotiating.

## Without cheating

Enter this little, basic, ugly project: [https://github.com/nterreri/p2p-file-transfer](https://github.com/nterreri/p2p-file-transfer).

Little, because it is limited in scope: it exemplifies (real) peer2peer browser agnostic file transfer and nothing else.
Basic, because it makes no concessions to the browser it runs on and is not very user friendly, a toy project.
Ugly, because the core client implementation is in a monolithic, inflexible module (written that way to experiment with procedural JS).

This project allows a two clients to connect to a static file-serving server, then "register" themselves as the "sender" and "receiver" of a file. The sender then initiates a peer2peer connection with the "receiver" by sending negotiation information to the server, which (via web-sockets) relays the information to the "receiver". Then the receiver symmetrically sends its negotiation information to the server, which relays it to the sender. All subsequent steps are client side, and do not involve server interaction.

Let's take a look at the server in more detail.

### The Signaling protocol

The signaling layer is more or less as minimal as it can be: any client (indeed any socket connection) may register as either an "offerer" and an "answerer", then offers/answers are relayed between the two ... as well as any "ICE" messages ...

Wait a minute what does that mean?

{% highlight javascript %}
if (payload.type === 'registerAnswerer') {
    answerer = connection;
}

if (payload.type === 'offer') {
    offerer = connection;

    answerer.send(JSON.stringify(payload));
}

if (payload.type === 'answer') {
    offerer.send(JSON.stringify(payload));
}

if (payload.type === 'ICE-offerer') {
    answerer.send(JSON.stringify({type: 'ICE', candidate: payload.candidate}));
}

if (payload.type === 'ICE-answerer') {
    offerer.send(JSON.stringify({type: 'ICE', candidate: payload.candidate}));
    }
{% endhighlight %}

#### Offer, Answer and breaking the ICE

The WebRTC protocol is built on top of existing RTC standards and concepts. The offerer/answerer model comes from traditional peer2peer RTC concepts representing the "initiating" party and the "responding" party. The initial data exchange is a plain text human-readable Session Description Protocol document (SDP) that describes objectives 1 and 2 of a peer2peer connection: the peer tells the other "here is where you reach me over network" and "here is what I would like to do" (session description).

This is what an SDP document sent from Chrome to FireFox may look like:

[^1]: This isn't strictly true, in some network configurations direct peer2peer communication is impossible, and a data relay server is used (see [TURN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols)).

[1]: https://webrtc.github.io/samples/
