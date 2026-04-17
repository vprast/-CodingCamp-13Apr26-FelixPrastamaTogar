# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a single `index.html` file containing all HTML, CSS, and Vanilla JavaScript (ES8 or earlier). The app uses `localStorage` for persistence, the Canvas API for the pie chart, and an event-driven module pattern (IIFEs + pub/sub) for state management. No build tools, no frameworks, no external libraries.

## Tasks

- [x] 1. Scaffold the single-file HTML structure and CSS foundation
  - Create `index.html` with semantic HTML skeleton: header, main content area, and all section containers (transaction form, balance display, pie chart canvas, transaction list, monthly summary, category manager)
  - Write base CSS custom properties for both light and dark themes (colors, spacing, typography)
  - Add CSS media queries for single-column (< 768px) and two-column (≥ 768px) layouts
  - Include the dark/light mode `data-theme` attribute hook on `<html>` or `<body>`
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Implement the Storage Module
  - [x] 2.1 Write the `StorageModule` IIFE with `save(key, value)`, `load(key)`, and `isAvailable()` methods
    - Wrap all `localStorage` calls in try/catch; return `null` on read errors; log parse errors to console
    - `isAvailable()` tests by writing and removing a sentinel key
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 2.2 Write property test for full state restore round-trip
    - **Property 17: Full State Restore Round-Trip**
    - **Validates: Requirements 9.3, 2.5**

  - [ ]* 2.3 Write unit tests for StorageModule
    - Test `load()` with malformed JSON returns `null`
    - Test `isAvailable()` returns `false` when `localStorage` throws on `setItem`
    - _Requirements: 9.4_

- [ ] 3. Implement the State Module and data models
  - [x] 3.1 Write the `State` IIFE with `transactions[]`, `categories[]`, and `theme` fields
    - Implement `addTransaction(tx)`, `deleteTransaction(id)`, `addCategory(name)`, `setTheme(theme)`
    - Implement `getBalance()` as sum of all transaction amounts
    - Implement `getSpendingByCategory()` returning `{ category: totalAmount }`
    - Implement `getMonthlySummary()` grouping transactions by calendar month, sorted descending
    - Initialize default categories: `["Food", "Transport", "Housing", "Entertainment", "Health", "Other"]`
    - Transaction `id` generated as `Date.now().toString(36) + Math.random().toString(36).slice(2)`
    - _Requirements: 1.2, 2.1, 3.1, 4.1, 5.1, 6.1, 9.3_

  - [ ]* 3.2 Write property test for balance sum invariant
    - **Property 11: Balance Equals Sum Invariant**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ]* 3.3 Write property test for transaction list ordering invariant
    - **Property 8: Transaction List Ordering Invariant**
    - **Validates: Requirements 3.1**

  - [ ]* 3.4 Write property test for monthly summary grouping and aggregation
    - **Property 14: Monthly Summary Grouping and Aggregation**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 3.5 Write unit tests for State Module
    - Test `getBalance()` with zero, one, and many transactions
    - Test `getMonthlySummary()` with transactions spanning multiple months and years
    - _Requirements: 4.4, 6.1_

- [ ] 4. Implement the Validation Module
  - [x] 4.1 Write the `Validation` IIFE with `validateItemName`, `validateAmount`, `validateCategory`, and `validateCategoryName` pure functions
    - Each returns `{ valid: boolean, error: string }`
    - `validateItemName`: reject empty or whitespace-only strings
    - `validateAmount`: reject zero, negative, or non-numeric values
    - `validateCategory`: reject if not present in the categories list
    - `validateCategoryName`: reject empty/whitespace-only; reject case-insensitive duplicates
    - _Requirements: 1.3, 1.4, 1.5, 2.3, 2.4_

  - [ ]* 4.2 Write property test for invalid item name rejection
    - **Property 2: Invalid Item Name Rejected**
    - **Validates: Requirements 1.3**

  - [ ]* 4.3 Write property test for invalid amount rejection
    - **Property 3: Invalid Amount Rejected**
    - **Validates: Requirements 1.4**

  - [ ]* 4.4 Write property test for duplicate category rejection
    - **Property 6: Duplicate Category Rejected**
    - **Validates: Requirements 2.3**

  - [ ]* 4.5 Write property test for empty category name rejection
    - **Property 7: Empty Category Name Rejected**
    - **Validates: Requirements 2.4**

  - [ ]* 4.6 Write unit tests for Validation Module
    - Test each function with boundary values: empty string, `"0"`, `"-1"`, `"abc"`, whitespace-only strings
    - _Requirements: 1.3, 1.4, 2.3, 2.4_

