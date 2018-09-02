According to MDN the `offerToReceiveAudio`, `offerToReceiveVideo` options of `createOffer`, `createAnswer` methods are considered legacy, and using RTCRtpTransceiver.

But how do you use them?

## Two ways to add transceivers

Once a peer connection has been created and configured, and you got a local user media stream (or other media stream to send to the remote peer). Normally you add a track to the peer connection from the stream. Then create an offer to send to the peer if initiating the session (or an answer if the peer sent you an offer):

``` javascript
for (const track of mediaStream.getAudioTracks()) {
    peerConnection.addTrack(track);
}

peerConnection.createOffer({
        offerToReceiveAudio: true // <- this is legacy
    })
    .then(offer => peerConnection.setLocalDescription(offer));
```

Instead of using the legacy option, you can use the call(s) to `addTrack` to configure the media. The creation of a sender implicitly results in a transceiver being instantiated and added to the peer connection. The receiver property of the transceiver represents the sender that the remote peer will associate with this media once the connection has been established.

Specifically, each call to `addTrack` returns an RTCRtpSender instance, and as a side effect adds a transceiver to the peer connection. You can get this instance by asking the peer connection for its transceivers. You can figure out which transceiver the sender is associated with in two ways.

The "ugly" way is to check if the sender instance is the value of the transceiver's sender property (reference equality). The probably cleaner way would be to check if the "media ID" of the sender is the same as the transceiver's.

``` javascript
const sender = peerConnection.addTrack(track);

// ugly way
const transceiver = peerConnection.getTransceivers().filter(t => t.sender === sender)[0];


// prettier way, but assumes the media ID is the same as the track kind, which is apparently only true after the pairing has occurred, which is after sdp peer exchange, so it is not possible to use this to configure the SDP offer before creating it:
const transceiver = peerConnection.getTransceivers().filter(t => t.mid === sender.track.kind);
```

Once you have the transceiver instance, you can perform additional media configuration. However, you won't need to manually specify the media kind as when adding a transceiver explicitly on the transceiver, as this was automatically configured based on the track kind.

``` javascript
const localAudioTrack = await navigator.mediaDevices.getUserMedia("audio");
const sender = peerConnection.addTrack(localAudioTrack);

const transceiver = peerConnection.getTransceivers().filter(t => t.sender === sender)[0];


```



## Browser support

As of time of writing, only Firefox supports the `addTransceiver` method. In fact, it appears not even the webrtc adapter shim supports it.

This means that although the options have been deprecated in the spec, wide browser support for the new API is as yet not available. However, for us continuing to build and support webrtc enabled applications we should keep up with the latest changes, ensuring our applications leverage the latest and greatest.

## From whence did transceivers come?

And actually, what the hell is a transceiver in the first place?

A transceiver is a permanent pairing of a receiver and a sender. Receivers and senders are a plain JS abstraction over the underlying media transmission, this means that a webrtc developer can use these objects to control and monitor the state of the underlying peer to peer connection.

Once a local receiver/sender has been paired with a remote sender/receiver, the pairing is represented by the transceiver and this can be used to control and monitor the state of the underlying peer-to-peer connection.

Transceivers, senders and receivers are primarily used to control:

1. The media type (e.g. audio or video)
2. The media direction (send only, send and receive, etc)
3. Configure individual media codecs

For the most part, application developers are likely mostly interested in configuring the media type and maybe the direction, codec parameter controls are more advanced.

Legend has it that transceivers were not part of the initial spec, and were later inspired by the ORTC api. The ORTC api is an alternative/successor standard to webrtc, the only browser implementation of which is provided by Edge.


