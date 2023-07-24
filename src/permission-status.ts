import { normalizeOptions } from "./event-target.js";
import { PermissionStore } from "./permission-store.js";
import { CREATE } from "./private.js";
import { StdPermissionState, StdPermissionStatus } from "./types/std.js";

type PermissionStatusParameters<Names extends string> = {
  name: Names;
  permissionStore: PermissionStore<Names>;
};

export class PermissionStatus<Name extends string> extends EventTarget {
  static [CREATE]<N extends string>(
    parameters: PermissionStatusParameters<N>,
  ): PermissionStatus<N> {
    PermissionStatus.#canConstruct = true;

    return new PermissionStatus(parameters);
  }

  readonly name: Name;

  /**
   * @deprecated Use the `Permissions.query()` method instead.
   */
  constructor({ name, permissionStore }: PermissionStatusParameters<Name>) {
    super();

    if (!PermissionStatus.#canConstruct) {
      throw new TypeError("Illegal constructor");
    }
    PermissionStatus.#canConstruct = false;

    this.#permissionStore = permissionStore;
    this.name = name;
    this.#onchange = null;

    this.#bubbleChangeListeners = new Map();
    this.#captureChangeListeners = new Map();

    this.#handlePermissionStoreChange = (name) => {
      if (name === this.name) this.dispatchEvent(new Event("change"));
    };
  }

  get state(): StdPermissionState {
    return this.#permissionStore.get(this.name);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    // We need to keep track of registered change handlers, so that we can
    // listen to the permission store in a lazy way, which should hopefully
    // prevent memory leaks.

    // Since listeners for the "capture" and "bubble" phases are added and
    // removed independently, we need to keep track of them separately in two
    // different sets.

    // When the total size of these sets grows from 0, we subscribe to the
    // permission store, and when it shrinks back to 0, we unsubscribe.

    // This means we also need to keep track of when the "once" option is set,
    // and remove those listeners from the appropriate internal set the first
    // time the event is dispatched.

    // We also need to keep track of when the "signal" option is set, and remove
    // those listeners from our internal set when the signal is aborted.

    // Events other than "change" don't affect whether we listen to the
    // permission store.
    if (type !== "change" || !listener) {
      super.addEventListener(type, listener, options);

      return;
    }

    super.addEventListener(
      type,
      this.#addChangeListener(listener, normalizeOptions(options)),
      options,
    );
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void {
    if (type !== "change" || !listener) {
      super.removeEventListener(type, listener, options);

      return;
    }

    const normalizedOptions = normalizeOptions(options);
    const listeners = this.#listenersForOptions(normalizedOptions);
    const listenerData = listeners.get(listener);

    if (!listenerData) {
      super.removeEventListener(type, listener, options);

      return;
    }

    const { wrappedListener } = listenerData;
    super.removeEventListener(type, wrappedListener, options);
    this.#removeChangeListener(listener, normalizedOptions);
  }

  get onchange(): EventListener | null {
    return this.#onchange;
  }

  set onchange(listener: EventListener | null) {
    if (this.#onchange) this.removeEventListener("change", this.#onchange);
    this.#onchange = listener;
    if (this.#onchange) this.addEventListener("change", this.#onchange);
  }

  #addChangeListener(
    listener: EventListenerOrEventListenerObject,
    options: AddEventListenerOptions,
  ): EventListener {
    const listeners = this.#listenersForOptions(options);
    const listenerData = listeners.get(listener);

    if (listenerData) return listenerData.wrappedListener;

    if (this.#listenerCount === 0) {
      this.#permissionStore.subscribe(this.#handlePermissionStoreChange);
    }

    const { once, signal } = options;

    const remove = () => {
      this.#removeChangeListener(listener, options);
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
    //   1. A "change" event listener is added with an abort signal.
    //   2. We listen to the "abort" event on the signal, with a listener that
    //      will remove the "change" event listener from our internal set the
    //      first time the "abort" event fires.
    //   3. The "change" event listener is removed.
    //   4. We do not remove the "abort" event listener.
    //   5. The same "change" event listener is added again without the original
    //      abort signal.
    //   6. The abort signal's "abort" event fires.
    //   7. Since we are still listening to the "abort" events, our "abort"
    //      listener removes the "change" event listener from our internal set
    //      even though it is no longer associated with the abort signal.
    //
    // To prevent this, we must keep track of the listener we add to the "abort"
    // event of the signal, and remove it when the "change" event listener is
    // removed.

    if (signal) {
      signal.addEventListener("abort", remove, { once: true });
      listeners.set(listener, { wrappedListener, signal, handleAbort: remove });
    } else {
      listeners.set(listener, { wrappedListener });
    }

    return wrappedListener;
  }

  #removeChangeListener(
    listener: EventListenerOrEventListenerObject,
    options: AddEventListenerOptions,
  ): void {
    const listeners = this.#listenersForOptions(options);
    const listenerData = listeners.get(listener);

    if (!listenerData) return;

    listeners.delete(listener);
    const { signal, handleAbort } = listenerData;
    if (signal && handleAbort) signal.removeEventListener("abort", handleAbort);

    if (this.#listenerCount === 0) {
      this.#permissionStore.unsubscribe(this.#handlePermissionStoreChange);
    }
  }

  #listenersForOptions({ capture }: AddEventListenerOptions): ChangeListeners {
    return capture ? this.#captureChangeListeners : this.#bubbleChangeListeners;
  }

  get #listenerCount(): number {
    return this.#bubbleChangeListeners.size + this.#captureChangeListeners.size;
  }

  static #canConstruct = false;
  readonly #permissionStore: PermissionStore<Name>;
  #onchange: EventListener | null;
  #bubbleChangeListeners: ChangeListeners;
  #captureChangeListeners: ChangeListeners;
  #handlePermissionStoreChange: (name: string) => void;
}

PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

type ChangeListeners = Map<
  EventListenerOrEventListenerObject,
  ChangeListenerData
>;

type ChangeListenerData =
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
