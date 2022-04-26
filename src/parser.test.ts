import { Dictionary, Index, invariant } from 'ts-runtime-typecheck';
import { append_attribute, append_child, close_parser, consume_whitespace, create_parser, get_attribute_value, parse_attributes, parse_closing_tag, parse_node, parse_nodes, parse_opening_tag, parse_tag, parse_text_node, read_tag_name } from './parser';
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
  test.todo('parses nodes by default');
  test.todo('resumes attribute parsing if attribute mode is set');
  test.todo('sets part_index');
});

describe('parse_attributes', () => {
  test('empty buffer', () => {
		const ctx = create_parser();
		ctx.part_index = 0;
		parse_attributes(ctx, []);
		expect(ctx).toStrictEqual({
			part_index: 0,
			attribute_mode: true,
			stack: [ { tag: FRAGMENT_TAG, children: [] }],
		});
	});
  test('immediate self close', () => {
		const ctx: Parser = {
			part_index: -1,
			attribute_mode: false,
			stack: [ { tag: 'a' }, { tag: FRAGMENT_TAG, children: [ { tag: 'a' } ]}]
		};
		const buffer = Array.from('/>');
		parse_attributes(ctx, buffer);
		expect(ctx).toStrictEqual({
			part_index: -1,
			attribute_mode: false,
			stack: [ { tag: FRAGMENT_TAG, children: [ { tag: 'a' } ] }],
		});
		expect(buffer.length).toBe(0);
	});
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
  test('unterminated string', () => {
		const ctx = create_parser();
		const buffer = Array.from('"hi');
		expect(() => get_attribute_value(ctx, buffer)).toThrow('Unterminated attribute value; unable to find \'"\' character.');
	});
  test('empty string', () => {
		const ctx = create_parser();
		expect(() => get_attribute_value(ctx, [])).toThrow('Unexpected end of string, expected \'"\'.');
	});
	test('missing " at start', () => {
		const ctx = create_parser();
		const buffer = Array.from('hi');
		expect(() => get_attribute_value(ctx, buffer)).toThrow('Expected \'"\' but found \'h\'.');
	});
  test('variable attribute', () => {
		const ctx = create_parser();
		ctx.part_index = 0;
		expect(get_attribute_value(ctx, [])).toBe(0);
	});
  test('value', () => {
		const ctx = create_parser();
		const buffer = Array.from('"hi"');
		expect(get_attribute_value(ctx, buffer)).toBe('hi');
	});
});

describe('consume_whitespace', () => {
  test('empty buffer', () => {
		// just want to make sure this doesn't throw
		consume_whitespace([]);
	});
  test('no whitespace', () => {
		const buffer = Array.from('hello');
		consume_whitespace(buffer);
		expect(buffer.length).toBe(5);
	});
  test('match first non-whitespace character', () => {
		const buffer = Array.from('  	hello');
		consume_whitespace(buffer);
		expect(buffer.length).toBe(5);
	});
  test('all whitespace', () => {
		const buffer = Array.from('  	 		 	 	   	 	 \n		 ');
		consume_whitespace(buffer);
		expect(buffer.length).toBe(0);
	});
});

describe('parse_nodes', () => {
  test('empty buffer', () => {
		const ctx = create_parser();
		parse_nodes(ctx, []);
		expect(ctx).toStrictEqual({
			part_index: -1,
			attribute_mode: false,
			stack: [ { tag: FRAGMENT_TAG, children: [] }]
		});
	});
  test('parse attributes first if attribute mode is set', () => {
		const target_node = { tag: 'hello' };
		const ctx: Parser = {
      part_index: -1,
      attribute_mode: true,
      stack: [
        target_node,
        { tag: FRAGMENT_TAG, children: [ target_node ]}
      ]
    };

		const buffer = Array.from('a="1" b="2">');
		parse_nodes(ctx, buffer);
		expect(ctx).toStrictEqual({
			part_index: -1,
			attribute_mode: false,
			stack: [
				{ tag: 'hello', attributes: { a: '1', b: '2' } },
				{
					tag: FRAGMENT_TAG,
					children: [
						{ tag: 'hello', attributes: { a: '1', b: '2' } }
					]
				}
			]
		});
	});
  test('1 node', () => {
		const ctx = create_parser();
		const buffer = Array.from('<a/>');
		parse_nodes(ctx, buffer);
		expect(ctx).toStrictEqual({
			part_index: -1,
			attribute_mode: false,
			stack: [
				{
					tag: FRAGMENT_TAG,
					children: [
						{ tag: 'a' }
					]
				}
			]
		});
	});
  test('multiple nodes', () => {
		const ctx = create_parser();
		const buffer = Array.from('<a/>hello<b/>');
		parse_nodes(ctx, buffer);
		expect(ctx).toStrictEqual({
			part_index: -1,
			attribute_mode: false,
			stack: [
				{
					tag: FRAGMENT_TAG,
					children: [
						{ tag: 'a' },
						'hello',
						{ tag: 'b' }
					]
				}
			]
		});
	});
  test('variable node', () => {
		const ctx = create_parser();
		ctx.part_index = 0;
		const buffer = Array.from('');
		parse_nodes(ctx, buffer);
		expect(ctx).toStrictEqual({
			part_index: 0,
			attribute_mode: false,
			stack: [
				{
					tag: FRAGMENT_TAG,
					children: [
						0
					]
				}
			]
		});
	});
  test('variable node after nodes', () => {
		const ctx = create_parser();
		ctx.part_index = 0;
		const buffer = Array.from('<a/><b/>');
		parse_nodes(ctx, buffer);
		expect(ctx).toStrictEqual({
			part_index: 0,
			attribute_mode: false,
			stack: [
				{
					tag: FRAGMENT_TAG,
					children: [
						{ tag: 'a' },
						{ tag: 'b' },
						0
					]
				}
			]
		});
	});
});

