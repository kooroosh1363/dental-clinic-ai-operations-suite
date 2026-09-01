import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { schemaSql } from "./migrations.js";

export interface QueryResult<T> {
  rows: T[];
}
export interface Database {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
  close(): Promise<void>;
}

export async function createDatabase(
  databaseUrl?: string,
  dataDir = "memory://",
): Promise<Database> {
  if (databaseUrl) {
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
    await pool.query(schemaSql);
    return {
      async query<T extends Record<string, unknown>>(
        sql: string,
        params: unknown[] = [],
      ) {
        const result = await pool.query(sql, params);
        return { rows: result.rows as T[] };
      },
      async close() {
        await pool.end();
      },
    };
  }

  const db = new PGlite(dataDir);
  await db.exec(schemaSql);
  return {
    async query<T extends Record<string, unknown>>(
      sql: string,
      params: unknown[] = [],
    ) {
      const result = await db.query<T>(sql, params);
      return { rows: result.rows };
    },
    async close() {
      await db.close();
    },
  };
}
