---
layout: post
title: Debugging webrtc with wireshark
description:
permalink: debugging-webrtc-with-wireshark
---

Although webrtc has been used in production on various applications and APIs for a few years now and is overall very stable, it is still marked as "experimental" on MDN. It is very possible to run into strange issues when developing applications on top of it, for example Chrome crashes when parsing SDP containing a specific codec, Firefox will occasionally take some time to start sending audio over the network. Edge has (my best guess) undocumented restrictions when using the API on non secure localhost and attempting to make the call from a different secure origin.

When you run into one of these issues no amount of scouring MDN or the webrtc spec is going to help, as these are implementation specific issues. So, what can you do?

For a start you can checkout chrome://webrtc-internals on Chrome and about://webrtc in FireFox. If you need to drill deeper still you can enable webrtc logging in Chrome (and in FireFox, although you basically already get the logs in its webrtc debug page also it's kind of a pain to set up). However, if you'd like to support Edge (with the webrtc-adapter shim) and Safari you're kind of stuck as neither of these has a fancy webrtc debug page, and they won't allow you to see any internal logging.

So, what else can you do?

I wanted a way to inspect webrtc network activity and I turned to a name I'd often heard whispered with reverence and and even fear, but had never approached before: Wireshark.

## Wireshark

Wireshark is an application that allows you to inspect packets as they are sent over network devices. It will read the blob and auto detect well-known protocols, display a stack of networking protocols from lowest level to highest level, and any headers or properties for each protocol layer.