- [ ] 5. Checkpoint — Ensure Storage, State, and Validation modules are wired and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement the TransactionForm UI component
  - [x] 6.1 Write the `TransactionForm` component that renders the input form into its container
    - Render text field (item name), numeric field (amount), category `<select>`, and submit button
    - Populate the `<select>` from the current categories list
    - Display inline validation error messages below each field on failed submission
    - Clear all fields after successful submission
    - Call `AppController.handleAddTransaction(formData)` on submit
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 6.2 Write property test for valid transaction add round-trip
    - **Property 1: Valid Transaction Add Round-Trip**
    - **Validates: Requirements 1.2, 9.1**

  - [ ]* 6.3 Write property test for form cleared after successful submission
    - **Property 4: Form Cleared After Successful Submission**
    - **Validates: Requirements 1.6**

- [ ] 7. Implement the CategoryManager UI component
  - [x] 7.1 Write the `CategoryManager` component that renders a text input and add button for custom categories
    - Display inline error for duplicate or empty category names
    - Call `AppController.handleAddCategory(name)` on submit
    - Re-render the category list and update the TransactionForm's `<select>` after a successful add
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 7.2 Write property test for valid category add round-trip
    - **Property 5: Valid Category Add Round-Trip**
    - **Validates: Requirements 2.2, 9.2**

- [ ] 8. Implement the TransactionList and BalanceDisplay UI components
  - [x] 8.1 Write the `TransactionList` component that renders all transactions ordered most-recent-first
    - Each entry shows item name, amount, category, and a delete button
    - Delete button calls `AppController.handleDeleteTransaction(id)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 8.2 Write property test for transaction rendering completeness
    - **Property 10: Transaction Rendering Completeness**
    - **Validates: Requirements 3.4**

  - [ ]* 8.3 Write property test for transaction delete round-trip
    - **Property 9: Transaction Delete Round-Trip**
    - **Validates: Requirements 3.3**

  - [x] 8.4 Write the `BalanceDisplay` component that renders the current balance
    - Reads `State.getBalance()` and writes the formatted value into its container element
    - _Requirements: 4.1, 4.4_

- [ ] 9. Implement the PieChart UI component
  - [x] 9.1 Write the `PieChart` component that renders a pie chart onto a `<canvas>` element
    - Use `State.getSpendingByCategory()` to compute slice angles: `(amount / grandTotal) * 2 * Math.PI`
    - Assign colors from `CHART_COLORS` palette by category index modulo 12
    - Draw a legend (category name + color swatch) below or beside the canvas
    - Display "No data yet" centered on the canvas when there are no transactions
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 9.2 Write property test for pie chart angle proportionality
    - **Property 12: Pie Chart Angle Proportionality**
    - **Validates: Requirements 5.1**

  - [ ]* 9.3 Write property test for pie chart legend completeness
    - **Property 13: Pie Chart Legend Completeness**
    - **Validates: Requirements 5.5**

- [ ] 10. Implement the MonthlySummary UI component
  - [x] 10.1 Write the `MonthlySummary` component that renders monthly totals from `State.getMonthlySummary()`
    - Display each entry as a row with the month/year label (e.g., "January 2025") and total amount
    - Show only months that have at least one transaction
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 10.2 Write property test for monthly summary rendering completeness
    - **Property 15: Monthly Summary Rendering Completeness**
    - **Validates: Requirements 6.3**

- [ ] 11. Implement the ThemeToggle UI component and dark/light mode CSS
  - [x] 11.1 Write the `ThemeToggle` component that renders a toggle button/switch
    - On click, call `AppController.handleThemeToggle()`
    - Apply the active theme by setting `data-theme` on `<html>` or `<body>`
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 11.2 Write property test for theme toggle round-trip
    - **Property 16: Theme Toggle Round-Trip**
    - **Validates: Requirements 7.4, 7.5**

- [ ] 12. Implement the App Controller and wire all modules together
  - [x] 12.1 Write the `AppController` IIFE with `init()`, `handleAddTransaction()`, `handleDeleteTransaction()`, `handleAddCategory()`, `handleThemeToggle()`, and `handleViewChange()` methods
    - `init()`: check `StorageModule.isAvailable()`, show storage-unavailable banner if needed; load state from `localStorage`; render all UI components; restore saved theme
    - Each handler: validate input via `Validation`, update `State`, persist via `StorageModule`, re-render affected components
    - `handleViewChange()`: toggle visibility between main view and monthly summary section
    - _Requirements: 1.2, 2.2, 3.3, 4.2, 4.3, 5.2, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4_

  - [x] 12.2 Add the `DOMContentLoaded` event listener that calls `AppController.init()`
    - _Requirements: 9.3, 10.3_

- [ ] 13. Final checkpoint — Ensure all tests pass and the app works end-to-end
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the app loads without errors when `localStorage` is empty (zero balance, default categories, light theme)
  - Verify the app loads without errors when `localStorage` contains pre-seeded data (full state restoration)
  - Verify the storage-unavailable banner appears when `localStorage` is blocked

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All code lives in a single `index.html` file — no separate `.js` or `.css` files
- Each task references specific requirements for traceability
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) loaded via CDN or local copy; tag format: `// Feature: expense-budget-visualizer, Property N: <property_text>`
- Checkpoints ensure incremental validation before proceeding to the next phase
