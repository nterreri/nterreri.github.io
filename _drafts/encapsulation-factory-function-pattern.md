---
layout: post
title: Encapsulation is a bad reason for the "factory function" pattern
permalink: encapsulation-factory-function-pattern
---

There have been a couple of popular posts recently about a JavaScript pattern called "factory function" or "ice factory". Here is an argument not so much against this pattern but rather arguing that wanting to achieve encapsulation is not the best reason for wanting to adopt it. Perhaps just playing devil's advocate.

We'll describe the "factory function" pattern and contrast it with classes in JavaScript. Then proceed to argue that wanting to achieve encapsulation is not the best reason why to adopt the pattern, but that instead wanting a "Go style", no inheritance object-based approach is a better reason.

## Constructors in JavaScript

Unlike traditional object-oriented languages where normally only constructors can (and have to) be preceded by the `new` operator, in JavaScript any function can be `new`d. When this happens, a new object is created and set as the binding (the value of `this`) inside the function, the value of this object's hidden `__proto__` property is set to the value of the `prototype` property of the function instance, and finally this new object is by default returned to the caller even if there is no explicit `return this` statement.

This pattern is meant to provide an inheritance mechanism by linking the new object instance to a "static" prototype, and has been widely used to do object-oriented programming in JavaScript. It relies on the rules of object property resolution whereby properties are first looked up on the object instance, then up the prototype chain.

{% highlight javascript %}
function Car() {
    this.kilometersTraveled = 0;
}

Car.prototype = {
    move: function(kilometers) {
        this.kilometersTraveled += kilometers;
        // etc
    }
}

// to use it:
const car = new Car();
car.move(123);

{% endhighlight %}

Alternatively, since ES2015:

{% highlight %}
class Car {
    constructor() {
        this.kilometersTraveled = 0;
    }
    move(kilometers) {
        this.kilometersTraveled += kilometers;
        // etc
    }
}

const car = new Car();
car.move(123);

{% endhighlight %}

## The "factory function" pattern

There's a good chance that if you're unfamiliar with JavaScript, and have a background in traditional OOP languages such as Java you found the above somewhat confusing. A different approach disregards the use of `this` and prototypes in favor of a much more straightforward object factory function. Instead of `new`ing functions and setting properties as appropriate on the `this` reference inside of the function body, a new object is explicitly created and returned.

{% highlight javascript %}
function Car() {
    const car = {}; // or, if you fancy, = Object.create(null);

    car.kilometersTraveled = 0;
    car.move = function(kilometers) {
        car.kilometersTraveled += kilometers;
        // etc
    };

    return car;
}

// to use it:
const car = Car();
car.move(123);

{% endhighlight %}

The core arguments for the "factory function" are:

1) It does not rely on function binding (`this`)
2) It allows for procedural encapsulation
3) It does not use those ugly prototypes

The core acknowledged disadvantage of this pattern is that is does not allow for inheritance, as such it is not considered an OOP pattern (though may be considered "object-based".) This is, however, mostly not considered a big disadvantage, for one it is always possible to use composition instead of inheritance, and secondly inheritance is considered harmful as it is a form of very tight coupling (see also the "gorilla-banana" problem.) This means you can use this pattern for more or less anything you'd want to use classes for.

There are variations of this pattern where furthermore the object returned from the factory function is "frozen", it becomes impossible to "replace" the values of its properties at runtime by using `Object.freeze()`. See this "ice factory" pattern.

## The argument against factory functions

So, why would you want to use classes/constructors over this wonderful patter?

### The `this` question

I am not really going to address this in detail.

I've recently read articles comparing JavaScript and Python, and suggesting that the two are not too different, which I believe to be true for the most part.

They are both scripting languages: it is relatively more straightforward and, generally takes less time, to implement something quickly in scripting languages than it does in other languages. A C# or Java project requires an explicit entry point (`main`), some classes (even if they're all static and effectively procedural), some additional metadata (compilation target etc).

To run a JavaScript or Python script you only need a minimal suitable runtime environment, and you're never too far from a JS runtime environment these days.

One of the main advantages of scripting languages is that you can easily and quickly write and run a script. The fact that function binding is a dynamic, runtime property is intended to be an advantage. It is true that, in retrospect, the highly volatile nature of binding is more of a disadvantage than an advantage as it represents a major source of confusion. The new anonymous function syntax introduced in ES2015 effectively removes binding from the equation in favor of relying instead on the more widely understood lexical scope, this addresses the vast majority of cases where binding becomes a source of confusion.

