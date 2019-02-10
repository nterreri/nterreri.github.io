---
layout: post
title: Why VOIP applications show your IP address to a peer
description: A lot of applications using direct peer2peer connectivity show a public IP address assigned by an internet service provider to your router, only a few get crucified for it (see recent The Division 2 beta outrage). If someone else on the internet knows this IP address they can perform potentially malicious attacks against it (such as DDoS). Why is new software being made that potentially exposes the user to these attacks?
permalink: why-voip-shows-your-ip-address
date: 2019-02-10
---

A lot of applications using direct peer2peer connectivity show a public IP address assigned by an internet service provider to your router, only a few get crucified for it (see recent [The Division 2 beta outrage](https://www.shacknews.com/article/109813/the-division-2-shows-your-public-ip-to-others-by-default)). If someone else on the internet knows this IP address they can perform potentially malicious attacks against it (such as DDoS).

Did we not learn exposing your IP address to potentially ill-meaning strangers is bad? Why is new software being made that potentially exposes the user to these attacks?

## Peer-ful

In traditional peer2peer networking technology, a first attempt is made to connect the peers by making them exchange their IP addresses through a central server (in the case of games, this will be the game server/s)[^webrtc].

Most likely, this is a local IP address belonging to a local network created by machines connected to a local router via WiFi or ethernet cables (your ps4, your phone, your PC etc). When the peer attempts to use this address nothing really happens: in the peer's local network this likely does not map to any device, or it maps to another device (which isn't going to respond to the connection attempt) and it certainly does not map to the remote peer.

The peer2peer software then tries to resolve the public IP (the WAN IP) that the router is using by hitting a server (this could be the game server) and get a response back containing the IP address from which the request was received. This is how the public IP address is discovered by the game or other peer2peer software application. This IP is then attempted to be used for the connection.

This may also not work if your router or firewall blocks certain types of inbound connections (this can also explain some instances where some multiplayer games complain that your "NAT is strict"). If it does not work then an intermediary server is used to let the two endpoints exchange media. This does not work different (network wise) than the game server, so if you can reach and make requests to the game server you most likely can also reach the media relay server.

## The IP and the DDoS

A few years back, a [vulnerability](https://krebsonsecurity.com/2013/03/privacy-101-skype-leaks-your-location/) was discovered in the Skype infrastructure that allowed finding the last used IP address for a Skype account from their Skype user name. Games like The Division do not suffer from this problem.

Any peer2peer application, however, sends your local public IP address to the peer (this is most likely encrypted when in transport). This may be directly visible to the remote peer (think torrent clients) or it may only be retrievable from the application logs. In some cases, applications only log partial IP addresses, making it far more difficult to guess the full IP address (for example blotting out the host part of an IPv4 address).

Even when applications do not log the full address, the remote machine is still going to make a connection to your machine's IP address. This means a packet sniffer (such as [Wireshark](https://www.wireshark.org/)) can be used to see all IP address your machine is connected to, as the network stack of the operating system must know and use the address to connect and exchange data with the peer. In particular with traditional real time communication (i.e. voice chat) applications, this is easy enough to filter out all connections other than STUN/TURN protocol messages (the protocol most likely used by peer2peer applications).

This only works if UDP is used for the connection, which is the preferred mechanism as it has less overhead than TCP. If TCP is used instead then filtering STUN/TURN messages is not going to work, but it may be possible to figure the remote IP address by letting the packet sniffer log everything, then tracing back TCP connection initiation to around the time the peer2peer connection started.

Attackers can use botnets to mount a [variety of attacks against the IP address](https://www.cloudflare.com/learning/ddos/ddos-attack-tools/ddos-booter-ip-stresser/) once this is known. One interesting way to mount and attack is by making tons of requests using an array of networked machines to send requests a known server both peers are connected to (for example the game server), but forging the request to look like it's coming from the IP address of the attack target. This circumvents firewalls/routers blocking new inbound connections as the DDoS attack is basically a ton of legitimate responses from a server we're already connected to.

## Why is this still a thing?

First, sending media between peers directly is more efficient than relaying it through a server. The direct connection removes the overhead of intermediary connections and servers, it also reduces delays. It's "real time" communication: we want the media to reach the peer sooner rather than later, you don't want unreasonable delay between the person speaking and hearing them, this is more likely to be noticeable if TCP is used, and if the media is not exchanged directly between the peers.

Secondly, it's cheaper. Media relay servers consume bandwidth continuously inbound and outbound (twice) for each media stream. Why add the cost on top of the worse user experience unless strictly necessary? For applications that offer free voice and video, they must be making enough money to cover these costs otherwise for this to make sense.

The takeaway here is that it bothers me as a software developer when people claim it's "developer laziness" that ends up leaking streamers' IPs and getting their stream down: there are legitimate security concerns around peer2peer media exchange with un-trusted peers, and someone in charge of application security at some point OK-ed the approach, but business reasons (i.e. making enough money) may be to blame too.

## Is Discord voice peer2peer too?

Yes and no. But for the purposes of DDoS no.

[All discord media chats are done via an intermediary server](https://blog.discordapp.com/how-discord-handles-two-and-half-million-concurrent-voice-users-using-webrtc-ce01c3187429). This is primarily done to offer multiparty media chat moderation features, for example a moderator can mute/un-mute participants etc. The peer2peer connection Discord clients establish is between your machine and one of their servers, the same protocols, IP discovery and media routing process between peers occurs with this server as it does with direct media endpoint connections.

This means whoever you're talking to cannot DDoS you via Discord (they can at most DDoS the server, but Discord has an army of such servers). This is also known as an MCU ([Multipoint Control Unit](http://www.daitan.com/video-conferencing-what-is-an-mcu/)) and it is one way for applications to deliver multi-participant voice and video (Skype also uses these, other ways require complicated network setups and it's harder to offer moderation features with them). The MCU service receives all participant media, re-mixes it and if necessary re-encodes it for each individual participant (you don't want to hear your own voice for example).

[^webrtc]: For example, webrtc. Here you can read more about peer2peer connectivity in browsers: [https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols)
