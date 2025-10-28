# 📒 Soranix Master Ledger System

Complete documentation for the immutable, double-entry ledger system.

---

## 🎯 Overview

The **Master Ledger** is the **single source of truth** for all financial transactions in Soranix. It provides:

- ✅ **Immutable** - Entries never updated or deleted, only appended
- ✅ **Double-Entry** - Every transaction affects two accounts (debits = credits)
- ✅ **Auditable** - Complete history of every monetary movement
- ✅ **Reconcilable** - Can verify all balances at any time
- ✅ **Time-Travel** - Query balances at any point in history
- ✅ **Multi-Currency** - Supports fiat (USD, EUR, NGN) and crypto (BTC, ETH)
- ✅ **Complex Accounts** - Wallet and investment sub-accounts per user

---

## ✨ Currently Implemented Features

### **Core Features**

#### ✅ **1. Immutable Ledger Entries**

- Append-only database design
- Database-level permissions prevent UPDATE/DELETE
- Every entry has `immutable: true` flag
- Sequence numbers prevent reordering

#### ✅ **2. Double-Entry Bookkeeping**

- Every transaction creates two entries
- Debits always equal credits
- Automatic validation
- Prevents unbalanced transactions

#### ✅ **3. Complex Account Structure**

```
User Account Format: {user_id}:{account_type}:{sub_account}:{currency}

Examples:
alice_123:wallet:checking:usd       → Alice's USD checking account
alice_123:wallet:savings:usd        → Alice's USD savings account
alice_123:investment:stocks:usd     → Alice's stock portfolio (USD value)
alice_123:investment:crypto:btc     → Alice's Bitcoin wallet
bob_456:wallet:checking:ngn         → Bob's NGN checking account
```

#### ✅ **4. Server-Generated Idempotency**

- Automatic duplicate detection
- Hash-based request fingerprinting
- 24-hour idempotency window
- Prevents double-spend from network retries

#### ✅ **5. Running Balance Optimization**

- Each entry stores balance AFTER transaction
- O(1) balance queries (just get latest entry)
- No need to sum millions of rows
- Still maintains complete history

#### ✅ **6. Cached Balances**

- Separate `account_balances` table for fast reads
- Updated atomically with ledger entries
- Includes available vs reserved balances
- Reconciled nightly against ledger

#### ✅ **7. Event-Driven Architecture**

- Hybrid: Events for writes, API for reads
- Subscribes to:
  - `payment.created` / `payment.completed` / `payment.failed`
  - `transfer.initiated` / `transfer.completed`
  - `bill.payment.initiated` / `bill.payment.completed`
- Publishes ledger confirmation events

#### ✅ **8. Multi-Currency Support**

- Fiat: USD, EUR, GBP, NGN
- Crypto: BTC, ETH, USDT, USDC
- Each currency tracked separately
- Exchange rates stored in metadata

#### ✅ **9. Transaction Types**

Supports 15+ transaction types:

- Deposits & Withdrawals
- P2P Transfers
- Internal Transfers (between own accounts)
- Payments & Refunds
- Bill Payments
- Fiat-to-Crypto Exchange
- Crypto-to-Fiat Exchange
- Crypto Swaps
- Stock Purchases/Sales
- Dividends & Interest
- Fees & Penalties
- Corrections & Reversals

#### ✅ **10. Balance Queries**

- Current balance (fast, from cache)
- Computed balance (slow, from ledger source of truth)
- Historical balance (point-in-time)
- User total balances (all accounts)
- System total balance (all users)

#### ✅ **11. Reconciliation**

- Per-account reconciliation
- System-wide reconciliation
- Compares cached vs computed balances
- Detects discrepancies automatically
- Background reconciliation job ready

#### ✅ **12. Race Condition Protection**

- Unique constraint on (account_id, sequence_number)
- Optimistic locking
- Automatic retry on conflicts
- Prevents concurrent modifications

#### ✅ **13. Negative Balance Prevention**

- User accounts cannot go negative
- Validation before insert
- Database-level CHECK constraints
- System accounts can go negative (liability tracking)

#### ✅ **14. Complete Audit Trail**

- Who: `created_by` field
- What: `transaction_type`, `description`
- When: `created_at` timestamp
- Why: `metadata` JSONB field
- Reference: `reference_id` links to original transaction

#### ✅ **15. RESTful API**

Endpoints for reading ledger data:

