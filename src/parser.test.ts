import { Dictionary, Index, invariant } from 'ts-runtime-typecheck';
import { append_attribute, append_child, close_parser, create_parser, parse_opening_tag, parse_text_node, read_tag_name } from './parser';
import type { Parser } from './Parser.type';
import { FRAGMENT_TAG } from './Template.constants';

describe('create_parser', () => {
  test('', () => {
    expect(create_parser()).toStrictEqual({
      part_index: -1,
      stack: [{ tag: FRAGMENT_TAG, children: []}],
      attribute_mode: false
    });
  });
});

describe('parse_chunk', () => {

});

describe('parse_attributes', () => {
  test.todo('empty buffer');
  test.todo('immediate self close');
  test.todo('no attributes');
  test.todo('multiple attributes');
  test.todo('whitespace then self close');
  test.todo('whitespace then no attributes');
  test.todo('boolean attribute');
  test.todo('variable attribute');
  test.todo('buffer end after attribute name');
  test.todo('missing angle bracket at end');
  test.todo('angle bracket at end replaced with invalid char');
  test.todo('resumability');
});

describe('get_attribute_value', () => {
  test.todo('unterminated string');
  test.todo('empty string');
  test.todo('variable attribute');
  test.todo('value');
});

describe('consume_whitespace', () => {
  test.todo('empty buffer');
  test.todo('no whitespace');
  test.todo('match first non-whitespace character');
  test.todo('all whitespace');
});

describe('parse_nodes', () => {
  test.todo('empty buffer');
  test.todo('1 node');
  test.todo('multiple nodes');
  test.todo('variable node');
});

describe('parse_node', () => {
  test.todo('tag');
  test.todo('text');
});

describe('parse_tag', () => {
  test.todo('opening tag');
  test.todo('closing tag');
});

describe('parse_closing_tag', () => {
  test.todo('matching tag');
  test.todo('unmatched tag');
  test.todo('close parent');
  test.todo('empty stack');
  test.todo('unterminated tag');
  test.todo('invalid character');
});

describe('parse_opening_tag', () => {
  describe('complete tag', () => {
    test('tagname', () => {
      const ctx = create_parser();
      const buffer = Array.from('hello>');
      parse_opening_tag(ctx, buffer);
      expect(ctx.stack[0]).toStrictEqual({
        tag: 'hello'
      });
      expect(buffer.length).toBe(0);
    });
    test('self closing', () => {
      const ctx = create_parser();
      const buffer = Array.from('hello/>');
      parse_opening_tag(ctx, buffer);
      expect(ctx.stack[0]).toStrictEqual({
        tag: FRAGMENT_TAG,
        children: [ { tag: 'hello' } ]
      });
      expect(buffer.length).toBe(0);
    });
    test('with attribute', () => {
      const ctx = create_parser();
      const buffer = Array.from('hello test="value">');
      parse_opening_tag(ctx, buffer);
      expect(ctx.stack[0]).toStrictEqual({
        tag: 'hello',
        attributes: { test: 'value' }
      });
      expect(buffer.length).toBe(0);
    });
    test('with boolean attribute', () => {
      const ctx = create_parser();
      const buffer = Array.from('hello test>');
      parse_opening_tag(ctx, buffer);
      expect(ctx.stack[0]).toStrictEqual({
        tag: 'hello',
        attributes: { test: '' }
      });
      expect(buffer.length).toBe(0);
    });
    test('with multiple attributes', () => {
      const ctx = create_parser();
      const buffer = Array.from('hello a b="value" c>');
      parse_opening_tag(ctx, buffer);
      expect(ctx.stack[0]).toStrictEqual({
        tag: 'hello',
        attributes: { a: '', b: 'value', c: '' }
      });
      expect(buffer.length).toBe(0);
    });
    test('self closing with multiple attributes', () => {
      const ctx = create_parser();
      const buffer = Array.from('hello a b="value" c/>');
      parse_opening_tag(ctx, buffer);
      expect(ctx.stack[0]).toStrictEqual({
        tag: FRAGMENT_TAG,
        children: [
          {
            tag: 'hello',
            attributes: { a: '', b: 'value', c: '' }
          }
        ]
      });
      expect(buffer.length).toBe(0);
    });
  });
  describe('partial tag', () => {
    test('tagname', () => {
      const ctx = create_parser();
      const buffer = Array.from('hello');
      parse_opening_tag(ctx, buffer);
      expect(ctx.stack[0]).toStrictEqual({
        tag: 'hello'
      });
      expect(buffer.length).toBe(0);
      expect(ctx.attribute_mode).toBe(true);
    });
    test('with some attributes', () => {
      const ctx = create_parser();
      const buffer = Array.from('hello a b="value" c');
      parse_opening_tag(ctx, buffer);
      expect(ctx.stack[0]).toStrictEqual({
        tag: 'hello',
        attributes: { a: '', b: 'value', c: '' }
      });
      expect(buffer.length).toBe(0);
      expect(ctx.attribute_mode).toBe(true);
    });
    test('with variable attribute', () => {
      const ctx = create_parser();
      ctx.part_index = 0;
      const buffer = Array.from('hello a=');
      parse_opening_tag(ctx, buffer);
      expect(ctx.stack[0]).toStrictEqual({
        tag: 'hello',
        attributes: { a: 0 }
      });
      expect(buffer.length).toBe(0);
      expect(ctx.attribute_mode).toBe(true);
    });
    test('with some attributes and a variable attribute', () => {
      const ctx = create_parser();
      ctx.part_index = 0;
      const buffer = Array.from('hello a b="value" c=');
      parse_opening_tag(ctx, buffer);
      expect(ctx.stack[0]).toStrictEqual({
        tag: 'hello',
        attributes: { a: '', b: 'value', c: 0 }
      });
      expect(buffer.length).toBe(0);
      expect(ctx.attribute_mode).toBe(true);
    });
  });
});

