import { Helper, Model, FilteredAdapter, BatchAdapter } from 'casbin';
import { CasbinRule } from './casbinRule';
import { CasbinMongoRule } from './casbinMongoRule';
import { MikroORM, MetadataStorage } from '@mikro-orm/core';
import { MikroORMAdapterOptions } from './types';

type GenericCasbinRule = CasbinRule | CasbinMongoRule | any;
type CasbinRuleConstructor = new (...args: any[]) => GenericCasbinRule;

/**
 * MikroORMAdapter represents the MikroORM filtered adapter for policy storage.
 * Supports both standalone mode (creates new connection) and shared mode (reuses existing MikroORM instance).
 */
export default class MikroORMAdapter implements FilteredAdapter, BatchAdapter {
  private option: MikroORMAdapterOptions;
  private mikroOrm!: MikroORM;
  private filtered = false;
  private isSharedInstance = false;
  private casbinRuleEntity?: any;

  private constructor(option: MikroORMAdapterOptions) {
    this.option = option;
  }

  public isFiltered(): boolean {
    return this.filtered;
  }

  /**
   * newAdapter is the constructor.
   * @param option MikroORM adapter options
   */
  public static async newAdapter(option: MikroORMAdapterOptions) {
    let a: MikroORMAdapter;

    // If mikroOrm instance is provided, use shared mode
    if (option.mikroOrm) {
      a = new MikroORMAdapter(option);
      a.mikroOrm = option.mikroOrm;
      a.isSharedInstance = true;

      // Find the Casbin entity by table name in shared instance
      const tableName = option.tableName || 'sys_casbin_rule';
      const metadata = a.mikroOrm.getMetadata();
      const registeredEntities = metadata.getAll();

      // Find entity by table name
      for (const [entityName, meta] of Object.entries(registeredEntities)) {
        if (meta.tableName === tableName) {
          a.casbinRuleEntity = meta.class;
          break;
        }
      }

      if (!a.casbinRuleEntity) {
        throw new Error(`Casbin entity with table name '${tableName}' not found in MikroORM metadata. Please ensure the entity is registered in your MikroORM configuration.`);
      }

      return a;
    }

    // Standalone mode: create new connection
    const dbType = this.detectDatabaseType(option);
    const casbinEntity = this.getCasbinRuleType(dbType);

    // Apply custom table name if specified
    if (option.tableName) {
      const metadata = MetadataStorage.getMetadataFromDecorator(casbinEntity);
      if (metadata) {
        metadata.tableName = option.tableName;
      }
    }

    // Merge Casbin entity with user's entities if they exist
    const opts = option as any;
    const userEntities = opts.entities || [];
    const allEntities = Array.isArray(userEntities)
      ? [...userEntities, casbinEntity]
      : [casbinEntity];

    const configuration = Object.assign({}, option, { entities: allEntities });
    a = new MikroORMAdapter(configuration);
    await a.open();
    return a;
  }

  /**
   * Detect database type from driver option or existing MikroORM instance
   * @param option - MikroORM configuration options
   * @returns Database type string
   */
  private static detectDatabaseType(option: MikroORMAdapterOptions): string {
    // If using shared instance, detect from the instance
    if (option.mikroOrm) {
      const driverName = option.mikroOrm.config.get('driver')?.name || '';
      const lowerName = driverName.toLowerCase();

      if (lowerName.includes('mongo')) return 'mongo';
      if (lowerName.includes('mysql')) return 'mysql';
      if (lowerName.includes('postgres') || lowerName.includes('pg')) return 'postgresql';
      if (lowerName.includes('sqlite')) return 'sqlite';
      if (lowerName.includes('mariadb')) return 'mariadb';
      if (lowerName.includes('mssql') || lowerName.includes('sqlserver')) return 'mssql';

      return 'mysql'; // default
    }

    const opts = option as any;

    // Check driver field (required in MikroORM v6)
    if (opts.driver) {
      const driverName = opts.driver.name || opts.driver.constructor?.name || '';
      const lowerName = driverName.toLowerCase();

      if (lowerName.includes('mongo')) return 'mongo';
      if (lowerName.includes('mysql')) return 'mysql';
      if (lowerName.includes('postgres') || lowerName.includes('pg')) return 'postgresql';
      if (lowerName.includes('sqlite')) return 'sqlite';
      if (lowerName.includes('mariadb')) return 'mariadb';
      if (lowerName.includes('mssql') || lowerName.includes('sqlserver')) return 'mssql';
    }

    // Fallback: try to detect from clientUrl for MongoDB
    if (opts.clientUrl && opts.clientUrl.includes('mongodb://')) {
      return 'mongo';
    }

    // Default to relational database (use CasbinRule)
    return 'mysql';
  }