- `GET /api/v1/balance/:accountId`
- `GET /api/v1/balance/user/:userId`
- `GET /api/v1/balance/:accountId/historical?date=YYYY-MM-DD`
- `GET /api/v1/balance/system/total?currency=usd`
- `GET /api/v1/entries/:accountId`
- `GET /api/v1/entries/transaction/:entryId`
- `GET /api/v1/reconcile/:accountId`
- `POST /api/v1/reconcile/all`

---

## 🚀 Features We Can Add (Future Enhancements)

### **Tier 1: High Priority**

#### 🔜 **1. Reserved Balance Management**

Track funds locked for pending transactions:

```
Total Balance: $1000
Reserved: $200 (pending payment)
Available: $800
```

#### 🔜 **2. Fee Tracking**

Automatic fee deduction and tracking:

```
Payment: $100
Fee: $2
Net Amount: $98
```

#### 🔜 **3. Exchange Rate Management**

Store and track exchange rates for conversions:

```
Exchanged: $500 USD → 0.01 BTC
Rate: 1 BTC = $50,000
Stored in metadata
```

#### 🔜 **4. Batch Operations**

Process multiple entries in one transaction:

```
Bulk transfers, dividend distributions
All succeed or all fail atomically
```

#### 🔜 **5. Ledger Event Publishing**

Publish events when ledger entries are created:

```
ledger.entry.created
ledger.balance.updated
ledger.reconciliation.completed
```

#### 🔜 **6. Transaction Reversal/Void**

Safe way to reverse transactions:

```
Original: Debit $100
Reversal: Credit $100 (with reference to original)
Both entries preserved in ledger
```

### **Tier 2: Medium Priority**

#### 🔜 **7. Account Statements**

Generate account statements for periods:

```
GET /api/v1/statements/:accountId?from=2024-01-01&to=2024-01-31
Returns PDF or JSON
```

#### 🔜 **8. Balance Snapshots**

Periodic snapshots for performance:

```
Monthly snapshots of all balances
Fast historical queries
Partition old data
```

#### 🔜 **9. Blockchain Hash Chain**

Link entries cryptographically:

```
entry_hash = SHA256(previous_hash + data)
Tamper-proof ledger
Instant integrity verification
```

#### 🔜 **10. Advanced Search**

Query ledger by multiple criteria:

```
Search by: date range, amount range, transaction type
Full-text search on descriptions
Metadata filtering
```

#### 🔜 **11. Real-time Balance Streaming**

WebSocket/SSE for live balance updates:

```
Subscribe to account balance changes
Real-time notifications
```

#### 🔜 **12. Multi-Signature Transactions**

Require multiple approvals for large transactions:

```
Transfer > $10,000 requires 2 approvals
Ledger holds in pending until approved
```

#### 🔜 **13. Account Freezing**

Temporarily freeze accounts:

```
Frozen accounts reject debits
Credits still allowed
Audit trail of freeze/unfreeze
```

#### 🔜 **14. Daily Closing**

End-of-day balance snapshots:

```
Daily closing process
Opening/closing balances
Daily summaries
```

### **Tier 3: Advanced Features**

#### 🔜 **15. Full Event Sourcing**

Store ALL state changes as events:

```
Every balance change is an event
Can replay to any point in time
Complete audit trail
```

#### 🔜 **16. Predictive Balance**

Forecast future balances:

```
Based on scheduled payments
Recurring bills
Pending transactions
```

#### 🔜 **17. Anomaly Detection**

AI-powered fraud detection:

```
Unusual transaction patterns
Velocity limits exceeded
Suspicious behavior flagging
```

#### 🔜 **18. Multi-Ledger Support**

Separate ledgers for different purposes:

```
Main ledger: User transactions
Shadow ledger: Testing
Archive ledger: Historical data
```

#### 🔜 **19. Compliance Reports**

Automated regulatory reporting:

```
Tax reports
AML/KYC transaction reports
Suspicious activity reports
```

#### 🔜 **20. GraphQL API**

Alternative API for complex queries:

```
query {
  account(id: "alice_123:wallet:checking:usd") {
    balance
    history(limit: 10) {
      amount
      description
    }
  }
}
```

#### 🔜 **21. Data Export**

Export ledger data in various formats:

```
CSV, JSON, Parquet
For analytics, ML training
Compliance archives
```

#### 🔜 **22. Read Replicas**

Dedicated databases for analytics:

```
Write to master
Read from replicas
No impact on write performance
```

