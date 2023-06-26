import type { HistoryState } from './router.type';

let current_index = 0;

export function bind_onpop (on_pop: (url: string) => void): () => void {
  const handler =  (event: Pick<PopStateEvent, 'state'>) => {
    const { url, index } = event.state as HistoryState;
    current_index = index;
    on_pop(url);
  };

  addEventListener('popstate', handler);
  replace_state(location.pathname);

  return () => removeEventListener('popstate', handler);
}

export function repop (state: HistoryState): void {
  const evt = new PopStateEvent('popstate', { state });
  dispatchEvent(evt);
}

export function navigate (url: URL | string): void {
  const normalised_url = normalise_url(url);

  if (is_external_url(normalised_url)) {
    location.assign(normalised_url);
  }
  push_state(normalised_url.pathname);
}

export function redirect (url: URL | string): void {
  const normalised_url = normalise_url(url);

  if (is_external_url(normalised_url)) {
    location.replace(normalised_url);
  }
  replace_state(normalised_url.pathname);
}

export function back (url: URL | string): void {
  const state = history.state as HistoryState;
  if (state.index > 0) {
    history.back();
  } else {
    redirect(url);
  }
}

export function reload (hard = false): void {
  if (hard) {
    location.reload();
  }
  repop(history.state as HistoryState);
}

export function push_state (url: string): void {
  const state = {
    url,
    index: current_index + 1,
  };
  history.pushState(state, '', url);
  repop(state);
}

export function replace_state (url: string): void {
  const state = {
    url,
    index: current_index,
  };
  history.replaceState(state, '', url);
  repop(state);
}

export function normalise_url(url: URL | string): URL {
  return new URL(url, location.href);
}

export function is_external_url(url: URL): boolean {
  return url.origin !== location.origin;
}