  private async open() {
    if (!this.mikroOrm) {
      this.mikroOrm = await MikroORM.init(this.option as any);
    }
    const isConnected = await this.mikroOrm.isConnected();
    if (!isConnected) {
      await this.mikroOrm.connect();
    }
  }

  public async close() {
    // Don't close shared instances
    if (this.isSharedInstance) {
      return;
    }

    const isConnected = await this.mikroOrm.isConnected();
    if (isConnected) {
      await this.mikroOrm.close(true);
    }
  }

  private async clearTable() {
    const em = this.mikroOrm.em.fork();
    await em.nativeDelete(this.getCasbinRuleConstructor(), {});
  }

  private loadPolicyLine(line: GenericCasbinRule, model: Model) {
    const result =
      line.ptype +
      ', ' +
      [ line.v0, line.v1, line.v2, line.v3, line.v4, line.v5, line.v6 ]
        .filter((n) => n)
        .map((n) => `"${n}"`)
        .join(', ');
    Helper.loadPolicyLine(result, model);
  }

  /**
   * loadPolicy loads all policy rules from the storage.
   */
  public async loadPolicy(model: Model) {
    const em = this.mikroOrm.em.fork();
    const lines = await em.find(this.getCasbinRuleConstructor(), {});
    for (const line of lines) {
      this.loadPolicyLine(line, model);
    }
  }

  // Loading policies based on filter condition
  public async loadFilteredPolicy(model: Model, filter?: object) {
    const em = this.mikroOrm.em.fork();
    const filteredLines = await em.find(this.getCasbinRuleConstructor(), { ...filter });
    for (const line of filteredLines) {
      this.loadPolicyLine(line, model);
    }
    this.filtered = true;
  }

  private savePolicyLine(ptype: string, rule: string[]): GenericCasbinRule {
    const line = new (this.getCasbinRuleConstructor())();

    line.ptype = ptype;
    if (rule.length > 0) {
      line.v0 = rule[0];
    }
    if (rule.length > 1) {
      line.v1 = rule[1];
    }
    if (rule.length > 2) {
      line.v2 = rule[2];
    }
    if (rule.length > 3) {
      line.v3 = rule[3];
    }
    if (rule.length > 4) {
      line.v4 = rule[4];
    }
    if (rule.length > 5) {
      line.v5 = rule[5];
    }
    if (rule.length > 6) {
      line.v6 = rule[6];
    }

    return line;
  }

  /**
   * savePolicy saves all policy rules to the storage.
   */
  public async savePolicy(model: Model) {
    await this.clearTable();

    let astMap = model.model.get('p');
    const lines: GenericCasbinRule[] = [];
    // @ts-ignore
    for (const [ ptype, ast ] of astMap) {
      for (const rule of ast.policy) {
        const line = this.savePolicyLine(ptype, rule);
        lines.push(line);
      }
    }

    astMap = model.model.get('g');
    // @ts-ignore
    for (const [ ptype, ast ] of astMap) {
      for (const rule of ast.policy) {
        const line = this.savePolicyLine(ptype, rule);
        lines.push(line);
      }
    }

    const em = this.mikroOrm.em.fork();

    if (Array.isArray(lines) && lines.length > 0) {
      await em.insertMany(this.getCasbinRuleConstructor(), lines);
      await em.flush();
    }

    return true;
  }

