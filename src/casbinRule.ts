import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * Base class for Casbin rule entities (SQL databases).
 * Use this class when you need to create a custom entity with additional fields or custom table name.
 *
 * @example
 * ```typescript
 * import { Entity, Property } from '@mikro-orm/core';
 * import { BaseCasbinRule } from '@xltorg/casbin-mikroorm-adapter';
 *
 * @Entity({ tableName: 'sys_casbin_rule' })
 * export class CustomCasbinRule extends BaseCasbinRule {
 *   @Property()
 *   createdAt: Date = new Date();
 * }
 * ```
 */
export abstract class BaseCasbinRule {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  public ptype?: string;

  @Property({ nullable: true })
  public v0?: string;

  @Property({ nullable: true })
  public v1?: string;

  @Property({ nullable: true })
  public v2?: string;

  @Property({ nullable: true })
  public v3?: string;

  @Property({ nullable: true })
  public v4?: string;

  @Property({ nullable: true })
  public v5?: string;

  @Property({ nullable: true })
  public v6?: string;
}

/**
 * Default Casbin rule entity for SQL databases.
 * Used internally by the adapter in standalone mode.
 */
@Entity({ tableName: 'sys_casbin_rule' })
export class CasbinRule extends BaseCasbinRule {
}
