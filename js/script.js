// =============================================
// StorageModule — wraps all localStorage I/O
// Requirements: 9.1, 9.2, 9.3, 9.4
// =============================================
var StorageModule = (function () {
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Storage may be full or unavailable — silently fail
    }
  }

  function load(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) { return null; }
      return JSON.parse(raw);
    } catch (e) {
      console.error('StorageModule.load: failed to parse value for key "' + key + '"', e);
      return null;
    }
  }

  function isAvailable() {
    var sentinel = '__storage_test__';
    try {
      localStorage.setItem(sentinel, '1');
      localStorage.removeItem(sentinel);
      return true;
    } catch (e) {
      return false;
    }
  }

  return { save: save, load: load, isAvailable: isAvailable };
})();

// =============================================
// State Module — in-memory application state
// Requirements: 1.2, 2.1, 3.1, 4.1, 5.1, 6.1, 9.3
// =============================================
var State = (function () {
  var DEFAULT_CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Other'];

  var STORAGE_KEYS = {
    transactions: 'evb_transactions',
    categories:   'evb_categories',
    theme:        'evb_theme'
  };

  var transactions = [];
  var categories   = DEFAULT_CATEGORIES.slice();
  var theme        = 'light';

  // Load persisted state from localStorage on module init
  (function init() {
    var savedTx    = StorageModule.load(STORAGE_KEYS.transactions);
    var savedCats  = StorageModule.load(STORAGE_KEYS.categories);
    var savedTheme = StorageModule.load(STORAGE_KEYS.theme);

    if (Array.isArray(savedTx))   { transactions = savedTx; }
    if (Array.isArray(savedCats)) { categories   = savedCats; }
    if (savedTheme === 'light' || savedTheme === 'dark') { theme = savedTheme; }
  })();

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function addTransaction(tx) {
    var entry = {
      id:       generateId(),
      name:     tx.name,
      amount:   tx.amount,
      category: tx.category,
      date:     tx.date || new Date().toISOString()
    };
    transactions.push(entry);
    StorageModule.save(STORAGE_KEYS.transactions, transactions);
  }

  function deleteTransaction(id) {
    transactions = transactions.filter(function (tx) { return tx.id !== id; });
    StorageModule.save(STORAGE_KEYS.transactions, transactions);
  }

  function addCategory(name) {
    categories.push(name);
    StorageModule.save(STORAGE_KEYS.categories, categories);
  }

  function setTheme(newTheme) {
    theme = newTheme;
    StorageModule.save(STORAGE_KEYS.theme, theme);
  }

  function getBalance() {
    return transactions.reduce(function (sum, tx) { return sum + tx.amount; }, 0);
  }

  function getSpendingByCategory() {
    return transactions.reduce(function (acc, tx) {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {});
  }

  function getMonthlySummary() {
    var MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    var map = {};
    transactions.forEach(function (tx) {
      var d     = new Date(tx.date);
      var year  = d.getFullYear();
      var month = d.getMonth();
      var key   = year + '-' + month;
      if (!map[key]) {
        map[key] = { label: MONTH_NAMES[month] + ' ' + year, year: year, month: month, total: 0 };
      }
      map[key].total += tx.amount;
    });

    return Object.keys(map)
      .map(function (k) { return map[k]; })
      .sort(function (a, b) {
        if (b.year !== a.year) { return b.year - a.year; }
        return b.month - a.month;
      });
  }

  return {
    get transactions() { return transactions; },
    get categories()   { return categories; },
    get theme()        { return theme; },
    addTransaction:        addTransaction,
    deleteTransaction:     deleteTransaction,
    addCategory:           addCategory,
    setTheme:              setTheme,
    getBalance:            getBalance,
    getSpendingByCategory: getSpendingByCategory,
    getMonthlySummary:     getMonthlySummary
  };
})();

// =============================================
// Validation Module — pure input validation
// Requirements: 1.3, 1.4, 1.5, 2.3, 2.4
// =============================================
var Validation = (function () {
  function validateItemName(name) {
    if (typeof name !== 'string' || name.trim() === '') {
      return { valid: false, error: 'Item name is required.' };
    }
    return { valid: true, error: '' };
  }

  function validateAmount(amount) {
    var num = Number(amount);
    if (amount === '' || amount === null || amount === undefined || isNaN(num)) {
      return { valid: false, error: 'Amount must be a valid number.' };
    }
    if (num <= 0) {
      return { valid: false, error: 'Amount must be greater than zero.' };
    }
    return { valid: true, error: '' };
  }

  function validateCategory(category, categories) {
    if (!category || !Array.isArray(categories) || categories.indexOf(category) === -1) {
      return { valid: false, error: 'Please select a valid category.' };
    }
    return { valid: true, error: '' };
  }

  function validateCategoryName(name, existing) {
    if (typeof name !== 'string' || name.trim() === '') {
      return { valid: false, error: 'Category name is required.' };
    }
    var normalized = name.trim().toLowerCase();
    if (Array.isArray(existing)) {
      for (var i = 0; i < existing.length; i++) {
        if (existing[i].toLowerCase() === normalized) {
          return { valid: false, error: 'Category already exists.' };
        }
      }
    }
    return { valid: true, error: '' };
  }

  return {
    validateItemName:     validateItemName,
    validateAmount:       validateAmount,
    validateCategory:     validateCategory,
    validateCategoryName: validateCategoryName
  };
})();

// =============================================
// TransactionForm — renders the add-transaction form
// Requirements: 1.1, 1.3, 1.4, 1.5, 1.6
// =============================================
var TransactionForm = (function () {
  var _container = null;

  function render(container, categories) {
    _container = container;

    var options = categories.map(function (cat) {
      return '<option value="' + _escapeHtml(cat) + '">' + _escapeHtml(cat) + '</option>';
    }).join('');

    container.innerHTML =
      '<form id="transaction-form" class="transaction-form" novalidate aria-label="Add transaction">' +
        '<div class="form-group">' +
          '<label for="tx-name">Item Name</label>' +
          '<input type="text" id="tx-name" name="name" placeholder="e.g. Coffee" autocomplete="off" aria-describedby="tx-name-error" />' +
          '<span id="tx-name-error" class="form-error" role="alert" aria-live="polite"></span>' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="tx-amount">Amount</label>' +
          '<input type="number" id="tx-amount" name="amount" placeholder="0.00" min="0.01" step="0.01" aria-describedby="tx-amount-error" />' +
          '<span id="tx-amount-error" class="form-error" role="alert" aria-live="polite"></span>' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="tx-category">Category</label>' +
          '<select id="tx-category" name="category" aria-describedby="tx-category-error">' +
            '<option value="">— Select a category —</option>' +
            options +
          '</select>' +
          '<span id="tx-category-error" class="form-error" role="alert" aria-live="polite"></span>' +
        '</div>' +
        '<button type="submit" class="btn btn--primary">Add Transaction</button>' +
      '</form>';

    container.querySelector('#transaction-form').addEventListener('submit', _handleSubmit);
  }

  function updateCategories(categories) {
    var select = _container && _container.querySelector('#tx-category');
    if (!select) { return; }
    var current = select.value;
    select.innerHTML = '<option value="">— Select a category —</option>' +
      categories.map(function (cat) {
        return '<option value="' + _escapeHtml(cat) + '"' +
          (cat === current ? ' selected' : '') +
          '>' + _escapeHtml(cat) + '</option>';
      }).join('');
  }

  function _handleSubmit(e) {
    e.preventDefault();
    var form = e.target;

    var nameInput     = form.querySelector('#tx-name');
    var amountInput   = form.querySelector('#tx-amount');
    var categoryInput = form.querySelector('#tx-category');

    var nameResult     = Validation.validateItemName(nameInput.value);
    var amountResult   = Validation.validateAmount(amountInput.value);
    var categoryResult = Validation.validateCategory(categoryInput.value, State.categories);

    _setFieldError(nameInput,     'tx-name-error',     nameResult);
    _setFieldError(amountInput,   'tx-amount-error',   amountResult);
    _setFieldError(categoryInput, 'tx-category-error', categoryResult);

    if (!nameResult.valid || !amountResult.valid || !categoryResult.valid) { return; }

    AppController.handleAddTransaction({
      name:     nameInput.value.trim(),
      amount:   parseFloat(amountInput.value),
      category: categoryInput.value
    });

    nameInput.value     = '';
    amountInput.value   = '';
    categoryInput.value = '';
    _clearFieldError(nameInput,     'tx-name-error');
    _clearFieldError(amountInput,   'tx-amount-error');
    _clearFieldError(categoryInput, 'tx-category-error');
    nameInput.focus();
  }

  function _setFieldError(input, errorId, result) {
    var errorEl = document.getElementById(errorId);
    if (result.valid) {
      input.removeAttribute('aria-invalid');
      if (errorEl) { errorEl.textContent = ''; }
    } else {
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) { errorEl.textContent = result.error; }
    }
  }

  function _clearFieldError(input, errorId) {
    input.removeAttribute('aria-invalid');
    var errorEl = document.getElementById(errorId);
    if (errorEl) { errorEl.textContent = ''; }
  }

  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { render: render, updateCategories: updateCategories };
})();