  /**
   * addPolicy adds a policy rule to the storage.
   */
  public async addPolicy(sec: string, ptype: string, rule: string[]) {
    const line = this.savePolicyLine(ptype, rule);
    const em = this.mikroOrm.em.fork();
    await em.persistAndFlush(line);
  }

  /**
   * addPolicies adds policy rules to the storage.
   */
  public async addPolicies(sec: string, ptype: string, rules: string[][]) {
    const lines: GenericCasbinRule[] = [];
    for (const rule of rules) {
      const line = this.savePolicyLine(ptype, rule);
      lines.push(line);
    }
    const em = this.mikroOrm.em.fork();
    await em.insertMany(this.getCasbinRuleConstructor(), lines);
    await em.flush();
  }

  /**
   * removePolicy removes a policy rule from the storage.
   */
  public async removePolicy(sec: string, ptype: string, rule: string[]) {
    const line = this.savePolicyLine(ptype, rule);
    const em = this.mikroOrm.em.fork();
    await em.nativeDelete(this.getCasbinRuleConstructor(), line);
  }

  /**
   * removePolicies removes policy rules from the storage.
   */
  public async removePolicies(sec: string, ptype: string, rules: string[][]) {
    const em = this.mikroOrm.em.fork();
    for (const rule of rules) {
      const line = this.savePolicyLine(ptype, rule);
      await em.nativeDelete(this.getCasbinRuleConstructor(), line);
    }
  }

  /**
   * removeFilteredPolicy removes policy rules that match the filter from the storage.
   */
  public async removeFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ) {
    const line = new (this.getCasbinRuleConstructor())();

    line.ptype = ptype;

    if (fieldIndex <= 0 && 0 < fieldIndex + fieldValues.length) {
      line.v0 = fieldValues[0 - fieldIndex];
    }
    if (fieldIndex <= 1 && 1 < fieldIndex + fieldValues.length) {
      line.v1 = fieldValues[1 - fieldIndex];
    }
    if (fieldIndex <= 2 && 2 < fieldIndex + fieldValues.length) {
      line.v2 = fieldValues[2 - fieldIndex];
    }
    if (fieldIndex <= 3 && 3 < fieldIndex + fieldValues.length) {
      line.v3 = fieldValues[3 - fieldIndex];
    }
    if (fieldIndex <= 4 && 4 < fieldIndex + fieldValues.length) {
      line.v4 = fieldValues[4 - fieldIndex];
    }
    if (fieldIndex <= 5 && 5 < fieldIndex + fieldValues.length) {
      line.v5 = fieldValues[5 - fieldIndex];
    }
    if (fieldIndex <= 6 && 6 < fieldIndex + fieldValues.length) {
      line.v6 = fieldValues[6 - fieldIndex];
    }
    const em = this.mikroOrm.em.fork();
    await em.nativeDelete(this.getCasbinRuleConstructor(), line);
  }

  private getCasbinRuleConstructor(): CasbinRuleConstructor {
    // In shared mode, use the entity found in MikroORM metadata
    if (this.isSharedInstance && this.casbinRuleEntity) {
      return this.casbinRuleEntity;
    }

    // In standalone mode, use built-in entities
    const dbType = MikroORMAdapter.detectDatabaseType(this.option);
    return MikroORMAdapter.getCasbinRuleType(dbType);
  }

  /**
   * Returns either a {@link CasbinRule} or a {@link CasbinMongoRule}, depending on the type. This switch is required as the normal
   * {@link CasbinRule} does not work when using MongoDB as a backend (due to a missing ObjectID field).
   * @param type - Database type (mongo, mongodb, mysql, postgresql, mariadb, sqlite, etc.)
   */
  private static getCasbinRuleType(type: string): CasbinRuleConstructor {
    if (type === 'mongo' || type === 'mongodb') {
      return CasbinMongoRule;
    }
    return CasbinRule;
  }
}