#### 🔜 **23. Automated Reconciliation**

Smart reconciliation with auto-fix:

```
Detect discrepancies
Suggest corrections
Auto-fix minor issues
Alert on major issues
```

#### 🔜 **24. Account Hierarchies**

Parent-child account relationships:

```
alice_123:wallet (parent)
├── alice_123:wallet:checking (child)
├── alice_123:wallet:savings (child)
└── alice_123:wallet:reserve (child)

Aggregate parent balance from children
```

#### 🔜 **25. Distributed Ledger**

Multi-region ledger replication:

```
Ledger in multiple regions
Conflict resolution
Eventually consistent
```

---

## 🏗️ Architecture

### **Database: PostgreSQL**

**Why PostgreSQL?**

- ✅ ACID transactions (critical for financial data)
- ✅ Excellent append-only performance
- ✅ Rich querying (complex reconciliation)
- ✅ Partitioning support (handle billions of entries)
- ✅ Proven in finance (Stripe, Square use it)

**Tables:**

1. `ledger_entries` - Immutable transaction log
2. `account_balances` - Cached balances for fast reads
3. `idempotency_keys` - Duplicate prevention

### **Service Type: Microservice**

**Location:** `services/ledger/`

**Port:** 6002

**Database:** `ledger_db` (in shared PostgreSQL instance)

**Communication:**

- **Writes:** Event-driven (subscribes to financial events)
- **Reads:** HTTP API (fast balance queries)

---

## 📊 Account Structure

### **User Accounts**

```
{user_id}:{account_type}:{sub_account}:{currency}

Account Types:
├── wallet
│   ├── checking (main spending account)
│   ├── savings (savings account)
│   └── reserve (locked funds for pending transactions)
│
└── investment
    ├── stocks (equity portfolio)
    ├── crypto (cryptocurrency)
    ├── bonds (fixed income)
    └── mutual_funds (mutual funds)
```

### **System Accounts**

```
system:{sub_account}:{currency}

System Sub-Accounts:
├── fees (platform fees collected)
├── reserves (money in reserve)
├── pending (pending transactions)
├── exchange (exchange operations)
└── bills_payable (bills awaiting payment)

Revenue Accounts:
├── revenue:payments
├── revenue:subscriptions
└── revenue:exchange_fees

Expense Accounts:
├── expense:bills
├── expense:payment_gateway
└── expense:operational
```

---

## 🔧 How It Works

### **Write Path (Event-Driven)**

```
1. Payment Service processes payment
   ↓
2. Publishes "payment.created" event to RabbitMQ
   ↓
3. Ledger Service receives event
   ↓
4. Creates double-entry ledger entries
   ├─ Debit: user account
   └─ Credit: system pending
   ↓
5. Updates cached balance
   ↓
6. Publishes "ledger.entry.created" event (optional)
   ↓
7. Payment Service can subscribe to confirmation
```

**Benefits:**

- ⚡ Fast: Payment Service doesn't wait for ledger
- 🔄 Resilient: Events queued if ledger is down
- 📈 Scalable: Ledger processes asynchronously

### **Read Path (API)**

```
1. User Service needs to check balance
   ↓
2. Calls GET /api/v1/balance/alice_123:wallet:checking:usd
   ↓
3. Ledger Service returns cached balance (< 1ms)
   ↓
4. User Service validates and proceeds
```

**Benefits:**

- ⚡ Ultra-fast reads from cached balances
- ✅ Guaranteed consistency (from master ledger)
- 🎯 Single source of truth

---

## 💰 Transaction Examples

### **Example 1: Bill Payment**

```
Alice pays $100 electric bill:

Entry 1 (Debit Alice's checking):
{
  id: "entry_001",
  entryId: "txn_abc123",
  sequenceNumber: 47,
  accountId: "alice_123:wallet:checking:usd",
  counterAccountId: "system:bills_payable",
  debit: "100.0000",
  credit: "0.0000",
  currency: "usd",
  balance: "1050.0000",  // Was 1150, now 1050
  transactionType: "bill_payment",
  referenceId: "bill_xyz789",
  description: "Electric bill payment",
  metadata: {
    biller: "Electric Company",
    billReference: "ELEC-2024-10-001"
  },
  createdBy: "ledger-service",
  idempotencyKey: "idem_abc123...",
  immutable: true
}

Entry 2 (Credit system bills payable):
{
  id: "entry_002",
  entryId: "txn_abc123",  // Same entry ID!
  sequenceNumber: 203,
  accountId: "system:bills_payable",
  counterAccountId: "alice_123:wallet:checking:usd",
  debit: "0.0000",
  credit: "100.0000",
  balance: "5000.0000",
  transactionType: "bill_payment",
  referenceId: "bill_xyz789",
  description: "Bill payment from Alice",
  createdBy: "ledger-service",
  idempotencyKey: "idem_def456...",
  immutable: true
}

Validation: 100 debit = 100 credit ✅
```

