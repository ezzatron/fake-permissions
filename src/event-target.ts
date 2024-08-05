export class BaseEventTarget extends EventTarget {
  constructor({
    onListenerCountChange,
  }: {
    onListenerCountChange: OnListenerCountChange;
  }) {
    super();

    this.#bubbleListeners = new Map();
    this.#captureListeners = new Map();
    this.#onListenerCountChange = onListenerCountChange;
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    if (!listener) {
      super.addEventListener(type, listener, options);

      return;
    }

    const [isNew, wrappedListener] = this.#wrapListener(
      type,
      listener,
      normalizeOptions(options),
    );
    super.addEventListener(type, wrappedListener, options);

    if (isNew) this.#onListenerCountChange(type, this.#listenerCount(type));
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void {
    if (!listener) {
      super.removeEventListener(type, listener, options);

      return;
    }

    const normalizedOptions = normalizeOptions(options);
    const listeners = this.#listenersFor(type, normalizedOptions);
    const listenerData = listeners.get(listener);

    if (!listenerData) {
      super.removeEventListener(type, listener, options);

      return;
    }

    super.removeEventListener(type, listenerData.wrappedListener, options);
    this.#handleListenerRemoval(type, listener, normalizedOptions);
  }

  #wrapListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options: AddEventListenerOptions,
  ): [boolean, EventListener] {
    const listeners = this.#listenersFor(type, options);
    const listenerData = listeners.get(listener);

    if (listenerData) return [false, listenerData.wrappedListener];

    const { once, signal } = options;

    const remove = () => {
      this.#handleListenerRemoval(type, listener, options);
    };

    function wrappedListener(this: EventTarget, event: Event) {
      if (typeof listener === "function") {
        listener.call(this, event);
      } else {
        listener.handleEvent(event);
      }

      if (once) remove();
    }

    // There's a nasty race condition that can occur if:
    //
    //   1. An event listener is added with an abort signal.
    //   2. We listen to the "abort" event on the signal, with a listener that
    //      will remove the main event listener from our internal set the first
    //      time the "abort" event fires.
    //   3. The main event listener is removed.
    //   4. We do not remove the "abort" event listener.
    //   5. The same event listener is added again without the original abort
    //      signal.
    //   6. The abort signal's "abort" event fires.
    //   7. Since we are still listening to the "abort" events, our "abort"
    //      listener removes the main event listener from our internal set even
    //      though it is no longer associated with the abort signal.
    //
    // To prevent this, we must keep track of the listener we add to the "abort"
    // event of the signal, and remove it when the main event listener is
    // removed.

    if (signal) {
      signal.addEventListener("abort", remove, { once: true });
      listeners.set(listener, { wrappedListener, signal, handleAbort: remove });
    } else {
      listeners.set(listener, { wrappedListener });
    }

    return [true, wrappedListener];
  }

  #handleListenerRemoval(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options: AddEventListenerOptions,
  ): void {
    const listeners = this.#listenersFor(type, options);
    const listenerData = listeners.get(listener);

    /* v8 ignore start: should never occur */
    if (!listenerData) {
      throw new Error("Invariant violation: Missing listener data");
    }
    /* v8 ignore end */

    listeners.delete(listener);

    const { signal, handleAbort } = listenerData;
    if (signal && handleAbort) signal.removeEventListener("abort", handleAbort);

    this.#onListenerCountChange(type, this.#listenerCount(type));
  }

  #listenersFor(type: string, options: AddEventListenerOptions): Listeners {
    const listenersByType = options.capture
      ? this.#captureListeners
      : this.#bubbleListeners;
    let listeners = listenersByType.get(type);

    if (listeners) return listeners;

    listeners = new Map();
    listenersByType.set(type, listeners);

    return listeners;
  }

  #listenerCount(type: string): number {
    return (
      (this.#bubbleListeners.get(type)?.size ?? 0) +
      (this.#captureListeners.get(type)?.size ?? 0)
    );
  }

  readonly #bubbleListeners: ListenersByType;
  readonly #captureListeners: ListenersByType;
  readonly #onListenerCountChange: OnListenerCountChange;
}

function normalizeOptions(
  options: AddEventListenerOptions | boolean | undefined,
): AddEventListenerOptions {
  return typeof options === "boolean" ? { capture: options } : (options ?? {});
}

type ListenersByType = Map<string, Listeners>;
type Listeners = Map<EventListenerOrEventListenerObject, ListenerData>;
type ListenerData =
  | {
      wrappedListener: EventListener;
      signal: AbortSignal;
      handleAbort: EventListener;
    }
  | {
      wrappedListener: EventListener;
      signal?: undefined;
      handleAbort?: undefined;
    };

type OnListenerCountChange = (type: string, count: number) => void;
