# 使用指南

本文档提供 `casbin-mikroorm-adapter` v2.x 的详细使用说明。

## 快速开始

### 安装

```bash
pnpm install casbin casbin-mikroorm-adapter @mikro-orm/core @mikro-orm/mongodb
```

### 基础使用

```typescript
import { newEnforcer } from 'casbin';
import MikroOrmAdapter, { MikroORMAdapterOptions } from 'casbin-mikroorm-adapter';
import { MongoDriver } from '@mikro-orm/mongodb';

async function main() {
  // 类型安全的配置
  const options: MikroORMAdapterOptions = {
    driver: MongoDriver,
    clientUrl: 'mongodb://localhost:27017',
    dbName: 'casbin',
  };

  // 创建适配器
  const adapter = await MikroOrmAdapter.newAdapter(options);

  // 创建 enforcer
  const enforcer = await newEnforcer('model.conf', adapter);

  // 加载策略
  await enforcer.loadPolicy();

  // 检查权限
  const allowed = await enforcer.enforce('alice', 'data1', 'read');
  console.log('Permission:', allowed);

  // 添加策略
  await enforcer.addPolicy('bob', 'data2', 'write');
  await enforcer.savePolicy();

  // 关闭连接
  await adapter.close();
}

main();
```

> **💡 提示**：
> - MikroORM v6 已移除 `type` 字段，必须使用 `driver` 字段
> - 使用 `MikroORMAdapterOptions` 类型可以获得完整的 TypeScript 类型检查和智能提示

## 配置选项

### MongoDB 配置

```typescript
import { MongoDriver } from '@mikro-orm/mongodb';

const adapter = await MikroOrmAdapter.newAdapter({
  driver: MongoDriver,
  clientUrl: 'mongodb://username:password@localhost:27017',
  dbName: 'casbin',
  debug: false, // 开启调试日志
});
```

### MySQL 配置

```typescript
import { MySqlDriver } from '@mikro-orm/mysql';

const adapter = await MikroOrmAdapter.newAdapter({
  driver: MySqlDriver,
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  dbName: 'casbin',
  charset: 'utf8mb4',
  tableName: 'sys_casbin_rule', // 可选：自定义表名（默认：'casbin_rule'）
});
```

### 自定义表名

默认情况下，Casbin 规则存储在 `casbin_rule` 表中。你可以通过 `tableName` 选项自定义表名：

```typescript
const adapter = await MikroOrmAdapter.newAdapter({
  driver: MySqlDriver,
  host: 'localhost',
  dbName: 'casbin',
  tableName: 'sys_casbin_rule', // 自定义表名
});
```

### PostgreSQL 配置

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

### SQLite 配置

```typescript
import { SqliteDriver } from '@mikro-orm/sqlite';

const adapter = await MikroOrmAdapter.newAdapter({
  driver: SqliteDriver,
  dbName: './casbin.db',
});
```

### 连接池配置

```typescript
import { MySqlDriver } from '@mikro-orm/mysql';

const adapter = await MikroOrmAdapter.newAdapter({
  driver: MySqlDriver,
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  dbName: 'casbin',
  pool: {
    min: 2,
    max: 10,
  },
});
```

## 高级用法

### 过滤策略加载

只加载特定用户的策略：

```typescript
// 只加载 alice 的策略
await enforcer.loadFilteredPolicy({
  ptype: 'p',
  v0: 'alice',
});

// 检查是否使用了过滤
console.log('Is filtered:', adapter.isFiltered()); // true
```

### 批量操作

```typescript
// 批量添加策略
await enforcer.addPolicies([
  ['alice', 'data1', 'read'],
  ['alice', 'data1', 'write'],
  ['bob', 'data2', 'read'],
]);

// 批量删除策略
await enforcer.removePolicies([
  ['alice', 'data1', 'write'],
  ['bob', 'data2', 'read'],
]);
```

### 条件删除