### **Example 2: Fiat-to-Crypto Exchange**

```
Alice exchanges $500 USD → 0.01 BTC at rate 1 BTC = $50,000

Transaction 1 (USD Leg):
Entry 1: alice_123:wallet:checking:usd
  ├─ debit: 500
  ├─ balance: 550 (was 1050)

Entry 2: system:exchange:usd
  ├─ credit: 500
  ├─ balance: 5000

Transaction 2 (BTC Leg):
Entry 3: system:exchange:btc
  ├─ debit: 0.01
  ├─ balance: 9.99

Entry 4: alice_123:investment:crypto:btc
  ├─ credit: 0.01
  ├─ balance: 0.01 (first BTC!)

All entries have metadata:
{
  exchangeRate: 50000,
  exchangeId: "exch_123",
  pair: "USD/BTC",
  marketPrice: 50100,
  fee: 5
}
```

### **Example 3: P2P Transfer**

```
Alice transfers $200 to Bob:

Entry 1: alice_123:wallet:checking:usd
  ├─ debit: 200
  ├─ counterAccount: bob_456:wallet:checking:usd
  ├─ balance: 350 (was 550)
  ├─ description: "Transfer to Bob"

Entry 2: bob_456:wallet:checking:usd
  ├─ credit: 200
  ├─ counterAccount: alice_123:wallet:checking:usd
  ├─ balance: 500 (was 300)
  ├─ description: "Transfer from Alice"

Both share same entryId for grouping
```

---

## 🔐 Security & Immutability

### **Database-Level Protection**

```sql
-- 1. Revoke dangerous permissions
REVOKE UPDATE, DELETE ON ledger_entries FROM app_user;
GRANT INSERT, SELECT ON ledger_entries TO app_user;

-- 2. Trigger to prevent modifications
CREATE TRIGGER prevent_ledger_modifications
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION raise_exception('Ledger entries are immutable!');

-- 3. CHECK constraints
ALTER TABLE ledger_entries ADD CONSTRAINT positive_amounts
  CHECK (debit >= 0 AND credit >= 0);

ALTER TABLE ledger_entries ADD CONSTRAINT one_side_only
  CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0));
```

### **Application-Level Protection**

```typescript
// ORM configuration: No update/delete methods
class LedgerEntry {
  // Only INSERT and SELECT allowed
  // No update() or delete() methods exposed
}

// Service layer validation
if (entry.immutable) {
  throw new Error('Cannot modify immutable ledger entry');
}
```

---

## 🎯 API Reference

### **Balance APIs**

#### `GET /api/v1/balance/:accountId`

Get current balance for an account

**Response:**

```json
{
  "success": true,
  "data": {
    "accountId": "alice_123:wallet:checking:usd",
    "balance": "1150.0000",
    "availableBalance": "950.0000",
    "currency": "usd",
    "asOf": "2024-10-10T10:30:00Z"
  }
}
```

#### `GET /api/v1/balance/user/:userId`