describe('parse_node', () => {
  test('tag', () => {
    const ctx = create_parser();
    const buffer = Array.from('<hello/>');
    parse_node(ctx, buffer);
    expect(ctx.stack).toStrictEqual([
      {
        tag: FRAGMENT_TAG,
        children: [ { tag: 'hello' } ],
      }
    ]);
    expect(buffer.length).toBe(0);
  });
  test('text', () => {
    const ctx = create_parser();
    const buffer = Array.from('hello');
    parse_node(ctx, buffer);
    expect(ctx.stack).toStrictEqual([
      {
        tag: FRAGMENT_TAG,
        children: [ 'hello' ],
      }
    ]);
    expect(buffer.length).toBe(0);
  });
});

describe('parse_tag', () => {
  test('opening tag', () => {
    const ctx = create_parser();
    const buffer = Array.from('hello>');
    parse_tag(ctx, buffer);
    expect(ctx.stack).toStrictEqual([
      { tag: 'hello' },
      { tag: FRAGMENT_TAG, children: [ { tag: 'hello' }] }
    ]);
    expect(buffer.length).toBe(0);
  });
  test('closing tag', () => {
    const ctx: Parser = {
      part_index: -1,
      attribute_mode: false,
      stack: [
        { tag: 'hello' },
        { tag: FRAGMENT_TAG, children: [ { tag: 'hello' } ]}
      ]
    };
    
    const buffer = Array.from('/hello>');
    parse_tag(ctx, buffer);
    expect(ctx.stack).toStrictEqual([
      { tag: FRAGMENT_TAG, children: [ { tag: 'hello' }] }
    ]);
    expect(buffer.length).toBe(0);
  });
});

describe('parse_closing_tag', () => {
  test('matching tag', () => {
    const ctx: Parser = {
      part_index: -1,
      attribute_mode: false,
      stack: [
        { tag: 'hello' },
        { tag: FRAGMENT_TAG, children: [ { tag: 'hello' } ]}
      ]
    };
    
    const buffer = Array.from('hello>');

    parse_closing_tag(ctx, buffer);

    expect(ctx.stack).toStrictEqual([
      { tag: FRAGMENT_TAG, children: [ { tag: 'hello' } ]}
    ]);
    expect(buffer.length).toBe(0);
  });
  test('unmatched tag', () => {
    const ctx: Parser = {
      part_index: -1,
      attribute_mode: false,
      stack: [
        { tag: 'hello' },
        { tag: FRAGMENT_TAG, children: [ { tag: 'hello' } ]}
      ]
    };
    
    const buffer = Array.from('goodbye>');

    parse_closing_tag(ctx, buffer);

    expect(ctx.stack).toStrictEqual([
      { tag: 'hello' },
      { tag: FRAGMENT_TAG, children: [ { tag: 'hello' } ]}
    ]);
    expect(buffer.length).toBe(0);
  });
  test('close parent', () => {
    const ctx: Parser = {
      part_index: -1,
      attribute_mode: false,
      stack: [
        { tag: 'goodbye' },
        { tag: 'hello', children: [ { tag: 'goodbye' }] },
        { tag: FRAGMENT_TAG, children: [ { tag: 'hello', children: [ { tag: 'goodbye' }] } ]}
      ]
    };
    
    const buffer = Array.from('hello>');

    parse_closing_tag(ctx, buffer);

    expect(ctx.stack).toStrictEqual([
      { tag: FRAGMENT_TAG, children: [ { tag: 'hello', children: [ { tag: 'goodbye' }] } ]}
    ]);
    expect(buffer.length).toBe(0);
  });
  test('empty stack', () => {
    const ctx: Parser = {
      part_index: -1,
      attribute_mode: false,
      stack: []
    };

    const buffer = Array.from('hello>');

    expect(() => parse_closing_tag(ctx, buffer)).toThrow('Stack is empty, no root node');
  });
  test('unterminated tag', () => {
    const ctx: Parser = {
      part_index: -1,
      attribute_mode: false,
      stack: [
        { tag: 'hello' },
        { tag: FRAGMENT_TAG, children: [ { tag: 'hello' } ]}
      ]
    };
    
    const buffer = Array.from('hello');

    expect(() => parse_closing_tag(ctx, buffer)).toThrow('Unexpected end of string, expected \'>\'.');
  });
  test('invalid character', () => {
    const ctx: Parser = {
      part_index: -1,
      attribute_mode: false,
      stack: [
        { tag: 'hello' },
        { tag: FRAGMENT_TAG, children: [ { tag: 'hello' } ]}
      ]
    };
    
    const buffer = Array.from('hello<');

    expect(() => parse_closing_tag(ctx, buffer)).toThrow('Expected character ">" but received "<".');
  });
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
			ctx.part_index = 0;
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
			ctx.part_index = 0;
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
 test('reject invalid names', () => {
  const buffer = Array.from('hello--world');
  expect(() => read_tag_name(buffer)).toThrow('Invalid tag name "hello--world".');
 });
 test('allows numbers', () => {
  const buffer = Array.from('h1');
  expect(read_tag_name(buffer)).toBe('h1');
  expect(buffer.length).toBe(0);
 });
 test('throws if no characters available', () => {
  expect(() => read_tag_name([])).toThrow('Unable to read tag name.');
 });
 test('throws if leading character is invalid ', () => {
  expect(() => read_tag_name(['<'])).toThrow('Unable to read tag name.');
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