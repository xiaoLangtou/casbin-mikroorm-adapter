# 迁移指南：从 MikroORM v5 升级到 v6

本文档说明如何将使用 `casbin-mikroorm-adapter` v1.x (MikroORM v5) 的项目升级到 v2.x (MikroORM v6)。

## 版本要求

- **Node.js**: >= 16.x
- **TypeScript**: >= 5.0
- **MikroORM**: >= 6.0.0
- **Casbin**: >= 5.0.0

## 重要变更

⚠️ **MikroORM v6 已移除 `type` 配置字段**

在 MikroORM v6 中，`type` 字段已被完全移除，必须使用 `driver` 字段来指定数据库驱动。

## 升级步骤

### 1. 更新依赖

```bash
# 使用 pnpm
pnpm install casbin-mikroorm-adapter@^2.0.0 @mikro-orm/core@^6.6.3

# 安装对应的数据库驱动
pnpm install @mikro-orm/mysql  # MySQL
# 或
pnpm install @mikro-orm/postgresql  # PostgreSQL
# 或
pnpm install @mikro-orm/mongodb  # MongoDB
```

### 2. 更新 TypeScript 配置

确保你的 `tsconfig.json` 包含以下配置：

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 3. 代码变更

#### 3.1 适配器初始化（必须修改）

**v1.x (MikroORM v5) - 使用 type 字段:**
```typescript
import { newEnforcer } from 'casbin';
import MikroOrmAdapter from 'casbin-mikroorm-adapter';

const adapter = await MikroOrmAdapter.newAdapter({
  type: 'mysql',  // ❌ v6 中已移除
  host: 'localhost',
  dbName: 'casbin',
});
```

**v2.x (MikroORM v6) - 使用 driver 字段:**
```typescript
import { newEnforcer } from 'casbin';
import MikroOrmAdapter from 'casbin-mikroorm-adapter';
import { MySqlDriver } from '@mikro-orm/mysql';

const adapter = await MikroOrmAdapter.newAdapter({
  driver: MySqlDriver,  // ✅ v6 中必须使用 driver
  host: 'localhost',
  dbName: 'casbin',
});

const enforcer = await newEnforcer('model.conf', adapter);
```

#### 3.2 实体类变更（如果你自定义了实体）

如果你扩展了 `CasbinRule` 或 `CasbinMongoRule` 实体，需要注意：

**v1.x (MikroORM v5):**
```typescript
import { BaseEntity, Entity, Property } from '@mikro-orm/core';

@Entity()
export class CasbinRule extends BaseEntity<CasbinRule, 'id'> {
  @Property()
  public ptype: string;
}
```

**v2.x (MikroORM v6):**
```typescript
import { Entity, Property } from '@mikro-orm/core';

@Entity()
export class CasbinRule {
  @Property({ nullable: true })
  public ptype?: string;
}
```

主要变更：
- 移除了 `BaseEntity` 继承
- 属性改为可选类型（使用 `?`）
- 装饰器添加 `{ nullable: true }` 选项

## 破坏性变更

### 1. 移除 BaseEntity

MikroORM v6 不再推荐使用 `BaseEntity`，所有实体类都不再继承它。

### 2. 属性类型变更

所有策略字段（`ptype`, `v0-v6`）现在都是可选的（`nullable: true`），这更符合实际使用场景。

### 3. TypeScript 版本要求

最低要求 TypeScript 5.0，因为 MikroORM v6 使用了 TypeScript 5.x 的新特性（如 `const` 类型参数）。

## 常见问题

### Q: 升级后出现类型错误

**A:** 确保你的 TypeScript 版本 >= 5.0，并在 `tsconfig.json` 中启用了 `esModuleInterop` 和 `skipLibCheck`。

### Q: 数据库迁移需要注意什么？

**A:** 数据库表结构没有变化，无需执行迁移脚本。现有数据可以直接使用。

### Q: 如何回退到 v1.x？

**A:** 如果需要回退：

```bash
pnpm install casbin-mikroorm-adapter@^1.0.0 @mikro-orm/core@^5.1.3
```

然后恢复相关代码变更。

## 获取帮助

- [MikroORM v6 迁移指南](https://mikro-orm.io/docs/upgrading-v5-to-v6)
- [Casbin 文档](https://casbin.org/docs/overview)
- [GitHub Issues](https://github.com/casbin/casbin-mikroorm-adapter/issues)

## 更新日志

完整的更新日志请查看 [CHANGELOG.md](./CHANGELOG.md)。
