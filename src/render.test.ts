import { invariant } from 'ts-runtime-typecheck';
import type { Part } from './Child.type';
import { Store } from './Observable';
import { bind_store_to_attribute, bind_store_to_node, create_placeholder_node, element_swap, render_node, render_template } from './render';
import { FRAGMENT_TAG } from './Template.constants';

describe('render_template', () => {
  test('create fragment', () => {
    expect(render_template({ tag: FRAGMENT_TAG }, [])).toBeInstanceOf(DocumentFragment);
  });
  test('create element', () => {
    expect(render_template({ tag: 'div' }, [])).toBeInstanceOf(HTMLDivElement);
  });
  test('create element in SVG namespace', () => {
    const el = render_template({ tag: 'circle' }, [], 'http://www.w3.org/2000/svg');
    invariant(el instanceof Element, 'Element is Element');
    expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(el.tagName).toBe('circle');
  });
  test('cannot add attributes to fragment', () => {
    expect(() => render_template({ tag: FRAGMENT_TAG, attributes: { a: '' }}, [])).toThrow('Unable to add attributes to a DocumentFragment.');
  });
  test('set plain attributes', () => {
    const el = render_template({ tag: 'div', attributes: { a: 'hello' } }, []);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(el.getAttribute('a')).toBe('hello');
  });
  test('set slotted attribute', () => {
    const el = render_template({ tag: 'div', attributes: { a: 0 } }, [ 'hello' ]);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(el.getAttribute('a')).toBe('hello');
  });
  // WARN potentially leaky test
  test('set event listener', () => {
    let was_clicked = false;
    const el = render_template({ tag: 'div', attributes: { onclick: 0 } }, [ () => { was_clicked = true; } ]);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(was_clicked).toBe(false);
    el.dispatchEvent(new Event('click'));
    expect(was_clicked).toBe(true);
  });
  test('can only set function for event listener, not attribute', () => {
    expect(() => render_template({ tag: 'div', attributes: { click: 0 } }, [ () => null ])).toThrow('');
  });
  test('observable attribute', () => {
    const store = new Store('a');
    const el = render_template({ tag: 'div', attributes: { value: 0 }}, [store]);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(el.getAttribute('value')).toBe('a');

    store.update('b');

    expect(el.getAttribute('value')).toBe('b');
  });
  test('render string child', () => {
    const el = render_template({ tag: 'div', children: [ 'hello' ]}, []);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(el.outerHTML).toBe('<div>hello</div>');
  });
  test('render template child', () => {
    const child = { tag: 'span', children: [ 'hi' ] };
    const el = render_template({ tag: 'div', children: [ child ]}, []);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(el.outerHTML).toBe('<div><span>hi</span></div>');
  });
  test('render slotted node child', () => {
    const child = document.createElement('span');
    const el = render_template({ tag: 'div', children: [ 0 ]}, [child]);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(el.outerHTML).toBe('<div><span></span></div>');
  });
  test('render slotted node array child', () => {
    const child = [
      document.createElement('span'),
      document.createElement('table')
    ];

    const el = render_template({ tag: 'div', children: [ 0 ]}, [child]);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(el.outerHTML).toBe('<div><span></span><table></table></div>');
  });
  test('render slotted observable child', () => {
    const store = new Store('a');
    const el = render_template({ tag: 'div', children: [0] }, [store]);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(el.outerHTML).toBe('<div>a</div>');

    store.update('b');

    expect(el.outerHTML).toBe('<div>b</div>');
  });
  test('render slotted text child', () => {
    const el = render_template({ tag: 'div', children: [ 0 ]}, [ 'hello' ]);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(el.outerHTML).toBe('<div>hello</div>');
  });
  test('render slotted mixed array child', () => {
    const store = new Store('a');

    const child = [
      document.createElement('span'),
      store,
      'hello'
    ];

    const el = render_template({ tag: 'div', children: [ 0 ] }, [child]);

    expect(el).toBeInstanceOf(HTMLDivElement);
    invariant(el instanceof Element, 'Element is Element');

    expect(el.outerHTML).toBe('<div><span></span>ahello</div>');

    store.update('b');

    expect(el.outerHTML).toBe('<div><span></span>bhello</div>');
  });
});

test('test create_placeholder_node', () => {
  expect(create_placeholder_node()).toBeInstanceOf(Comment);
});

