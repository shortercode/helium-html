import { close_parser, create_parser, parse_chunk } from './parser';
import { render_template } from './render';
import type { Template } from './Template.type';

const template_cache = new Map<TemplateStringsArray, Template>();

export function svg (literal: TemplateStringsArray, ...parts: unknown[]): DocumentFragment | Element {
  return helium(literal, parts, 'http://www.w3.org/2000/svg');

}

export function html (literal: TemplateStringsArray, ...parts: unknown[]): DocumentFragment | Element {
  return helium(literal, parts, 'http://www.w3.org/1999/xhtml');
}

export function helium (literal: TemplateStringsArray, parts: unknown[], namespace: 'http://www.w3.org/2000/svg' | 'http://www.w3.org/1999/xhtml'): DocumentFragment | Element {
	let template = template_cache.get(literal);

  // first part can memoised based on the literal
  if (!template) {
		const ctx = create_parser();
		const l = literal.raw.length;
		for (const [i, chunk] of literal.raw.entries()) {
			// NOTE no associated part with the last chunk, so pass an index of -1
			parse_chunk(ctx, chunk, i < l ? i : - 1);
		}
		template = close_parser(ctx);
  } 

  // this bit needs to be done fresh each time
  return render_template(template, parts, namespace);

	// TODO the above always returns a fragment, because the root template is
	// always a fragment. In the case that the fragment only contains 1 element
	// it makes more sense to return that instead of the fragment
	// This could be done by either trimming the template or inspecting the
	// rendered output
}