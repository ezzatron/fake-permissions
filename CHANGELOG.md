# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic
Versioning].

[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html

## Unreleased

### Added

- Added the `PermissionAccessStatusAllowed` type.
- Added the `PermissionAccessStatusBlocked` type.
- Added the `PermissionAccessStatusBlockedAutomatically` type.
- Added the `PermissionAccessStatusDenied` type.
- Added the `PermissionAccessStatusGranted` type.
- Added the `PermissionAccessStatusPrompt` type.
- Added the `PermissionStoreParameters` type.

## [v0.16.0] - 2025-05-02

[v0.16.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.16.0

### Removed

- Removed the `Unsubscribe` type.

## [v0.15.0] - 2025-05-02

[v0.15.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.15.0

### Added

- Added the `NonEmptyPermissionStateArray` type.
- Added the `PermissionsParameters` type.
- Added the `Unsubscribe` type.

## [v0.14.1] - 2024-08-22

[v0.14.1]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.14.1

### Changed

- Access requests are now recorded before the async access request handler
  finishes executing. Each `AccessRequest` now has an additional `isComplete`
  property that indicates whether the access request has been fully handled.
  Once the access request is complete, the `isComplete` property will be `true`,
  and the `result` property will contain the final result. Note that querying
  access requests with `user.accessRequests()` returns copies of the recorded
  access requests, so they will not be updated over time. To get the latest
  access request state, you should query the user object again.

## [v0.14.0] - 2024-08-21

[v0.14.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.14.0

### Removed

- **\[BREAKING]** Removed the `permissionStore.findByDescriptor()` method.

### Added

- Added [access request recording].
  - Added the `user.accessRequests()` method.
  - Added the `user.accessRequestCount()` method.
  - Added the `user.clearAccessRequests()` method.
- Added the `AccessDialogResult` type.
- Added the `AccessRequest` type.
- Added the `IsMatchingDescriptor` type.

[access request recording]: #access-request-recording

### Changed

- Concurrent access requests for matching permission descriptors are now handled
  with a single dialog, instead of multiple dialogs. It's still possible to have
  multiple dialogs open at once when handling access requests for multiple
  different permission descriptors.

#### Access request recording

Users now record every permission access request that they handle. You can query
user objects for this information during tests to verify what access requests
the user has handled.

```ts
import { createPermissionStore, createUser } from "fake-permissions";

const permissionStore = createPermissionStore({
  initialStates: new Map([
    // Set the initial status of the "geolocation" permission to "PROMPT"
    [{ name: "geolocation" }, "PROMPT"],
    // Set the initial status of the "notifications" permission to "PROMPT"
    [{ name: "notifications" }, "PROMPT"],
  ]),
});

const user = createUser({
  permissionStore,

  handleAccessRequest: async (dialog, descriptor) => {
    // Allow permanent access to geolocation
    if (descriptor.name === "geolocation") {
      dialog.remember(true);
      dialog.allow();

      return;
    }

    // Dismiss access dialogs for other permissions
    dialog.dismiss();
  },
});

// Request geolocation access twice
await permissionStore.requestAccess({ name: "geolocation" });
await permissionStore.requestAccess({ name: "geolocation" });
// Outputs "1"
console.log(user.accessRequestCount({ name: "geolocation" }));
// Outputs "[
//   {
//     descriptor: { name: 'geolocation' },
//     result: { shouldAllow: true, shouldRemember: true }
//   }
// ]"
console.log(user.accessRequests({ name: "geolocation" }));

// Request notifications access twice
await permissionStore.requestAccess({ name: "notifications" });
await permissionStore.requestAccess({ name: "notifications" });
// Outputs "2"
console.log(user.accessRequestCount({ name: "notifications" }));
// Outputs "[
//   { descriptor: { name: 'notifications' }, result: undefined },
//   { descriptor: { name: 'notifications' }, result: undefined }
// ]"
console.log(user.accessRequests({ name: "notifications" }));

// Outputs "3" (total for all descriptors)
console.log(user.accessRequestCount());
// Outputs "[
//   {
//     descriptor: { name: 'geolocation' },
//     result: { shouldAllow: true, shouldRemember: true }
//   },
//   { descriptor: { name: 'notifications' }, result: undefined },
//   { descriptor: { name: 'notifications' }, result: undefined }
// ]"
console.log(user.accessRequests());

// Clear access requests for geolocation
user.clearAccessRequests({ name: "geolocation" });
// Outputs "0"
console.log(user.accessRequestCount({ name: "geolocation" }));
// Outputs "[]"
console.log(user.accessRequests({ name: "geolocation" }));

// Clear access requests for all descriptors
user.clearAccessRequests();
// Outputs "0"
console.log(user.accessRequestCount());
// Outputs "[]"
console.log(user.accessRequests());
```

## [v0.13.0] - 2024-08-19

[v0.13.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.13.0

### Changed

- **\[BREAKING]** The methods available on the dialog taken by
  `HandleAccessRequest` functions have changed:
  - The `dialog.allow()` and `dialog.deny()` methods no longer take a
    `shouldPersist` parameter.
  - A new `dialog.remember()` method has been added, which takes a single
    parameter `isChecked`. This method can be used to control whether the access
    dialog outcome should affect the permission state, similar to the old
    `shouldPersist` parameter of `dialog.allow()` and `dialog.deny()`.

#### Access request handling with `dialog.remember()`

```ts
import {
  createPermissions,
  createPermissionStore,
  createUser,
} from "fake-permissions";

const permissionStore = createPermissionStore({
  initialStates: new Map([
    // Set the initial status of the "geolocation" permission to "PROMPT"
    [{ name: "geolocation" }, "PROMPT"],
    // Set the initial status of the "notifications" permission to "PROMPT"
    [{ name: "notifications" }, "PROMPT"],
  ]),
});
const permissions = createPermissions({ permissionStore });

createUser({
  permissionStore,

  handleAccessRequest: async (dialog, descriptor) => {
    // Allow access to geolocation, but don't change permission state
    if (descriptor.name === "geolocation") {
      // This is equivalent to the old dialog.allow(false)
      dialog.allow();

      return;
    }

    // Deny access to notifications, and change permission state to "denied"
    if (descriptor.name === "notifications") {
      // This is equivalent to the old dialog.deny(true)
      dialog.remember(true);
      dialog.deny();

      return;
    }

    dialog.dismiss();
  },
});

const geolocation = await permissions.query({ name: "geolocation" });
const notifications = await permissions.query({ name: "notifications" });

// Outputs "true, prompt"
console.log(
  await permissionStore.requestAccess({ name: "geolocation" }),
  geolocation.state,
);

// Outputs "false, denied"
console.log(
  await permissionStore.requestAccess({ name: "notifications" }),
  notifications.state,
);
```

### Added

- The `createPermissionStore()` function now takes an option
  `dialogDefaultRemember` which can be used to control whether access dialog
  outcomes should affect the permission state by default. The option defaults to
  `false`. Regardless of the value of this option, the use of
  `dialog.remember()` in `HandleAccessRequest` functions can still be used to
  control whether the access dialog outcome should affect the permission state.

## [v0.12.0] - 2024-08-08

[v0.12.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.12.0

### Changed

- **\[BREAKING]** The arguments taken by permission store subscribers have
  changed. Instead of taking "from" status and "to" status as the second and
  third arguments, they now take a single object as the second argument, with
  the following properties:
  - `hasAccess` — A boolean indicating whether access is allowed.
  - `hadAccess` — A boolean indicating whether access was allowed before the
    change.
  - `toStatus` — The new `PermissionAccessStatus`.
  - `fromStatus` — The previous `PermissionAccessStatus`.

## [v0.11.0] - 2024-08-08

[v0.11.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.11.0

### Changed

- **\[BREAKING]** Permission access requests are now handled by the permission
  store instead of the user. This means:
  - The `user.requestAccess()` method has moved to
    `permissionStore.requestAccess()`.
  - The `dismissDenyThreshold` option has moved from `createUser()` to
    `createPermissionStore()`.
  - Access request handlers are still configured via the user, either by passing
    a `handleAccessRequest` option to `createUser()`, or by calling
    `user.setAccessRequestHandler()`.
- **\[BREAKING]** The `permissionStore.has()` method was renamed to
  `isKnownDescriptor()`.
- **\[BREAKING]** The `permissionStore.get()` method was renamed to
  `getStatus()`, and now returns a `PermissionAccessStatus` instead of a
  `PermissionState`.
- **\[BREAKING]** The `permissionStore.set()` method was renamed to
  `setStatus()`, and now takes a `PermissionAccessStatus` instead of a
  `PermissionState`.
- **\[BREAKING]** Permission store subscribers now take `PermissionAccessStatus`
  values instead of `PermissionState` values for the "to" and "from" statuses.
- **\[BREAKING]** The permission store's initial states are now specified as
  either `PermissionAccessState` or `PermissionAccessStatus` values, instead of
  `PermissionState` values.
- **\[BREAKING]** The user permission modifier methods were all renamed:
  - `grantPermission()` -> `grantAccess()`
  - `denyPermission()` -> `blockAccess()`
  - `resetPermission()` -> `resetAccess()`
- **\[BREAKING]** The `mask` option of `createPermissions()` was renamed to
  `masks`.
- **\[BREAKING]** Permission masks now map `PermissionAccessStatus` values
  `PermissionState` values. Previously they could only map from one
  `PermissionState` to another.

### Removed

- Removed the `PermissionsMask` type.

### Added

- Added the `permissionStore.hasAccess()` method. This method is similar to
  `permissionStore.requestAccess()`, in that it returns a boolean indicating
  whether access is allowed, but it does not trigger an access request dialog.
- Added the `permissionStore.findByDescriptor()` method. This utility method can
  be used to find a value in any iterable whose keys are permission descriptors,
  using the permission store's configured `isMatchingDescriptor` logic.
- Added the `PermissionAccessState` type. This is an object type containing the
  full state of a permission known to the permission store, including:
  - A `status` property, which is a `PermissionAccessStatus` value.
  - A `dismissCount` property, which is the number of times the user has
    dismissed access requests for this permission.
- Added the `PermissionAccessStatus` type. This is a union type of all
  permission access states supported by the permission store, including:
  - `PROMPT` — Interaction with the user is required to gain access.
  - `GRANTED` — Access is allowed, and will continue to be allowed on subsequent
    visits.
  - `BLOCKED` — Access is denied, and will continue to be denied on subsequent
    visits.
  - `BLOCKED_AUTOMATICALLY` — Access is denied automatically, without user
    interaction (e.g. due to repeated dismissals of access requests).
  - `ALLOWED` — Access is allowed, but only for the current visit.
  - `DENIED` — Access is denied, but only for the current visit.
- Added the `PermissionStoreSubscriber` type. This type was already used for
  permission store subscribers, but is now exported for use in user-defined
  code.

### Fixed

- Exported the `PermissionMask` type that was missing from the `v0.7.0` release.

## [v0.10.0] - 2024-08-08

[v0.10.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.10.0

### Changed

- **\[BREAKING]** The `createPermissionObserver()` function is no longer
  asynchronous.

### Removed

- **\[BREAKING]** Removed the `waitForStateChange()` method from permission
  observers.

## [v0.9.4] - 2024-08-07

[v0.9.4]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.9.4

### Fixed

- Errors thrown by permission store subscribers are now thrown asynchronously
  using `queueMicrotask()` instead of `setTimeout()`.

## [v0.9.3] - 2024-08-06

[v0.9.3]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.9.3

### Fixed

- Improved permission observer correctness.

## [v0.9.2] - 2024-08-06

[v0.9.2]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.9.2

### Fixed

- Improved permission observer correctness.

## [v0.9.1] - 2024-08-06

[v0.9.1]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.9.1

### Fixed

- Improved permission observer correctness.

## [v0.9.0] - 2024-08-06

[v0.9.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.9.0

### Added

- Added [permission observers].

[permission observers]: #permission-observers

#### Permission observers

This release adds permission observers, which can be used to wait for specific
changes to permission states. This can be useful for testing scenarios where you
want to wait for a specific permission state to be reached before continuing.

You can create a permission observer by calling the `createPermissionObserver()`
function, and then wait for a specific permission state change by calling either
`observer.waitForState()` or `observer.waitForStateChange()`. These methods are
similar, but `waitForState()` can resolve immediately if the permission state is
already in the desired state, whereas `waitForStateChange()` will only resolve
if the permission state changes to the desired state _after_ being called.

```ts
import {
  createPermissionObserver,
  createPermissions,
  createPermissionStore,
  createUser,
} from "fake-permissions";

const permissionStore = createPermissionStore({
  initialStates: new Map([
    // Set the initial state of the "geolocation" permission to "prompt"
    [{ name: "geolocation" }, "prompt"],
  ]),
});
const user = createUser({ permissionStore });
const permissions = createPermissions({ permissionStore });

// We're dealing with the "geolocation" permission
const descriptor: PermissionDescriptor = { name: "geolocation" };

// Start a Permissions API query
const status = await permissions.query(descriptor);

// Start observing the permission
const observer = await createPermissionObserver(permissions, descriptor);

// Wait for the state to be "prompt"
await observer.waitForState("prompt");
// Outputs "prompt"
console.log(status.state);

user.denyPermission(descriptor);

// Wait for the state to be "prompt" OR "denied"
await observer.waitForState(["prompt", "denied"]);
// Outputs "denied"
console.log(status.state);

// Wait for the state to be "granted", while running a task
await observer.waitForState("granted", async () => {
  user.grantPermission(descriptor);
});
// Outputs "granted"
console.log(status.state);

// Wait for the state to be "prompt" OR "denied", while running a task
await observer.waitForState(["prompt", "denied"], async () => {
  user.resetPermission(descriptor);
});
// Outputs "prompt"
console.log(status.state);
```

## [v0.8.0] - 2024-08-06

[v0.8.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.8.0

### Changed

- This release updates the default permission set to match changes to the
  `@types/web` definition of the `PermissionName` type. The new default
  permissions are:
  - `geolocation`
  - `midi` (with support for the `sysex` property)
  - `notifications`
  - `persistent-storage`
  - `push` (with support for the `userVisibleOnly` property)
  - `screen-wake-lock`
  - `storage-access`

### Removed

- **\[BREAKING]** Removed the `xr-spatial-tracking` permission from the default
  permission set.

### Added

- Added the `midi` permission with support for the `sysex` descriptor property
  to the default permission set.

## [v0.7.0] - 2024-08-04

[v0.7.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.7.0

### Changed

- **\[BREAKING]** This release changes the way that permission access is
  requested, and how those requests are handled. See [Updated access request
  handling].
- **\[BREAKING]** The default user response to permission access requests is now
  to dismiss the request, instead of denying it.
- **\[BREAKING]** The `handlePermissionRequest` option of the `createUser()`
  function has been renamed to `handleAccessRequest`.
- **\[BREAKING]** The `HandlePermissionRequest` function type has been renamed
  to `HandleAccessRequest`, and its signature has changed:
  - The function is now always asynchronous.
  - The first parameter is now an `AccessDialog` object, with methods
    `dialog.dismiss()`, `dialog.allow()`, and `dialog.deny()`. The
    `dialog.allow()` and `dialog.deny()` methods both accept a single parameter
    `shouldPersist` which can be used to control whether the access dialog
    outcome should affect the permission state.
  - The permission descriptor is now the second parameter.
  - The return type is now `Promise<void>`.
- **\[BREAKING]** The `user.requestPermission()` method has been renamed to
  `user.requestAccess()`, and now returns a `Promise<boolean>` instead of a
  `Promise<PermissionStatus>`. This boolean value indicates whether the user
  allowed access or not, but does not indicate whether the permission state
  changed as a result of the user's decision.
- **\[BREAKING]** Repeated calls to `user.requestAccess()` that result in dialog
  dismissals can now cause the permission state to be set to "denied"
  automatically. The default threshold for this behavior is 3 dismissals, but
  this can be configured using the `dismissDenyThreshold` option of the
  `createUser()` function.
- **\[BREAKING]** Subscribers for `PermissionStore.subscribe()` now take three
  parameters - the permission descriptor, the "to" state, and the "from" state.
  Previously, subscribers only took a function for matching permission
  descriptors against. You can use the new
  `permissionStore.isMatchingDescriptor()` method to replace the old parameter.
- **\[BREAKING]** The `PermissionStore.subscribe()` method now returns an
  unsubscribe callback.
- **\[BREAKING]** The `PermissionStore` type is now a type, instead of an
  interface.
- **\[BREAKING]** The `User` type is now a type, instead of an interface.

[updated access request handling]: #updated-access-request-handling

#### Updated access request handling

Browsers like Safari and Firefox let users allow temporary access to sensitive
permissions like `geolocation` and `notifications` without actually granting the
associated permission. This release adds support for emulating these more
nuanced behaviors.

Instead of simply returning a new `PermissionStatus` object when a user requests
access to a permission, the `user.requestAccess()` method now returns a boolean
value indicating whether the user allowed access or not. This value does not
indicate anything about the permission state, only whether the user allows
access at this time.

When handling access requests, the `handleAccessRequest` handler can now allow,
deny, or dismiss permission requests using a virtual access "dialog".
Additionally, when allowing or denying access, the handler can specify whether
the permission state should be updated based on the user's decision.

```ts
import {
  createPermissions,
  createPermissionStore,
  createUser,
} from "fake-permissions";

const permissionStore = createPermissionStore({
  initialStates: new Map([
    // Set the initial state of the "geolocation" permission to "prompt"
    [{ name: "geolocation" }, "prompt"],
    // Set the initial state of the "notifications" permission to "prompt"
    [{ name: "notifications" }, "prompt"],
  ]),
});
const permissions = createPermissions({ permissionStore });

const user = createUser({
  permissionStore,

  // The number of times the user can dismiss a permission dialog before the
  // permission state is set to "denied" automatically (default: 3)
  dismissDenyThreshold: Infinity,

  handleAccessRequest: async (dialog, descriptor) => {
    // Allow access to geolocation, but don't change permission state
    if (descriptor.name === "geolocation") {
      dialog.allow(false);

      return;
    }

    // Deny access to notifications, and change permission state to "denied"
    if (descriptor.name === "notifications") {
      dialog.deny(true);

      return;
    }

    dialog.dismiss();
  },
});

const geolocation = await permissions.query({ name: "geolocation" });
const notifications = await permissions.query({ name: "notifications" });

// Outputs "true, prompt"
console.log(
  await user.requestAccess({ name: "geolocation" }),
  geolocation.state,
);

// Outputs "false, denied"
console.log(
  await user.requestAccess({ name: "notifications" }),
  notifications.state,
);
```

The access request handler can also be replaced at any time by using the
`user.setAccessRequestHandler()` method. This can be useful for changing the
behavior of the access request handler in different test scenarios.

```ts
user.setAccessRequestHandler(async (dialog) => {
  // New behavior for handling access requests
  dialog.dismiss();
});
```

### Removed

- **\[BREAKING]** The `PermissionStore.unsubscribe()` method has been removed.

### Added

- Added [permission masking].
- Added the `user.setAccessRequestHandler()` method.
- Added the `permissionStore.isMatchingDescriptor()` method.
- Added the `PermissionsMask` and `PermissionMask` types.
- Added the `AccessDialog` type.

[permission masking]: #permission-masking

#### Permission masking

The `createPermissions()` function now accepts a `mask` option. This option can
be used to emulate the behavior of browsers like Safari and Firefox, which do
not always expose the actual permission state via the Permissions API.

The `mask` option accepts a `Map` where the keys are permission descriptors, and
the values are objects that map permission states to other permission states.
For example, the following mask would cause the `geolocation` permission to be
reported as `prompt` when the actual state in the permission store is `denied`:

```ts
import {
  createPermissions,
  createPermissionStore,
  createUser,
} from "fake-permissions";

const permissionStore = createPermissionStore({
  initialStates: new Map([
    // Set the initial state of the "geolocation" permission to "prompt"
    [{ name: "geolocation" }, "prompt"],
  ]),
});
const user = createUser({ permissionStore });

const permissions = createPermissions({
  permissionStore,
  mask: new Map([
    [
      // Mask the "geolocation" permission
      { name: "geolocation" },
      {
        // When the actual state is "denied", report it as "prompt"
        denied: "prompt",

        // Can mask multiple states if desired
        // granted: "prompt",
      },
    ],
  ]),
});

const status = await permissions.query({ name: "geolocation" });
console.log(status.state); // Outputs "prompt"

user.denyPermission({ name: "geolocation" });
console.log(status.state); // Outputs "prompt"

user.grantPermission({ name: "geolocation" });
console.log(status.state); // Outputs "granted"
```

## [v0.6.2] - 2024-07-04

[v0.6.2]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.6.2

### Changed

- Errors thrown from subscriber functions used in permissions delegates and
  permission stores are now thrown asynchronously, instead of being discarded.

## [v0.6.1] - 2024-06-21

[v0.6.1]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.6.1

### Added

- Added [`Symbol.toStringTag`] methods to all `Permissions` and
  `PermissionStatus` objects.

[`Symbol.toStringTag`]:
  https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag

## [v0.6.0] - 2023-09-10

[v0.6.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.6.0

### Added

- Added an `isDelegateSelected()` query function to created delegates.

## [v0.5.0] - 2023-09-09

[v0.5.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.5.0

### Changed

- **\[BREAKING]** The default values for the `initialStates` and
  `isMatchingDescriptor` options of `createPermissionStore()` function have
  changed to match the old behavior of `createStandardPermissionStore()`.

### Removed

- **\[BREAKING]** Removed `createStandardPermissionStore()`. It is no longer
  needed, since `createPermissionStore()` now has sensible defaults for all of
  its options.

## [v0.4.0] - 2023-09-09

[v0.4.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.4.0

### Changed

- **\[BREAKING]** This package no longer implements its own generic types for
  permissions, and instead uses the built-in ones from `@types/web`.

### Removed

- **\[BREAKING]** Removed permission name constants.
- **\[BREAKING]** Removed permission status constants.

## [v0.3.1] - 2023-09-09

[v0.3.1]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.3.1

### Fixed

- Fixed the `PermissionDescriptor` type so that it no longer adds generic
  permission descriptors to the union unless a permission name other than `midi`
  or `push` is part of the `PermissionName` union.

## [v0.3.0] - 2023-08-20

[v0.3.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.3.0

### Changed

- The current permission state is now returned when requesting permissions from
  the user.
- The `HandlePermissionRequest` type is now used as the
  `user.requestPermission()` method's type.

## [v0.2.1] - 2023-08-20

[v0.2.1]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.2.1

### Other

- Changed the module index exports to be compatible with `@swc/jest`.

## [v0.2.0] - 2023-08-02

[v0.2.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.2.0

### Changed

- Requesting a permission is now an `async` operation.

## [v0.1.3] - 2023-07-31

[v0.1.3]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.1.3

### Other

- Improved how private constructors are implemented. They now avoid adding a
  property to the class, and instead rely on module state.

## [v0.1.2] - 2023-07-28

[v0.1.2]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.1.2

### Fixed

- Replaced TODOs in `package.json` with correct values.

## [v0.1.1] - 2023-07-28

[v0.1.1]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.1.1

### Other

- Fixed broken release publishing workflow.

## [v0.1.0] - 2023-07-28

[v0.1.0]: https://github.com/ezzatron/fake-permissions/releases/tag/v0.1.0

### Added

- Initial release.
