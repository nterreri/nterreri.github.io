---
layout: post
title: The anathomy of a minimal React + JSX dev setup
permalink: anathomy-of-minimal-react-setup
date: 2018-05-20
---

This is yet another blog post about minimal React (Preact etc) setups in 2018. This post is meant to address a simple question: what are the minimum dev environment requirements to get started with React + JSX and why each of them is a necessary piece of the puzzle. I'm going to breakdown each of them as follows: identify the requirement and its purpose, describe and explain my preferred way to put it into place, explain why it's strictly necessary and finally provide some alternatives where applicable.

### React + JSX development in 2018

Let's say we want to develop a very simple application in React, we're going to ignore any other additional dependencies and focus purely on getting two simple things in place: a local dev environment where we can easily access the application via a browser, the minimum required to get React + JSX working.

## Baby steps

The first piece of this puzzle requires is an initial HTML file to run our JavaScript. We can either inline the bootstrapping script or externally require a file:

{% highlight html %}
<script type="text/javascript" src="./index.js" defer>
</script>
{% endhighlight %}

#### The what
However you deliver your project, there is going to be a tiny bit of bootstrapping HTML. In our case, the bare minimum you can get away with is requiring the script that is going to dynamically manufacture the DOM tree as it runs. Why the defer? Need to wait until the body of the document has mounted. Most browsers will generate the rest of the HTML document given only the above. This needs to happen before you can start using ReactDOM to populate the DOM. You can add them yourself to the document, but if your script is included before the body it will be run before this has been mounted, so you'll still need a `defer` attribute on your script.

#### Alternatives
You may choose to inline your bootstrapping code inside the script tag but this is likely to be more awkward:

{% highlight html %}
<script type="module">
import ReactDom from 'react-dom';
import Root from './Root.jsx';

import './root.css';

const container = document.createElement('div');
container.className = 'root';
document.body.appendChild(container);
ReactDom.render(Root(), container);
</script>
{% endhighlight %}

Let's assume that your entry point looks something like the above. You fetch some css, react-dom which you're going to use to bootstrap React, and your Root component.

The main issue is that the above assumes there is a `react-dom` module and a `Root.jsx` file available at the same resource as the index file on the origin. Basically, whether the modules are reachable from the served HTML file depends on how you structure your server. The other issue is that you're trying to make the browser parse JSX which it can't do (really you have the same issue with the other approach, we'll go back to this in a minute).

## How do I make it understand JSX?

You don't. If you want to use JSX you'll need something to "compile" the JSX to React/Preact function calls.

#### The what

[Babel](https://babeljs.io/) is probably the most popular transpiler and needs no introductions. To set it up you'll need your package.json to include at least something like the following:

{% highlight json %}
    "dependencies": {
        "react": "^16.3.2",
        "react-dom": "^16.3.2"
    },
    "devDependencies": {
        "babel-cli": "^6.26.0",
        "babel-plugin-transform-react-jsx": "^6.24.1"
{% endhighlight %}

We're including the modules we strictly need, which include the React framework, and ReactDOM. The first is the library that provides the functions that your transpiled JSX is going to rely on (React.createElement etc). The second provides the library that translates the "virtual" React components to DOM nodes and looks after managing the tree (appeding, updating nodes etc). Additionally we're including the Babel CLI client and a plugin with a self-describing name. We're also going to need a babelrc file (or equivalent configuration method) that at bare minimum provides the following (yes that's the entire file):

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

Again, the browser does not understand your JSX out of the box (you're meant to use [web components](https://www.webcomponents.org/introduction) instead), so something needs to take your JSX and turn it into plain JS.

#### Alternatives

Transpilers other than Babel exist. Unfortunately none of them appear to support transpiling JSX, to the author's knowledge. This means you're stuck with Babel if you want to use JSX syntax. Then again, babel is an incredibly popular tool that is used for many transpilation purposes other than JSX, which means you project likely needs Babel anyway.

There is a Babel [react configuration preset](https://babeljs.io/docs/plugins/preset-react/). I believe it includes stuff that isn't really part of a minimal setup, for example it includes a flow transformer, which assumes you're going to be using another FB open source initiative ([flow](https://flow.org/)) which you may not want to use.

## Sanity check

Right, at this point we're basically done. You have setup all you need to distribute your React application written in JSX. Except for one tiny detail: you still need a way to distribute React and React DOM.

If you're using this route you'll need to include these two libraries either from your origin (e.g. /public/react etc) or you'll need to reference them from the NPM repository or another website. There are [known issues](https://blog.andrewray.me/webpack-when-to-use-and-why/) with this approach, which is why the recommendation is to bundle all your (non-dev) dependencies and your implementation into a single bundled file. This leads us to the next step.

## Enter the bundler

A bundler takes the entry point file of your application (e.g. index.js), then reads its imported modules and starts walking down the dependencies tree bundling each module whether external (e.g. react) or internal (e.g. Root.jsx in our example above) and putting all of it into a file. This will include any non-dev dependencies of imported libraries as well (which means it'll include react's massive dependency tree). What is the first port of call for devs looking for a bundler nowdays?

#### The what

[Webpack](https://webpack.js.org/) is mainly a bundler, but it really wants to be whatever you want it to be: bundler, task runner, dev server and more. We don't care to use anything other than a bundler here. Which is why we're not going to use it.

[Parcel](https://parceljs.org/) is a zero configuration bundler. It picks up your bablerc and works with babel out of the box. It also really wants to work as a hot-reload, file-watching, dev-server just like Webpack, but we're only going to use it to bundle stuff.

Once you've added `parcel` to your dev dependencies you should be good to feed it the entry point with an output dir and you're good to go: `parcel build src/index.js --out-dir public`.

That's it. No config file (other than for Babel, but seems that's also [optional](https://medium.com/@devongovett/parcel-v1-6-0-46f4a2514668) in new releases and Parcel works out that you need to use Babel with your JSX files itself).

#### Alternatives

There are many alternatives bundlers, any of them will get the job done.
Webpack is probably the most popular one, and has a very high degree of customizability at the cost of more complexity than our minimal Parcel example. Other alternatives include Browserify (which however still seems to force you to write modules in [commonJS syntax](https://github.com/browserify/browserify/issues/1186) which for us that didn't grow up learning JS in Node and really like to leverage more modern standard features like ES6 modules it's a bit of a deal breaker).

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

Hopefully you've found this post informative and can walk away with a good understanding of the various cogs and wheels in the machinery that makes React and JSX development possible.
