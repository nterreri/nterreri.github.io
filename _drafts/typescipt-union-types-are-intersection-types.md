---
layout: post
title: Typescript union types are intersection types and vice versa.
description: The intuitive semantics for "union" and "intersection" do not map to type union and intersection in Typescript because they're not as useful as operations over types as sets of properties.
permalink: typescript-union-types-are-intersection-types
date: 2019-01-20
---

Typescript has structural typing, what that means is that at compile time a value is assignable to a variable of a given type if it has at least all of the non-optional properties of the target type, but can have additional properties defined on it.

For example the actual type structure of "blanket" here has all of the properties defined on the `IFlammable` type, as such it can be used as that type.

{% highlight typescript %}
interface IFlammable {
    setOnFire(): void;
}

function makeCampfire(flammable: IFlammable) {
    // ...
}

const blanket = {
    snuggle() { /**/ },
    setOnFire() { /**/ }
}

makeCampfire(blanket); // OK
{% endhighlight %}

Typescript also has operations defined on types, for example there's a "union" and "intersection" type operators, both of which take two types and return another type meant to represent the union/intersection of the original types. (Typescript also has a number of other operations to combine or select properties from types: [https://www.typescriptlang.org/docs/handbook/advanced-types.html](https://www.typescriptlang.org/docs/handbook/advanced-types.html))

Given structural typing, it is easy to understand types as sets (bundles) of properties and operators on types that return other types as mapping to basic and intuitive operations on sets. This is meant to allow programmers to express relationships between types. So, a union type operator would return a type that has all of the properties of both operands. An intersection type operator would return a type that has only the shared properties of the operands.

For example basic set theory and these diagrams just like the ones you can find on wikipedia show what happens when you intersect and take the union of a "fish" and "bird" set, where the elements of the sets represent what the animal can do: the union of bird and fish can both swim and fly. The intersection of bird and fish can only breathe and can't do either of the things that the more specific types can do[^2].


{% highlight typescript %}
interface IAnimal {
    breathe(): void;
}

interface IFish extends IAnimal {
    swim(): void;
}

interface IBird extends IAnimal {
    fly(): void;
}
{% endhighlight %}

Except that intuition is all wrong.

## All wrong

**The issue is that the intuitive semantics for "union" and "intersection" do not map to type union and intersection in Typescript because they're not as useful as operations over types as sets of properties.**

Given what we know of basic set theory we expect intersection between `IFish` and `IBird` to give us `IAnimal`: the only element in common between the two is `breathe`. Instead, we get a fish bird:

{% highlight typescript %}
function intersectionFactory(): IFish & IBird { /**/ }

const intersection = intersectionFactory();

intersection.breathe(); // OK
intersection.swim(); // OK
intersection.fly(); // OK
{% endhighlight %}

Similarly, if we were expecting the type union operator to give us a type with ALL elements of either set we'll be disappointed:

{% highlight typescript %}
function unionFactory(): IFish | IBird { /**/ }

const union = unionFactory();

union.breathe(); // OK
union.swim(); // NOT OK
union.fly(); // NOT OK
{% endhighlight %}

Why is it backwards? When you read the signature of a function what you expect the vertical stroke character `|` to mean is "either". This is from the use of this character from the C-like syntax for bitwise and boolean operations. What you do not expect it to mean is "both" or "all" (that is indeed intersection: `&`).

Take this example:

{% highlight typescript %}
/**
 * Sets the size with the given parameters.
 *
 * If a number is provided the size will be set in pixels,
 * if a string is provided the size will be set in pixels if no unit measure is specified,
 * otherwise the size will be set in the unit measure specified if this is any standard CSS unit.
 */
function setSize(height: string | number, width: string | number);
{% endhighlight %}

What we take the parameter to mean is "*either* a string or a number is OK" and not "you need to give me something that is both a string and a number". That's what type intersection is there for in Typescript!

## There's a language for that

Union and intersection operators in Typescript do not map to familiar and intuitive operations over sets. Even through it makes sense to have an operator to "mix in" different types together as that is an often used mechanism in Javascript, similarly it makes sense to be able to express that "either" type is acceptable in a function signature. It's not clear there's the need for an operator to select only those properties that are shared between two types. What is the use case of "please give me something that only has the shared properties of these types"?

Well, that is actually the basic purpose of adding type annotations to the Javascript language.

You could imagine a sort of type guard that worked like this[^1]:

{% highlight typescript %}
declare function makeCampfire(flammable: IFlammable);

function maybeMakeCampfire(something: any) {
    if (something is IFlammable) {
        makeCampfire(something);
    }
}
{% endhighlight %}

The semantics of the operator would be set intersections where the types are considered bundles (sets) of properties. In this case, because we're checking for structural type conformity we cannot use the `instanceof` operator effectively, as all this does is traverse the prototype chain of the left hand operand to check to see if it inherits from the right hand operand (if `constructor.prototype` of the right hand operand appears anywhere in the prototype chain). Since we're being *very dynamic* in this example, there is no prototype linking involved, we just want to check if the type looks like it's compatible.

Obviously the example is contrived as it's typing the parameter as `any`. Typescript will already check at compile time to see if `something` is structurally compatible with `IFlammable`. In other words, use cases for "intersecting types" are already accommodated by structural typing, there's no need for an operator. 

[^1]: Note: Typescript has a case where an `is` appears in user defined type guards. This is different from what we're talking about here.
[^2]: Let's not worry about whether there's fish that can fly and birds that can swim.

### References

[https://www.typescriptlang.org/docs/handbook/advanced-types.html](https://www.typescriptlang.org/docs/handbook/advanced-types.html)
[https://basarat.gitbooks.io/typescript/docs/types/typeGuard.html](https://basarat.gitbooks.io/typescript/docs/types/typeGuard.html)