describe('append_child', () => {
  test('throws if empty stack', () => {
    const ctx = create_parser();
    ctx.stack.length = 0;
    expect(() => append_child(ctx, 'value')).toThrow('Stack is empty, no root node');
  });
  test('creates children if it does not exist', () => {
    const ctx: Parser = {
      part_index: -1,
      stack: [{ tag: FRAGMENT_TAG }],
      attribute_mode: false,
    };
    expect(ctx.stack[0]?.children).toBeUndefined();
    append_child(ctx, 'test');
    expect(ctx.stack[0]?.children).toBeDefined();
  });
  test('uses existing children if already exists', () => {
    const ctx = create_parser();
    const top = ctx.stack[0];
    invariant(typeof top !== 'undefined', '');

    expect(top.children).toBeDefined();
    const children = top.children;

    append_child(ctx, 'test');
    expect(children).toBe(children);
  });
  test('adds new child', () => {
    const ctx = create_parser();
    append_child(ctx, 'a');
    append_child(ctx, 'b');
    expect(ctx.stack[0]?.children).toStrictEqual([
      'a',
      'b'
    ]);
  });
});

describe('append_attribute', () => {
  test('throws if empty stack', () => {
    const ctx = create_parser();
    ctx.stack.length = 0;
    expect(() => append_attribute(ctx, 'test', 'value')).toThrow('Stack is empty, no root node');
  });
  test('creates attributes if it does not exist', () => {
    const ctx = create_parser();
    expect(ctx.stack[0]?.attributes).toBeUndefined();
    append_attribute(ctx, 'test', 'value');
    expect(ctx.stack[0]?.attributes).toBeDefined();
  });
  test('uses existing attributes if already exists', () => {
    const ctx = create_parser();
    const top = ctx.stack[0];
    invariant(typeof top !== 'undefined', '');

    expect(top.attributes).toBeUndefined();
    const attr: Dictionary<Index> = {};
    top.attributes = attr;

    append_attribute(ctx, 'test', 'value');
    expect(attr['test']).toBe('value');
  });
  test('adds new attribute', () => {
    const ctx = create_parser();
    append_attribute(ctx, 'a', 1);
    append_attribute(ctx, 'b', 2);
    expect(ctx.stack[0]?.attributes).toStrictEqual({
      a: 1,
      b: 2
    });
  });
  test('overwrites an existing attribute with same name', () => {
    const ctx = create_parser();
    append_attribute(ctx, 'a', 1);
    expect(ctx.stack[0]?.attributes).toStrictEqual({
      a: 1,
    });
    append_attribute(ctx, 'a', 2);
    expect(ctx.stack[0]?.attributes).toStrictEqual({
      a: 2,
    });
  });
});

describe('read_tag_name', () => {
 test('does not read past spaces', () => {
  const buffer = Array.from('hello world');
  expect(read_tag_name(buffer)).toBe('hello');
  expect(buffer.length).toBe(6);
 });
 test('includes dashes', () => {
  const buffer = Array.from('hello-world');
  expect(read_tag_name(buffer)).toBe('hello-world');
  expect(buffer.length).toBe(0); 
 });
 test('allows numbers', () => {
  const buffer = Array.from('h1');
  expect(read_tag_name(buffer)).toBe('h1');
  expect(buffer.length).toBe(0);
 });
 test('throws if no characters available', () => {
  expect(() => read_tag_name([])).toThrow('Unable to read tag name');
 });
 test('throws if leading character is invalid ', () => {
  expect(() => read_tag_name(['<'])).toThrow('Unable to read tag name');
 });
});

describe('parse_text_node', () => {
  test('does not append a node when theres no text', () => {
    const ctx = create_parser();
    parse_text_node(ctx, []);
    expect(ctx).toStrictEqual({
      part_index: -1,
      stack: [{ tag: FRAGMENT_TAG, children: []}],
      attribute_mode: false
    });
  });
  test('does not append a node when next char is angle bracket', () => {
    const ctx = create_parser();
    parse_text_node(ctx, [ '<' ]);
    expect(ctx).toStrictEqual({
      part_index: -1,
      stack: [{ tag: FRAGMENT_TAG, children: []}],
      attribute_mode: false
    });
  });
  test('returns all characters if no angle bracket present', () => {
    const ctx = create_parser();
    const buffer = Array.from('hello world');
    parse_text_node(ctx, buffer);
    expect(ctx).toStrictEqual({
      part_index: -1,
      stack: [{ tag: FRAGMENT_TAG, children: [ 'hello world' ]}],
      attribute_mode: false
    });
    expect(buffer.length).toBe(0);
  });
  test('returns all characters up to the first angle bracket', () => {
    const ctx = create_parser();
    const buffer = Array.from('hello <world> <cheese>');
    parse_text_node(ctx, buffer);
    expect(ctx).toStrictEqual({
      part_index: -1,
      stack: [{ tag: FRAGMENT_TAG, children: [ 'hello ' ]}],
      attribute_mode: false
    });
    expect(buffer.length).toBe(16);
  });
});

describe('close_parser', () => {
  test('cannot exit while trying to parse attributes', () => {
    const ctx = create_parser();
    ctx.attribute_mode = true;
    expect(() => close_parser(ctx)).toThrow('Unterminated start tag');
  });
  test('cannot exit when stack is empty', () => {
    const ctx = create_parser();
    ctx.stack.length = 0;
    expect(() => close_parser(ctx)).toThrow('Stack is empty, no root node');
  });
  test('empties the stack', () => {
    const ctx = create_parser();
    expect(close_parser(ctx)).toStrictEqual({ tag: FRAGMENT_TAG, children: []});
  });
});