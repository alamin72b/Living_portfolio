import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CONFIG, type Configuration } from '../config.js';
import * as schema from './schema.js';
@Injectable()
export class Database implements OnModuleDestroy {
  readonly pool: Pool;
  readonly orm: NodePgDatabase<typeof schema>;
  constructor(@Inject(CONFIG) config: Configuration) {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
    this.orm = drizzle(this.pool, { schema });
  }
  async onModuleDestroy() {
    await this.pool.end();
  }
}
export type Session = Pick<Database['orm'], 'select' | 'insert' | 'update' | 'delete' | 'execute'>;
