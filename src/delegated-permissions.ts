import { createPermissionStatus } from "./delegated-permission-status.js";

let canConstruct = false;

/**
 * Parameters for creating a delegated Permissions API.
 *
 * @see {@link createDelegatedPermissions} to create a delegated Permissions
 *   API.
 */
export interface DelegatedPermissionsParameters {
  /**
   * The Permissions APIs to delegate to.
   *
   * The list must have at least one delegate, which will be selected initially.
   * The list is static, and cannot be changed after the delegated API is
   * created.
   */
  delegates: globalThis.Permissions[];
}

/**
 * The result of calling {@link createDelegatedPermissions}.
 */
export interface DelegatedPermissionsResult {
  /**
   * The delegated Permissions API.
   */
  readonly permissions: globalThis.Permissions;

  /**
   * A handle for controlling the delegated Permissions API.
   */
  readonly handle: DelegatedPermissionsHandle;
}

/**
 * A handle for controlling a delegated Permissions API.
 */
export interface DelegatedPermissionsHandle {
  /**
   * Select a Permissions API delegate.
   *
   * @param delegate - The delegate to select.
   */
  selectDelegate: (delegate: globalThis.Permissions) => void;

  /**
   * Get the selected Permissions API delegate.
   *
   * @returns The selected delegate.
   */
  selectedDelegate: () => globalThis.Permissions;

  /**
   * Check if a Permissions API delegate is selected.
   *
   * @param delegate - The delegate to check.
   *
   * @returns `true` if the delegate is selected, `false` otherwise.
   */
  isSelectedDelegate: (delegate: globalThis.Permissions) => boolean;
}

/**
 * Create a Permissions API that delegates to other Permissions APIs.
 *
 * Delegated Permissions APIs can be used, for example, to dynamically "switch"
 * between a fake Permissions API and a real Permissions API.
 *
 * When {@link globalThis.Permissions.query | Permissions.query} is called on
 * the delegated Permissions API, the resulting {@link PermissionStatus} will
 * reflect the {@link PermissionState} of the permission in the selected
 * delegate.
 *
 * Permissions API delegates can be selected dynamically at any time, and any
 * {@link PermissionStatus} queries will immediately update to reflect the new
 * delegate's {@link PermissionState} for the relevant permission, dispatching
 * events as appropriate to any registered `change` listeners.
 *
 * @param params - The parameters for creating the delegated Permissions API.
 *
 * @returns The delegated Permissions API, and functions for managing the
 *   selected delegate.
 * @throws A {@link TypeError} if no delegates are provided.
 *
 * @inlineType DelegatedPermissionsParameters
 * @inlineType DelegatedPermissionsResult
 */
export function createDelegatedPermissions(
  params: DelegatedPermissionsParameters,
): DelegatedPermissionsResult {
  const { delegates } = params;
  let [delegate] = delegates;
  if (!delegate) throw new TypeError("No delegates provided");

  const subscribers = new Set<Subscriber>();

  canConstruct = true;

  const permissions = new Permissions({
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
  });

  const handle: DelegatedPermissionsHandle = {
    selectDelegate(selectedDelegate) {
      if (!delegates.includes(selectedDelegate)) {
        throw new TypeError("Unknown delegate");
      }

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

    selectedDelegate() {
      return delegate;
    },

    isSelectedDelegate(query) {
      return query === delegate;
    },
  };

  return { permissions, handle };
}

interface PermissionsParameters {
  delegates: globalThis.Permissions[];
  delegate: () => globalThis.Permissions;
  subscribe: (subscriber: Subscriber) => void;
  unsubscribe: (subscriber: Subscriber) => void;
}

class Permissions {
  /**
   * @internal
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
