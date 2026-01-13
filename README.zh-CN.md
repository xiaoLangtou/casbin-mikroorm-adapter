# Casbin MikroORM 适配器

[![NPM version](https://img.shields.io/npm/v/@xltorg/casbin-mikroorm-adapter.svg)](https://www.npmjs.com/package/@xltorg/casbin-mikroorm-adapter)
[![NPM download](https://img.shields.io/npm/dm/@xltorg/casbin-mikroorm-adapter.svg)](https://www.npmjs.com/package/@xltorg/casbin-mikroorm-adapter)
[![License](https://img.shields.io/npm/l/@xltorg/casbin-mikroorm-adapter.svg)](https://github.com/casbin/casbin-mikroorm-adapter/blob/master/LICENSE)

[Casbin](https://github.com/casbin/node-casbin) 的 MikroORM 适配器。通过此库，Casbin 可以从 MikroORM 支持的数据库中加载策略或将策略保存到数据库。

## ✨ 特性

- 🚀 **MikroORM v6 支持** - 为 MikroORM v6.x 构建，完整的 TypeScript 支持
- 🗄️ **多数据库支持** - 支持 MongoDB、MySQL、PostgreSQL、SQLite、MariaDB、MS SQL Server
- 🔧 **灵活集成** - 独立模式或共享 MikroORM 实例模式
- 📝 **自定义表名** - 可配置 Casbin 规则的自定义表名
- 🎯 **类型安全** - 包含完整的 TypeScript 类型定义
- 🔍 **过滤策略** - 支持加载过滤后的策略
- ⚡ **批量操作** - 高效的批量添加/删除操作
- 🔄 **自动检测** - 从驱动程序自动检测数据库类型

## 📋 版本兼容性

| MikroORM 版本 | 适配器版本 |
|--------------|-----------|
| v6.x | `@xltorg/casbin-mikroorm-adapter@^2.0.0` |
| v5.x | `casbin-mikroorm-adapter@^1.x.x` (旧版) |

## 🗄️ 支持的数据库

基于 [MikroORM 官方支持的数据库](https://mikro-orm.io)：

- ✅ MongoDB
- ✅ MySQL / MariaDB
- ✅ PostgreSQL
- ✅ SQLite
- ✅ MS SQL Server
- ⚠️ Oracle（未测试）

## 📦 安装

```bash
npm install @xltorg/casbin-mikroorm-adapter casbin @mikro-orm/core
# 或
pnpm add @xltorg/casbin-mikroorm-adapter casbin @mikro-orm/core
# 或
yarn add @xltorg/casbin-mikroorm-adapter casbin @mikro-orm/core
```

**安装数据库驱动：**

```bash
# MongoDB
npm install @mikro-orm/mongodb

# MySQL
npm install @mikro-orm/mysql

# PostgreSQL
npm install @mikro-orm/postgresql

# SQLite
npm install @mikro-orm/sqlite
```

## 🚀 快速开始

### 基础用法（独立模式）

#### MongoDB

```typescript
import { newEnforcer } from 'casbin';
import MikroOrmAdapter, { MikroORMAdapterOptions } from '@xltorg/casbin-mikroorm-adapter';
import { MongoDriver } from '@mikro-orm/mongodb';

async function main() {
    // 类型安全的配置
    const options: MikroORMAdapterOptions = {
        driver: MongoDriver,
        clientUrl: 'mongodb://localhost:27017',
        dbName: 'casbin',
    };
    
    // 创建适配器和执行器
    const adapter = await MikroOrmAdapter.newAdapter(options);
    const enforcer = await newEnforcer('model.conf', adapter);

    // 从数据库加载策略
    await enforcer.loadPolicy();

    // 检查权限
    const allowed = await enforcer.enforce('alice', 'data1', 'read');
    console.log('权限授予:', allowed);

    // 添加新策略
    await enforcer.addPolicy('bob', 'data2', 'write');
    await enforcer.savePolicy();
    
    // 清理资源
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
        tableName: 'sys_casbin_rule', // 可选：自定义表名
    };
    
    const adapter = await MikroOrmAdapter.newAdapter(options);
    const enforcer = await newEnforcer('model.conf', adapter);
    await enforcer.loadPolicy();
    
    const allowed = await enforcer.enforce('alice', 'data1', 'read');
    console.log('访问授权:', allowed);
    
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

### 过滤策略加载

仅加载符合过滤条件的特定策略：

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

    // 仅加载 alice 的策略
    await enforcer.loadFilteredPolicy({
        ptype: 'p',
        v0: 'alice'
    });

    // 检查是否已过滤
    console.log('是否已过滤:', adapter.isFiltered()); // true

    await enforcer.enforce('alice', 'data1', 'read');
    await adapter.close();
}

main();
```

### 共享 MikroORM 实例模式

复用现有的 MikroORM 实例（适用于 NestJS 或已配置 MikroORM 的项目）：

```typescript
import { MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import MikroOrmAdapter from '@xltorg/casbin-mikroorm-adapter';
import { newEnforcer } from 'casbin';

// 你现有的 MikroORM 实例
const orm = await MikroORM.init({
    driver: MySqlDriver,
    host: 'localhost',
    dbName: 'myapp',
    entities: [/* 你的实体 */],
});

// 使用共享实例创建适配器
const adapter = await MikroOrmAdapter.newAdapter({
    mikroOrm: orm,
    tableName: 'sys_casbin_rule', // 必须与实体的表名匹配
});

const enforcer = await newEnforcer('model.conf', adapter);
await enforcer.loadPolicy();

// 注意：在共享模式下不要调用 adapter.close()
// 连接由主 MikroORM 实例管理
```

## 🔧 配置选项

### MikroORMAdapterOptions

```typescript
interface MikroORMAdapterOptions extends Options {
    /**
     * Casbin 规则的自定义表名
     * @default 'casbin_rule'
     */
    tableName?: string;
    
    /**
     * 现有的 MikroORM 实例（用于共享模式）
     * 如果提供，适配器将复用此连接
     */
    mikroOrm?: MikroORM;
}
```

### 独立模式配置

```typescript
const options: MikroORMAdapterOptions = {
    driver: MySqlDriver,        // 必需：数据库驱动
    host: 'localhost',          // 数据库主机
    port: 3306,                 // 数据库端口
    user: 'root',               // 数据库用户
    password: 'password',       // 数据库密码
    dbName: 'casbin',           // 数据库名称
    tableName: 'casbin_rule',   // 可选：自定义表名
    debug: false,               // 可选：启用调试日志
    pool: {                     // 可选：连接池设置
        min: 2,
        max: 10,
    },
};
```

### 共享模式配置

```typescript
const options: MikroORMAdapterOptions = {
    mikroOrm: existingOrmInstance,  // 必需：你的 MikroORM 实例
    tableName: 'sys_casbin_rule',   // 必需：数据库中的表名
};
```

## 📚 API 参考

### 适配器方法

#### `newAdapter(options: MikroORMAdapterOptions): Promise<MikroORMAdapter>`

创建新的适配器实例。

```typescript
const adapter = await MikroOrmAdapter.newAdapter({
    driver: MySqlDriver,
    host: 'localhost',
    dbName: 'casbin',
});
```

#### `loadPolicy(model: Model): Promise<void>`

从数据库加载所有策略。

```typescript
await enforcer.loadPolicy();
```

#### `loadFilteredPolicy(model: Model, filter: object): Promise<void>`

从数据库加载过滤后的策略。

```typescript
await enforcer.loadFilteredPolicy({ ptype: 'p', v0: 'alice' });
```

#### `savePolicy(model: Model): Promise<boolean>`

将所有策略保存到数据库。

```typescript
await enforcer.savePolicy();
```

#### `addPolicy(sec: string, ptype: string, rule: string[]): Promise<void>`

添加单个策略规则。

```typescript
await enforcer.addPolicy('alice', 'data1', 'read');
```

#### `addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void>`

批量添加多个策略规则。

```typescript
await enforcer.addPolicies([
    ['alice', 'data1', 'read'],
    ['bob', 'data2', 'write'],
]);
```

#### `removePolicy(sec: string, ptype: string, rule: string[]): Promise<void>`

删除单个策略规则。

```typescript
await enforcer.removePolicy('alice', 'data1', 'read');
```

#### `removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void>`

批量删除多个策略规则。

```typescript
await enforcer.removePolicies([
    ['alice', 'data1', 'read'],
    ['bob', 'data2', 'write'],
]);
```

#### `removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void>`

删除符合过滤条件的策略。

```typescript
// 删除 alice 的所有策略
await enforcer.removeFilteredPolicy(0, 'alice');

// 删除 data1 的所有读取权限
await enforcer.removeFilteredPolicy(1, 'data1', 'read');
```

#### `isFiltered(): boolean`

检查适配器是否处于过滤模式。

```typescript
const filtered = adapter.isFiltered();
```

#### `close(): Promise<void>`

关闭数据库连接（仅在独立模式下）。

```typescript
await adapter.close();
```

## 🔄 从 v1.x 迁移

详细的升级指南请参阅 [MIGRATION.md](./MIGRATION.md)。

**主要变更：**
- MikroORM v6 需要使用 `driver` 字段而不是 `type`
- 从 `@xltorg/casbin-mikroorm-adapter` 导入
- 新增 `tableName` 选项支持自定义表名
- 新增共享 MikroORM 实例模式

## 🤝 NestJS 集成

```typescript
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import MikroOrmAdapter from '@xltorg/casbin-mikroorm-adapter';
import { newEnforcer, Enforcer } from 'casbin';

@Module({
    imports: [MikroOrmModule.forRoot(/* 你的配置 */)],
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

## 📖 文档

- [使用指南](./USAGE.md) - 详细的使用示例
- [迁移指南](./MIGRATION.md) - 从 v1.x 升级到 v2.x
- [更新日志](./CHANGELOG.md) - 版本历史
- [Casbin 文档](https://casbin.org/docs/overview)
- [MikroORM 文档](https://mikro-orm.io/docs)

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

## 📄 许可证

本项目采用 Apache 2.0 许可证。

## 🔗 链接

- [Casbin 官网](https://casbin.org)
- [Casbin GitHub](https://github.com/casbin/node-casbin)
- [MikroORM 官网](https://mikro-orm.io)
- [NPM 包](https://www.npmjs.com/package/@xltorg/casbin-mikroorm-adapter)

## ⭐ 支持

如果这个项目对你有帮助，请给它一个 ⭐️！
