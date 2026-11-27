import { db } from '../database';
import { z } from 'zod';

const BackupSchema = z.object({
  appName: z.literal('GYM APP'),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.string(),
  tables: z.record(z.string(), z.array(z.unknown())),
});

export type BackupPayload = z.infer<typeof BackupSchema>;

export const backupRepo = {
  async exportAllData(): Promise<BackupPayload> {
    const tables: Record<string, unknown[]> = {};
    for (const table of db.tables) {
      tables[table.name] = await table.toArray();
    }
    return {
      appName: 'GYM APP',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      tables,
    };
  },

  validateBackup(raw: unknown): { valid: true; data: BackupPayload } | { valid: false; error: string } {
    const parsed = BackupSchema.safeParse(raw);
    if (!parsed.success) {
      return { valid: false, error: 'Invalid backup file structure or missing required fields.' };
    }
    if (parsed.data.schemaVersion > 1) {
      return { valid: false, error: `Unsupported schema version (${parsed.data.schemaVersion}). Please update GYM APP.` };
    }
    return { valid: true, data: parsed.data };
  },

  async importBackup(payload: BackupPayload, mode: 'replace' | 'merge' = 'replace'): Promise<{ restoredRecords: number }> {
    let restoredRecords = 0;
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) {
        const rows = payload.tables[table.name];
        if (!Array.isArray(rows)) continue;
        if (mode === 'replace') {
          await table.clear();
        }
        if (rows.length > 0) {
          await table.bulkPut(rows as never[]);
          restoredRecords += rows.length;
        }
      }
    });
    return { restoredRecords };
  },

  async clearAllUserData(): Promise<void> {
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) {
        await table.clear();
      }
    });
  },
};