describe('render_node', () => {
  test('prevents functions from passing through', () => {
    expect(() => render_node(() => null)).toThrow('Received a function where a Node or Primitive was expected.');
  });
  test('returns any element passed to it', () => {
    const el = document.createElement('div');
    expect(render_node(el)).toBe(el);
  });
  test('returns contents of fragment instead of fragment', () => {
    const frag = document.createDocumentFragment();
    const el = document.createElement('div');
    frag.append(el);
    expect(render_node(frag)).toStrictEqual([el]);
  });
  test('returns string when string passed to it', () => {
    const el = render_node('hello');
    expect(el).toBe('hello');
  });
  test('returns string when number passed to it', () => {
    const el = render_node(42);
    expect(el).toBe('42');

  });
  test('returns string when boolean passed to it', () => {
    const el = render_node(false);
    expect(el).toBe('false');
  });
});

test('bind_store_to_node', () => {
  const source = new Store<Part>(undefined);
  const parent = document.createElement('div');
  const stub = new Comment('test test test');
  parent.append(stub);
  bind_store_to_node(source, stub);

  expect(parent.innerHTML).toBe('<!--test test test-->');

  source.update('hello');

  expect(parent.innerHTML).toBe('hello');

  source.update([]);

  expect(parent.innerHTML).toBe('<!--test test test-->');

  source.update([ 'a', 42 ]);

  expect(parent.innerHTML).toBe('a42');

  source.update([ 'a', 42, false, document.createElement('div')]);

  expect(parent.innerHTML).toBe('a42false<div></div>');

  source.update([ 'a' ]);

  expect(parent.innerHTML).toBe('a');

  const frag = document.createDocumentFragment();
  const table = document.createElement('table');
  frag.append(table);

  source.update(frag);

  expect(parent.innerHTML).toBe('<table></table>');

  source.update(null);

  expect(parent.innerHTML).toBe('<!--test test test-->');
});

test('bind_store_to_attribute', () => {
  const source = new Store<Part>(undefined);
  const node = document.createElement('div');

  bind_store_to_attribute(source, node, 'example');

  expect(node.hasAttribute('example')).toBe(false);

  source.update('hello');

  expect(node.getAttribute('example')).toBe('hello');

  source.update(null);

  expect(node.hasAttribute('example')).toBe(false);

  source.update(42);

  expect(node.getAttribute('example')).toBe('42');

  source.update(false);

  expect(node.getAttribute('example')).toBe('false');

  expect(() => source.update(() => null)).toThrow('Invalid attribute value');
});

describe('element_swap', () => {
  test('text update', () => {
    const parent = document.createElement('div');
    const old = new Text('a');
    parent.append(old);

    expect(parent.textContent).toBe('a');

    element_swap([ old ], ['b']);

    expect(parent.textContent).toBe('b');
  });
  test('swap node order', () => {
    const parent = document.createElement('div');
    const a = document.createElement('span');
    a.textContent = 'a';
    const b = document.createElement('span');
    b.textContent = 'b';
    const c = document.createElement('span');
    c.textContent = 'c';
    parent.append(a, b, c);

    expect(parent.textContent).toBe('abc');

    element_swap([a, b, c], [c, b, a]);

    expect(parent.textContent).toBe('cba');
  });
  test('increase node count', () => {
    const parent = document.createElement('div');
    const a = document.createElement('span');
    a.textContent = 'a';
    const b = document.createElement('span');
    b.textContent = 'b';
    const c = document.createElement('span');
    c.textContent = 'c';
    parent.append(a);

    expect(parent.textContent).toBe('a');

    element_swap([a], [b, a]);

    expect(parent.textContent).toBe('ba');

    element_swap([b, a], [a, b, c]);

    expect(parent.textContent).toBe('abc');
  });
  test('decrease node count', () => {
    const parent = document.createElement('div');
    const a = document.createElement('span');
    a.textContent = 'a';
    const b = document.createElement('span');
    b.textContent = 'b';
    const c = document.createElement('span');
    c.textContent = 'c';
    parent.append(a, b, c);

    expect(parent.textContent).toBe('abc');

    element_swap([a, b, c], [b, a]);

    expect(parent.textContent).toBe('ba');

    element_swap([b, a], [a]);

    expect(parent.textContent).toBe('a');
  });
  test('remove all and re-add', () => {
    const parent = document.createElement('div');
    const a = document.createElement('span');
    a.textContent = 'a';
    const b = document.createElement('span');
    b.textContent = 'b';
    const c = document.createElement('span');
    c.textContent = 'c';
    parent.append(a, b, c);

    const stub = new Comment('test test test');

    expect(parent.textContent).toBe('abc');

    element_swap([a, b, c], [stub]);

    expect(parent.textContent).toBe('');

    element_swap([stub], [a, b, c]);

    expect(parent.textContent).toBe('abc');
  });
});