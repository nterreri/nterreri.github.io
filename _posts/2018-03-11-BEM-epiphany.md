---
layout: post
title: A BEM epiphany
permalink: BEM-epiphany
date: 2018-03-11
---

In this post, we'll introduce BEM as a CSS class names naming convention, then talk about how extra class names other than the element's own can be beneficial to the definition of the style of the page. As the title mentions, this was something of an epiphany for the writer.

## BEM as a naming convention

BEM stands for Block-Element-Modifier: in a nutshell it advises styling your components via class names that are unique for each independent "piece" of your view (block), then styling sub-pieces of your blocks as independent "elements" and finally allowing for different "states" for your components via modifiers. Each of these follows its own syntax.

Generally you'll want to define your blocks via relatively simple names that describe what they're meant to represent, something like "list" or "article". Your elements are meant to be parts composing a block, so for example you will call them "list__item". Notice the double underscore syntax, that is part of the naming convention, it signals that the class represents an element, and that it is part of a block named "list". Finally, modifiers represents variations on the style of blocks (depending on your conventions, they may represent the style of elements as well), generally representing that the block is in an altered state, for example "list--empty" or "list--disabled". The double dash syntax represents that the block is modified. You can read more about BEM here: [http://getbem.com](http://getbem.com)

## Independent style

Once upon a time, at work, I had the chance of structuring and styling a new view at work. This was meant to represent a list of users with certain features and buttons for each entry. I felt that throughout our code we sometimes sprinkled a few too many classes on our blocks and elements. I thought that since this new list and list elements were independent from other views I'd do it right this time: I would have a single main class name for each component, with modifiers to allow for different element states and as needed, but avoid using multiple names for the same block so that the component style would be entirely defined by a single class name.

My list would look something like the following:

``` html
    <ul class="users-list">
        <li class="user">Something complex in here</li>
        <li class="user">Something complex in here</li>
        <li class="user">Something complex in here</li>
        <li class="user">Something complex in here</li>
    </ul>
```

The only catch: the last element in the list needed to be styled slightly differently from the others. Each of these elements had a line under it to distinguish it from the next. But there would not be a line drawn under the last element. There's nothing below the last element, so there's no "need" to separate it with a line. Furthermore, each "user" entry was in mind sufficiently complex to deserve to be considered its own separate block rather than a piece of a list, so I did not call them "users-list\__item" or "users-list__user".

At first I figured I use state to distinguish this last element. Again, I wanted each element to have a single main class name, and know how to style itself without needing additional information: `<li class="user--last">...</li>`

### Can you spot the problem?

This list had to be dynamically generated based on the state of our application, so generally when rendering this list we have to dynamically figure out which one is the last element. Our logic looked something like this initally (using React):

``` JSX
    listItems.map(item => <User name={item.displayName} /* and a bunch of other things ... */ />);
```

Then turned into:

```JSX
    listItems.map((item, index, list) =>
        <User
        name={item.displayName}
        /* and a bunch of other things ... */
        isLast={index === list.length - 1}
        />);
```

When the element is the last one in the list, it is rendered with a different state by adding a modifier: "user--last".

### Own style and surrounding context

At first I was satisfied with my work, after adding style definitions everything looked proper and I was getting ready to commit and push my changes ... But I had a feeling something was wrong.

I was using a modifier to style the component when this was in a different state, however, being the last element in the list, given that I am treating "user"s as independent blocks, seemed to imply that they should be in control of when their state ought to change, not their parent component. In other words, I was misusing modifiers, but had no idea how to conditionally render the line under the list item otherwise.

I asked my manager (who's maybe reading this, hello Luke) for advice and he said I should pass additional class names down to the User. This went against my vision for a clean, independent block-based CSS class names architecture which I thought to be cleaner than having components styled according to several different names. Why make our components represent different things at the same time?

But I tried applying the advice to my new view, while still not convinced.

## Epiphany

After a bit of work the rendering logic looked like this:
``` JSX
    listItems.map((item, index, list) =>
        <User
        name={item.displayName}
        /* and a bunch of other things ... */
        classNames={index === list.length - 1 ? "user-list__item--last" : "user-list__item"}
        />);
```

And the rendered result was something like this:
``` html
    <ul class="users-list">
        <li class="user user-list__item">Something complex in here</li>
        <li class="user user-list__item">Something complex in here</li>
        <li class="user user-list__item">Something complex in here</li>
        <li class="user user-list__item--last">Something complex in here</li>
    </ul>
```

All this meant to the style was that normally "user-list__item"s are rendered with a line below them, and each "user" only worries about rendering its content right without worrying about lines around it.

Then it clicked: each list item in this case represents both a "user" and in addition requires information about their surrounding "context", which can be as simple as the position they are in, or whether they're last. Using multiple class names is in this case useful to differentiate between the display information to render each user as an independent, self-contained unit (with its own states, elements etc) and the display information that represents the context or additional decorations that the component should receive that are unrelated to its internal structure.

# Conclusion

In this post we've introduced BEM briefly, then described a story that taught the user something about structuring the style definitions for the components where the component's style is separated from contextual rendering constraints.

### Further reading:

- [http://getbem.com/faq](http://getbem.com/faq)
- There are many good articles about BEM as well, but I suggest checking out the FAQ for more details as it examines common arguments against BEM.
