# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic
Versioning].

[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html

## Unreleased

### Changed

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
- **\[BREAKING]** The `PermissionStore` type is now a type, instead of an
  interface.
- **\[BREAKING]** The `User` type is now a type, instead of an interface.

### Added

- Added the `AccessDialog` type.

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
