import type { Value } from './Child.type';
import { HTML_NAMESPACE, SVG_NAMESPACE } from './Namespace.constants';
import type { Namespace } from './Namespace.type';
import { close_parser, create_parser, parse_chunk } from './parser';
import { render_template } from './render';
import type { Template } from './Template.type';

const template_cache = new Map<TemplateStringsArray, Template>();

export function svg (literal: TemplateStringsArray, ...parts: Value[]): DocumentFragment | Element {
  return helium(literal, parts, SVG_NAMESPACE);
}

export function html (literal: TemplateStringsArray, ...parts: Value[]): DocumentFragment | Element {
  return helium(literal, parts, HTML_NAMESPACE);
}

export function helium (literal: TemplateStringsArray, parts: Value[], namespace: Namespace): DocumentFragment | Element {
  let template = template_cache.get(literal);

  // first part can memoised based on the literal
  if (!template) {
    const ctx = create_parser();
    const l = parts.length;
    for (const [i, chunk] of literal.raw.entries()) {
      // NOTE no associated part with the last chunk, so pass an index of -1
      parse_chunk(ctx, chunk, i < l ? i : - 1);
    }
    template = close_parser(ctx);
  } 

  // this bit needs to be done fresh each time
  return render_template(template, parts, namespace);
}