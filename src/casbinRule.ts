import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'sys_casbin_rule' })
export class CasbinRule {
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
