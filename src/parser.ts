import { invariant } from 'ts-runtime-typecheck';
import type { Parser } from './Parser.type';
import { FRAGMENT_TAG } from './Template.constants';
import type { Template } from './Template.type';

export function create_parser (): Parser {
  return {
    part_index: -1,
    stack: [{ tag: FRAGMENT_TAG, children: [] }],
    attribute_mode: false,
  };
}

export function parse_chunk (ctx: Parser, src: string, part_index: number) {
  /**
	 * The parser can be in 3 states here
	 * 1. Initial
	 * 2. After attribute
	 * 3. After text/node
	 * 
	 * In 1 & 3 we proceed to try and parse more nodes or text.
	 * In 2 we proceed to try and parse more attributes for the current node.
	 * 
	 * The major difference between 1 & 3 is that there is no root node in state 1
	 * which means any attempt to close a node will fail.
	 */
  ctx.part_index = part_index;
  const buffer = Array.from(src);
  parse_nodes(ctx, buffer);
}

export function parse_attributes (ctx: Parser, buffer: string[]): void {
  const top = ctx.stack[0];
  invariant(top !== undefined, 'Stack is empty, no root node');
  do {
    consume_whitespace(buffer);
    if (buffer[0] === '/' || buffer[0] === '>') {
      break;
    }

    if (ctx.part_index >= 0 && buffer.length === 0) {
      throw new SyntaxError('Variable attribute names are not allowed.');
    }

    // NOTE can also be used for attributes
    const name = read_label(buffer);

    if (ctx.part_index >= 0 && buffer.length === 0) {
      throw new SyntaxError('Expected "=".');
    }

    if (buffer[0] === '=') {
      // consume "="
      buffer.shift();
      const value = get_attribute_value(ctx, buffer);
      append_attribute(top, name, value);
    } else {
      append_attribute(top, name, '');
    }
  } while(buffer.length > 0);

  if (ctx.part_index >= 0 && buffer.length === 0) {
    ctx.attribute_mode = true;
    return;
  }

  ctx.attribute_mode = false;

  if (buffer[0] === '/') {
    // consume '/'
    buffer.shift();
    // pop the current element from the stack
    ctx.stack.shift();
  }

  // consume '>'
  const next_ch = buffer.shift();
  if (next_ch === undefined) {
    throw new SyntaxError('Expected \'/>\'.');
  }
  if (next_ch !== '>') {
    throw new SyntaxError(`Expected '>' but found '${next_ch}'.`);
  }
}