// =============================================
// CategoryManager — renders the custom category input and list
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
// =============================================
var CategoryManager = (function () {
  var _container = null;

  function render(container, categories) {
    _container = container;

    var listItems = categories.map(function (cat) {
      return '<li class="category-tag">' + _escapeHtml(cat) + '</li>';
    }).join('');

    container.innerHTML =
      '<div class="category-form">' +
        '<input type="text" id="category-name-input" placeholder="New category name" autocomplete="off" aria-label="New category name" aria-describedby="category-name-error" />' +
        '<button type="button" id="category-add-btn" class="btn btn--primary">Add</button>' +
      '</div>' +
      '<span id="category-name-error" class="form-error" role="alert" aria-live="polite"></span>' +
      '<ul id="category-list" class="category-list" aria-label="Category list">' +
        listItems +
      '</ul>';

    container.querySelector('#category-add-btn').addEventListener('click', _handleAdd);
    container.querySelector('#category-name-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); _handleAdd(); }
    });
  }

  function _refreshList(categories) {
    var list = _container && _container.querySelector('#category-list');
    if (!list) { return; }
    list.innerHTML = categories.map(function (cat) {
      return '<li class="category-tag">' + _escapeHtml(cat) + '</li>';
    }).join('');
  }

  function _handleAdd() {
    var input   = _container && _container.querySelector('#category-name-input');
    var errorEl = _container && _container.querySelector('#category-name-error');
    if (!input) { return; }

    var result = Validation.validateCategoryName(input.value, State.categories);

    if (!result.valid) {
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) { errorEl.textContent = result.error; }
      return;
    }

    input.removeAttribute('aria-invalid');
    if (errorEl) { errorEl.textContent = ''; }

    AppController.handleAddCategory(input.value.trim());
    _refreshList(State.categories);
    TransactionForm.updateCategories(State.categories);

    input.value = '';
    input.focus();
  }

  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { render: render };
})();

