import { createPermissionStatus } from "./delegated-permission-status.js";

let canConstruct = false;

export function createDelegatedPermissions({
  delegates,
}: {
  delegates: globalThis.Permissions[];
}): {
  permissions: globalThis.Permissions;
  selectDelegate: SelectDelegate;
  isDelegateSelected: IsDelegateSelected;
} {
  let [delegate] = delegates;
  if (!delegate) throw new TypeError("No delegates provided");

  const subscribers = new Set<Subscriber>();

  canConstruct = true;

  return {
    permissions: new Permissions({
      delegates,

      delegate() {
        return delegate;
      },

      subscribe(subscriber) {
        subscribers.add(subscriber);
      },

      unsubscribe(subscriber) {
        subscribers.delete(subscriber);
      },
    }),

    selectDelegate(selectedDelegate) {
      delegate = selectedDelegate;

      for (const subscriber of subscribers) {
        try {
          subscriber();
          /* v8 ignore start: impossible to test under Vitest */
        } catch (error) {
          // Throw subscriber errors asynchronously, so that users will at least
          // see it in the console and notice that their subscriber throws.
          queueMicrotask(() => {
            throw error;
          });
        }
        /* v8 ignore stop */
      }
    },

    isDelegateSelected(query) {
      return query === delegate;
    },
  };
}

export type SelectDelegate = (delegate: globalThis.Permissions) => void;
export type IsDelegateSelected = (delegate: globalThis.Permissions) => boolean;

type PermissionsParameters = {
  delegates: globalThis.Permissions[];
  delegate: () => globalThis.Permissions;
  subscribe: (subscriber: Subscriber) => void;
  unsubscribe: (subscriber: Subscriber) => void;
};

class Permissions {
  /**
   * @deprecated Use {@link createDelegatedPermissions} instead.
   */
  constructor({
    delegates,
    delegate,
    subscribe,
    unsubscribe,
  }: PermissionsParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.#delegates = delegates;
    this.#delegate = delegate;
    this.#subscribe = subscribe;
    this.#unsubscribe = unsubscribe;
  }

  async query(descriptor: PermissionDescriptor): Promise<PermissionStatus> {
    const delegates: Map<globalThis.Permissions, PermissionStatus> = new Map();

    await Promise.all(
      this.#delegates.map(async (delegate) => {
        delegates.set(delegate, await delegate.query(descriptor));
      }),
    );

    return createPermissionStatus({
      descriptor,
      delegates,
      delegate: this.#delegate,
      subscribe: this.#subscribe,
      unsubscribe: this.#unsubscribe,
    });
  }

  readonly [Symbol.toStringTag] = "Permissions";

  readonly #delegates: globalThis.Permissions[];
  readonly #delegate: () => globalThis.Permissions;
  readonly #subscribe: (subscriber: Subscriber) => void;
  readonly #unsubscribe: (subscriber: Subscriber) => void;
}

type Subscriber = () => void;
