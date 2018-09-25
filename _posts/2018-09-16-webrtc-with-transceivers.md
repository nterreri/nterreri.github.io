---
layout: post
title: Webrtc with transceivers
description: A transceiver is a permanent pairing of a receiver and a sender. Receivers and senders are a plain JS abstraction over the underlying media transmission, this means that a webrtc developer can use these objects to control and monitor the state of the underlying peer to peer connection.
permalink: webrtc-with-transceivers
date: 2018-09-16
---

According to MDN the `offerToReceiveAudio`, `offerToReceiveVideo` options of `createOffer`, `createAnswer` methods [are considered legacy](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer), and using [RTCRtpTransceiver](https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpTransceiver). Firefox already supports the new way, Chrome is adding support and makes it available behind a debug flag as of Chrome 69 ([along some sdp semantics changes](https://webrtc.org/web-apis/chrome/unified-plan/)).

But how do you use them?

Note that I assume the reader is already somewhat familiar with webrtc, its capabilities and applications. If you need more information, you may find it on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) and [my other blog post]({{ site.baseurl }}{% link _posts/2018-07-29-webrtc-without-cheating.md %}).

## Actually, what the hell is a transceiver in the first place

A transceiver is a permanent pairing of a receiver and a sender. Receivers and senders are a plain JS abstraction over the underlying media transmission, this means that a webrtc developer can use these objects to control and monitor the state of the underlying peer to peer connection.

Once a local receiver/sender has been paired with a remote sender/receiver, the pairing is represented by the transceiver and this can be used to control and monitor the state of the underlying peer-to-peer connection.

Transceivers, senders and receivers are primarily used to control:

1. The media type (e.g. audio or video)
2. The media direction (send only, send and receive, etc)
3. Individual media codecs
4. The media transport

For the most part, application developers are likely mostly interested in configuring the media type and maybe the direction, codec parameter controls are more advanced: dynamically switch the sending track without renegotiating, or prohibit certain codecs or change codec priority.

[Legend has it](https://w3c.github.io/webrtc-pc/#acknowledgements) that transceivers were not part of the initial spec, and were later inspired by the ORTC api. The ORTC api is an alternative/successor standard to webrtc, the only browser implementation of which is provided by Edge.

## Two ways to add transceivers

Once a peer connection has been created and configured, we then create an offer to send to the peer (if initiating the session or an answer if the peer sent you an offer):

{% highlight javascript %}
for (const track of mediaStream.getAudioTracks()) {
    peerConnection.addTrack(track);
}

peerConnection.createOffer({
        offerToReceiveAudio: true // <- this is legacy
    })
    .then(offer => peerConnection.setLocalDescription(offer));
{% endhighlight %}

Instead of using the legacy option, you can use `addTrack` to configure the media: each call to `addTrack` returns an RTCRtpSender instance, and as a side effect adds a transceiver to the peer connection. The creation of a sender implicitly results in a transceiver being instantiated and added to the peer connection. The receiver property of the transceiver represents the sender that the remote peer will associate with this media once the connection has been established.

 You can get this instance by asking the peer connection for its transceivers. You can figure out which transceiver the sender is associated with in two ways. The "ugly" way is to check if the sender instance is the value of the transceiver's sender property (reference equality).

{% highlight javascript %}
const sender = peerConnection.addTrack(track);

// ugly way
const transceiver = peerConnection.getTransceivers().filter(t => t.sender === sender)[0];
{% endhighlight %}

Note that this is really only a problem if you have multiple media kinds (e.g. audio and video), or are sending multiple tracks of the same kind, if you are only sending one single media stream across (e.g. audio) then there will be a single transceiver. Another way to add a transceiver is to explicitly specify the media kind, when adding a track this is automatically configured based on the track kind. This way you don't have to "guess" which transceiver is the correct one, you can then add a track on the sender.

{% highlight javascript %}
const transceiver = peerConnection.addTransceiver('audio');

const sender = transceiver.sender;

sender.replaceTrack(audioTrack);
{% endhighlight %}

## Browser support

As of time of writing, only Firefox supports the `addTransceiver` method. In fact, it appears not even the webrtc adapter shim (which is required to shim webrtc for Edge, so you don't have to maintain two implementations of your RTC application) supports it. Support for the full set of methods defined in the spec is still spotty in Chrome, and the API is poorly documented. When fully fleshed out and supported, however, it will enable webrtc developers to have more control over media and transport configuration than before.

This means that although the options have been formally deprecated, wide browser support for the new API is as yet not available. However, for us continuing to build and support webrtc-enabled applications we should keep up with the latest changes, ensuring our applications leverage the latest and greatest.

### References

- J. Bruaroey. [https://blog.mozilla.org/webrtc/rtcrtptransceiver-explored/](https://blog.mozilla.org/webrtc/rtcrtptransceiver-explored/). 2018.
