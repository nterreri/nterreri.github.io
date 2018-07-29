---
layout: post
title: WebRTC file transfer sample without cheating
permalink: webrtc-without-cheating
date: 2018-07-29
---

WebRTC is a real time communication API built into modern browsers. It enables developers to build audio and video conferencing peer2peer web applications, exchange of arbitrary data and more. Most modern browsers implement the WebRTC specification allowing cross browsers audio and video calls. There already are very good sample applications showing how to implement various features on [https://webrtc.github.io/samples/][1], and an extensive reference on [MDN][2].

This post basically re-implements the file transfer sample from above, but without cheating.

## "Cheating"

The WebRTC file transfer sample (and all other samples on [https://webrtc.github.io/samples/][1]) cheat by making all peer2peer exchanges from the local browser window. They still use the WebRTC API for the application, however they circumvent the implementation of the "signaling" layer by simply managing two WebRTC endpoints on the same web page.

### Signaling

In any real time communication application the "signaling" layer is the mechanism through which the two peers are initially put into contact with each other, independently of the peer2peer connection that will follow.

Most RTC applications rely on peers to establish a direct connection with each other and exchange data directly, without an intermediary server relaying data between the two[^1]. The peer2peer negotiation attempts to achieve two goals: (1) direct peer2peer connectivity, (2) establishment of one or more data/media channels.

Before any of this can happen however, the two peers must be first put into contact with each other via independent, implementation specific means. For example, a chat application may maintain some concept of "account" or "identity" and have a system in place to publish user status across the system (e.g. "online", "offline" etc). It may choose to leverage the same delivery system to begin a peer2peer negotiation between two separate such "identities".

The issue I had with the way the samples circumvent the need for signaling by making both peer endpoints local is that it does not represent a real-life example of how you could put peers into contact and enable them to begin negotiating, and I wanted an end-to-end toy project I could use to learn more about the capabilities of WebRTC.

## Without cheating

Enter this little, basic, ugly project: [https://github.com/nterreri/p2p-file-transfer](https://github.com/nterreri/p2p-file-transfer)

Little, because it is limited in scope: it exemplifies peer2peer browser agnostic file transfer and nothing else when WebRTC can do a lot more.
Basic, because it makes no concessions to the browser it runs on (no ES5 compatibility) and is not very user friendly.
Ugly, because the core client implementation is in a monolithic, inflexible module (written that way to experiment with procedural JS).

This project allows a two clients to connect to a server, then "register" themselves as the "sender" and "receiver" of a file. The sender then initiates a peer2peer connection with the "receiver" by sending negotiation information to the server, which (via web-sockets) relays the information to the "receiver". Then the receiver symmetrically sends its negotiation information to the server, which relays it to the sender. All subsequent steps are client side, and do not involve server interaction.

Let's take a look at the server in more detail.

### The Signaling protocol

The signaling layer is more or less as minimal as it can be: any client (indeed any socket connection[^2]) may register as either an "offerer" and an "answerer", then offers/answers are relayed between the two ... as well as any "ICE" messages ...

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

### Offer, Answer and breaking the ICE

The WebRTC protocol is built on top of existing RTC standards and concepts. The offerer/answerer model comes from traditional peer2peer RTC concepts representing the "initiating" party and the "responding" party. The initial data exchange is a plain text human-readable Session Description Protocol document (SDP) that describes objectives 1 and 2 of a peer2peer connection: the peer tells the other "here is where you reach me over network" and "here is what I would like to do" (session description).

This is what an SDP document sent from Chrome to FireFox may look like:

{% highlight text %}
v=0
o=- 2631320480241103754 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE data
a=msid-semantic: WMS
m=application 9 DTLS/SCTP 5000
c=IN IP4 0.0.0.0
a=ice-ufrag:4dsa
a=ice-pwd:pKJGHnMQNzouOqgz33sfz2EO
a=candidate:2243178167 1 udp 2113937151 192.168.0.32 58330 typ host generation 0 
a=ice-options:trickle
a=fingerprint:sha-256 BA:5B:0C:D3:78:6A:C4:99:16:81:3D:73:20:27:33:AB:7D:1F:41:AC:65:EC:49:C7:F9:72:41:7E:7C:D4:EB:5B
a=setup:actpass
a=mid:data
a=sctpmap:5000 webrtc-datachannel 1024
{% endhighlight %}

You don't really need to understand very much about SDP documents if your aim is to develop an application intended to work only between browsers[^3].

The "where you can reach me" part is represented by the "candidate" lines. Each of these contains an IP address and a port, and the low level networking protocols (typically UDP and TCP) to use: a "candidate" way to reach us over network. The remote peer responds in kind with their own candidates. Should the selected candidate later fail after the initial connection, a "renegotiation" should occur where the peers will try again to reach each other.

The second essential part of the SDP is the "m= ..." line. This is a "media" line, it describes what the initial offer is for, this would be "audio" or "video" for peer2peer audio/video calls, in this case "application" is used to mean "application defined/specific", and an arbitrary data exchange "webrtc-channel" is configured (as the m line specifies, the protocol of choice for the data transfer is [SCTP](https://developer.mozilla.org/en-US/docs/Glossary/SCTP)). In this case, the data channel will be used to send the file across in chunked byte sequences.

Finally, a word about security. The "fingerprint" line contains the public key of a certificate that will be used to sign all data packets sent over the peer2peer channel.

Essentially, the one of the two peers initiates a negotiation process by "offering" an initial SDP document. The receiving party "answers" with a SDP describing its response. After the two manage to successfully connect to each other media can begin to flow.

## Starting the negotiation

Creating and starting a peer connection uses the Javascript WebRTC API, which exposes several browser-implemented ["RTC-" objects][2].

{% highlight javascript %}
    const connection = new RTCPeerConnection();

    const dataChannel = connection.createDataChannel('some channel name');
    dataChannel.binarytype = 'arraybuffer';

    connection.createOffer().then(
        descr => {
            connection.setLocalDescription(descr);
            webSocket.send(JSON.stringify(descr));
        }
    );
{% endhighlight %}

In this case, the offerer creates a connection, a data channel for the file transfer and then creates and sends an SDP offer over. The answerer receives this SDP document from the server and responds in kind:

{% highlight javascript %}
    const connection = new RTCPeerConnection();

    connection.ondatachannel = (event) => {
        listenForMessages(event.channel);
    };

    connection.setRemoteDescription(offererDescription);
    connection.createAnswer().then(
        descr => {
            connection.setLocalDescription(descr);
            webSocket.send(JSON.stringify(descr));
        }
    );
{% endhighlight %}

## The peers take over

After the initial negotiation succeeds, one of the peers can use the data channel[^4]. This is exposed as a RTCDataChannel object to JavaScript, both peers will see an instance of this type representing the abstraction over sending/receiving data over network.

The offerer does some chunking, then simply uses the data channel instance it created locally to send data.

{% highlight javascript %}
    dataChannel = connection.createDataChannel('some channel name');

    . . .

    readAsArrayBufferAsync(chunk).then((arrayBuffer) => {
        dataChannel.send(arrayBuffer);
        console.log('File chunk of size', arrayBuffer.byteLength, 'was sent to peer.');
        return Promise.resolve();
    });
{% endhighlight %}

The other peer "sees" the data channel after the initial negotiation succeeds and will receive the data sent on the channel something like the following:

{% highlight javascript %}
    connection.ondatachannel = (event) => {
        listenForMessages(event.channel);
    };

    . . .

    dataChannel.onmessage = (rtcMessage) => {
    const data = rtcMessage.data;
    console.info('Answerer received RTC message:', data);

    if (data instanceof ArrayBuffer) {
        // process each chunk here ...

        if (fileMetadata.size > totalBytesReceived) {
            return;
        }
        const fileReceived = new Blob(chunks);

        // then do something with the file ...

        return;
    }

    if (data instanceof Blob) { 
        // etc ...
    }

    const payload = JSON.parse(data);
    if (payload.type === 'file-metadata') {
        console.info('Received file metadata for file:', payload.name);
        fileMetadata = {name: payload.name, size: payload.size};
    }
{% endhighlight %}

Unlike previously, where the data was sent over an intermediary "signaling" server, in this case the data is directly sent and received by the peers.

### Conclusion

The truth is that I also borrowed the idea of using websockets from [this](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/) other resource of how to set up the signaling part of a WebRTC application, and there are other samples available that accomplish the same thing. So the project itself is not very original.

The motivation behind this post was to describe a demo of web RTC that is relatively easy to set up, but unlike the official samples actually puts two peers in contact over network rather than basically creating two peers in the same webpage (with no actual signaling example in place).

This has proven very useful to begin investigating how to leverage WebRTC for other purposes, including integration with other RTC clients. Expect some more posts on WebRTC in the future.

[^1]: This isn't strictly true, in some network configurations direct peer2peer communication is impossible, and a data relay server is used (see [TURN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols)).

[^2]: The server implementation uses this: [https://github.com/theturtle32/WebSocket-Node](https://github.com/theturtle32/WebSocket-Node), I won't go into details about web sockets here, just know they are a way to allow client/server communication.

[^3]: On the other hand if you're ~~a nerd~~ like me and you are developing integrations between browsers and other applications, [see here](https://webrtchacks.com/sdp-anatomy/) for a high-level breakdown of an SDP document, also the [SDP spec](https://tools.ietf.org/html/rfc4566). Yes, it is possible to develop an integration from browsers to other RTC clients, but it may require manipulating the SDP document for compatibility purposes.

[^4]: You can tell whether it succeed by observing the `iceconnectionstatechanged` [event](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState) on the peer connection instances, when this transitions to `connected` or `completed` the local peer has connected to the remote.

[1]: https://webrtc.github.io/samples/

[2]: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
