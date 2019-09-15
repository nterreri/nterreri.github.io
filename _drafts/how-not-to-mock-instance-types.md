---
layout: post
title: How not to mock instance types.
description:
permalink: how-not-to-mock-instance-types
date: 2019-01-27
---

Once upon a time, I had the need to mock a dependency, and also to keep the semantics of the instance of operator intact (to make the test pass). I discovered I could not keep both the mocking framework own mock instance inheritance chain and the `instanceof` semantics, I also could not make an intermediary prototype whose prototype is the original mocked type via mixing in the mock framework mock prototype and the original prototype.

## Ok, now slower

I am assuming the reader is familiar with mocks, their place in testing and how mocking frameworks provide interfaces to both setup and verify the invocations on the wrapped instance as well as a reference to the instance itself.

In particular this post is about how the [typemoq](https://github.com/florinn/typemoq) framework does not maintain the prototype chain from the original constructor function in the mocked interface.

This means that if we are testing a function that uses the instanceof operator on something that was mocked through the framework this is going to fail.
