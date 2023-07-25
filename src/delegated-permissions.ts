import { PermissionStatus } from "./delegated-permission-status.js";
import { CREATE } from "./private.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";
import { PermissionName } from "./types/permission-name.js";
import { PermissionStatus as PermissionStatusInterface } from "./types/permission-status.js";
import { Permissions as PermissionsInterface } from "./types/permissions.js";
import { StdPermissionName, StdPermissions } from "./types/std.js";

export function createDelegatedPermissions<
  Names extends string = PermissionName,
>({
  delegates,
}: {
  delegates: PermissionsInterface<Names>[];
}): {
  permissions: PermissionsInterface<Names>;
  selectDelegate: SelectDelegate<Names>;
} {
  let [delegate] = delegates;
  if (!delegate) throw new TypeError("No delegates provided");

  const subscribers = new Set<Subscriber<Names>>();

  return {
    permissions: Permissions[CREATE]({
      delegates,

      delegate() {
        return delegate;
      },

      subscribe(subscriber: Subscriber<Names>) {
        subscribers.add(subscriber);
      },

      unsubscribe(subscriber: Subscriber<Names>) {
        subscribers.delete(subscriber);
      },
    }),

    selectDelegate(nextDelegate: PermissionsInterface<Names>) {
      delegate = nextDelegate;

      for (const subscriber of subscribers) {
        try {
          subscriber(delegate);
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
  subscribe: (subscriber: Subscriber<Names>) => void;
  unsubscribe: (subscriber: Subscriber<Names>) => void;
};

class Permissions<Names extends string> {
  static [CREATE]<N extends string>(
    parameters: PermissionParameters<N>,
  ): Permissions<N> {
    Permissions.#canConstruct = true;

    return new Permissions(parameters);
  }

  /**
   * @deprecated Use the `createDelegatedPermissions()` function instead.
   */
  constructor({
    delegates,
    delegate,
    subscribe,
    unsubscribe,
  }: PermissionParameters<Names>) {
    if (!Permissions.#canConstruct) throw new TypeError("Illegal constructor");
    Permissions.#canConstruct = false;

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

    return PermissionStatus[CREATE]<Name>({
      descriptor,
      delegates,
      delegate: this.#delegate,
      subscribe: this.#subscribe,
      unsubscribe: this.#unsubscribe,
    });
  }

  static #canConstruct = false;
  readonly #delegates: PermissionsInterface<Names>[];
  readonly #delegate: () => PermissionsInterface<Names>;
  readonly #subscribe: (subscriber: Subscriber<Names>) => void;
  readonly #unsubscribe: (subscriber: Subscriber<Names>) => void;
}

Permissions satisfies new (...args: never[]) => PermissionsInterface<never>;
Permissions<StdPermissionName> satisfies new (
  ...args: never[]
) => StdPermissions;

type Subscriber<Names extends string> = (
  delegate: PermissionsInterface<Names>,
) => void;
