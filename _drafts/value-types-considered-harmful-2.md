---
layout: post
title: Value types considered harmful (part 2)
permalink: value-types-considered-harmful-2
---

This post is part of a series on value types, particularly in the C# language, and why some people consider defining your own value types not useful or even dangerous.
In the last post, we presented a distinction between value types, reference types and raw pointers, and gave a "performance" argument in favor of value types. In this post, we'll critically evaluate that argument and provide another.

## The false argument for value types

Before we argued that the reason to use value types is essentially to save processor cycles. This optimization, however, is not always applied to value type instances, but a specific set of conditions must apply in order for the instance to be eligible for stack allocation:

1. The instance has to be a local variable, or a field of another value type instance.

2. Anonymous functions, iterator blocks or the \`await\` operator must not have a closure over the local variable.

3. The instance will be automatically "boxed" (i.e. passed by reference).

4. The value type has reference type fields.

Let's go through each of this points in some more detail:

#### 1. The instance has to be a local variable.
Fields of reference type instances will be allocated on the heap with the rest of the instance value.

#### 2. Anonymous functions, iterator blocks or the \`await\` operator must not have a closure over the local variable.
The main reason for this is conceptual: changes to state "closed over" that occur within the anonymous function should be observable from the piece of executable code they are defined in. The second reason has to do with how these are implemented: anonymous classes that hold the local state are defined in-place in the compiled IL and instantiated in such a way to be referenced by the anonymous block. The reason why this applies to iterator and async blocks is due to how these are implemented in turn: essentially the method the \`foreach\` and \`await\` keywords occur in are broken up into different executable blocks controlled by a state machine. The details of this implementation are wonderfully complex (JavaScript transpilers such as Babel shim ES6 iterators similarly), and it is worth looking at one simple example of these at least once in a life time.

#### 3. The instance will be automatically "boxed" (i.e. passed by reference).
This occurs, for example, whenever you use a nullable value type, whenever you pass the instance by reference (via the \`ref\` or \`out\` operators) and whatever causes the instance to be cast to an interface type.

#### 4. The value type has reference type fields.
This is because the reference type itself needs to be kept track of by the garbage collector (for reasons we addressed in part 1 of this series). The value type instance becomes the owner of a reference to this value, so the reference can only become unreachable when the value type instance becomes unreachable, so the garbage collector needs to ensure *it* is no longer reachable in turn.

Okay, basically most of the time the choice of defining a type as a value type rather than reference type will bring no performance advantage whatsoever. This is a point against the argument for value types we presented in the last post: that value types should be used due to their performance reasons. When the conditions for applicability of the optimization are draconic, and the optimization itself has a very limited effect on performance in most cases, maybe not considering the use of value types by default is the correct choice.

## The ultimate argument for value types

The ultimate argument for the use of value types has to do with their equality and copy semantics: it is whenever instances of the type will represent something that by its nature *should* be considered a copy of the same value, rather than a shared instance. In this sense, using reference types only makes sense when the type is intended to be housing independently observable state (or behavior that depends on such state): when, for example, the type is a store of sorts modeling part of a user or API session that needs to be observed from various places of the application, so they can all independently react to changes in its state.

This implies that the bias towards defaulting to reference types is the wrong way around: types should be by default value types until the need for them to be treated as sharable reference arises from a positive type design decision ...

## The ultimate argument against value types

... Which is also the ultimate argument against their use.

Unlike what is perhaps a popular image of a programmer, all absorbed in complicated maths and languages, programming is *meant* to be a straightforward process for 90% of cases. Most of us use high level languages exclusively, and are far more concerned with the human understandability of our software than with dubious micro-optimizations. In projects where the user of value types is generally positively encouraged, the programmer is by default incurring in a higher cognitive load than they would if they just defaulted to using reference types for everything, even those types for which semantically (and maybe even performance reasons) it would make sense to use a value type.

Having to choose between value or reference types when making a new type is a strike against the principle that software development should, normally, be a straightforward process. Furthermore, the understandability of the software also suffers as a new human reader comes into contact with a project that liberally sprinkles value types throughout.

This is part of the reason why languages such as Python and JavaScript that (traditionally) are not high performance languages are incredibly popular within for-profit commercial applications: more often than not they perform well enough even with their limitations. For that matter, this is also part of the reason why companies prefer higher level languages were possible to lower level ones, they are easier to use, easier for people other than the author of the software to understand and modify.

This is also the reason why library frameworks as well as the limitations imposed on developers by specific platforms are good: they limit what you can (or should) do and in doing so provide a guide to implementing your ideas. Limits are good to the exercise of creativity, even when they are artificial and effectively can be violated.

## Conclusion

In this post we carried our discussion of value types further, argued against the argument proposed in the last post, and finally presented what is both the strongest argument for and against value types at the same time. This concludes (for the moment at least) this series.

If you read this conclusion as I do, it is perhaps a disappointing result. Surely it is more crucial to us as professional developers that others may easily understand our software, before we become concerned with performance. But why shy away from a feature of our beloved languages as basic as specifying the nature of our types due to the cognitive complications that arise from their use? Especially when we consider the importance of explicit and well expressed design for our software units and the larger pieces of software we compose out of them.

What I am trying to say is that readability should come before performance. But does this mean should not explicitly document our design in our code, also by specifying what we believe the nature of the type we are defining should entail?
