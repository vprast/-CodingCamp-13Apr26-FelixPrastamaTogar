# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly web application that helps individuals track daily spending, monitor budgets, and understand spending habits. Built with plain HTML, CSS, and Vanilla JavaScript, it runs entirely in the browser with no backend — all data is persisted via the browser's Local Storage API. The app provides real-time balance updates, category-based pie chart visualization, a monthly summary view, and a dark/light mode toggle, all within a responsive design that works across mobile and desktop.

## Glossary

- **App**: The Expense & Budget Visualizer web application
- **Transaction**: A single expense entry consisting of an item name, an amount, and a category
- **Category**: A label used to group transactions (e.g., Food, Transport); can be a default or user-created custom category
- **Balance**: The running total calculated from all transactions currently stored
- **Pie_Chart**: A circular chart that visually represents the proportion of spending per category
- **Monthly_Summary**: A view that aggregates and displays total spending grouped by calendar month
- **Local_Storage**: The browser's built-in client-side key-value storage API
- **Dark_Mode**: A display theme using dark background colors and light text
- **Light_Mode**: A display theme using light background colors and dark text
- **Transaction_List**: The scrollable UI component that displays all stored transactions

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to add a transaction with an item name, amount, and category, so that I can record my daily expenses.

#### Acceptance Criteria

1. THE App SHALL provide an input form containing a text field for item name, a numeric field for amount, and a category selector.
2. WHEN the user submits the form with a valid item name, a positive numeric amount, and a selected category, THE App SHALL save the transaction to Local_Storage and display it in the Transaction_List.
3. IF the user submits the form with an empty item name, THEN THE App SHALL display a validation error message and SHALL NOT save the transaction.
4. IF the user submits the form with a non-positive or non-numeric amount, THEN THE App SHALL display a validation error message and SHALL NOT save the transaction.
5. IF the user submits the form without selecting a category, THEN THE App SHALL display a validation error message and SHALL NOT save the transaction.
6. WHEN a transaction is successfully saved, THE App SHALL clear the input form fields.

---

### Requirement 2: Manage Custom Categories

**User Story:** As a user, I want to create custom categories, so that I can organize my expenses in a way that fits my lifestyle.

#### Acceptance Criteria

1. THE App SHALL provide a set of default categories (e.g., Food, Transport, Housing, Entertainment, Health, Other).
2. WHEN the user creates a new custom category with a unique, non-empty name, THE App SHALL save the category to Local_Storage and make it available in the category selector.
3. IF the user attempts to create a category with a name that already exists (case-insensitive), THEN THE App SHALL display an error message and SHALL NOT create a duplicate category.
4. IF the user attempts to create a category with an empty name, THEN THE App SHALL display an error message and SHALL NOT save the category.
5. THE App SHALL persist all custom categories across page reloads via Local_Storage.

---

### Requirement 3: View and Delete Transactions

**User Story:** As a user, I want to view all my transactions in a list and delete entries, so that I can review and correct my expense records.

#### Acceptance Criteria

1. THE App SHALL display all stored transactions in the Transaction_List, ordered from most recent to oldest.
2. WHEN the Transaction_List contains more entries than the visible area, THE App SHALL allow the user to scroll through the list.
3. WHEN the user deletes a transaction, THE App SHALL remove it from Local_Storage and remove it from the Transaction_List without requiring a page reload.
4. THE App SHALL display each transaction entry showing the item name, amount, and category.

---

### Requirement 4: Real-Time Balance Calculation

**User Story:** As a user, I want to see my total balance update automatically as I add or remove transactions, so that I always know my current spending total.

#### Acceptance Criteria

1. THE App SHALL display the current Balance as the sum of all transaction amounts stored in Local_Storage.
2. WHEN a transaction is added, THE App SHALL update the displayed Balance immediately without requiring a page reload.
3. WHEN a transaction is deleted, THE App SHALL update the displayed Balance immediately without requiring a page reload.
4. WHEN Local_Storage contains no transactions, THE App SHALL display a Balance of zero.

---

### Requirement 5: Spending Pie Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can quickly understand how my expenses are distributed.

#### Acceptance Criteria

1. THE App SHALL render a Pie_Chart that displays each category's share of total spending as a proportional segment.
2. WHEN a transaction is added or deleted, THE App SHALL update the Pie_Chart immediately to reflect the current data.
3. WHEN Local_Storage contains no transactions, THE App SHALL display an empty or placeholder state for the Pie_Chart.
4. THE App SHALL render the Pie_Chart using only Vanilla JavaScript and the HTML Canvas API or inline SVG, without external charting libraries.
5. THE Pie_Chart SHALL display a legend identifying each category and its corresponding color.

---

### Requirement 6: Monthly Summary View

**User Story:** As a user, I want to view a monthly summary of my spending, so that I can track how my expenses change over time.

#### Acceptance Criteria

1. THE App SHALL provide a Monthly_Summary view that groups transactions by calendar month and displays the total spending for each month.
2. WHEN the user navigates to the Monthly_Summary view, THE App SHALL display each month for which at least one transaction exists.
3. THE Monthly_Summary SHALL display each month's total spending amount alongside the month and year label.
4. WHEN a transaction is added or deleted, THE Monthly_Summary SHALL reflect the updated totals the next time the view is displayed.

---

### Requirement 7: Dark/Light Mode Toggle

**User Story:** As a user, I want to toggle between dark and light mode, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control that switches the display between Dark_Mode and Light_Mode.
2. WHEN the user activates Dark_Mode, THE App SHALL apply a dark background with light text across all UI components.
3. WHEN the user activates Light_Mode, THE App SHALL apply a light background with dark text across all UI components.
4. WHEN the user toggles the theme, THE App SHALL save the selected theme preference to Local_Storage.
5. WHEN the App loads, THE App SHALL restore the previously saved theme preference from Local_Storage.

---

### Requirement 8: Responsive Design

**User Story:** As a user, I want the app to work well on both mobile and desktop devices, so that I can track expenses from any device.

#### Acceptance Criteria

1. THE App SHALL render a usable layout on viewport widths from 320px to 2560px.
2. WHILE the viewport width is less than 768px, THE App SHALL display a single-column layout optimized for touch interaction.
3. WHILE the viewport width is 768px or greater, THE App SHALL display a multi-column layout that makes use of the available screen space.
4. THE App SHALL use CSS media queries to adapt the layout without JavaScript-based resize logic.

---

### Requirement 9: Data Persistence

**User Story:** As a user, I want my transactions and settings to be saved automatically, so that my data is available when I return to the app.

#### Acceptance Criteria

1. THE App SHALL save all transactions to Local_Storage immediately when a transaction is added or deleted.
2. THE App SHALL save all custom categories to Local_Storage immediately when a category is created.
3. WHEN the App loads, THE App SHALL read all transactions and categories from Local_Storage and restore the full application state.
4. IF Local_Storage is unavailable or throws an error, THEN THE App SHALL display a warning message informing the user that data will not be persisted.

---

### Requirement 10: Browser Compatibility

**User Story:** As a developer, I want the app to work across modern browsers, so that users are not restricted to a specific browser.

#### Acceptance Criteria

1. THE App SHALL function correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari.
2. THE App SHALL use only standard HTML5, CSS3, and ECMAScript 2017 (ES8) or earlier JavaScript features to ensure broad compatibility.
3. THE App SHALL operate as a standalone web application loadable by opening the HTML file directly in a browser without a local server.