// =============================================
// TransactionList — renders all transactions ordered most-recent-first
// Requirements: 3.1, 3.2, 3.3, 3.4
// =============================================
var TransactionList = (function () {
  function render(container, transactions) {
    var list = container.querySelector('#transaction-list') || container;

    if (!transactions || transactions.length === 0) {
      list.innerHTML = '<li class="transaction-list-empty">No transactions yet.</li>';
      return;
    }

    var sorted = transactions.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    list.innerHTML = sorted.map(function (tx) {
      return (
        '<li class="transaction-item" data-id="' + _escapeHtml(tx.id) + '">' +
          '<div class="transaction-item__info">' +
            '<div class="transaction-item__name">' + _escapeHtml(tx.name) + '</div>' +
            '<div class="transaction-item__meta">' + _escapeHtml(tx.category) + '</div>' +
          '</div>' +
          '<span class="transaction-item__amount">$' + Number(tx.amount).toFixed(2) + '</span>' +
          '<button type="button" class="btn btn--danger" aria-label="Delete transaction ' + _escapeHtml(tx.name) + '" data-id="' + _escapeHtml(tx.id) + '">Delete</button>' +
        '</li>'
      );
    }).join('');

    list.querySelectorAll('.btn--danger[data-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        AppController.handleDeleteTransaction(btn.getAttribute('data-id'));
      });
    });
  }

  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { render: render };
})();

// =============================================
// BalanceDisplay — renders the current total balance
// Requirements: 4.1, 4.4
// =============================================
var BalanceDisplay = (function () {
  function render(container) {
    var balance  = State.getBalance();
    var amountEl = container.querySelector('.balance-display__amount');
    if (amountEl) {
      amountEl.textContent = '$' + balance.toFixed(2);
    } else {
      container.innerHTML =
        '<p class="balance-display__label">Total Spending</p>' +
        '<p class="balance-display__amount" aria-live="polite" aria-atomic="true">$' +
          balance.toFixed(2) +
        '</p>';
    }
  }

  return { render: render };
})();

