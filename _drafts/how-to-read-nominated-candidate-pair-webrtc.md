---
layout: post
title: How to read the nominated candidate pair through webrtc
description: 
permalink: how-to-read-nominated-candidate-pair-webrtc
date: 2019-02-16
---

The nominated candidate pair in an application leveraging ICE is the pair of the local and the remote candidate being used for the connection. These are made of the highest priority candidates of each peer that worked for the connection. In some (very rare) situations, it's necessary to know what the candidate pair is.

To be precise, there will be at least one pair for each media line in the SDP documents exchanged by the peers. Furthermore, unless RTCP MUX is in place, or equivalently both RTP and RTPC protocol packets are sent to the same port, there will be two nominated candidates per media line one for the RTP and RTCP connections. But let's assume for the sake of simplicity that there is one single media line and RTCP MUX is supported by both peers.

## The proper way

The RTCIceTransport interface has a method `getSelectedCandidatePair` that allows access to plain Javascript objects describing the candidates (RTCIceCandidate). To get to the RTCIceTransport we need to dig down into the object graph starting at the RTCPeerConnection.

The ICE transport is on a RTCDtlsTransport, this is, in turn, on both the sender and receiver (specification isn't clear on this, but the transport objects are likely meant to be the same reference on both sender and receiver). So, to get to either sender or receiver we need to get to the transceiver, this is simple enough to get via the peer connection.

**Basically this** (after you've made the peers exchange offer/answer):

{% highlight javascript %}
// Assuming single media line, otherwise you'll need to figure out which one it is by media type etc
const transceiver = pc.getTransceivers()[0];
const sender = transceiver.sender;
const dtlsTransport = sender.transport;
const iceTransport = dtlsTransport.iceTransport;

const nominatedCandidatePair = iceTransport.getSelectedCandidatePair();
// phew
{% endhighlight% }

Now, the bad news is that the RTCDtlsTransport interface isn't implemented in any browser (except for Edge).

## The way that actually works and only in Chrome at the moment

When I was trying to figure out how to get to the candidate pair, at this point I was close to giving up. The interface simply isn't there yet.

Then I started thinking, how does `chrome://webrtc-internals` know what the nominated candidate pair is?

Using that URL in Chrome shows advanced webrtc debugging tools. Among the things that it shows is each local and remote candidate, as well as the nominated candidate pair (again, for each media line) and information about them (packets exchanged etc).

Either this page uses some internal Chrome magic or it uses the Javascript interface. Turns out it just reads the data from `RTCPeerConnection:getStats`.

The stats dictionary contains a bunch of stuff (https://w3c.github.io/webrtc-pc/#mandatory-to-implement-stats), we're at this point only interested in knowing the nominated candidate pair(s), and what IP, protocol, ports (and the corresponding RTCP component if no RTCP MUX).

For the sake of simplicity, we're going to assume there is a single media line (`m=`) and RTCP MUX is in place and so there should be only one single nominated candidate pair after the connection state becomes connected. Otherwise, there will be at least one pair for every other media line (normally) plus a second candidate for RTCP if RTCP-MUX is not in place.

Unfortunately the spec does not provide an easy way to figure out what media type a candidate pair is for. There are two ways to figure out the candidate pair: the first is to simply cross reference the candidates under the media line in the current SDP (both local and remote SDP can be read from RTCPeerConnection properties `RTCPeerConnection:localDescription`, `RTCPeerConnection:remoteDescription`), these will be unique for each IP, protocol and port triplets.

The other way, is to read Chrome-only RTCStats entries properties. In particular, we'd need to cross reference the media track ID (assuming we know which local media stream is in use for which media line) with the "channel" entry (under the `transportId` property). This then should have the ID of the selected candidate pair entry ... 

{% highlight typescript %}
const stats = await this.peerConnection.getStats() as Map<string, any>;
const statsArray = Array.from(stats.values());

const localCandidates = statsArray.filter(stat => stat.type === "local-candidate");
const remoteCandidates = statsArray.filter(stat => stat.type === "remote-candidate");
const nominatedCandidatePairs = statsArray.filter(stat => stat.type === "candidate-pair" && !!stat.nominated);

// And now find the IP, port and protocol for each candidate pair:
for (const pair of nominatedCandidatePairs) {
    const localCandidate = localCandidates.filter(c => c.candidateId === pair.localCandidateId)[0];
    const remoteCandidate = remoteCandidates.filter(c => c.candidateId === pair.remoteCandidateId)[0];

    // Here they are:
    console.info("local candidate:", `{localCandidate.ip}:{localCandidate.port}`, "over", localCandidate.protocol);
    console.info("remote candidate:", `{remoteCandidate.ip}:{remoteCandidate.port}`, "over", remoteCandidate.protocol);
}
{% endhighlight %}

### What could I possibly ever need this for ??

The answer is most developers using the webrtc API are not going to need to worry about figuring out what the remote candidate is. It is in some cases necessary to know what it is to interop between ICE clients and non-standard or extended versions of the ICE protocol.
