import type { Listener, Observable } from './Observable/Observable.type';
import { match, MatchResult } from 'path-to-regexp';
import { SimpleObservable } from './Observable/Observable';
import type { Nodelike, Value } from './Child.type';
import { html } from './html';
import type { DynamicRedirectRoute, RedirectRoute, RenderRoute, Route, StaticRedirectRoute } from './router.type';
import { bind_onpop, navigate, redirect, normalise_url } from './router_core';

/**
 * @ignore not ready for public use 
 */
export function route(pattern: string, render: (match: MatchResult) => Nodelike): RenderRoute {
  return {
    pattern: match(pattern),
    label: pattern,
    render,
  };
}

/**
 * @ignore not ready for public use 
 */
export function redirect_route(pattern: string, url: string | URL): StaticRedirectRoute;
export function redirect_route(pattern: string, route: RedirectRoute): DynamicRedirectRoute;
export function redirect_route(pattern: string, target: string | URL | RedirectRoute): Route {
  if (typeof target === 'string' || target instanceof URL) {
    const url = normalise_url(target);
    return { pattern: match(pattern), label: pattern, url };
  }
  return { pattern: match(pattern), label: pattern, route: target };
}

/**
 * @ignore not ready for public use 
 */
export function router(routes: Route[]): Observable<Node> {
  return new SimpleObservable((listener: Listener<Node>) => {
    const dispose = bind_onpop(url => {
      for (const route of routes) {
        const match = route.pattern(url); // false or MatchResult
        if (match) {
          if ('render' in route) {
            return render_route(route, match, listener);
          }

          redirect('url' in route ? route.url : route.route(match));
        }
      }
    });
    
    return { dispose };
  });
}

/**
 * @ignore not ready for public use 
 */
export function render_route(route: RenderRoute, match: MatchResult, listener: Listener<Node>): void {
  try {
    const node = route.render(match);
    listener(node);
  } catch (err) {
    console.error(`Failed to render route ${route.label}: ${err as string}`);
  }
}

export function link(url: string, child: Value): DocumentFragment | Element {
  const link_handler = (e: Event) => {
    e.preventDefault();
    navigate(url);
  };
  return html`<a href=${url} onclick=${link_handler}>${child}</a>`;
}