export function get_attribute_value (ctx: Parser, buffer: string[]): string | number {
  // consume " symbol
  const next_ch = buffer.shift();
  if (next_ch === undefined) {
    if (ctx.part_index > -1) {
      return ctx.part_index;
    }
    throw new SyntaxError('Expected \'"\'.');
  }
  if (next_ch !== '"') {
    throw new SyntaxError(`Expected '"' but found '${next_ch}'.`);
  }

  // find the first invalid 
  const i = buffer.findIndex(ch => /["]/i.test(ch));
  if (i < 0) {
    throw new SyntaxError('Unterminated attribute value; unable to find \'"\' character.');
  }
  const value = buffer.splice(0, i).join('');
  // NOTE consume " character
  buffer.shift();
  return value;
}

export function consume_whitespace (buffer: string[]): void {
  const i = buffer.findIndex(ch => /\S/m.test(ch));
  const length = i < 0 ? buffer.length : i;
  buffer.splice(0, length);
}

export function parse_nodes (ctx: Parser, buffer: string[]) {
  if (ctx.attribute_mode) {
    parse_attributes(ctx, buffer);
  }
  while(buffer.length > 0) {
    parse_node(ctx, buffer);
  }
  if (ctx.attribute_mode === false && ctx.part_index > -1) {
    append_child(ctx, ctx.part_index);
  }
}

const TAG_NAME_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/i; 

export function parse_node (ctx: Parser, buffer: string[]): void {
  if (buffer[0] === '<') {
    // consume angle bracket
    buffer.shift();
    parse_tag(ctx, buffer);
  } else {
    parse_text_node(ctx, buffer);
  }
}

export function parse_tag (ctx: Parser, buffer: string[]): void {
  // TODO add support for HTML comments here
  if (buffer[0] === '/') {
    buffer.shift();
    parse_closing_tag(ctx, buffer);
  } else {
    parse_opening_tag(ctx, buffer);
  }	
}

export function parse_closing_tag (ctx: Parser, buffer: string[]): void {
  const top = ctx.stack[0];
  invariant(top !== undefined, 'Stack is empty, no root node');
  const tag = read_label(buffer);

  if (tag !== top.tag) {
    console.warn(`Unmatched closing tag "${tag}" in current context "${top.tag}"`);
    /** 
		 * Uses a similar recovery pattern to native HTML parsing, search upward
		 * through the stack for a matching open tag and close all the open tags
		 * within that node. This is helpful when trying to recover from a forgotten
		 * closing tag.
		 * 
		 * If it doesn't match anything then it's presumed erroneous and just
		 * completely ignored. 
		 * 
		 * <a>					['a']
		 *   <b>				['b', 'a']
		 *     <c>			['c', 'b', 'a']
		 *       <d>		['d', 'c', 'b', 'a']
		 *   </b>				['a']
		 * </a>     		[]
		 * 
		 * ['a', 'b', 'c', 'd']
		 * 
		 * close 'b'
		 */ 
    // 
    const i = ctx.stack.findIndex(node => node.tag === tag) + 1;
    if (i > 0) {
      ctx.stack.splice(0, i);
    }
  } else  {
    ctx.stack.shift();
  }
  const next_ch = buffer.shift();
  if (next_ch === undefined) {
    throw new SyntaxError('Unexpected end of string, expected \'>\'.');
  }
  if (next_ch !== '>') {
    throw new SyntaxError(`Expected character ">" but received "${next_ch}".`);
  }
}

export function parse_opening_tag (ctx: Parser, buffer: string[]): void {
  const child = { tag: read_label(buffer) };
  append_child(ctx, child);
  ctx.stack.unshift(child);
  parse_attributes(ctx, buffer);
  // the node may, or may not, be closed by the time we reach here
}

export function append_child (ctx: Parser, child: string | number | Template) {
  const top = ctx.stack[0];
  invariant(top !== undefined, 'Stack is empty, no root node');
  let children = top.children;
  if (!children) {
    children = [];
    top.children = children;
  }
  children.push(child);
}

export function append_attribute(top: Template, name: string, child: string | number) {
  let attributes = top.attributes;
  if (!attributes) {
    attributes = {};
    top.attributes = attributes;
  }
  attributes[name] = child;
}

export function read_label (buffer: string[]): string {
  // find the first invalid
  const i = buffer.findIndex(ch => /[^a-z0-9-]/i.test(ch));
  const length = i < 0 ? buffer.length : i;

  if (length === 0) {
    throw new Error('Unable to read name.');
  }

  const tag_name = buffer.splice(0, length).join('');

  if (!TAG_NAME_REGEX.test(tag_name)) {
    throw new Error(`Invalid name "${tag_name}".`);
  }

  return tag_name;
}

export function parse_text_node (ctx: Parser, buffer: string[]): void {
  // extract every char until the next "<"
  const i = buffer.indexOf('<');
  const length = i < 0 ? buffer.length : i;
  if (length === 0) {
    return;
  }
  const text = buffer.splice(0, length).join('');
  append_child(ctx, text);
}

export function close_parser (ctx: Parser): Template {
  if (ctx.attribute_mode) {
    throw new SyntaxError('Unterminated start tag');
  }
  // this implicitly closes any elements left on the stack
  const last = ctx.stack.pop();
  ctx.stack.length = 0;
  invariant(last !== undefined, 'Stack is empty, no root node');

  // 
  if (last.tag === FRAGMENT_TAG && last.children) {
    const { children } = last;
    const only_child = children.length === 1 && children[0];
    if (typeof only_child === 'object') {
      return only_child;
    }
  }
  return last;
}