```typescript
// 删除所有 alice 的策略
await enforcer.removeFilteredPolicy(0, 'alice');

// 删除所有对 data1 的 read 权限
await enforcer.removeFilteredPolicy(1, 'data1', 'read');
```

## NestJS 集成

### 模块配置

```typescript
// casbin.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import MikroOrmAdapter from 'casbin-mikroorm-adapter';
import { newEnforcer, Enforcer } from 'casbin';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      type: 'mongo',
      clientUrl: process.env.MONGODB_URL,
      dbName: 'casbin',
    }),
  ],
  providers: [
    {
      provide: 'CASBIN_ENFORCER',
      useFactory: async () => {
        const adapter = await MikroOrmAdapter.newAdapter({
          type: 'mongo',
          clientUrl: process.env.MONGODB_URL,
          dbName: 'casbin',
        });
        
        const enforcer = await newEnforcer('model.conf', adapter);
        await enforcer.loadPolicy();
        
        return enforcer;
      },
    },
  ],
  exports: ['CASBIN_ENFORCER'],
})
export class CasbinModule {}
```

### 服务使用

```typescript
// auth.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Enforcer } from 'casbin';

@Injectable()
export class AuthService {
  constructor(
    @Inject('CASBIN_ENFORCER')
    private readonly enforcer: Enforcer,
  ) {}

  async checkPermission(user: string, resource: string, action: string): Promise<boolean> {
    return await this.enforcer.enforce(user, resource, action);
  }

  async addPermission(user: string, resource: string, action: string): Promise<void> {
    await this.enforcer.addPolicy(user, resource, action);
    await this.enforcer.savePolicy();
  }
}
```

## 错误处理

```typescript
try {
  const adapter = await MikroOrmAdapter.newAdapter({
    type: 'mongo',
    clientUrl: 'mongodb://localhost:27017',
    dbName: 'casbin',
  });
  
  const enforcer = await newEnforcer('model.conf', adapter);
  await enforcer.loadPolicy();
  
  // 业务逻辑
  
} catch (error) {
  if (error.message.includes('connect')) {
    console.error('数据库连接失败:', error);
  } else if (error.message.includes('model')) {
    console.error('模型文件加载失败:', error);
  } else {
    console.error('未知错误:', error);
  }
}
```

## 性能优化

### 1. 使用连接池

```typescript
const adapter = await MikroOrmAdapter.newAdapter({
  type: 'mongo',
  clientUrl: 'mongodb://localhost:27017',
  dbName: 'casbin',
  pool: {
    min: 5,
    max: 20,
  },
});
```

### 2. 启用策略缓存

```typescript
const enforcer = await newEnforcer('model.conf', adapter);
enforcer.enableAutoSave(false); // 禁用自动保存，手动控制保存时机

// 批量操作
await enforcer.addPolicies([...]);
await enforcer.removePolicies([...]);

// 统一保存
await enforcer.savePolicy();
```

### 3. 使用过滤加载

对于大型策略集，使用过滤加载可以显著提升性能：

```typescript
// 只加载当前用户相关的策略
await enforcer.loadFilteredPolicy({
  ptype: 'p',
  v0: currentUser,
});
```

## 常见问题

### Q: 如何处理并发写入？

A: MikroORM v6 的 EntityManager 使用 `fork()` 创建独立实例，已经处理了并发问题。

### Q: 策略数据存储在哪个集合？

A: 默认存储在 `casbin_rule` 集合中。

### Q: 如何自定义集合名称？

A: 目前不支持自定义集合名称，使用默认的 `casbin_rule`。

### Q: 支持事务吗？

A: MongoDB 4.0+ 支持事务，但适配器当前未实现事务支持。

## 更多资源

- [Casbin 官方文档](https://casbin.org/docs/overview)
- [MikroORM 文档](https://mikro-orm.io/docs)
- [GitHub 仓库](https://github.com/casbin/casbin-mikroorm-adapter)
