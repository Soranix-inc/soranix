# 📁 Ledger Service - Proper Structure

## ✅ Correctly Structured Following Soranix Pattern

```
services/ledger/
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── drizzle.config.ts                 # Database ORM config
├── Dockerfile.dev                    # Docker development
├── env.example                       # Environment template
│
├── src/
│   ├── types/                        # Type definitions
│   │   ├── account-types.ts          # Account enums & helpers
│   │   └── ledger-types.ts           # Ledger interfaces
│   │
│   ├── db/                           # Database layer
│   │   ├── connection.ts             # PostgreSQL pool
│   │   └── schema/
│   │       ├── ledger-entries.ts     # Main ledger table
│   │       ├── account-balances.ts   # Cached balances table
│   │       ├── idempotency-keys.ts   # Duplicate prevention
│   │       └── index.ts              # Schema exports
│   │
│   ├── utils/                        # Utility services
│   │   └── idempotency.service.ts    # Idempotency key generation
│   │
│   ├── events/                       # Event-driven layer
│   │   ├── event-bus.ts              # RabbitMQ integration
│   │   └── subscribers/
│   │       ├── payment-event-subscriber.ts
│   │       ├── bill-event-subscriber.ts
│   │       └── transfer-event-subscriber.ts
│   │
│   ├── services/                     # Domain modules (follows pattern)
│   │   ├── core/                     # Core ledger operations
│   │   │   ├── core.controllers.ts
│   │   │   ├── core.services.ts      # Main ledger logic
│   │   │   ├── core.routes.ts
│   │   │   └── core.modules.ts
│   │   │
│   │   ├── balance/                  # Balance queries
│   │   │   ├── balance.controllers.ts
│   │   │   ├── balance.services.ts   # Balance & reconciliation
│   │   │   ├── balance.routes.ts
│   │   │   └── balance.modules.ts
│   │   │
│   │   ├── entries/                  # Transaction history
│   │   │   ├── entries.controllers.ts
│   │   │   ├── entries.services.ts
│   │   │   ├── entries.routes.ts
│   │   │   └── entries.modules.ts
│   │   │
│   │   ├── reconcile/                # Reconciliation
│   │   │   ├── reconcile.controllers.ts
│   │   │   ├── reconcile.services.ts
│   │   │   ├── reconcile.routes.ts
│   │   │   └── reconcile.modules.ts
│   │   │
│   │   └── root/                     # Root aggregator
│   │       └── root.modules.ts       # Aggregates all modules
│   │
│   ├── app.ts                        # Express app setup
│   └── server.ts                     # Server entry point
│
└── drizzle/                          # Generated migrations
```

---

## 🏗️ Architecture Pattern

### **Domain Module Structure** (Consistent with Auth & Users)

Each domain (balance, entries, reconcile, core) follows the **same 4-file pattern**:

```
services/ledger/src/services/{domain}/
├── {domain}.controllers.ts          # HTTP request handlers
├── {domain}.services.ts              # Business logic
├── {domain}.routes.ts                # Route definitions
└── {domain}.modules.ts               # Module aggregator
```

### **Root Module** (Aggregates All Domains)

```typescript
// services/ledger/src/services/root/root.modules.ts

class RootModules {
  public balance: BalanceModules; // Balance domain
  public entries: EntriesModules; // Entries domain
  public reconcile: ReconcileModules; // Reconcile domain
  public core: CoreModules; // Core domain

  initializeRoutes() {
    router.use('/balance', this.balance.routes.routes());
    router.use('/entries', this.entries.routes.routes());
    router.use('/reconcile', this.reconcile.routes.routes());
    router.use('/core', this.core.routes.routes());
  }
}
```

### **App.ts** (Uses Root Module)

```typescript
// services/ledger/src/app.ts

const root = new RootModules();
ledger_app.use('/api/v1', root.routes());

// All routes automatically registered!
```

---

## 🎯 Module Responsibilities

### **Core Module** (`services/core/`)

**Responsibility:** Main ledger operations

- `core.services.ts`:
  - `createDoubleEntry()` - Creates double-entry transactions
  - `createSingleEntry()` - Internal: creates single entry
  - `validateDoubleEntry()` - Validates double-entry rules
  - `getCurrentBalanceAndSequence()` - Gets current state
  - `updateCachedBalance()` - Updates balance cache

**Why separate?**

- Core ledger logic isolated
- Can be used by event subscribers
- Other modules can reference it

### **Balance Module** (`services/balance/`)

**Responsibility:** Balance queries and reconciliation

- `balance.services.ts`:
  - `getBalance()` - Get current balance
  - `getUserBalances()` - All user balances
  - `computeBalance()` - Compute from ledger
  - `getHistoricalBalance()` - Point-in-time balance
  - `getSystemTotalBalance()` - System-wide total
  - `reconcileAccount()` - Verify account
  - `reconcileAllAccounts()` - System-wide reconciliation

