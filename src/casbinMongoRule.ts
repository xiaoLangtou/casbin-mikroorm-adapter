import { Entity, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

/**
 * Base class for Casbin rule entities (MongoDB).
 * Use this class when you need to create a custom entity with additional fields or custom collection name.
 *
 * @example
 * ```typescript
 * import { Entity, Property } from '@mikro-orm/core';
 * import { BaseCasbinMongoRule } from '@xltorg/casbin-mikroorm-adapter';
 *
 * @Entity({ tableName: 'sys_casbin_rule' })
 * export class CustomCasbinMongoRule extends BaseCasbinMongoRule {
 *   @Property()
 *   customField: string;
 * }
 * ```
 */
export abstract class BaseCasbinMongoRule {
  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

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

  @Property()
  public createdAt?: Date | string;

  @Property()
  public updatedAt?: Date | string;

  constructor() {
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * Default Casbin rule entity for MongoDB.
 * Used internally by the adapter in standalone mode.
 */
@Entity({ tableName: 'casbin_rule' })
export class CasbinMongoRule extends BaseCasbinMongoRule {}
