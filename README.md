# helium-html

A simple but powerful library for creating HTML fragments using template literals.

```ts
import { html } from 'helium-html';

const fragment = html`<h1>hello world</h1>`
document.body.append(fragment)
```

## Slotted values

Values can be passed as attributes, nodes or text.

```ts
import { html } from 'helium-html';

const name = 'James';
const avatar = html`<img src=${ `avatar/${name}.png` } alt=${name} />`;

const card = html`<div class="card">
  <h3>hello ${name}</h1>
  ${avatar}
</div>
`;


document.body.append(card)
```

## Dynamic values

Passing an `Observable` as an attribute or node will bind it as the value. This provides a simple way for state to modify content. When written as a function this gives you components with very little behind the scenes magic.

```ts
import { html, Store } from 'helium-html';

function card (name: Store<string>) {
  const src = name.map(n => `avatar/${n}.png`);
  const avatar = html`<img src=${src} alt=${name} />`;

  return html`<div class="card">
    <h3>hello ${name}</h1>
    ${avatar}
  </div>
  `;
}

const name = new Store('James');

document.body.append(card(name))

setTimeout(() => name.update('Paul'), 5000);
```

## No V-DOM

`Observable`s are bound to a specific piece of your template. If you have a large template with a single piece of dynamic text, only the relevant piece is updated. This differs from the likes of react which do a 'virtual' render of the entire template, compare with the current state and modify only the parts which change. Skipping this has obvious performance advantages, but care needs to be taken to avoid large re-renders.

The following is a simple example showing 2 ways to reflect state changes. Both take the same parameters, can be used in similar ways and produce the same HTML. In function `a` the `Observable` state is passed into the template expression. In function `b` state changes are observed and the value is passed into the template expression.

```ts
import { html, children } from 'helium-html'

// GOOD
function a (name: Store<string>) {
  return html`<div>${name}</div>`;
}

// BAD
function b (name: Store<string>) {
  return name.map(v => html`<div>${v}</div>`);
}

const name = new Store('Dave');

document.body.append(html`
  ${a(name)}
  ${b(name)}
`);
```

When the value of name is updated for `a` only the text node containing the value is updated. For `b` a new div and text node is created, which replace the previous one. In this example the performance cost of doing the latter is likely to be low, but with a more complicated template possibly containing nested templates the cost could be much higher. The moral is to **unwrap Observables as late as possible**.

## Variadic children

Having a variable number of child nodes with an element can obviously cause some unnecessary re-rendering. A helper `children` is provided to resolve this issue.

The following example shows 2 ways to render a list of items. Both take the same parameters, can be used in similar ways and produce the same HTML. In function `a` the `items$` observable is passed to the children helper, which deals with subscription and ensures that only new items need to be rendered. In function `b` the `items$` observable is subscribed to directly, then individual items are iterated over and rendered.

```ts
import { html, children } from 'helium-html'

// GOOD
function a (items$: Store<string[]>) {
  return html`<ul>${children(items$, item => html`<li>${ item }</li>`)}</ul>`;
}

// BAD
function b (items$: Store<string[]>) {
  return html`<ul>${items$.map(items => items.map(item => html`<li>${ item }</li>` ))}</ul>`;
}

const names = new Store(['Dave', 'James']);

document.body.append(html`
  ${a(names)}
  ${b(names)}
`);

names.modify(names => names.concat(['Paul']));
```

When the `names` store is updated `a` renders only the new element, and appends it to the list. `b` renders all 3 nodes and replaces the first 2 nodes in the list with new, but identical, nodes. The `children` helper does this by using an identity function. By default this is `value => value`. When the source updates each value generates an ID based on the `identity` function, and checks if the previous list contains a node with a matching ID. If it does then that previous node is used, otherwise the render function is called with that entry. This allows for reordering entries, adding new entries and removing old ones without additional cost.

The issue with this design is that it becomes hard to update the contents of the child elements without re-rendering the entire child. It's possible to circumvent this by placing the variables for the child elements inside it's own `Store` so that the child element can subscribe the changes without having to rely on a complete re-render.

## Props, state, attributes and components

A casual comparison to the likes of React ( with hooks ) things appear very similar. But not all the concepts line up in the same way. Components are functions that return a `Node`. Properties are arguments you pass to a function, not psuedo-attributes. Attributes are attributes and state is represented using observables.

```tsx
import React, { useState } from 'react';

function Example({ initial }: { initial: number }) {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

function App() {
  return <Example initial={{ 42 }}/>
}

import { html } from 'helium-html';

function Example(initial: number) {
  const count = new Store(initial);
  const increment = () => count.modify(value => value + 1);

  return html`<div>
    <p>You clicked ${count} times</p>
    <button onclick=${increment}>
      Click me
    </button>
  </div>`;
}

function App() {
  return Example(42);
}
```

## Memoised parsing

Templates are parsed lazily and stored for reuse. So you only pay the parsing cost once, the first time you use the template.

## Typo correction

Missing closing tags are corrected for automatically. Unmatched closing tags are ignored

## Observables

helium-html uses it's own Observable _like_ classes for dynamic state. These are inspired by Rxjs and the Observable proposal, but follow a subtly different design and implementation which is intended to be simpler to use and debug. As a tradeoff they cannot do as much, but in part I hope this will encourage simpler usage as Rxjs can become incredibly complex.

They do not support the Symbol.Observable method, and are not compatible with the stage 1 Observable proposal.

`Observable` is an **interface** that describes 2 methods; `watch` and `pipe`. `watch` subscribes to the `Observable` with a given callback that is called for each emitted value. `pipe` accepts an `Operator` and returns a new `Observable` based on the `Operator`, allowing for a source to be chained via various transforms.

`Emitter` is an `Observable` that is analogous to a Rxjs Subject. It implements the method `emit` which sends a value to all it's subscribers immediately.
`Store` is an `Observable` that is analogous to a Rxjs BehaviourSubject. It contains a value which is sent to new subscribers immediately, updates to the value are sent to all subscribers. The initial value is set via the constructor, and changed using the `update` method.

`AbstractObservable` is an abstract class which implements `Observable`. It is used as a base for `Emitter` and `Store`. It is exposed so that developers may implement their own `Observable` classes with custom behavior. It provides a default implementation for `pipe` as well as some other utility methods but requires the implementor to define their own `watch` method, which is where the bulk of the class specific behavior for `Observable`s occur.

helium `Observable`s do not support error or completion events. Any faults are thrown back to the trigger. If you wish to pass any error state onto a subscriber I advise utilizing a Result style algebraic type that wraps the success/failure state of an operation. Any subscription to an `Observable` returns a `Disposable` object, by calling the `dispose` method of this object any subscriptions will be cancelled.

## Project status

This project is currently in pre-release state. Many of the ideas have been fleshed out and implemented, with minimal testing. Some use cases are not fully covered, and performance has not been optimized. But it stands as a proof of concept. Some things might change and break before reaching 1.0.0, after which normal semver rules will be observed for breaking changes.

## TODO

Nodes can bind to event listeners and Observables, then be removed from the DOM. This can leave lingering connections causing memory leaks. Ideally subscriptions should be made when a template is added to the DOM, and disposed when it's removed from the scope.
