import type { Value } from './Child.type';
import { HTML_NAMESPACE, SVG_NAMESPACE } from './Namespace.constants';
import { close_parser, create_parser, parse_chunk } from './parser';
import { render_template } from './render';
import type { Template } from './Template.type';

const template_cache = new Map<TemplateStringsArray, Template>();

export function svg (literal: TemplateStringsArray, ...parts: Value[]): DocumentFragment | Element {
  const template = parse_template(literal);
  return render_template(template, parts, SVG_NAMESPACE);
}

export function html (literal: TemplateStringsArray, ...parts: Value[]): DocumentFragment | Element {
  const template = parse_template(literal);
  return render_template(template, parts, HTML_NAMESPACE);
}

export function parse_template (literal: TemplateStringsArray): Template {
  const template = template_cache.get(literal);

  if (template) {
    return template;
  }

  const ctx = create_parser();
  const l = literal.length - 1;

  for (const [i, chunk] of literal.raw.entries()) {
    // NOTE no associated part with the last chunk, so pass an index of -1
    parse_chunk(ctx, chunk, i < l ? i : - 1);
  }
	
  return close_parser(ctx);
}