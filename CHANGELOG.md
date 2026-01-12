# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-01-12

### Breaking Changes

- **Upgraded to MikroORM v6.x**: This version now requires MikroORM v6.6.3 or higher
- Removed dependency on TypeORM
- Updated all entity classes to remove `BaseEntity` inheritance (MikroORM v6 requirement)
- Changed entity property types to be nullable with optional chaining

### Changed

- Updated `@mikro-orm/core` from `^5.1.3` to `^6.6.3`
- Updated `@mikro-orm/mongodb` from `^5.1.3` to `^6.6.3`
- Refactored `MikroORMAdapter` to use MikroORM v6 API
- Replaced `nativeInsertMany` with `insertMany` + `flush`
- Updated `removePolicy` and `removePolicies` to use `nativeDelete` instead of `remove`
- Simplified `open()` method to use `MikroORM.init()` directly with options
- Removed unused TypeORM imports and comments
- Simplified `newAdapter()` configuration merging logic
- **BREAKING**: Removed support for `type` configuration field (removed in MikroORM v6), must use `driver` field instead
- Enhanced database type detection to automatically identify driver type from `driver` field or `clientUrl`

### Added

- Added `peerDependencies` for `@mikro-orm/core` to ensure version compatibility
- Added version compatibility section in README
- Added `MIGRATION.md` for upgrade guide
- Added `USAGE.md` for detailed usage examples
- Added `MikroORMAdapterOptions` type for type-safe configuration with TypeScript
- Added `tableName` option to support custom table names for Casbin rules (default: 'casbin_rule')

### Fixed

- Fixed version conflict issues when using with projects that have MikroORM v6.x
- Fixed entity initialization issues with MikroORM v6
- Fixed configuration merging bug where user-provided `dbName` and `clientUrl` were being ignored
- Fixed entity type detection to automatically choose correct entity class based on database type (MySQL, PostgreSQL, etc. now use `CasbinRule`, MongoDB uses `CasbinMongoRule`)

## [1.0.0] - Previous Release

- Initial release with MikroORM v5.x support
