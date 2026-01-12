import { Options, MikroORM } from '@mikro-orm/core';

/**
 * MikroORM Adapter Options
 * 
 * Note: In MikroORM v6, the `type` option has been removed.
 * You must use the `driver` option instead.
 * 
 * @example
 * ```typescript
 * import { MySqlDriver } from '@mikro-orm/mysql';
 * 
 * // Option 1: Create new connection (standalone mode)
 * const options: MikroORMAdapterOptions = {
 *   driver: MySqlDriver,
 *   host: 'localhost',
 *   dbName: 'casbin',
 *   tableName: 'sys_casbin_rule',
 * };
 * 
 * // Option 2: Share existing MikroORM instance
 * const options: MikroORMAdapterOptions = {
 *   mikroOrm: existingMikroOrmInstance,
 *   tableName: 'sys_casbin_rule',
 * };
 * ```
 */
export type MikroORMAdapterOptions = (Options | { mikroOrm: MikroORM }) & {
  /**
   * Custom table name for Casbin rules
   * @default 'casbin_rule'
   */
  tableName?: string;
  /**
   * Existing MikroORM instance to share
   * If provided, adapter will use this instance instead of creating a new one
   */
  mikroOrm?: MikroORM;
};
