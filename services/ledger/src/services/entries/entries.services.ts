import { eq, desc } from 'drizzle-orm';

import { getDatabase } from '../../db/connection.js';
import { ledgerEntries } from '../../db/schema/index.js';
import type { LedgerEntry } from '../../types/ledger-types.js';

class EntriesServices {
  private db = getDatabase();

  async getAccountHistory(accountId: string, limit: number = 50, offset: number = 0): Promise<LedgerEntry[]> {
    const entries = await this.db.query.ledgerEntries.findMany({
      where: eq(ledgerEntries.accountId, accountId),
      orderBy: [desc(ledgerEntries.createdAt)],
      limit,
      offset,
    });

    return entries as LedgerEntry[];
  }

  async getTransactionEntries(entryId: string): Promise<LedgerEntry[]> {
    const entries = await this.db.query.ledgerEntries.findMany({
      where: eq(ledgerEntries.entryId, entryId),
    });

    return entries as LedgerEntry[];
  }
}

export default EntriesServices;
