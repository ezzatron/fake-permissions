import { BaseEventTarget } from "./event-target.js";

type PermissionStatusParameters = {
  descriptor: PermissionDescriptor;
  delegates: Map<Permissions, globalThis.PermissionStatus>;
  delegate: () => Permissions;
  subscribe: (subscriber: Subscriber) => void;
  unsubscribe: (subscriber: Subscriber) => void;
};

let canConstruct = false;

export function createPermissionStatus(
  parameters: PermissionStatusParameters,
): globalThis.PermissionStatus {
  canConstruct = true;

  return new PermissionStatus(parameters);
}

export class PermissionStatus extends BaseEventTarget {
  readonly name: PermissionName;

  /**
   * @deprecated Use the `Permissions.query()` method instead.
   */
  constructor({
    descriptor: { name },
    delegates,
    delegate,
    subscribe,
    unsubscribe,
  }: PermissionStatusParameters) {
    super({
      onListenerCountChange: (type, count) => {
        if (type !== "change") return;

        if (count > 0) {
          subscribe(this.#handleDelegateChange);
          this.#state = this.#statusDelegate().state;

          for (const delegate of delegates.values()) {
            delegate.addEventListener("change", this.#handleChangeEvent);
          }
        } else {
          for (const delegate of delegates.values()) {
            delegate.removeEventListener("change", this.#handleChangeEvent);
          }

          unsubscribe(this.#handleDelegateChange);
        }
      },
    });

    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.name = name;
    this.#delegates = delegates;
    this.#delegate = delegate;
    this.#onchange = null;
    this.#state = this.#statusDelegate().state;

    this.#handleChangeEvent = (event) => {
      const delegate = this.#statusDelegate();
      if (event.currentTarget !== delegate) return;

      this.#updateState(delegate.state);
    };

    this.#handleDelegateChange = () => {
      this.#updateState(this.#statusDelegate().state);
    };
  }

  get state(): PermissionState {
    this.#state = this.#statusDelegate().state;

    return this.#state;
  }

  get onchange(): EventListener | null {
    return this.#onchange;
  }

  set onchange(listener: EventListener | null) {
    if (this.#onchange) this.removeEventListener("change", this.#onchange);
    this.#onchange = listener;
    if (this.#onchange) this.addEventListener("change", this.#onchange);
  }

  #statusDelegate(): globalThis.PermissionStatus {
    const delegate = this.#delegates.get(this.#delegate());

    /* v8 ignore start: should never occur */
    if (!delegate) {
      throw new Error("Invariant violation: Missing status delegate");
    }
    /* v8 ignore end */

    return delegate;
  }

  #updateState(state: PermissionState): void {
    if (this.#state === state) return;

    this.#state = state;
    this.dispatchEvent(new Event("change"));
  }

  readonly #delegates: Map<Permissions, globalThis.PermissionStatus>;
  readonly #delegate: () => Permissions;
  #onchange: EventListener | null;
  #state: PermissionState;
  readonly #handleChangeEvent: (event: Event) => void;
  readonly #handleDelegateChange: () => void;
}

type Subscriber = () => void;
