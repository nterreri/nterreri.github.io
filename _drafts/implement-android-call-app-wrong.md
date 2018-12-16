---
layout: post
title: Implementing an Android calling app the wrong way
description: .
permalink: implement-android-call-app-wrong
date: 2018-12-15
---

If you're interested in implementing an Android audio-video call capable app (who isn't these days?) then you probably stumbled into this guide: https://developer.android.com/guide/topics/connectivity/telecom/selfManaged

## The basics

The Android Telecom framework exists to prevent calling apps from calling on top of each other and importantly from preventing calling apps from starting or answering incoming calls automatically when an emergency call is in progress.
