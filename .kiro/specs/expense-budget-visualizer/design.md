# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-file, client-side web application built with plain HTML, CSS, and Vanilla JavaScript (ES8 or earlier). It runs entirely in the browser with no backend — all data is persisted via the browser's `localStorage` API. The app allows users to record daily expenses, view a real-time balance, explore spending via a pie chart, review a monthly summary, and toggle between dark and light themes.

### Key Design Decisions

- **Single HTML file**: All HTML, CSS, and JavaScript are bundled into one `index.html` file so the app can be opened directly in a browser without a local server.
- **No frameworks or external libraries**: Vanilla JS only. The pie chart is rendered with the HTML Canvas API.
- **LocalStorage as the data layer**: All state (transactions, categories, theme preference) is serialized to JSON and stored in `localStorage`.
- **Module pattern via IIFEs**: Code is organized into logical modules using Immediately Invoked Function Expressions to avoid polluting the global scope while staying ES8-compatible.
- **Event-driven UI updates**: A simple pub/sub pattern drives re-renders whenever state changes, keeping the UI in sync without a virtual DOM.

---

## Architecture

The application follows a simple layered architecture:

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer (DOM)                    │
│  TransactionForm | TransactionList | BalanceDisplay  │
│  PieChart | MonthlySummary | ThemeToggle             │
└───────────────────┬─────────────────────────────────┘
                    │ DOM events / render calls
┌───────────────────▼─────────────────────────────────┐
│                  App Controller                      │
│  Orchestrates state changes, triggers re-renders     │
└───────────────────┬─────────────────────────────────┘
                    │ read / write
┌───────────────────▼─────────────────────────────────┐
│                  State Module                        │
│  In-memory state: transactions[], categories[],      │
│  theme preference                                    │
└───────────────────┬─────────────────────────────────┘
                    │ serialize / deserialize
┌───────────────────▼─────────────────────────────────┐
│               Storage Module (localStorage)          │
│  STORAGE_KEYS: transactions, categories, theme       │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. User interacts with a UI component (e.g., submits the add-transaction form).
2. The UI component calls the App Controller with the action and payload.
3. The App Controller validates input, updates in-memory State, and calls the Storage Module to persist.
4. The App Controller triggers re-renders of all affected UI components.

---

## Components and Interfaces

### Storage Module

Responsible for all `localStorage` interactions. Wraps reads/writes in try/catch to handle unavailability.

```javascript
StorageModule = {
  save(key, value): void,       // JSON.stringify and store
  load(key): any | null,        // JSON.parse and return, or null on error
  isAvailable(): boolean        // test localStorage availability
}
```

### State Module

Holds the canonical in-memory application state. Initialized from `localStorage` on app load.

```javascript
State = {
  transactions: Transaction[],
  categories: string[],
  theme: 'light' | 'dark',

  addTransaction(tx: Transaction): void,
  deleteTransaction(id: string): void,
  addCategory(name: string): void,
  setTheme(theme: string): void,
  getBalance(): number,
  getSpendingByCategory(): { [category: string]: number },
  getMonthlySummary(): { label: string, total: number }[]
}
```

### App Controller

Wires together user actions, state mutations, persistence, and UI re-renders.

```javascript
AppController = {
  init(): void,                          // load state, render initial UI
  handleAddTransaction(formData): void,  // validate, update state, re-render
  handleDeleteTransaction(id): void,     // update state, re-render
  handleAddCategory(name): void,         // validate, update state, re-render
  handleThemeToggle(): void,             // toggle theme, persist, re-render
  handleViewChange(view): void           // switch between main/monthly views
}
```

### UI Components

Each component exposes a `render(container, data)` function that writes to the DOM.

| Component | Responsibility |
|---|---|
| `TransactionForm` | Input form for item name, amount, category; inline validation errors |
| `TransactionList` | Scrollable list of all transactions with delete buttons |
| `BalanceDisplay` | Shows the current total balance |
| `PieChart` | Canvas-based pie chart with legend |
| `MonthlySummary` | Table/list of monthly totals |
| `ThemeToggle` | Button/switch to toggle dark/light mode |
| `CategoryManager` | Input + list for creating custom categories |

### Validation Module

Pure functions for input validation, returning `{ valid: boolean, error: string }`.

```javascript
Validation = {
  validateItemName(name: string): ValidationResult,
  validateAmount(amount: string): ValidationResult,
  validateCategory(category: string, categories: string[]): ValidationResult,
  validateCategoryName(name: string, existing: string[]): ValidationResult
}
```

---

## Data Models

### Transaction

```javascript
{
  id: string,          // UUID-like: Date.now() + Math.random() string
  name: string,        // item name, non-empty
  amount: number,      // positive number
  category: string,    // must exist in categories list
  date: string         // ISO 8601 date string (new Date().toISOString())
}
```

### AppState (persisted to localStorage)

```javascript
// localStorage key: "evb_transactions"
Transaction[]

// localStorage key: "evb_categories"
string[]   // e.g. ["Food", "Transport", "Housing", "Entertainment", "Health", "Other", ...custom]

// localStorage key: "evb_theme"
"light" | "dark"
```

