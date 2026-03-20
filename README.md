# Casbin MikroORM Adapter

[![NPM version](https://img.shields.io/npm/v/@xltorg/casbin-mikroorm-adapter.svg)](https://www.npmjs.com/package/@xltorg/casbin-mikroorm-adapter)
[![NPM download](https://img.shields.io/npm/dm/@xltorg/casbin-mikroorm-adapter.svg)](https://www.npmjs.com/package/@xltorg/casbin-mikroorm-adapter)
[![License](https://img.shields.io/npm/l/@xltorg/casbin-mikroorm-adapter.svg)](https://github.com/casbin/casbin-mikroorm-adapter/blob/master/LICENSE)

[English](./README.md) | [中文](./README.zh-CN.md)

MikroORM adapter for [Casbin](https://github.com/casbin/node-casbin). With this library, Casbin can load policy from MikroORM supported databases or save policy to it.

## ✨ Features

- 🚀 **MikroORM v6 Support** - Built for MikroORM v6.x with full TypeScript support
- 🗄️ **Multi-Database** - Supports MongoDB, MySQL, PostgreSQL, SQLite, MariaDB, MS SQL Server
- 🔧 **Flexible Integration** - Standalone mode or shared MikroORM instance mode
- 📝 **Custom Table Names** - Configure custom table names for Casbin rules
- 🎯 **Type-Safe** - Full TypeScript type definitions included
- 🔍 **Filtered Policy** - Support for loading filtered policies
- ⚡ **Batch Operations** - Efficient batch add/remove operations
- 🔄 **Auto-Detection** - Automatic database type detection from driver

## 📋 Version Compatibility

| MikroORM Version | Adapter Version |
|------------------|----------------|
| v6.x | `@xltorg/casbin-mikroorm-adapter@^2.0.0` |
| v5.x | `casbin-mikroorm-adapter@^1.x.x` (legacy) |

## 🗄️ Supported Databases

Based on [MikroORM Officially Supported Databases](https://mikro-orm.io):

- ✅ MongoDB
- ✅ MySQL / MariaDB
- ✅ PostgreSQL
- ✅ SQLite
- ✅ MS SQL Server
- ⚠️ Oracle (not tested)

## 📦 Installation

```bash
npm install @xltorg/casbin-mikroorm-adapter casbin @mikro-orm/core
# or
pnpm add @xltorg/casbin-mikroorm-adapter casbin @mikro-orm/core
# or
yarn add @xltorg/casbin-mikroorm-adapter casbin @mikro-orm/core
```

**Install database driver:**

```bash
# For MongoDB
npm install @mikro-orm/mongodb

# For MySQL
npm install @mikro-orm/mysql

# For PostgreSQL
npm install @mikro-orm/postgresql

# For SQLite
npm install @mikro-orm/sqlite
```

## 🚀 Quick Start

### Basic Usage (Standalone Mode)

#### MongoDB

```typescript
import { newEnforcer } from 'casbin';
import MikroOrmAdapter, { MikroORMAdapterOptions } from '@xltorg/casbin-mikroorm-adapter';
import { MongoDriver } from '@mikro-orm/mongodb';

async function main() {
    // Configure adapter with type safety
    const options: MikroORMAdapterOptions = {
        driver: MongoDriver,
        clientUrl: 'mongodb://localhost:27017',
        dbName: 'casbin',
    };
    
    // Create adapter and enforcer
    const adapter = await MikroOrmAdapter.newAdapter(options);
    const enforcer = await newEnforcer('model.conf', adapter);

    // Load policies from database
    await enforcer.loadPolicy();

    // Check permissions
    const allowed = await enforcer.enforce('alice', 'data1', 'read');
    console.log('Permission granted:', allowed);

    // Add new policy
    await enforcer.addPolicy('bob', 'data2', 'write');
    await enforcer.savePolicy();
    
    // Clean up
    await adapter.close();
}

main();
```

#### MySQL

```typescript
import { newEnforcer } from 'casbin';
import MikroOrmAdapter, { MikroORMAdapterOptions } from '@xltorg/casbin-mikroorm-adapter';
import { MySqlDriver } from '@mikro-orm/mysql';

async function main() {
    const options: MikroORMAdapterOptions = {
        driver: MySqlDriver,
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'password',
        dbName: 'casbin',
        tableName: 'sys_casbin_rule', // Optional: custom table name
    };
    
    const adapter = await MikroOrmAdapter.newAdapter(options);
    const enforcer = await newEnforcer('model.conf', adapter);
    await enforcer.loadPolicy();
    
    const allowed = await enforcer.enforce('alice', 'data1', 'read');
    console.log('Access granted:', allowed);
    
    await adapter.close();
}

main();
```

#### PostgreSQL

```typescript
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

const adapter = await MikroOrmAdapter.newAdapter({
    driver: PostgreSqlDriver,
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    dbName: 'casbin',
});
```

### Filtered Policy Loading

Load only specific policies that match the filter:

```typescript
import { newEnforcer } from 'casbin';
import MikroOrmAdapter from '@xltorg/casbin-mikroorm-adapter';
import { MySqlDriver } from '@mikro-orm/mysql';

async function main() {
    const adapter = await MikroOrmAdapter.newAdapter({
        driver: MySqlDriver,
        host: 'localhost',
        dbName: 'casbin',
    });

    const enforcer = await newEnforcer('model.conf', adapter);

    // Load only alice's policies
    await enforcer.loadFilteredPolicy({
        ptype: 'p',
        v0: 'alice'
    });

    // Check if filtered
    console.log('Is filtered:', adapter.isFiltered()); // true

    await enforcer.enforce('alice', 'data1', 'read');
    await adapter.close();
}

main();
```

### Shared MikroORM Instance Mode

Reuse an existing MikroORM instance (useful for NestJS or when you already have MikroORM configured):

```typescript
import { MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import MikroOrmAdapter from '@xltorg/casbin-mikroorm-adapter';
import { newEnforcer } from 'casbin';

// Your existing MikroORM instance
const orm = await MikroORM.init({
    driver: MySqlDriver,
    host: 'localhost',
    dbName: 'myapp',
    entities: [/* your entities */],
});

// Create adapter with shared instance
const adapter = await MikroOrmAdapter.newAdapter({
    mikroOrm: orm,
    tableName: 'sys_casbin_rule', // Must match your entity's table name
});

const enforcer = await newEnforcer('model.conf', adapter);
await enforcer.loadPolicy();

// Note: Don't call adapter.close() in shared mode
// The connection is managed by your main MikroORM instance
```

### Custom Entity (Extending Base Classes)

When you need to add custom fields or use a custom table name, extend the base classes instead of using the built-in entities directly:

#### SQL Databases (MySQL, PostgreSQL, etc.)

```typescript
import { Entity, Property } from '@mikro-orm/core';
import { BaseCasbinRule } from '@xltorg/casbin-mikroorm-adapter';

@Entity({
    tableName: 'sys_casbin_rule',
    comment: 'Casbin rules table',
})
export class CasbinRuleEntity extends BaseCasbinRule {
    @Property({ name: 'created_date' })
    createdDate: Date = new Date();

    @Property({ name: 'updated_date' })
    updatedDate: Date = new Date();
}
```

#### MongoDB

```typescript
import { Entity, Property } from '@mikro-orm/core';
import { BaseCasbinMongoRule } from '@xltorg/casbin-mikroorm-adapter';

@Entity({ tableName: 'sys_casbin_rule' })
export class CustomCasbinMongoRule extends BaseCasbinMongoRule {
    @Property()
    customField?: string;
}
```

Then use with shared MikroORM instance:

```typescript
import { MikroORM } from '@mikro-orm/core';
import MikroOrmAdapter from '@xltorg/casbin-mikroorm-adapter';
import { CasbinRuleEntity } from './entities/casbin.entity';

const orm = await MikroORM.init({
    entities: [CasbinRuleEntity, /* other entities */],
    // ... other config
});

const adapter = await MikroOrmAdapter.newAdapter({
    mikroOrm: orm,
    tableName: 'sys_casbin_rule', // Must match your entity's table name
});
```

## 🔧 Configuration Options

### MikroORMAdapterOptions

```typescript
interface MikroORMAdapterOptions extends Options {
    /**
     * Custom table name for Casbin rules
     * @default 'casbin_rule'
     */
    tableName?: string;
    
    /**
     * Existing MikroORM instance (for shared mode)
     * If provided, adapter will reuse this connection
     */
    mikroOrm?: MikroORM;
}
```

### Standalone Mode Options

```typescript
const options: MikroORMAdapterOptions = {
    driver: MySqlDriver,        // Required: Database driver
    host: 'localhost',          // Database host
    port: 3306,                 // Database port
    user: 'root',               // Database user
    password: 'password',       // Database password
    dbName: 'casbin',           // Database name
    tableName: 'casbin_rule',   // Optional: Custom table name
    debug: false,               // Optional: Enable debug logging
    pool: {                     // Optional: Connection pool settings
        min: 2,
        max: 10,
    },
};
```

### Shared Mode Options

```typescript
const options: MikroORMAdapterOptions = {
    mikroOrm: existingOrmInstance,  // Required: Your MikroORM instance
    tableName: 'sys_casbin_rule',   // Required: Table name in your database
};
```

## 📚 API Reference

### Adapter Methods

#### `newAdapter(options: MikroORMAdapterOptions): Promise<MikroORMAdapter>`

Create a new adapter instance.

```typescript
const adapter = await MikroOrmAdapter.newAdapter({
    driver: MySqlDriver,
    host: 'localhost',
    dbName: 'casbin',
});
```

#### `loadPolicy(model: Model): Promise<void>`

Load all policies from database.

```typescript
await enforcer.loadPolicy();
```

#### `loadFilteredPolicy(model: Model, filter: object): Promise<void>`

Load filtered policies from database.

```typescript
await enforcer.loadFilteredPolicy({ ptype: 'p', v0: 'alice' });
```

#### `savePolicy(model: Model): Promise<boolean>`

Save all policies to database.

```typescript
await enforcer.savePolicy();
```

#### `addPolicy(sec: string, ptype: string, rule: string[]): Promise<void>`

Add a single policy rule.

```typescript
await enforcer.addPolicy('alice', 'data1', 'read');
```

#### `addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void>`

Add multiple policy rules in batch.

```typescript
await enforcer.addPolicies([
    ['alice', 'data1', 'read'],
    ['bob', 'data2', 'write'],
]);
```

#### `removePolicy(sec: string, ptype: string, rule: string[]): Promise<void>`

Remove a single policy rule.

```typescript
await enforcer.removePolicy('alice', 'data1', 'read');
```

#### `removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void>`

Remove multiple policy rules in batch.

```typescript
await enforcer.removePolicies([
    ['alice', 'data1', 'read'],
    ['bob', 'data2', 'write'],
]);
```

#### `removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void>`

Remove policies that match the filter.

```typescript
// Remove all policies for alice
await enforcer.removeFilteredPolicy(0, 'alice');

// Remove all read permissions for data1
await enforcer.removeFilteredPolicy(1, 'data1', 'read');
```

#### `isFiltered(): boolean`

Check if the adapter is in filtered mode.

```typescript
const filtered = adapter.isFiltered();
```

#### `close(): Promise<void>`

Close the database connection (only in standalone mode).

```typescript
await adapter.close();
```

## 🔄 Migration from v1.x

See [MIGRATION.md](./MIGRATION.md) for detailed upgrade guide.

**Key Changes:**
- MikroORM v6 requires `driver` field instead of `type`
- Import from `@xltorg/casbin-mikroorm-adapter`
- New `tableName` option for custom table names
- New shared MikroORM instance mode

## 🤝 NestJS Integration

```typescript
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import MikroOrmAdapter from '@xltorg/casbin-mikroorm-adapter';
import { newEnforcer, Enforcer } from 'casbin';

@Module({
    imports: [MikroOrmModule.forRoot(/* your config */)],
    providers: [
        {
            provide: 'CASBIN_ENFORCER',
            useFactory: async (orm: MikroORM) => {
                const adapter = await MikroOrmAdapter.newAdapter({
                    mikroOrm: orm,
                    tableName: 'sys_casbin_rule',
                });
                
                const enforcer = await newEnforcer('model.conf', adapter);
                await enforcer.loadPolicy();
                return enforcer;
            },
            inject: [MikroORM],
        },
    ],
    exports: ['CASBIN_ENFORCER'],
})
export class CasbinModule {}
```

## 📖 Documentation

- [Usage Guide](./USAGE.md) - Detailed usage examples
- [Migration Guide](./MIGRATION.md) - Upgrade from v1.x to v2.x
- [Changelog](./CHANGELOG.md) - Version history
- [Casbin Documentation](https://casbin.org/docs/overview)
- [MikroORM Documentation](https://mikro-orm.io/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the Apache 2.0 License.

## 🔗 Links

- [Casbin Website](https://casbin.org)
- [Casbin GitHub](https://github.com/casbin/node-casbin)
- [MikroORM Website](https://mikro-orm.io)
- [NPM Package](https://www.npmjs.com/package/@xltorg/casbin-mikroorm-adapter)

## ⭐ Support

If this project helps you, please give it a ⭐️!
