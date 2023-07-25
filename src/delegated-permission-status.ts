import { BaseEventTarget } from "./event-target.js";
import { CREATE } from "./private.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";
import { PermissionStatus as PermissionStatusInterface } from "./types/permission-status.js";
import { Permissions as PermissionsInterface } from "./types/permissions.js";
import { StdPermissionState, StdPermissionStatus } from "./types/std.js";

type PermissionStatusParameters<Name extends string> = {
  descriptor: PermissionDescriptor<Name>;
  delegates: Map<PermissionsInterface<Name>, PermissionStatusInterface<Name>>;
  delegate: () => PermissionsInterface<Name>;
  subscribe: (subscriber: Subscriber<Name>) => void;
  unsubscribe: (subscriber: Subscriber<Name>) => void;
};

export class PermissionStatus<Name extends string> extends BaseEventTarget {
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
  constructor({
    descriptor: { name },
    delegates,
    delegate,
    subscribe,
    unsubscribe,
  }: PermissionStatusParameters<Name>) {
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

    if (!PermissionStatus.#canConstruct) {
      throw new TypeError("Illegal constructor");
    }
    PermissionStatus.#canConstruct = false;

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

  get state(): StdPermissionState {
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

  #statusDelegate(): PermissionStatusInterface<Name> {
    const delegate = this.#delegates.get(this.#delegate());
    if (delegate) return delegate;

    throw new Error("Invariant violation: Missing status delegate");
  }

  #updateState(state: StdPermissionState): void {
    if (this.#state === state) return;

    this.#state = state;
    this.dispatchEvent(new Event("change"));
  }

  static #canConstruct = false;
  readonly #delegates: Map<
    PermissionsInterface<Name>,
    PermissionStatusInterface<Name>
  >;
  readonly #delegate: () => PermissionsInterface<Name>;
  #onchange: EventListener | null;
  #state: StdPermissionState;
  readonly #handleChangeEvent: (event: Event) => void;
  readonly #handleDelegateChange: (
    delegate: PermissionsInterface<Name>,
  ) => void;
}

PermissionStatus satisfies new (
  ...args: never[]
) => PermissionStatusInterface<never>;
PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

type Subscriber<Names extends string> = (
  delegate: PermissionsInterface<Names>,
) => void;
