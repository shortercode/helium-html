import { create_placeholder_node, render_node } from './render';

describe('render_template', () => {
  test.todo('test render_template');
});


test('test create_placeholder_node', () => {
  expect(create_placeholder_node()).toBeInstanceOf(Comment);
});

describe('render_node', () => {
  test('returns any element passed to it', () => {
    const el = document.createElement('div');
    expect(render_node(el)).toBe(el);
  });
  test('returns text node when string passed to it', () => {
    const el = render_node('hello');
    expect(el).toBeInstanceOf(Text);
    expect(el.textContent).toBe('hello');
  });
  test.todo('resolve behaviour when reusing document fragments');
});

describe('bind_store_to_node', () => {
  test.todo('test bind_store_to_node');
});

describe('element_swap', () => {
  test.todo('test element_swap');
});