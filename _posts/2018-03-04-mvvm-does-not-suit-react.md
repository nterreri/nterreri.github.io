---
layout: post
title: Why MVVM does not suit React
permalink: mvvm-does-not-suit-react
date: 2018-03-04
---

In this post we'll talk about a variant of the MVC patter to decouple views from the rest of the implementation of a user-facing application. We'll first introduce MVVM (that's model-view-viewmodel), how it relates to MVC, and why it is a good pattern. Then we'll talk a bit about the React component update model (but will however assume general familiarity with its details), and conclude that MVVM fundamentally does not suit the recommended way to handle component updates for React.

# MVVM

Historically, MVC has risen as a way to decouple the view and logic that controls the "state" of the view from the application model. At its core [MVVM][1] is a constrained version of MVC where the way the view and the "controller" interact is regulated by the following rules: the view invokes behavior of the view model directly, and listens for changes in the view model state via an event or subscription-based approach or similar. The view model, on the other hand, exposes methods and events for views but is not tied to any particular specification of a view, it doesn't know what the view is. In other words, the dependency relation between the two proceeds from the view to the view model with no way backwards.

In a typical example, the user clicks a button, this results in the view calling a method on the view model triggering a change in the model and eventually alerting all registered listeners of a change in its state, for example by declaring some state as now "pending" and some other state as now "disabled". The view receives the notification as it is one of the registered listeners and updates itself to now show some result as "pending" and the button clicked as "disabled", for example.

This differs from some implementations of MVC where, for example, the interaction between view and view model is unconstrained and both view and view model share some mutable state they can both read and write over (hopefully from the same UI thread.) Constraints are good to the exercise of creativity. MVVM provides constraints where the view model is completely independent of the view implementation. This means, for example, that you could in principle migrate your views from React to Vue and not have to worry about re-wiring them all up to your business logic / domain model.

## The React component update model in a nutshell

As [mentioned][2] in the React documentation, **the rendering output of a React component is meant to be a pure function on props and state for each individual render cycle**: given the same props and state the it returns the same virtual representation of a view[^1]. A pure function is a function that is: (1) free of side effects, (2) deterministically returns the same value given a specific output. The React component model (in a nutshell) proposes a hierarchical view architecture where a view component tickles down `props` to its children (or the components which compose it), these can range from state, callbacks, rendering information etc. In turn, an individual component can queue updates to its `state`. This is normally used for things the component itself should know and manage [internally][5].

Any appropriately propagated changed to props and states triggers a component re-render: React will render the component again, get a new version of it, then compare it to the previous render output and selectively dispatch changes to the underlying view engine (which may or may not be the browser's [DOM][10].)

[^1]: Note: not to be confused with the idea that a React component is [called][3] "[pure][4]" if it has no state, whenever the `render` method of a class, or the function that represents the component is called, its output is meant to be entirely determined by the props and state that have been passed in. In this sense react components are pure functions on props and state.

## Legend of the immutable view model

To implement a simple MVVM pattern in React, we can define the props or state for the view as the properties the view model is intended to expose. The parent component (or rendering component) passes the properties of a new instance of the view model down to the view, where the state of the new view model is an appropriately updated version of the its previous state.

This would in turn force us to make the parent component in some way aware of the properties of the view model for each of its children. We can do this by organizing our view models hierarchically like we do with our views in React: every view model is composed of (factories for) its inner or child view models. The child view then reads the state of the view model and wires up its controls to its methods as appropriate. We then [force][6] a re-render of the parent any time the state of the view model updates as the model changes.

And therein lies the problem.

Because the parent view was re-rendered due to a change in the state of the view model, which is other than its state and the props, then rendering the component is no longer a function on props and state. Worse yet, the output of its render function is now a function on the state of the view model which makes its output not deterministic on its input.

This basically does violence to *both* React and MVVM: it does violence to React as it is  necessary to force a re-render on the parent component that is independent of props and state. It does violence to MVVM as it requires a view different from the one the view model is intended for: the parent view of that view. Moreover, the parent view now has to basically be aware of the properties of *all* of its children.

# Conclusion

It is in principle impossible to implement a MVVM pattern that fits with the intended component updates for a React (or React-like) view framework. **The view model is a bundle of state to the view, so if the result of rendering the component is dependent on the state of the view model then the render function cannot in principle be pure**. This means that any approach that binds a React view to a view model is a statement against the pattern React is meant to work with.

Does this mean any such approach is unfeasible? Of course not, there are [several][7] [implementations][8] of [MVVM][9] for React that are fun and likely profitable. They are, however, in principle incompatible with React and stretch the framework semantics.

[1]:https://msdn.microsoft.com/en-gb/library/hh848246.aspx
[2]:https://reactjs.org/docs/react-component.html#render
[3]:https://reactjs.org/docs/components-and-props.html#props-are-read-only
[4]:http://lucybain.com/blog/2016/react-state-vs-pros/
[5]:https://reactjs.org/docs/state-and-lifecycle.html
[6]:https://reactjs.org/docs/react-component.html#forceupdate
[7]:https://www.bitovi.com/blog/introducing-react-view-model-mvvm-with-react
[8]:https://medium.com/@gaperton/mvvm-architecture-for-react-34aebb5b584c
[9]:https://github.com/zuudo/astarisx
[10]:http://facebook.github.io/react-native/

#### Further reading

- The React docs, https://reactjs.org/docs/hello-world.html
- L. Bain. *[ReactJS: Props vs. State][4]*. 2017.
