import { SimpleObservable } from './Observable';
import { distinct } from './operators';

const dom_changes = new SimpleObservable(listener => {
  const mutation_observer = new MutationObserver(listener);
  mutation_observer.observe(document, { childList: true, subtree: true });
  const dispose = () => mutation_observer.disconnect();
  return { dispose };
}).pipe(distinct());

// TODO come up with a better way of doing this that doesn't require observing EVERY change to the document
export function on_disconnected (el: Element, cb: () => void): void {
  let is_connected = el.isConnected;
  const disposable = dom_changes.watch(() => {
    if (!is_connected) {
      is_connected = el.isConnected;
      return;
    }
    if (!el.isConnected) {
      disposable.dispose();
      cb();
    }
  });
}