// =============================================
// PieChart — renders a pie chart onto a <canvas> element
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
// =============================================
var PieChart = (function () {
  var CHART_COLORS = [
    '#4e79a7', '#f28e2b', '#e15759', '#76b7b2',
    '#59a14f', '#edc948', '#b07aa1', '#ff9da7',
    '#9c755f', '#bab0ac', '#d37295', '#a0cbe8'
  ];

  function render(container) {
    var canvas   = container.querySelector('#pie-chart-canvas');
    var legendEl = container.querySelector('#pie-chart-legend');
    if (!canvas) { return; }

    var ctx    = canvas.getContext('2d');
    var width  = canvas.width;
    var height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    var spending   = State.getSpendingByCategory();
    var categories = Object.keys(spending).filter(function (cat) { return spending[cat] > 0; });
    var grandTotal = categories.reduce(function (sum, cat) { return sum + spending[cat]; }, 0);

    if (grandTotal === 0) {
      ctx.fillStyle    = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#6b7280';
      ctx.font         = '14px ' + (getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() || 'system-ui, sans-serif');
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No data yet', width / 2, height / 2);
      if (legendEl) { legendEl.innerHTML = ''; }
      return;
    }

    var cx           = width / 2;
    var cy           = height / 2;
    var radius       = Math.min(cx, cy) - 4;
    var currentAngle = -Math.PI / 2;

    categories.forEach(function (cat, index) {
      var sliceAngle = (spending[cat] / grandTotal) * 2 * Math.PI;
      var color      = CHART_COLORS[index % CHART_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#ffffff';
      ctx.lineWidth   = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    if (legendEl) {
      legendEl.innerHTML = categories.map(function (cat, index) {
        var color = CHART_COLORS[index % CHART_COLORS.length];
        return (
          '<div class="pie-chart-legend__item">' +
            '<span class="pie-chart-legend__swatch" style="background-color:' + color + '" aria-hidden="true"></span>' +
            '<span>' + _escapeHtml(cat) + '</span>' +
          '</div>'
        );
      }).join('');
    }
  }

  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { render: render, CHART_COLORS: CHART_COLORS };
})();

// =============================================
// MonthlySummary — renders monthly spending totals
// Requirements: 6.1, 6.2, 6.3
// =============================================
var MonthlySummary = (function () {
  function render(container, data) {
    if (!container) { return; }

    if (!data || data.length === 0) {
      container.innerHTML = '<p class="monthly-summary-empty">No transactions yet.</p>';
      return;
    }

    var rows = data.map(function (entry) {
      return (
        '<tr>' +
          '<td>' + _escapeHtml(entry.label) + '</td>' +
          '<td>$' + Number(entry.total).toFixed(2) + '</td>' +
        '</tr>'
      );
    }).join('');

    container.innerHTML =
      '<table class="monthly-summary-table" aria-label="Monthly spending summary">' +
        '<thead><tr><th scope="col">Month</th><th scope="col">Total</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { render: render };
})();

// =============================================
// ThemeToggle — renders a toggle button for dark/light mode
// Requirements: 7.1, 7.2, 7.3
// =============================================
var ThemeToggle = (function () {
  function render(container, state) {
    if (!container) { return; }

    var isDark = state && state.theme === 'dark';
    var label  = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    var icon   = isDark ? '☀️' : '🌙';

    container.innerHTML =
      '<button type="button" id="theme-toggle-btn" class="btn btn--icon theme-toggle__btn" aria-label="' + label + '" title="' + label + '">' +
        '<span aria-hidden="true">' + icon + '</span>' +
        '<span class="visually-hidden">' + label + '</span>' +
      '</button>';

    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    container.querySelector('#theme-toggle-btn').addEventListener('click', function () {
      AppController.handleThemeToggle();
    });
  }

  return { render: render };
})();

// =============================================
// AppController — orchestrates state, persistence, and UI re-renders
// Requirements: 1.2, 2.2, 3.3, 4.2, 4.3, 5.2, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4
// =============================================
var AppController = (function () {
  function init() {
    if (!StorageModule.isAvailable()) {
      var banner = document.getElementById('storage-banner');
      if (banner) { banner.setAttribute('aria-hidden', 'false'); }
    }

    document.documentElement.setAttribute('data-theme', State.theme);

    var themeToggleContainer = document.getElementById('theme-toggle-container');
    if (themeToggleContainer) { ThemeToggle.render(themeToggleContainer, { theme: State.theme }); }

    var txFormContainer = document.getElementById('transaction-form-container');
    if (txFormContainer) { TransactionForm.render(txFormContainer, State.categories); }

    var categoryContainer = document.getElementById('category-manager-container');
    if (categoryContainer) { CategoryManager.render(categoryContainer, State.categories); }

    var txListContainer = document.getElementById('transaction-list-container');
    if (txListContainer) { TransactionList.render(txListContainer, State.transactions); }

    var balanceContainer = document.getElementById('balance-display-container');
    if (balanceContainer) { BalanceDisplay.render(balanceContainer); }

    var pieChartContainer = document.getElementById('pie-chart-container');
    if (pieChartContainer) { PieChart.render(pieChartContainer); }

    var summaryContainer = document.getElementById('monthly-summary-container');
    if (summaryContainer) { MonthlySummary.render(summaryContainer, State.getMonthlySummary()); }
  }

  function handleAddTransaction(formData) {
    var nameResult     = Validation.validateItemName(formData.name);
    var amountResult   = Validation.validateAmount(formData.amount);
    var categoryResult = Validation.validateCategory(formData.category, State.categories);

    if (!nameResult.valid || !amountResult.valid || !categoryResult.valid) {
      return {
        success: false,
        errors: {
          name:     nameResult.error     || '',
          amount:   amountResult.error   || '',
          category: categoryResult.error || ''
        }
      };
    }

    State.addTransaction({
      name:     formData.name.trim(),
      amount:   parseFloat(formData.amount),
      category: formData.category,
      date:     new Date().toISOString()
    });

    _rerenderTransactionViews();
    return { success: true };
  }

  function handleDeleteTransaction(id) {
    State.deleteTransaction(id);
    _rerenderTransactionViews();
  }

  function handleAddCategory(name) {
    var result = Validation.validateCategoryName(name, State.categories);
    if (!result.valid) { return { success: false, error: result.error }; }

    State.addCategory(name.trim());

    var categoryContainer = document.getElementById('category-manager-container');
    if (categoryContainer) { CategoryManager.render(categoryContainer, State.categories); }

    var txFormContainer = document.getElementById('transaction-form-container');
    if (txFormContainer) { TransactionForm.updateCategories(State.categories); }

    return { success: true };
  }

  function handleThemeToggle() {
    var newTheme = State.theme === 'light' ? 'dark' : 'light';
    State.setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', State.theme);

    var themeToggleContainer = document.getElementById('theme-toggle-container');
    if (themeToggleContainer) { ThemeToggle.render(themeToggleContainer, { theme: State.theme }); }
  }

  function handleViewChange(view) {
    var appMain        = document.getElementById('app-main');
    var summarySection = document.querySelector('.summary-section');

    if (view === 'monthly') {
      if (appMain)        { appMain.style.display = 'none'; }
      if (summarySection) {
        summarySection.style.display = 'block';
        var summaryContainer = document.getElementById('monthly-summary-container');
        if (summaryContainer) { MonthlySummary.render(summaryContainer, State.getMonthlySummary()); }
      }
    } else {
      if (appMain)        { appMain.style.display = ''; }
      if (summarySection) { summarySection.style.display = ''; }
    }
  }

  function _rerenderTransactionViews() {
    var txListContainer = document.getElementById('transaction-list-container');
    if (txListContainer) { TransactionList.render(txListContainer, State.transactions); }

    var balanceContainer = document.getElementById('balance-display-container');
    if (balanceContainer) { BalanceDisplay.render(balanceContainer); }

    var pieChartContainer = document.getElementById('pie-chart-container');
    if (pieChartContainer) { PieChart.render(pieChartContainer); }

    var summaryContainer = document.getElementById('monthly-summary-container');
    if (summaryContainer) { MonthlySummary.render(summaryContainer, State.getMonthlySummary()); }
  }

  return {
    init:                    init,
    handleAddTransaction:    handleAddTransaction,
    handleDeleteTransaction: handleDeleteTransaction,
    handleAddCategory:       handleAddCategory,
    handleThemeToggle:       handleThemeToggle,
    handleViewChange:        handleViewChange
  };
})();

// Bootstrap the app on DOM ready
document.addEventListener('DOMContentLoaded', function () {
  AppController.init();
});
