---
layout: post
title: Value types considered harmful (part 1)
permalink: value-types-considered-harmful-1
description: This post is part of a series on value types, particularly in the C# language, and why some people consider defining your own value types not useful or even dangerous.
date: 2018-02-17
last-edited: 2018-02-25
---

This post is part of a series on value types, particularly in the C# language, and why some people consider defining your own value types not useful or even dangerous.
This first post is a general introduction to the subject of value types and the basic arguments for their use.

Certain programming languages draw a difference between value and reference types: the distinction ultimately consists in separating the way to get to the value in memory from the value itself. In this post we'll be mostly looking at how the distinction applies to C#.

## Wait, what's a value type again?

Evaluating a value type expression lends a new instance of the value in its entirety, whereas with reference types there is something over and above the value which is a reference to the value.

Value types instances are (*typically*) not subject to garbage collection, which means the memory resources they occupy become immediately available for reuse once they are no longer reachable (for example when you reach the end of the function where an instance is reachable as a local variable). Reference types are subject to garbage collection: the memory they occupy is generally not immediately released when there no longer exist a way to reach them from an an application root, but a further step is necessary where a garbage collector realizes this memory can be reused by employing some algorithm to figure out that there are no more references to the instance.

This means whenever you, for example, assign a value type variable to a field or a collection a copy of the original instance is produced whereas doing the same with a reference type will (generally) create a new, separate reference to the same instance. In this second case, any change to the internal state of the instance can be read from multiple places: all is needed is a reference to it (read: a way to reach it). This also means that your application does not need to keep track of value types for garbage collection, reducing the overhead incurred with every garbage collection cycle.

### Garbage and you

As your application runs it allocates memory for the data types that you use: your numbers, your strings, your lists and whatever else. Because with reference types you can have multiple references to the same instance it's harder to tell when the memory the instance occupies can be reclaimed.

The CLR employs a [generational][1] garbage collection, where once your application gets to measuring a certain size in memory, the garbage collector temporarily halts execution of your program logic and starts checking what reference type instances you allocated are completely out of scope (then it promotes any surviving objects to the next generation.)

So, once in a while precious processor cycles will be 'wasted' on housekeeping rather than keeping processing your customers' clicks, API requests, etc. This is essentially the basic argument for value types: the extra step to double check they're no longer reachable is made unnecessary given that there is a one-to-one mapping between value type instances and ways to reach them.

### Place-oriented programming

Languages such as C and [Go][2] generally allow the sort of de-referencing characteristic of reference types for any type through a generalized notion of "pointer", without drawing a strong distinction between two categories of types like C# and Java do. Indeed, C# and Java support value type wrappers (or boxes) that can "contain" a value type instance and allow it to be treated as a reference type (i.e. allow one instance to be reference by multiple sources, and be subject to garbage collection). A pointer is simply a way to get to the instance (perhaps the only clear example of a "mode of presentation"). A value in memory that in turns tells you where exactly to go to find the instance; it is the equivalent of saying "I don't know what value this is exactly, but I know it takes \`this\` much space, and it starts over there."

If you're willing to dig deep enough you'll find that [C# does indeed support a generalized notion of pointer][3], however pointers are semantically different from reference types in that they are not subject to garbage collection and using them bypasses the type verification the CLR automatically performs. They are a considered a powerful tool, generally only employed where strictly needed (typically to call into unmanaged code). Much like C pointers (and unlike Go pointers), they are subject to [pointer arithmetic][4], which is part of the reason it is impossible for the CLR to verify what you're doing when you use them.

## Conclusion

In this post we have introduced a distinction in some managed languages between value and reference types, and presented a basic argument for them. A basic trade-off with value types is that no processor cycles will be used to keep track of whether there's still at least one reference to the instance (garbage collection) but more memory overall may end up being used by the program depending on how many concurrent copies of the value exist as they it is passed around and mutated.

In the next post we'll see the limitations with using value types in C# and the arguments against the use of custom value types outside the ones built into the CLR.

#### Further reading
- E. Lippert. *[The stack is an implementation detail, part one][5]*. 2009.
    [Generally everything Lippert has written about value types explains them in much more depth than this series][6].
- J. Richter. *CLR via C#*, Chapters 5, 19. Fourth printing: Microsoft Press 2014.
    The basic argument for value types is from Chapter 5 here.
- J. Skeet. *C# in depth*, Chapter 2.2. Manning Publications 2014.
- Rich Hickey. *The value of values*. 2012.

[1]: https://docs.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals#generations
[2]: https://tour.golang.org/moretypes/1
[3]: https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/unsafe-code-pointers/pointer-types
[4]: https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/unsafe-code-pointers/arithmetic-operations-on-pointers
[5]: https://blogs.msdn.microsoft.com/ericlippert/2009/04/27/the-stack-is-an-implementation-detail-part-one/
[6]: https://blogs.msdn.microsoft.com/ericlippert/tag/value-types/
