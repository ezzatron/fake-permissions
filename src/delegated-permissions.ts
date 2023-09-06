import { createPermissionStatus } from "./delegated-permission-status.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";
import { PermissionStatus as PermissionStatusInterface } from "./types/permission-status.js";
import { Permissions as PermissionsInterface } from "./types/permissions.js";

let canConstruct = false;

export function createDelegatedPermissions<Names extends string>({
  delegates,
}: {
  delegates: PermissionsInterface<Names>[];
}): {
  permissions: PermissionsInterface<Names>;
  selectDelegate: SelectDelegate<Names>;
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

    selectDelegate(nextDelegate) {
      delegate = nextDelegate;

      for (const subscriber of subscribers) {
        try {
          subscriber();
        } catch {
          // ignored
        }
      }
    },
  };
}

export type SelectDelegate<Names extends string> = (
  delegate: PermissionsInterface<Names>,
) => void;

type PermissionParameters<Names extends string> = {
  delegates: PermissionsInterface<Names>[];
  delegate: () => PermissionsInterface<Names>;
  subscribe: (subscriber: Subscriber) => void;
  unsubscribe: (subscriber: Subscriber) => void;
};

export class Permissions<Names extends string> {
  /**
   * @deprecated Use the `createDelegatedPermissions()` function instead.
   */
  constructor({
    delegates,
    delegate,
    subscribe,
    unsubscribe,
  }: PermissionParameters<Names>) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.#delegates = delegates;
    this.#delegate = delegate;
    this.#subscribe = subscribe;
    this.#unsubscribe = unsubscribe;
  }

  async query<Name extends Names>(
    descriptor: PermissionDescriptor<Name>,
  ): Promise<PermissionStatusInterface<Name>> {
    const delegates: Map<
      PermissionsInterface<Names>,
      PermissionStatusInterface<Name>
    > = new Map();

    await Promise.all(
      this.#delegates.map(async (delegate) => {
        delegates.set(delegate, await delegate.query(descriptor));
      }),
    );

    return createPermissionStatus<Name>({
      descriptor,
      delegates,
      delegate: this.#delegate,
      subscribe: this.#subscribe,
      unsubscribe: this.#unsubscribe,
    });
  }

  readonly #delegates: PermissionsInterface<Names>[];
  readonly #delegate: () => PermissionsInterface<Names>;
  readonly #subscribe: (subscriber: Subscriber) => void;
  readonly #unsubscribe: (subscriber: Subscriber) => void;
}

type Subscriber = () => void;
