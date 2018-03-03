---
layout: post
title: Why MVVM does not suit React
permalink: mvvm-does-not-suit-react
date: 2018-03-03
---

In this post we'll talk about a very popular variant of the MVC patter to decouple views from the rest of the implementation of a user-facing application. We'll first introduce MVVM (that's model-view-viewmodel), how it relates to MVC, and why it is a good pattern. Then we'll talk a bit about the React component update model (but will however assume general familiarity with its details), and conclude that MVVM fundamentally does not suit the recommended way to handle component updates for React.

# MVVM

Historically, MVC has risen as a way to decouple the view and logic that controls the \`state\` of the view from the application model. At its core MVVM is a constrained version of MVC where the way the view and the "controller" interact is regulated by the following rules: the view invokes behavior of the view model directly, and listens for changes in the view model state via an event-based approach or similar. The view model, on the other hand, exposes methods and events for views to listen to but is not tied to any particular specification of a view, it doesn't know what the view is. In other words, the dependency relation between the two proceeds from the view to the view model with no way backwards.

In a typical example, the user clicks a button, this results in the view calling a method on the view model and in the view model alerting all registered listeners of a change in its state, for example by declaring some state as now "pending" and some other state as now "disabled". The view receives the notification as it is one of the registered listeners and updates itself to now show some result as "pending" and the button clicked as "disabled", for example.

This differs from some implementations of MVC where, for example, the interaction between view and view model is unconstrained and both view and view model share some mutable state they can both read and write over (likely from the same UI thread, to avoid well known synchronization issues due to thread preempting.) Constraints are good to the exercise of creativity. MVVM provides constraints and decouples view model from view in a way where the view model is completely independent of the view implementation. This means, for example, that you could in principle migrate your views from React to Vue and not have to worry about re-wiring them all up to your business logic / domain model.

## The React component update model in a nutshell

As mentioned in the React documentation. The rendering output of a React component is meant to be a pure function on props and state. A pure function is a function that is: (1) free of side effects, (2) deterministically returns the same value given a specific output. The React component model (in a nutshell) proposes a hierarchical view architecture where a view component tickles down `props` to its children (or the components which compose it), these can range from state, callbacks, rendering information etc. In turn, an individual component can queue updates to its `state`. This is normally used for things the component itself should know and manage internally, generally in response to user action (e.g. user hits button, button turns gray.)

Any appropriately propagated changed to props and states triggers a component re-render: React will render the component again, get a new version of it, then compare it to the previous render output and selectively dispatch changes to the underlying view engine (which may or may not be the browser's DOM, see React-Native.)

## A React MVVM architecture

To implement a minimal MVVM architecture in React, you can simply make the view model one of the props passed into the component, the component then reads the state of the view model and wires up its controls to its methods as appropriate (note that this implicitly requires that your view models are hierarchically organized in a way that mirrors your views.) Except this is not sufficient: we need a way to listen for changes on the view model and trigger a component re-render. React exposes some facility to generally force a re-render, so we can simply wire up the event listener to trigger a re-render.

And therein lies the problem.

If the result of rendering a component is a pure function on props and state, and the props themselves do not change, then rendering the component is no longer a function on props and state. Worse yet, the output of a render function is now a function on the state of the view model which makes its output not deterministic on its input. There may be other ways to implement this pattern: for example, we could define the props for the view as the properties its view model exposes. This would in turn force us to make the parent component in some way aware of the interface (or at least the public state) of the view model for each of its children.

## Legend of the immutable view model

Another way to implement MVVM for React would have the parent component (or rendering component) pass a new instance of the view model down to the view, where the state of the new view model is  an appropriately updated version of the previous state. Whenever a view model alerts listeners that properties changed, the registered listener is not the view that cares about those properties, but its parent. This way, the parent can be alerted of the fact that its child may need to be re-rendered given the new state, passes down the new view model instance to the child view, and this can then decide whether it should be yellow or green (or whatever else it needs to update.)

Except this basically does violence to *both* React and MVVM.

It does violence to React as it is still necessary to force a re-render on the parent component that is independent of props and state. So, this solution only moves the problem around but does not eliminate it. It does violence to MVVM as it requires a view different from the one the view model is intended for: the parent view of that view. Moreover, the parent view now has to basically be aware (even indirectly via some further abstraction layer) of the properties of *all* of its children.

# Conclusion

It is in principle impossible to implement a MVVM pattern that fits with the intended component updates for a React (or React-like) view framework. The view model is a bundle of state to the view, so if the result of rendering the component is dependent on the state of the view model then the render function cannot in principle be pure. This means that any approach that binds a React view to a view model is a statement against the pattern React is meant to work with.

Does this mean any such approach is unfeasible? Of course not, there are several implementations of MVVM in React that are fun and likely profitable. They are, however, in principle incompatible with React and stretch the framework semantics.
