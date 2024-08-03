# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic
Versioning].

[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html

## Unreleased

### Changed

- **\[BREAKING]** This release changes the way that permission access is
  requested, and how those requests are handled. See [Updated access request
  handling].
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

### Added

- Added [permission masking].
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

[`Symbol.toStringTag`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag

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