### Default Categories

```javascript
const DEFAULT_CATEGORIES = ["Food", "Transport", "Housing", "Entertainment", "Health", "Other"];
```

### Monthly Summary Entry

```javascript
{
  label: string,   // e.g. "January 2025"
  year: number,
  month: number,   // 0-indexed (Date.getMonth())
  total: number    // sum of all transaction amounts in that month
}
```

---

## Pie Chart Implementation

The pie chart is rendered on an HTML `<canvas>` element using the 2D Canvas API. No external libraries are used.

### Algorithm

```
1. Compute spendingByCategory = { category: totalAmount }
2. Compute grandTotal = sum of all amounts
3. For each category with amount > 0:
   a. Compute slice angle = (amount / grandTotal) * 2 * Math.PI
   b. Draw arc from currentAngle to currentAngle + sliceAngle
   c. Fill with a deterministic color from a fixed palette
   d. Advance currentAngle
4. Draw legend below or beside the chart
```

### Color Palette

A fixed array of 12 accessible colors is assigned to categories by index (modulo 12), ensuring consistent colors across re-renders.

```javascript
const CHART_COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7",
  "#9c755f", "#bab0ac", "#d37295", "#a0cbe8"
];
```

### Empty State

When there are no transactions, the canvas displays a centered placeholder message: "No data yet".

---

## Responsive Layout

### Mobile (< 768px) — Single Column

```
┌──────────────────────┐
│  Header + Theme Toggle│
├──────────────────────┤
│  Balance Display      │
├──────────────────────┤
│  Transaction Form     │
├──────────────────────┤
│  Pie Chart            │
├──────────────────────┤
│  Transaction List     │
├──────────────────────┤
│  Monthly Summary Tab  │
└──────────────────────┘
```

### Desktop (≥ 768px) — Two Column

```
┌──────────────────────────────────────────────┐
│  Header                        Theme Toggle   │
├─────────────────────┬────────────────────────┤
│  Transaction Form   │  Balance Display        │
│  Category Manager   │  Pie Chart              │
│                     │  Transaction List       │
├─────────────────────┴────────────────────────┤
│  Monthly Summary (full width tab/section)     │
└──────────────────────────────────────────────┘
```

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable | Show a persistent banner: "Storage unavailable — data will not be saved." App continues to function in-memory. |
| Empty item name | Inline error below the name field; form not submitted |
| Non-positive / non-numeric amount | Inline error below the amount field; form not submitted |
| No category selected | Inline error below the category selector; form not submitted |
| Duplicate category name | Inline error in the category manager; category not created |
| Empty category name | Inline error in the category manager; category not created |
| Corrupted localStorage data | `JSON.parse` errors caught; treat as empty state and log to console |

---

### Integration / Smoke Tests

- Verify the app loads without errors when `localStorage` is empty.
- Verify the app loads without errors when `localStorage` contains pre-seeded data.
- Verify the app displays the storage-unavailable banner when `localStorage` is blocked.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Valid Transaction Add Round-Trip

*For any* valid transaction (non-empty name, positive numeric amount, existing category), adding it to the app state SHALL result in the transaction being present in the in-memory transaction list and persisted to `localStorage`.

**Validates: Requirements 1.2, 9.1**

---

### Property 2: Invalid Item Name Rejected

*For any* string composed entirely of whitespace characters (or the empty string), submitting it as an item name SHALL be rejected by validation, and the transaction list SHALL remain unchanged.

**Validates: Requirements 1.3**

---

### Property 3: Invalid Amount Rejected

*For any* value that is zero, negative, or non-numeric, submitting it as a transaction amount SHALL be rejected by validation, and the transaction list SHALL remain unchanged.

**Validates: Requirements 1.4**

---

### Property 4: Form Cleared After Successful Submission

*For any* valid transaction submitted through the form, all form input fields (name, amount, category) SHALL be empty immediately after the transaction is successfully saved.

**Validates: Requirements 1.6**

---

### Property 5: Valid Category Add Round-Trip

*For any* non-empty, unique category name, adding it SHALL result in the category being present in the in-memory categories list and persisted to `localStorage`.

**Validates: Requirements 2.2, 9.2**

---

### Property 6: Duplicate Category Rejected

*For any* category name already present in the categories list, attempting to add any case-variant of that name SHALL be rejected, and the categories list SHALL not contain a duplicate entry.

**Validates: Requirements 2.3**

---

### Property 7: Empty Category Name Rejected

*For any* string composed entirely of whitespace characters (or the empty string), submitting it as a category name SHALL be rejected, and the categories list SHALL remain unchanged.

**Validates: Requirements 2.4**

---

### Property 8: Transaction List Ordering Invariant

*For any* set of transactions with varying dates, the transaction list returned by the state module SHALL always be ordered from most recent to oldest (descending by date).

**Validates: Requirements 3.1**

---

### Property 9: Transaction Delete Round-Trip

*For any* non-empty transaction list, deleting a transaction by its ID SHALL result in that transaction being absent from both the in-memory state and `localStorage`, while all other transactions remain present.

**Validates: Requirements 3.3**

---

