---
layout: post
title: 2 React MVVM patterns
permalink: 2-react-mvvm-patterns
---

In this post we'll talk about two MVVM-compatible architectural patterns for React aiming at explaining how a user action all the way deep inside a nested view in the corner of a web app can affect a different view on the other side of the screen.

For example, say you you split your application into two main views, each with their own controls and features. Assume that clicking a particular button in one of the views will render a different view in the other main view. How would you go about changing the "main" given a nav bar selection event?

### ... Other than leveraging the model

If you adopt MVVM as the main way to drive your application, the simplest answer is to let the core application model drive every view. Selecting a control in one of your views eventually changes the core model, your other view is ultimately driven by such changes and so it responds by re-rendering as appropriate.

The obvious limitation to this approach springs from the fact that sometimes the event action does not cause a change in your core model itself, but only affects what is shown to the user. For this reason it perhaps does not belong to the core model, which is meant to reflect the implementation independent and view independent state and logic of your application.

After all, a view is only a projection on this core model. Anything outside of it should be handled by the view model layer. So the real question is how can you handle these cases in your view models? We'll propose two different approaches:

1. The view hierarchy approach

2. The event bus approach

## The view hierarchy approach

The structure of your application is a hierarchy of React components, the structure of your view models (or the way you arrange them at runtime) is going to mirror this hierarchy at least to some extent. Some of the more complex view models view are likely to be composed of multiple sub view models, one for each of the sub views of your more complex views.

Sub-view models can expose events (via subscription/observable based patterns) so that their parent view model can be made aware of actions or other changes as they happen without creating symmetric dependencies between your view models at runtime (this mirrors a React pattern where parent views are aware of actions/changes in their children through callbacks passed down as props.)

This way you can relay the action to the first common parent the two main views share, when this handles the event from one of your views it will know which view to change. Effectively, in this pattern you pick up the click event and bubble it (in some form) to the root of your application which then forwards it to the view that should handle it.

### Limitations

Using this approach requires explicitly handling each individual event up and down the hierarchy, this can make your view models more and more complex as you add more features, and if you support multiple clients with the same view model hierarchy it can make it very easy to lose track of where exactly events are meant to be handled and where they originate when this pattern is applied to multiple controls.

## The event bus approach

Again, a user action is a sort of event which you need to relay from the view where this originates to the view that will receive it. Rather than explicitly forwarding this event up and down the view hierarchy, you can define an "event receival provider" of sorts: a module that the view will invoke when the event has been received that will relay it. Inject a reference to this module into both the view where the event originates and the view that is meant to receive it.

Note that the extremely popular "flux" pattern is basically a generalization of this approach where everything is forwarded to a global event bus and any part of the application can subscribe to events from the bus.

### Limitations

With this approach, you still need to explicitly define and wire up your event relays throughout your view models. However this removes the need to define explicit handling for various types of events and actions throughout the hierarchy. It also reduces the potential confusion arising from the same events being referenced throughout the hierarchy as the event relay is explicitly used only in the originator and receiver.

## Conclusion

I believe I've already given away which of the approaches I prefer. Event buses allow for neater, less verbose implementations with less boilerplate and leave the core model alone. They are relatively straightforward to implement on top of any observable pattern implementation and Finally, if adopting ad-hoc event relays instead of relying on a global event bus avoids a form of implicit global state. Really, whether this is a good or a bad thing comes down to whether having less boilerplate is worth not having an explicit and intentional mapping of your events to event relays.

If you use a global bus you cannot prevent parts of your application that are not supposed to know about certain events from subscribing to them (this maybe doesn't sound like a terrible issue, but in larger and more complex projects written by multiple hands issues of this sort arise all the time.) On the other hand, if you use ad-hoc event relays you prevent events (and therefore state) from "leaking out" to places they do not belong to, at the cost of more boilerplate: you will need to explicitly inject your event relay instances where needed.
