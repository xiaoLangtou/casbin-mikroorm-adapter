Casbin MikroORM Adapter
====
Casbin MikroORM Adapter is the [MikroORM](https://mikro-orm.io/) adapter for [Node-Casbin](https://github.
com/casbin/node-casbin). With this library, Node-Casbin can load policy from MikroORM supported database or save policy to it.

## Version Compatibility

- **MikroORM v6.x**: Use `casbin-mikroorm-adapter@^1.0.0` (current version)
- **MikroORM v5.x**: Use `casbin-mikroorm-adapter@^0.x.x` (legacy version)

Based on [Officially Supported Databases](https://mikro-orm.io), the current supported databases are:

- [x] MongoDB
- [x] MySQL
- [x] PostgreSQL
- [x] MariaDB
- [x] SQLite
- [x] MS SQL Server (via better-sqlite3 or mssql)
- [ ] Oracle (not tested)
- [ ] WebSQL (deprecated)


You may find other 3rd-party supported DBs in MikroORM website or other places.

## Installation

    npm install casbin-mikroorm-adapter
    # or
    pnpm install casbin-mikroorm-adapter
    # or
    yarn add casbin-mikroorm-adapter

## Simple Example

### MongoDB Example

```typescript
import { newEnforcer } from 'casbin';
import MikroOrmAdapter, { MikroORMAdapterOptions } from 'casbin-mikroorm-adapter';
import { MongoDriver } from '@mikro-orm/mongodb';

async function myFunction() {
    // Type-safe configuration
    const options: MikroORMAdapterOptions = {
        driver: MongoDriver,
        clientUrl: 'mongodb://localhost:27017',
        dbName: 'casbin',
    };
    
    const adapter = await MikroOrmAdapter.newAdapter(options);
    const enforcer = await newEnforcer('examples/rbac_model.conf', adapter);

    // Load the policy from DB.
    await enforcer.loadPolicy();

    // Check the permission.
    await enforcer.enforce('alice', 'data1', 'read');

    // Modify the policy.
    // await enforcer.addPolicy(...);
    // await enforcer.removePolicy(...);

    // Save the policy back to DB.
    await enforcer.savePolicy();
    
    // Close the connection
    await adapter.close();
}
```

### MySQL Example

```typescript
import { newEnforcer } from 'casbin';
import MikroOrmAdapter, { MikroORMAdapterOptions } from 'casbin-mikroorm-adapter';
import { MySqlDriver } from '@mikro-orm/mysql';

async function myFunction() {
    // Type-safe configuration with driver field
    const options: MikroORMAdapterOptions = {
        driver: MySqlDriver,
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'password',
        dbName: 'casbin',
        tableName: 'sys_casbin_rule', // Optional: custom table name (default: 'casbin_rule')
    };
    
    const adapter = await MikroOrmAdapter.newAdapter(options);
    const enforcer = await newEnforcer('examples/rbac_model.conf', adapter);
    await enforcer.loadPolicy();
    
    // Your authorization logic here
    const allowed = await enforcer.enforce('alice', 'data1', 'read');
    console.log('Permission:', allowed);
    
    await adapter.close();
}
```

## Simple Filter Example

```typescript
import { newEnforcer } from 'casbin';
import MikroOrmAdapter from 'casbin-mikroorm-adapter';
import { MySqlDriver } from '@mikro-orm/mysql';

async function myFunction() {
    const adapter = await MikroOrmAdapter.newAdapter({
        driver: MySqlDriver,
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        dbName: 'casbin',
    });

    const enforcer = await newEnforcer('examples/rbac_model.conf', adapter);

    // Load the filtered policy from DB.
    await enforcer.loadFilteredPolicy({
        'ptype': 'p',
        'v0': 'alice'
    });

    // Check the permission.
    await enforcer.enforce('alice', 'data1', 'read');

    // Modify the policy.
    // await enforcer.addPolicy(...);
    // await enforcer.removePolicy(...);

    // Save the policy back to DB.
    await enforcer.savePolicy();
}
```
## Getting Help

- [Node-Casbin](https://github.com/casbin/node-casbin)