### Property 10: Transaction Rendering Completeness

*For any* transaction object, the rendered HTML string for that transaction SHALL contain the item name, the amount, and the category.

**Validates: Requirements 3.4**

---

### Property 11: Balance Equals Sum Invariant

*For any* set of transactions (including the empty set), `getBalance()` SHALL return a value exactly equal to the arithmetic sum of all transaction amounts. This invariant holds before and after any add or delete operation.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

---

### Property 12: Pie Chart Angle Proportionality

*For any* non-empty set of transactions grouped by category, the computed arc angle for each category SHALL equal `(categoryTotal / grandTotal) * 2 * Math.PI`, and the sum of all arc angles SHALL equal `2 * Math.PI` (within floating-point tolerance).

**Validates: Requirements 5.1**

---

### Property 13: Pie Chart Legend Completeness

*For any* spending-by-category map with at least one entry, the generated legend data SHALL contain an entry for every category that has a non-zero spending total.

**Validates: Requirements 5.5**

---

### Property 14: Monthly Summary Grouping and Aggregation

*For any* set of transactions with varying dates, `getMonthlySummary()` SHALL return exactly one entry per distinct calendar month represented in the transactions, and each entry's total SHALL equal the sum of all transaction amounts in that month.

**Validates: Requirements 6.1, 6.2**

---

### Property 15: Monthly Summary Rendering Completeness

*For any* monthly summary entry, the rendered output SHALL contain both the month/year label (e.g., "January 2025") and the total spending amount for that month.

**Validates: Requirements 6.3**

---

### Property 16: Theme Toggle Round-Trip

*For any* initial theme value (`'light'` or `'dark'`), toggling the theme SHALL update `localStorage` to the new theme value, and reloading the application state from `localStorage` SHALL restore that theme value.

**Validates: Requirements 7.4, 7.5**

---

### Property 17: Full State Restore Round-Trip

*For any* combination of transactions, categories, and theme preference saved to `localStorage`, initializing the application state by reading from `localStorage` SHALL produce an in-memory state that is equivalent to the saved state (same transactions, same categories, same theme).

**Validates: Requirements 9.3, 2.5**

---

## Testing Strategy (Detailed)

### Property-Based Testing Library

Use [fast-check](https://github.com/dubzzz/fast-check) (ES module compatible, no build step required via CDN or local copy). Each property test runs a minimum of **100 iterations**.

Tag format for each test:
```
// Feature: expense-budget-visualizer, Property N: <property_text>
```

### Property Test Mapping

| Property | fast-check Arbitraries |
|---|---|
| P1: Valid transaction add | `fc.record({ name: fc.string({minLength:1}).filter(s => s.trim()), amount: fc.float({min:0.01, max:9999}), category: fc.constantFrom(...categories) })` |
| P2: Invalid item name | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| P3: Invalid amount | `fc.oneof(fc.float({max:0}), fc.string().filter(s => isNaN(Number(s))))` |
| P4: Form cleared | Same as P1 |
| P5: Valid category add | `fc.string({minLength:1}).filter(s => s.trim())` |
| P6: Duplicate category | `fc.string({minLength:1}).map(s => [s, s.toUpperCase(), s.toLowerCase()])` |
| P7: Empty category name | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| P8: Transaction ordering | `fc.array(fc.record({ date: fc.date() }), {minLength:2})` |
| P9: Transaction delete | `fc.array(transactionArb, {minLength:1})` + `fc.nat()` for index |
| P10: Transaction rendering | `fc.record({ name: fc.string({minLength:1}), amount: fc.float({min:0.01}), category: fc.string({minLength:1}) })` |
| P11: Balance sum | `fc.array(fc.float({min:0.01, max:9999}))` |
| P12: Pie chart angles | `fc.dictionary(fc.string({minLength:1}), fc.float({min:0.01}))` |
| P13: Legend completeness | Same as P12 |
| P14: Monthly summary | `fc.array(fc.record({ amount: fc.float({min:0.01}), date: fc.date() }), {minLength:1})` |
| P15: Monthly rendering | `fc.record({ label: fc.string({minLength:1}), total: fc.float({min:0}) })` |
| P16: Theme round-trip | `fc.constantFrom('light', 'dark')` |
| P17: Full state restore | `fc.record({ transactions: fc.array(transactionArb), categories: fc.array(fc.string({minLength:1})), theme: fc.constantFrom('light','dark') })` |

### Unit Test Coverage

Focus unit tests on:
- Each validation function with specific boundary values (empty string, `"0"`, `"-1"`, `"abc"`)
- `getBalance()` with zero transactions, one transaction, many transactions
- `getMonthlySummary()` with transactions spanning multiple months and years
- `StorageModule.load()` when `localStorage` contains malformed JSON
- `StorageModule.isAvailable()` when `localStorage` throws on `setItem`

### Smoke Tests

- Open `index.html` directly in Chrome, Firefox, Edge, Safari — verify no console errors
- Open with empty `localStorage` — verify zero balance, default categories, light theme
- Open with pre-seeded `localStorage` — verify full state restoration
- Block `localStorage` (e.g., private browsing with storage blocked) — verify warning banner appears
