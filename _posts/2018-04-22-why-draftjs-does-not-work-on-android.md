---
layout: post
title: Why DraftJS doesn't work on Android
description: This post is in particular about why the way Draft works is in principle incompatible with how the Google virtual keyboard which is the default on certain Android devices.
permalink: why-draftjs-does-not-work-on-android
date: 2018-04-22
---

[DraftJS][1] is a popular open source rich text editing library for React maintained by Facebook. It allows developers to decorate input text as the user types, and provides a way to embed metadata into the decorated text (e.g. a URL.) Also supports commands, keyboard shortcuts ...

All of these rich development features come with a caveat however: mobile browsers are not officially supported. This means that if you're developing your mobile applications as wrapped web applications via [Cordova][3] (or [Phonegap][4], or [Ionic][5]) then you're probably out of luck.

This post is in particular about *why* the way Draft works is in principle incompatible with how the Google virtual keyboard which is the default on certain Android devices. Supporting multiple mobile operating systems with the same code-base is one of the main reasons why to use Cordova (or similar) in the first place, so you are likely to want to use the same rich text editing library across them all.

## An eventful experience
 
The core React execution model involves deciding what the state of the DOM is in memory first, then pushing the new state down onto the DOM. The [DraftEditor][2] is a React component the virtual representation of which is modified by React independently of the state of the DOM.

DraftJS essentially works by creating a `contenteditable` div and [attaching multiple input-handling events][6] to it. Leaving all of the more advanced stuff aside (drag events, keyboard shortcuts, input metadata), browsers will normally fire events describing the plain text user input from the editable div. DraftJS will handle these events and create its own virtual version of the text contents and eventually push an update down into the editable div, replacing the DOM text node contents that the browser initially rendered on user input with its rich styled markup and embedded metadata.

Because of the amount of detail Draft takes care of, it does not represent user input (even when it's all plain text) as a plain DOM text node, but will create separate blocks (strictly speaking: DOM block-level elements) to represent different lines. Additionally, any "styled" text is treated as its own block[^2].

This means Draft relies on the information about the typed text forwarded by the browser through events in order to construct its internal state.

[^2]: For that matter, there is [no standard][7] on how browsers represent content of a `contenteditable` block.

## Enter GBoard

[GBoard][8] is the default virtual keyboard on first-party Android models (Pixel, Nexus etc.) It supports various fancy features such as gif, emojis, multiple languages etc. It is also available on virtually every Android device (although the default on Samsung devices is probably going to be Samsung-made) and even iOS.

There are well known issues due to how this keyboard communicates with mobile Chrome: the keyboard does not trigger detailed text input information via browser events (see [these][9] [discussions][10]), and there's multiple issues stemming from text suggestions and auto-complete. **Basically, all of the stuff DraftJS relies on is simply not there**. This means Draft has to "guess" what the state of the content editable div is at every turn based on the limited information that is forwarded via events.

What's worse, this information is sometimes inconsistent with the state of the text node rendered in the DOM: it is possible for the internal state of Draft to be inconsistent with what is shown in the DOM, so if you read the Draft state when extracting input information you may be reading something different from what the user is seeing on the screen.

Other issues I've observed: entering newlines does not produce different block level elements in the editor (which is how Draft represents newlines) but sometimes results in Draft blocks with newline characters in them: "<div>`hello\nthere`</div>". Because of this, both the content state and the selection state become detached from the DOM when newlines are entered, resulting in a complete mess upon undo. Worse yet, pausing on breakpoints seems to prevent Draft from pushing its updated state onto the DOM, which means most of the debugging has to occur via logging or via recording draft state via watched global variables in the debugger.

## Not-so-easy solution

These issues with GBoard are long standing and developers outside of DraftJS users have brought them up with the [Chromium project][12]. There's no solution in sight.

**The core of the issue is that the way GBoard interacts with the browser changes contents of the DOM text node inside the content editable but does not forward edit events as accurately as most other input methods do. This means DraftJS is in principle incompatible with GBoard as an input method as it relies on these events to update its virtual state.**

DraftJS would need to operate in a completely different "mode" on Android with GBoard: instead of relying on events, passively read the state of the `contenteditable` element and update the internal state accordingly. A host of issues awaits down this path: what event(s) would we wait for before reading the state? Is there some input gesture that would trigger no events? Detecting the running browser and OS is possible, but how do we detect GBoard? Should we maintain two separate modes of operation for Draft, one event-based, another passive, or stick to the passive model indefinitely? Are there any performance consequences? Would the user experience be acceptable or would the timing of the styling effects create awkward delay effects?

## Conclusion

DraftJS maintainers promise to eventually address the mobile issues, but this isn't a priority at the moment, in fact it has not been a priority for [around a couple of years now][11]. Ultimately, DraftJS is not production-ready for mobile Android[^1].

As developers with live products in the app stores, we have to deploy a reliable, production-ready experiences now rather than later. If we want to re-use as much of our code as possible throughout our web and mobile client, perhaps DraftJS simply isn't the solution we need right now. The other alternative is to reject Draft as a way to decorate our mobile input, or investigate alternatives. What is the point of having a rich text decorated input when basic plain text input is unacceptably broken?

[^1]: To be clear, DraftJS maintainers do not "owe" anyone mobile Android support. This is only a word of caution to developers thinking of using Draft in their Android mobile projects. 

[1]: https://draftjs.org/
[2]: https://github.com/facebook/draft-js/blob/master/src/component/base/DraftEditor.react.js
[3]: https://cordova.apache.org/
[4]: https://phonegap.com/
[5]: https://ionicframework.com/
[6]: https://github.com/facebook/draft-js/blob/05b2b4c83c39163697dccf7a3fa28fe04eb8e008/src/component/base/DraftEditor.react.js#L387
[7]: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content#Differences_in_markup_generation
[8]: https://play.google.com/store/apps/details?id=com.google.android.inputmethod.latin
[9]: https://github.com/facebook/draft-js/issues/1077
[10]: https://github.com/ianstormtaylor/slate/issues/725
[11]: https://github.com/facebook/draft-js/issues/102
[12]: https://bugs.chromium.org/p/chromium/issues/detail?id=118639#c260

### References

- DraftJS contributors. [*DraftJS docs*](https://draftjs.org/docs/advanced-topics-issues-and-pitfalls.html#content). 2018.
- ReactJS contributors. [*ReactJS docs*](https://reactjs.org/docs/hello-world.html). 2018.