**Routes:**

- `GET /api/v1/balance/:accountId`
- `GET /api/v1/balance/user/:userId`
- `GET /api/v1/balance/:accountId/historical`
- `GET /api/v1/balance/system/total`

### **Entries Module** (`services/entries/`)

**Responsibility:** Transaction history queries

- `entries.services.ts`:
  - `getAccountHistory()` - Paginated history
  - `getTransactionEntries()` - Get transaction by ID

**Routes:**

- `GET /api/v1/entries/:accountId`
- `GET /api/v1/entries/transaction/:entryId`

### **Reconcile Module** (`services/reconcile/`)

**Responsibility:** Balance reconciliation

- `reconcile.services.ts`:
  - Delegates to BalanceServices for reconciliation

**Routes:**

- `GET /api/v1/reconcile/:accountId`
- `POST /api/v1/reconcile/all`

---

## 📊 Comparison with Other Services

### **Auth Service Structure**

```
services/auth/src/
└── services/
    ├── auth/
    │   ├── auth.controllers.ts
    │   ├── auth.services.ts
    │   ├── auth.routes.ts
    │   └── auth.modules.ts
    └── root/
        └── root.modules.ts
```

### **Users Service Structure**

```
services/users/src/
└── services/
    ├── profile/
    │   ├── profile.controllers.ts
    │   ├── profile.services.ts
    │   ├── profile.routes.ts
    │   └── profile.modules.ts
    └── root/
        └── root.modules.ts
```

### **Ledger Service Structure** ✅

```
services/ledger/src/
└── services/
    ├── core/              # Main ledger logic
    │   ├── core.controllers.ts
    │   ├── core.services.ts
    │   ├── core.routes.ts
    │   └── core.modules.ts
    ├── balance/           # Balance queries
    │   ├── balance.controllers.ts
    │   ├── balance.services.ts
    │   ├── balance.routes.ts
    │   └── balance.modules.ts
    ├── entries/           # Transaction history
    │   ├── entries.controllers.ts
    │   ├── entries.services.ts
    │   ├── entries.routes.ts
    │   └── entries.modules.ts
    ├── reconcile/         # Reconciliation
    │   ├── reconcile.controllers.ts
    │   ├── reconcile.services.ts
    │   ├── reconcile.routes.ts
    │   └── reconcile.modules.ts
    └── root/
        └── root.modules.ts
```

**✅ All three services follow the same pattern!**

---

## 🔄 Request Flow

### **Example: Get Balance**

```
1. HTTP Request
   GET /api/v1/balance/alice_123:wallet:checking:usd
   ↓
2. app.ts routes to root module
   /api/v1 → root.routes()
   ↓
3. Root module routes to balance module
   /balance → balance.routes.routes()
   ↓
4. Balance routes to controller
   /:accountId → balance.controllers.getBalance()
   ↓
5. Controller calls service
   balance.services.getBalance()
   ↓
6. Service queries database
   SELECT balance FROM account_balances...
   ↓
7. Response returned up the chain
   { success: true, data: { balance: "1150.0000" }}
```

---

## 🎯 Benefits of This Structure

### ✅ **Consistency**

- Every service follows same pattern
- Easy for developers to navigate
- Predictable file locations

### ✅ **Modularity**

- Each domain is self-contained
- Controllers → Services → Database
- Clear separation of concerns

### ✅ **Scalability**

- Easy to add new domains
- Just create new folder with 4 files
- Root module automatically aggregates

### ✅ **Testability**

- Each layer can be tested independently
- Mock services in controllers
- Mock database in services

### ✅ **Maintainability**

- Related code grouped together
- Easy to find files
- Clear ownership

---

## 📝 Adding New Domain Module

To add a new domain (e.g., "statements"):

```bash
# 1. Create domain folder
mkdir -p src/services/statements

# 2. Create 4 files
touch src/services/statements/statements.controllers.ts
touch src/services/statements/statements.services.ts
touch src/services/statements/statements.routes.ts
touch src/services/statements/statements.modules.ts

# 3. Implement files following the pattern

# 4. Add to root module
# Edit: src/services/root/root.modules.ts
# Add: public readonly statements: StatementsModules;
# Add: this.statements = new StatementsModules();
# Add: this.router.use('/statements', this.statements.routes.routes());
```

**Done! New domain integrated!**

---

## ✅ Structure is Now Correct!

The ledger service now follows the **exact same architectural pattern** as auth and users services:

- ✅ `services/` contains domain modules
- ✅ Each domain has: controllers, services, routes, modules
- ✅ `root.modules.ts` aggregates all domains
- ✅ `app.ts` uses root module
- ✅ No standalone `api/` folder
- ✅ Consistent with rest of codebase

**Ready for review!** 🚀



