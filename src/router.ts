import type { Listener, Observable } from './Observable/Observable.type';
import { match, MatchResult } from 'path-to-regexp';
import { SimpleObservable } from './Observable/Observable';
import type { Value } from './Child.type';
import { html } from './html';
import type { DynamicRedirectRoute, RedirectRoute, RenderRoute, Route, StaticRedirectRoute } from './router.type';

/**
 * @ignore not ready for public use 
 */
export function route<T extends unknown[]>(pattern: string, render: (match: MatchResult, ...data: T) => Node | Promise<Node>, ...data: T): RenderRoute {
  return {
    pattern: match(pattern),
    label: pattern,
    render: async (match: MatchResult) => await render(match, ...data),
  };
}

/**
 * @ignore not ready for public use 
 */
export function redirect(pattern: string, url: string | URL): StaticRedirectRoute;
export function redirect(pattern: string, route: RedirectRoute): DynamicRedirectRoute;
export function redirect(pattern: string, target: string | URL | RedirectRoute): Route {
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
    function on_pop (event: Pick<PopStateEvent, 'state'>): void {
      const url = event.state as string;
      for (const route of routes) {
        const match = route.pattern(url); // false or MatchResult
        if (match) {
          if ('render' in route) {
            return void render_route(route, match, listener);
          }
          const url = 'url' in route ? route.url : route.route(match);
          const normalised_url = normalise_url(url);

          if (is_external_url(normalised_url)) {
            location.replace(normalised_url);
          } else {
            const state = normalised_url.pathname;
            history.replaceState(state, '', state);
          }
        }
      }
    }
    addEventListener('popstate', on_pop);
    on_pop({ state: location.pathname });
    const dispose = () => removeEventListener('popstate', on_pop);
    return { dispose };
  });
}

/**
 * @ignore not ready for public use 
 */
export async function render_route(route: RenderRoute, match: MatchResult, listener: Listener<Node>): Promise<void> {
  try {
    const node = await route.render(match);
    listener(node);
  } catch (err) {
    console.error(`Failed to render route ${route.label}: ${err as string}`);
  }
}

export function normalise_url(url: URL | string): URL {
  return new URL(url, location.href);
}

export function is_external_url(url: URL): boolean {
  return url.origin !== location.origin;
}

export function navigate(url: URL | string): void {
  const normalised_url = normalise_url(url);
  if (is_external_url(normalised_url)) {
    location.assign(normalised_url);
  } else {
    const state = normalised_url.pathname;
    history.pushState(state, '', state);
  }
}

export function link(url: string, child: Value): DocumentFragment | Element {
  const link_handler = (e: Event) => {
    e.preventDefault();
    navigate(url);
  };
  return html`<a href=${url} onclick=${link_handler}>${child}</a>`;
}