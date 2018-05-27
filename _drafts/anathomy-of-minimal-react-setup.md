---
layout: post
title: The anathomy of a minimal React + JSX dev setup
permalink: anathomy-of-minimal-react-setup
date: 2018-05-20
---

This is yet another blog post about minimal React (Preact etc) setups in 2018. This post is meant to address a simple question: what are the minimum dev environment requirements to get started and why each of them is a necessary piece of the puzzle. I'm going to breakdown each of them as follows: identify the requirement and its purpose, describe and explain my preferred way to put it into place, explain why it's strictly necessary and finally provide some alternatives where applicable.

### React + JSX development in 2018

Let's say we want to develop a very simple application in React, we're going to ignore any other additional dependencies and focus purely on getting two simple things in place: a local dev environment where we can easily access the application via a browser, the minimum required to get React + JSX working.

## Baby steps
#### The what
#### Why is this strictly necessary
#### Alternatives

## Baby steps

The first piece of this puzzle requires is an initial HTML file to run our JavaScript. We can either inline the bootstrapping script or externally require a file:

{% highlight html %}
<script type="text/javascript" src="./index.js" defer>
</script>
{% endhighlight %}

#### The what
However you deliver your project, there is going to be a tiny bit of bootstrapping HTML. In our case, the bare minimum you can get away with is requiring the script that is going to dynamically manufacture the DOM tree as it runs. Why the defer? Need to wait until the body of the document has mounted. Most browsers will generate the rest of the HTML document given only the above. This needs to happen before you can start using ReactDOM to populate the DOM. You can add them yourself to the document, but if your script is included before the body it will be run before this has been mounted, so you'll still need a `defer` attribute on your script.

#### Why is this strictly necessary?
Assuming your React application is going to use the DOM, you need to serve an initial HTML file to the browser. That's about it.

#### Alternatives
You may choose to inline your bootstrapping code inside the script tag but this is likely to be more awkward:

{% highlight html %}
<script type="module" defer>
import ReactDom from 'react-dom';
import Root from './Root.jsx';

import './root.css';

const container = document.createElement('div');
container.className = 'root';
document.body.appendChild(container);
ReactDom.render(Root(), container);
</script>
{% endhighlight %}

There's a couple of problems with the above: the first is that it uses `module` as the script type which is not very widely supported in major browsers yet. The second issue is that it uses ES6 `import` module syntax, which is not actually yet supported in browsers as some minor semantic issues around certain corner cases have not been finalized yet (at the time of writing). The Third issue is that even if module syntax was supported, this file assumes there is a `react-dom` module and a local `Root.jsx` file locally available. Both of these are unlikely to be true: whether the modules are reachable from the served HTML file depends on how you structure your application. Since this is the first file you serve to the browser, you would need to provide a way for the browser to reach these modules before running the embedded script. This would probably be done by adding additional script tags so the browser can request additional files to the source.

Although this means that there you've made an resource on your server available where the browser can go fetch react-dom, and a Root.js file.

## If you want to use JSX

If you want to use JSX you'll need something to "compile" the JSX to React/Preact function calls.

#### The what

Babel is probably the most popular transpiler and needs no introductions. To set it up you'll need your package.json to include at least something like the following:

{% highlight json %}
    "dependencies": {
        "react": "^16.3.2",
        "react-dom": "^16.3.2"
    },
    "devDependencies": {
        "babel-cli": "^6.26.0",
        "babel-plugin-transform-react-jsx": "^6.24.1"
{% endhighlight %}

With a babelrc file (or equivalent configuration method) that at bare minimum provides the following (yes that's the entire file):

{% highlight json %}
{
    "plugins": [
        "transform-react-jsx"
    ]
}
{% endhighlight %}

Basically we only want to run babel over our JSX files and transpile them to equivalent JS. And that is all we're using babel for, no ES5 compatibility, no minification etc.
This also assumes you are going to direct babel to the files to transpile via the CLI. Finally, you'll want to put the output somewhere relevant:

{% highlight sh %}
npx babel src --out-dir public
{% endhighlight %}

You may additionally want to include copying other files over to your `public` directory, without changing them (e.g. your css and other plain JS files).

#### Why is this strictly necessary

The browser does not understand your JSX out of the box (you're meant to use web components instead), so something needs to take your JSX and turn it into plain JS.

#### Alternatives

Transpilers other than Babel exist. Unfortunately none of them appear to support transpiling JSX. This means you're stuck with Babel if you really want to use JSX syntax (which you probably do). Then again, babel is an incredibly popular project that is used for many transpilation purposes other than JSX, which means you project likely needs Babel anyway.   

There is a Babel react preset. I believe it includes stuff that isn't really part of a minimal setup, for example it includes a flow transformer, which assumes you're going to be using flow to decorate your JS with types which may not be the case.

## Sanity check

Right, at this point we're basically done. You have setup all you need to distribute your React application written in JSX. Except for one tiny detail: you still need a way to distribute React and React DOM. Why do you need both? The first is the library that provides the functions that your transpiled JSX is going to rely on (React.createElement etc). The second provides the library that translates the "virtual" React components to DOM nodes and looks after managing the tree (appeding, updating nodes etc).

If you're using this route you'll need to include these two libraries either from your server (e.g. http://myserver.com/public/react etc) or you'll need to reference them from the NPM repository or another website. There are known issues with this approach, which is why the recommendation is to bundle all your (non-dev) dependencies and your implementation into a single bundled file. This leads us to the next step.

## Enter the bundler

A bundler takes the entry point file of your application (e.g. index.js), then reads its imported modules and starts walking down the dependencies tree bundling each module whether external (e.g. react) or internal (e.g. Root.jsx in our example above) and putting all of it into a file. This will include any non-dev dependencies of imported libraries as well (which means it'll include react's massive dependency tree). What is the first port of call for devs looking for a bundler nowdays?

#### The what

Webpack is a bundler at its core, but it really wants to be whatever you want it to be: bundler, task runner, dev server and more. We don't care to use it here as anything other than a bundler. Which is why we're not going to use it.

Parcel is a zero configuration bundler. It picks up your bablerc and works with babel out of the box. It also really wants to work as a hot-reload, file-watching, dev-server just like Webpack, but we're only going to use it to build stuff.

Once you've added `parcel` to your dev dependencies you should be good to feed it the entry point with an output dir and you're good to go: `parcel build src/index.js --out-dir public`.

That's it.

#### Alternatives

There are many alternatives bundlers, any of them will get the job done.
Webpack is probably the most popular one, and has a very high degree of customizability at the cost of more complexity than our minimal parcel example. Other alternatives include Browserify (which however still seems to force you to write modules in commonJS syntax).

To get the same results as we did with parcel with Webpack, you'd need a bit of configuration, at minimum something that will "transform" your JSX via Babel, oh and also you'll have to remind it to include your css files:

{% highlight javascript %}
module.exports = {
    output: {
        path: `${__dirname}/public/`,
        filename: 'index.js'
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: 'babel-loader'
            }, {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    }
}
{% endhighlight %}

## Conclusion

The truly essential piece of the puzzle is really a JSX transformer ... however best practices would have you use a bundler. Parcel actually supports JSX with zero Babel config out of the box as well, although that is still used under the hood, finally making React + JSX development in 2018 a one-step process! The suggestion is to use parcel to get started, and if and when you require the additional customization options of other bundler to switch to Webpack/Browserify. Depending on the lifetime of the project, you may never need either and there is no added value to the user in making your build process more complex than it needs to be.