Get all balances for a user

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "alice_123",
    "balances": [
      {
        "accountId": "alice_123:wallet:checking:usd",
        "balance": "1150.0000",
        "currency": "usd"
      },
      {
        "accountId": "alice_123:investment:crypto:btc",
        "balance": "0.0100",
        "currency": "btc"
      }
    ],
    "totalAccounts": 2
  }
}
```

#### `GET /api/v1/balance/:accountId/historical?date=2024-03-15`

Get historical balance

**Response:**

```json
{
  "success": true,
  "data": {
    "accountId": "alice_123:wallet:checking:usd",
    "balance": "800.0000",
    "asOf": "2024-03-15T23:59:59Z"
  }
}
```

### **Entry APIs**

#### `GET /api/v1/entries/:accountId?limit=50&offset=0`

Get transaction history

**Response:**

```json
{
  "success": true,
  "data": {
    "accountId": "alice_123:wallet:checking:usd",
    "entries": [
      {
        "id": "entry_001",
        "debit": "100.0000",
        "credit": "0.0000",
        "balance": "1050.0000",
        "transactionType": "bill_payment",
        "description": "Electric bill",
        "createdAt": "2024-10-10T10:00:00Z"
      }
    ],
    "count": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### **Reconciliation APIs**

#### `GET /api/v1/reconcile/:accountId`

Reconcile specific account

**Response:**

```json
{
  "success": true,
  "data": {
    "accountId": "alice_123:wallet:checking:usd",
    "cachedBalance": "1150.0000",
    "computedBalance": "1150.0000",
    "discrepancy": "0.0000",
    "status": "ok"
  }
}
```

#### `POST /api/v1/reconcile/all`

Reconcile all accounts

**Response:**

```json
{
  "success": true,
  "data": {
    "totalMismatches": 2,
    "mismatches": [
      {
        "accountId": "bob_456:wallet:checking:usd",
        "cachedBalance": "500.0000",
        "computedBalance": "501.0000",
        "discrepancy": "-1.0000",
        "status": "mismatch"
      }
    ]
  }
}
```

---

## 📋 Database Schema

### **ledger_entries Table**

| Column             | Type          | Description                       |
| ------------------ | ------------- | --------------------------------- |
| id                 | UUID          | Primary key                       |
| entry_id           | UUID          | Groups double-entry pairs         |
| sequence_number    | INTEGER       | Per-account ordering              |
| account_id         | VARCHAR       | Account identifier                |
| counter_account_id | VARCHAR       | The other side of transaction     |
| debit              | DECIMAL(19,4) | Money out                         |
| credit             | DECIMAL(19,4) | Money in                          |
| currency           | VARCHAR       | USD, EUR, BTC, etc.               |
| balance            | DECIMAL(19,4) | Running balance after transaction |
| transaction_type   | VARCHAR       | bill_payment, transfer, etc.      |
| reference_id       | VARCHAR       | Original transaction ID           |
| description        | TEXT          | Human-readable description        |
| metadata           | JSONB         | Flexible additional data          |
| created_at         | TIMESTAMP     | When entry was created            |
| created_by         | VARCHAR       | Service/user that created it      |
| idempotency_key    | VARCHAR       | Prevents duplicates               |
| immutable          | BOOLEAN       | Always true                       |

**Indexes:**

- `idx_idempotency_key` (UNIQUE)
- `idx_account_sequence` (UNIQUE on account_id, sequence_number)
- `idx_account_time` (account_id, created_at DESC)
- `idx_entry_group` (entry_id)

### **account_balances Table**

| Column               | Type          | Description               |
| -------------------- | ------------- | ------------------------- |
| account_id           | VARCHAR       | Primary key               |
| user_id              | VARCHAR       | Owner user ID             |
| balance              | DECIMAL(19,4) | Current balance (cached)  |
| available_balance    | DECIMAL(19,4) | Balance minus reserved    |
| reserved_balance     | DECIMAL(19,4) | Locked funds              |
| last_entry_id        | VARCHAR       | Last processed entry      |
| last_sequence_number | INTEGER       | Last sequence processed   |
| entry_count          | INTEGER       | Total entries for account |
| updated_at           | TIMESTAMP     | Last update time          |

---

## 🚦 Getting Started

### **1. Start Services**

```bash
# Start PostgreSQL (creates ledger_db)
docker-compose up postgres -d

# Start Ledger Service
docker-compose up soranix-ledger -d
```

### **2. Verify Health**

```bash
curl http://localhost:6002/health

# Should show:
# {
#   "status": "healthy",
#   "service": "ledger",
#   "eventBus": "connected"
# }
```

### **3. Check Balance**

```bash
curl http://localhost:6002/api/v1/balance/alice_123:wallet:checking:usd
```

---

## 🎯 Summary

**The Master Ledger is now:**

✅ **Immutable** - Append-only, never modified  
✅ **Double-Entry** - Always balanced  
✅ **Event-Driven** - Async writes  
✅ **API-Based** - Fast reads  
✅ **Multi-Currency** - Fiat + Crypto  
✅ **Complex Accounts** - Wallet + Investment sub-accounts  
✅ **Idempotent** - Server-generated duplicate prevention  
✅ **Reconcilable** - Automatic validation  
✅ **Auditable** - Complete transaction history  
✅ **Performant** - Running balances + caching

**Start using it to track every financial transaction in Soranix!** 🚀
