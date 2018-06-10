---
layout: post
title: Pointers, references and values
permalink: pointers-references-values
date: 2018-06-10
---

Coming to Java from a C background I never did understand very well the difference between references (in Java/C#) and C pointers. This difference did not become clear to me until a fair bit of time afterwards. This post is about explaining that difference, providing design and practical reasons why the two are not equivalent, nor is one a subset of the other. The reader should expect some of the following to be familiar, but hopefully by the end of it the difference will have become clear. In summary, references in languages such as Java and C# are an abstraction over things like pointers. 

## That's not it

A pointer is a description of the logical memory location where a specific value resides. It is (more or less) the place in memory where to find a certain value (this may not correspond to the physical memory location of the value, but it is the logical location of the value). The pointer is a standardized way to refer to any value without the value itself. It is an indirect way to access a value. The value of a pointer is something like the address of another value in memory. This may be, for example, the full memory address where to find the "start" of the pointed value, or an offset to add to a known base address in order to reach the value.

Multiple pointers to the same value can exist, if the pointed value is manipulated from one pointer the change will be visible from all other pointers to the same value. Pointers have relatively complicated identity semantics: two pointer variables can hold the same pointer value (same place in memory) and be semantically identical (the same value). Two pointer variable can hold different values that both happen to point to the same pointed value, in which case they are not semantically equal (although their pointed values are). In this sense, pointers are only ever self-identical. Setting a pointer to a different value generally changes the value of the pointer but not the (previously) pointed value.

Since pointers have values, it is in principle possible to manipulate these memory address/offset values via operations. Generally, pointers allow for pointer arithmetic: it is possible to perform addition, subtraction, multiplication (etc) operations on the value of pointers. This can be useful, for example, to index a sequence of values of the same type by adding the known size of the type instances (assuming of course that this size is a fixed value for all instances, this simplifies things but isn't theoretically necessary).

Let's assume, for example, that we have a type named "Pretty" (what this represents does not matter) whose instances take 4 bytes of memory. Again, for the sake of the example, the sequence of "Pretty"`s we are interested in starts at the address 0x0000. If we know want to index the fifth "Pretty" value in the sequence, since we know each "Pretty" is 4 bytes in size, we just add 4 five times, or equivalently multiply 4 by 5. This leads us to the offset 0x0014 (which reads "20" in decimal), the value we want is then the next 4 bytes.

## That's not it either

References are abstractions on top of pointers that have the more or less the same behavior as pointers for the vast majority of purposes, but abstract away some details that programmers are not concerned with most of the time. This is the main purpose of references: they are a runtime platform design feature meant to simplify the development process.

A reference behaves like a pointer managed by the runtime platform. This doesn't mean that they are necessarily implemented as pointers, but it means the platform (canonically the CLR) will ensure references have roughly the same value semantics as pointers and the programmer should not worry about manipulating their value at all. A reference is, like a pointer, an indirect way to reach a value, but, unlike a pointer, the set of operations defined on references does not allow for value arithmetic. The identity semantics of references are slightly different from pointers: unlike pointers references are not only self-identical. Two reference variables are identical if their referenced value is the same, pointer values are only ever self-identical. You may think of references as a more abstract way to reach value instances than memory locations.

### Why can't I treat references like pointers?

This is where the "managed platform" idea comes into play. In (canonically) unmanaged languages such as C/C++ the programmer is responsible for memory initialization and finalization. This means that the programmer is in charge of ensuring pointers are assigned a value and that the memory allocated for the pointed values is reclaimed once no longer in use. Runtime platforms like the CLR take care of these details on behalf of the programmer (which however limit the amount of control the programmer has over how memory is managed).

The first benefit of this approach is that the code the runtime platform runs is "verifiable". On top of compilation time checks (which compiled unmanaged languages such as C also leverage) the runtime platform can perform additional runtime checks to verify the behavior and integrity of a program. This is achieved by compiling the code to an intermediate form, the platform then "runs" this intermediate code by verifying what it's doing (again) then compiling it to machine code. The platform has allocated the values in memory, and is in charge of their lifecycle. This means it can ensure that the values in memory are the correct types, this cannot be guaranteed when the programmer manipulates pointed values directly.

Just like the purpose of compilation time checks is to ensure that, for example, variables are only assigned the result of expressions whose resolved value is compatible with their declared type, and likewise procedures are only invoked with values compatible with the types of their parameters. In a similar vein, procedures requiring binding are only invoked on (or dispatched to, or bound on) values that can satisfy the binding requirements (usually expressed in terms of being part of a type hierarchy). Basically, the runtime platform can perform the checks done at compilation time again at runtime along with additional verification, providing further program robustness and further limiting certain security risks.

The other benefit of managed platforms is that the programmer is not responsible for memory management. The runtime platform will employ its own mechanism to handle memory allocation and deallocation, generally in the form of a garbage collector. A garbage collector employs heuristics to decide whether values have become unreachable by the rest of the application and their memory can be reclaimed (generally it also supports programmer-defined finalization of values by running some additional cleanup instructions before reclaiming the value memory, such as releasing unmanaged handles). Garbage collectors also perform memory compaction to keep the memory footprint of the program minimal: if some value right in the middle of section of memory assigned to the program is reclaimed, since there's still other values before and after it, the newly freed piece of memory can only be allocated to new values that are the same size or smaller. As the program runs, this means that eventually there will be lots of tiny holes in this section of memory that are for the most part too small to be used for anything. The garbage collector will move values around in memory to minimize the occurrence of these holes.

The location of the value in memory is by default not fixed, this means that the references to these values are not equivalent to pointers, and helps explain why pointer arithmetic does not make sense on references. The values allocated by the program will be moved around as the garbage collector compacts the program's memory.

## Conclusion

The purpose of any abstraction is to hide some implementation details to simplify the job of the person who uses the abstraction. This is true in product design as it is in programming language design. References provide a very useful abstraction that takes a chunk of cognitive load away from developers and is meant to help them focus on their application design and implementation. Ultimately, there is no necessity that references are implemented through pointers by a runtime platform, but since the two are easily confused it is important to clarify their difference. Hopefully, the reader has a better understanding of what the differences are and why they exist.

### References

- J. Richter. *CLR via C#*. Fourth printing: Microsoft Press 2014.
- Various contributors. [C# language specification](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/). 2017.
