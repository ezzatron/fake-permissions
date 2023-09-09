# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

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