What I believe this doesn't mean is that professional developers should avoid learning basic features of the languages they use. I do not believe an encyclopedic knowledge of the JavaScript specification is required to call yourself a professional JS developer, but I believe completely dismissing deeply ingrained language features is not the way forward either. There will always be cases where being familiar with the rules of dynamic binding will help figuring out why one or another module appears to be misbehaving. See also what Kyle Simpson says.

You are free to decide to adopt the factory function pattern if you truly believe the dynamic nature of `this` is too hazardous a feature to use for your project, and it is unnecessary for you accomplish everything you want. However, I do not believe it represents an excuse not to understand it as a mechanism.

Really, the vast majority of practical cases where the binding becomes lost have to do with passing or returning a method defined on your class as a value, which is simply solved by using an arrow function or the `Function.prototype.bind` utility.

### The purpose of encapsulation

As far as encapsulation goes, an easy way to encapsulate methods is to rely on function closure when defining your class module. Encapsulating instance state is not as easy; there are ways to achieve it, but they're not pretty.

Another way to encapsulate your private methods is by using function closure within the module defining your class and "manually" switching their runtime binding/context when you call them from inside your public methods via `Function.prototype.call`.

State and behavior should be encapsulated, but the real question is what is the point of encapsulation? There are really two kinds of  encapsulation.

1) run-time encapsulation
2) author-time encapsulation

The factory function pattern achieves the first (stronger) level of encapsulation, even if you can write JS that seems to access private properties, you will only end up with a `ReferenceError` at runtime. State and behavior defined within a function body is scoped to that function only, so only what you explicitly expose will be accessible from the outside. The level of encapsulation normally achieved in languages such as C# is really the second. The moment you introduce a reflection API, you can always "attack" the privately held state of a class instance. This is the same level of encapsulation you achieve in a language such as Typescript where you introduce compile-time constraints to accessing private class properties, but everything is freely accessible at runtime.

{% highlight javascript %}
function proceduralEncapsulation() {
    const privateState;

    function privateMethod() { /* something goes here */}

    function publicMethod() {
        privateMethod();
        // etc
    }

    return {
        publicMethod: publicMethod
    };
}

const stuffEncapsulated = proceduralEncapsulation();

stuffEncapsulated.publicMethod(); // ok
stuffEncapsulated.privateMethod(); // ReferenceError
stuffEncapsulated.privateState = 123; // ReferenceError

{% endhighlight %}

Compare this with typescript:

{% highlight typescript %}
class ClassEncapsulation {
    private privateState;
    private privateMethod() { /* etc */ }
    public publicMethod() {
        privateMethod();
        // etc
    }
}

const classEncapsulated = new ClassEncapsulation();

classEncapsulated.publicMethod(); // ok
classEncapsulated.privateMethod(); // Typescript compilation error
classEncapsulated.privateState = 123; // Typescript compilation error

{% endhighlight %}

The question is what is the purpose of encapsulation? Are we doing to hide implementation details to prevent misuse of our types, or are we doing it for security reasons? Doing it for the first reason makes immediate and obvious sense: we want to make sure our newest junior dev hire does not start calling the `_doRead` method instead of the `read` method when implementing some new feature. Secondly, if we are even the slight bit concerned about disclosing the secrets of our implementation to the world, minification and obfuscation do as good a job as we can reasonably ask for, alternatively you can distribute your software as raw compiled and optimized machine-language.

Doing it for security reasons does not make nearly as much sense to me. For this to be a valid reason, you need to be storing extremely sensitive data in memory (personal information, PIN numbers, other secrets, even with encryption) AND be extremely concerned about someone else running malicious information-stealing JavaScript in your same runtime instance. Basically, you are concerned about cross-site scripting. Or you are concerned about someone else having injected JavaScript in your nodejs program.

Finally, you do not even begin to address the possibility of other sources of malicious code having compromised the device your JavaScript is running on, or the remote possibility of someone successfully sneaking in malicious code when contributing to the Chromium project.

The difference between number 1 and number 2 above is, for the purpose of developing an application, academic. It does not make a concrete difference for the purpose of encapsulating details at author time.

## Conclusion

In summary, one of the strongest reasons for using the "factory function" pattern is encapsulation. This is better achieved by using some form of author-type validation (such as using Typescript) or using a naming convention (prefixing private properties with underscores, the "grown-up" rule from Python.)

"But what if I don't want to use Typescript and still *enforce* encapsulation?" As mentioned, there are other not so pretty ways to achieve encapsulation. But the crux of the question is not so much whether you want encapsulation or not, but rather whether you want to write your JavaScript in a object-based but not object-oriented manner. In other words, whether you want to be able to avoid the tight coupling that comes with traditional class inheritance mechanisms, and exclusively leverage association and composition as the core behavior-reuse mechanism.
