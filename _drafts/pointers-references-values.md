---
layout: post
title: Pointers, references and values
permalink: pointers-references-values
---

This post is about the meaning of terms frequently used in traditional OOP languages such as Java and C# and what they mean.

## A type

A type is a structured description of data. Any part of memory is meaningless a pile of data, a type is a way to interpret or make sense of the data. Note that this applies to both "instantiable" types, where different instances share some data but have some individual data that may differ between instances, and "static" types where there are no logical differences in the data itself, and any "replica" of the type in memory is equivalent (holds the same value).

## Value

A value is an instance of a type. Again, this applies to both static and non-static types. A value is immediately useful, it is a direct way to access a structured interpretation of data. Variables are places where to put values, so are procedure parameters.

## That's not it

A pointer is a description of the logical memory location where a specific value resides. It is (more or less) the memory address where to find a certain value (this may not correspond to the physical memory location of the type, but it is the logical location of the type). The pointer is a type: it is a standardized way to refer to any value without the value itself. It is an indirect way to access a value, the value being indirectly accessed in this manner may be thought of as the pointed value.

Multiple pointers to the same value can exist, this means that if we manipulate the pointed value from one pointer the change will be visible from all other pointers to the same value. Setting a pointer to a different value generally changes the value of the pointer but not the (previously) pointed value.

The value of a pointer is something like the address of another value in memory. This may be, for example, the value of the full memory address where to find the "start" of the pointed value, or an offset to add to a known base address in order to reach the value.

Since pointers have values, it is in principle possible to manipulate pointer values via operations. Generally, pointers allow for pointer arithmetic: it is possible to perform addition, subtraction, multiplication (etc) operations on the value of pointers. This can be useful, for example, to index a sequence of values of the same type by adding the known size of the type instances (assuming of course that this size is a fixed value for all instances, this simplifies things but isn't theoretically necessary).

Let's assume, for example, that we have a type named "Pretty" (what this represents does not matter) whose instances take 4 bytes of memory. Again, for the sake of the example, the sequence of "Pretty"`s we are interested in starts at the address 0x0000. If we know want to index the fifth "Pretty" value in the sequence, since we know each "Pretty" is 4 bytes in size, we just add 4 five times, or equivalently multiply 4 by 5. This leads us to the offset 0x0014 (which reads "20" in decimal), the value we want is then the next 4 bytes.

## That's not it either

A reference is, like a pointer, an indirect way to reach a value, but, unlike a pointer, does not provide value manipulation facilities. The set of operations does not allow for pointer arithmetic. It also should not be thought of as a memory address.

A reference is basically a pointer managed by the runtime platform. This means the platform (canonically the CLR) will look after the pointer and the user of the pointer should not worry about manipulating the pointer value at all. Like with pointers, multiple references to the same value are possible, with the same implications.

This is where the "managed platform" idea comes into play. In (canonically) unmanaged languages such as C/C++ the programmer is responsible for pointer initialization and finalization. This means that the programmer is in charge of ensuring pointers are assigned a value, that the memory allocated for the pointed values is reclaimed once no longer in use, and that pointer values are also reclaimed. Runtime platforms like the CLR take care of these details on behalf of the programmer. There are two main benefits to this approach (which however limit the amount of control the programmer has over how memory is managed).

The first benefit is that the code the runtime platform runs is "verifiable". On top of compilation time checks (which unmanaged languages such as C can also leverage) the runtime platform can perform additional runtime checks to verify the behavior and integrity of a program. This is achieved by compiling the code to an intermediate form (ofter referred to as bytecode), before this is later (just-in-time) compiled to machine code. There are several benefits to these additional checks.

First of all behavior verification: just like the purpose of compilation time checks is to ensure that, for example, variables are only assigned the result of expressions whose resolved value is compatible with their declared type, and likewise procedures are only invoked with values compatible with the types of their parameters. In a similar vein, procedures requiring binding are only invoked on (or dispatched to, or bound on) values that can satisfy the binding requirements (usually expressed in terms of being part of a type hierarchy). Basically, the runtime platform can perform the checks done at compilation time again at runtime along with additional verification, providing further program robustness and further limiting certain security risks.

The other benefit of managed platforms is that the programmer is not responsible for memory management. The runtime platform will employ its own mechanism to handle memory allocation and deallocation, generally in the form of a garbage collector. A garbage collector employs heuristics to decide whether some value has become unreachable by the rest of the application and its memory can be reclaimed (generally it also supports programmer-defined finalization of values by running some additional cleanup instructions before reclaiming the value memory, such as releasing unmanaged handles). Garbage collectors also perform memory compaction to keep the memory footprint of the program minimal: if some value right in the middle of section of memory assigned to the program is reclaimed, since there's still other values before and after it, can only be allocated to new values that are the same size or smaller. As the program runs, this means that eventually there will be lots of tiny holes in this section of memory that are for the most part too small to be used for anything. The garbage collector will move values around in memory to minimize the occurrence of these holes.

The location of the value in memory is by default not fixed, this means that the references to these values are not equivalent to pointers, and helps explain why pointer arithmetic does not make sense on references. The values allocated by the program will be moved around as the garbage collector compacts the program's memory. References are abstractions on top of pointers that function like pointers for the vast majority of purposes, but abstract away some details that programmers are not concerned with most of the time.

## Value types

As explained elsewhere, the distinction between value and reference types makes sense in languages that support references in the sense here described, but does not really make sense in other contexts. The basic difference is that reference types are (like pointers) an indirect way to reach a value, whereas value types are not indirect. Equivalently: the value of a value type is the value, the value of a reference type is a way to get to the value. The value of a pointer type has the same definition of as for a reference type, but with additional operations defined on it.

## Primitives

The definition of a primitive in a language is a type for which the language provides some special form of support. Not all primitives are value types in C#: for example, by this definition, `string` is a primitive, and so is `object`.
