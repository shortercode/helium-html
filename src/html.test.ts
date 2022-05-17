import { invariant } from 'ts-runtime-typecheck';
import { html, svg } from './html';

describe('html', () => {
  test('simple', () => {
    const node = html`<div>Hello World</div>`;

    expect(node).toBeInstanceOf(HTMLDivElement);
    expect(node.childNodes.length).toBe(1);
    expect(node.textContent).toBe('Hello World');
  });

  test('value insertion', () => {
    const node = html`<div>Hello ${'James'}</div>`;

    expect(node).toBeInstanceOf(HTMLDivElement);
    expect(node.childNodes.length).toBe(2);
    expect(node.textContent).toBe('Hello James');
  });

  test('attribute insertion', () => {
    const node = html`<div title="Hello World">Hello World</div>`;

    expect(node).toBeInstanceOf(HTMLDivElement);
    expect(node.childNodes.length).toBe(1);
    invariant(node instanceof Element, 'Expected to be an Element');
    expect(node.attributes.getNamedItem('title')?.value).toBe('Hello World');
    expect(node.textContent).toBe('Hello World');
  });
});

describe('svg', () => {
  test('simple', () => {
    const node = svg`<svg width="300" height="200"><rect width="100%" height="100%" fill="red" /></svg>`;

    expect(node).toBeInstanceOf(SVGElement);
    expect(node.children.length).toBe(1);
    expect(node.firstElementChild?.tagName).toBe('rect');
  });
});