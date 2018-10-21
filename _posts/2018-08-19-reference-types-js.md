---
layout: post
title: Reference types in JavaScript
description: There is no definition of value vs reference in the spec of languages like JavaScript and Go. These languages do not wish to make an explicit distinction between references and values. However, they still have types that semantically behave like reference and value types.
permalink: reference-types-js
date: 2018-08-19
---

The distinction between reference and value types typically belong to traditional compiled languages such as [C#](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/value-types) and Java.

There is no definition of value vs reference in the spec of languages like JavaScript [and Go](https://www.tapirgames.com/blog/golang-has-no-reference-values). These languages do not wish to make an explicit distinction between references and values. However, they still have types that semantically behave like reference and value types.

## Objects have reference type semantics

As extensively [discussed]({{ site.baseurl }}{% link _posts/2018-02-17-value-types-considered-harmful-1.md %}) [elsewhere]({{ site.baseurl }}{% link _posts/2018-02-17-value-types-considered-harmful-1.md %}), the difference between reference and value types boils down to their identity and copy semantics: reference types instances are only self-identical (different value type instances can be identical to each other), reference type instance copy preserves reference identity (value type instance copy does not).

Effectively, all types in the ECMAScript spec have value type semantics except for the object type (and maybe Symbol`s). So, even if the distinction is not emphasized or explicitly stated, it is implicitly part of the language.

Additionally, there is no way to define custom types with value type semantics, any user defined type has reference type semantics (even if defined with no linked prototype via `Object.create(null)`), anything that isn't a language primitive (that is has special language syntax support) has reference type semantics. Again, this is unlike languages like C#.

## Adapting the `trySomething` pattern to JS

A typical C# coding patterns is the "trySomething" pattern:

{% highlight c# %}
if (!trySomething(out var initializeMe)) {
    throw new Exception();
}

Log("Initialized reference with value:", initializeMe);
{% endhighlight %}

This pattern allows attempting some operation with a returned result value that may fail without involving exceptions as a way to communicate failure, compare to the following:

{% highlight c# %}
object thing;

try
{
    thing = doSomething();
}
catch (Exception)
{
    throw new Exception();
}

Log("Whew, finally got the:", thing);
{% endhighlight %}

Because JS has no support for "pass by reference" semantics this pattern can only be implemented in a slightly awkward roundabout way by passing an object reference and reading a property off of it:

{% highlight javascript %}
const byRef = {};
if (!trySomething(byRef)) {
    throw new Error();
}

console.log("Initialized property with value:", byRef.something);
{% endhighlight %}

Another possible, perhaps less awkward way to implement the pattern in JS leverages object decomposition (this was [Luke](http://www.indescrible.co.uk/)'s idea):

{% highlight javascript %}
const {success, value} = trySomething();

if (!success) {
    throw new Error();
}

console.log("Initialized value:", value);
{% endhighlight %}

This is more similar to other patterns in JS, such as iterators/generator functions:

{% highlight javascript %}
const it = someArray[Symbol.iterator];

let done, value;
while(!done) {
    {done, value} = it.next();
    console.log(value);
}
{% endhighlight %}

## Conclusion

One of the best things about working full stack with different programming languages is the exposure you get to different patterns and language features.

Languages such as JS do not explicitly distinguish between reference and value types, do not allow user defined value types and they do not allow for pass by reference semantics. Lacking these features, alternative patterns have emerged that are roughly equivalent and read with the same level of expressiveness as the originals.

#### Further reading
- E. Lippert. *[The stack is an implementation detail, part one](https://blogs.msdn.microsoft.com/ericlippert/2009/04/27/the-stack-is-an-implementation-detail-part-one/)*. 2009.
