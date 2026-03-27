/* =============================================
   FinWise — Financial Planner Application
   ============================================= */

// ─── Category Definitions ─────────────────────
const CATEGORIES = {
  expense: [
    { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#f97316' },
    { id: 'transport', name: 'Transport', icon: '🚗', color: '#3b82f6' },
    { id: 'housing', name: 'Housing & Rent', icon: '🏠', color: '#8b5cf6' },
    { id: 'utilities', name: 'Utilities', icon: '💡', color: '#06b6d4' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#ec4899' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#10b981' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#f43f5e' },
    { id: 'education', name: 'Education', icon: '📚', color: '#6366f1' },
    { id: 'insurance', name: 'Insurance', icon: '🛡️', color: '#0891b2' },
    { id: 'other_expense', name: 'Other', icon: '📋', color: '#64748b' },
  ],
  income: [
    { id: 'salary', name: 'Salary', icon: '💼', color: '#22c55e' },
    { id: 'freelance', name: 'Freelance', icon: '💻', color: '#14b8a6' },
    { id: 'investments', name: 'Investments', icon: '📈', color: '#a855f7' },
    { id: 'other_income', name: 'Other Income', icon: '💰', color: '#64748b' },
  ],
  retirement: [
    { id: 'ret_401k', name: '401(k)', icon: '🏦', color: '#7c3aed' },
    { id: 'ret_ira', name: 'Traditional IRA', icon: '📊', color: '#6d28d9' },
    { id: 'ret_roth', name: 'Roth IRA', icon: '🌟', color: '#8b5cf6' },
    { id: 'ret_hsa', name: 'HSA', icon: '🏥', color: '#a78bfa' },
    { id: 'ret_403b', name: '403(b)', icon: '🎓', color: '#5b21b6' },
    { id: 'ret_pension', name: 'Pension', icon: '🏛️', color: '#4c1d95' },
    { id: 'ret_other', name: 'Other Retirement', icon: '💎', color: '#9333ea' },
  ],
};

const ALL_CATEGORIES = [...CATEGORIES.expense, ...CATEGORIES.income, ...CATEGORIES.retirement];

function getCategoryById(id) {
  return ALL_CATEGORIES.find(c => c.id === id) || { id: 'unknown', name: 'Unknown', icon: '❓', color: '#64748b' };
}

// ─── Reactive State Manager ───────────────────
const Store = {
  _state: {
    transactions: [],
    budgets: [],
    goals: [],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    viewYear: new Date().getFullYear(),
    activeView: 'dashboard',
  },
  _subscribers: [],

  get state() { return this._state; },

  init() {
    const saved = localStorage.getItem('finwise_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this._state.transactions = data.transactions || [];
        this._state.budgets = data.budgets || [];
        this._state.goals = data.goals || [];
      } catch (e) {
        console.warn('Failed to load saved data, starting fresh.');
      }
    }
    this.notify();
  },

  subscribe(fn) { this._subscribers.push(fn); },

  notify() {
    this._save();
    this._subscribers.forEach(fn => fn(this._state));
  },

  _save() {
    const { transactions, budgets, goals } = this._state;
    localStorage.setItem('finwise_data', JSON.stringify({ transactions, budgets, goals }));
  },

  dispatch(action, payload) {
    switch (action) {
      case 'ADD_TRANSACTION':
        this._state.transactions.push({ ...payload, id: generateId() });
        break;
      case 'UPDATE_TRANSACTION':
        this._state.transactions = this._state.transactions.map(t =>
          t.id === payload.id ? { ...t, ...payload } : t
        );
        break;
      case 'DELETE_TRANSACTION':
        this._state.transactions = this._state.transactions.filter(t => t.id !== payload.id);
        break;
      case 'ADD_BUDGET':
        this._state.budgets.push({ ...payload, id: generateId() });
        break;
      case 'UPDATE_BUDGET':
        this._state.budgets = this._state.budgets.map(b =>
          b.id === payload.id ? { ...b, ...payload } : b
        );
        break;
      case 'DELETE_BUDGET':
        this._state.budgets = this._state.budgets.filter(b => b.id !== payload.id);
        break;
      case 'ADD_GOAL':
        this._state.goals.push({ ...payload, id: generateId(), current: 0 });
        break;
      case 'UPDATE_GOAL':
        this._state.goals = this._state.goals.map(g =>
          g.id === payload.id ? { ...g, ...payload } : g
        );
        break;
      case 'DELETE_GOAL':
        this._state.goals = this._state.goals.filter(g => g.id !== payload.id);
        break;
      case 'CONTRIBUTE_GOAL':
        this._state.goals = this._state.goals.map(g =>
          g.id === payload.id ? { ...g, current: Math.min(g.target, g.current + payload.amount) } : g
        );
        break;
      case 'SET_MONTH':
        this._state.currentMonth = payload.month;
        this._state.currentYear = payload.year;
        break;
      case 'SET_VIEW_YEAR':
        this._state.viewYear = payload;
        break;
      case 'SET_VIEW':
        this._state.activeView = payload;
        break;
      case 'CLEAR_ALL':
        this._state.transactions = [];
        this._state.budgets = [];
        this._state.goals = [];
        break;
    }
    this.notify();
  },
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Helpers ──────────────────────────────────
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMonthLabel(month, year) {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function filterByMonth(transactions, month, year) {
  return transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

function filterByYear(transactions, year) {
  return transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getFullYear() === year;
  });
}

function sumByType(txs, type) {
  return txs.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);
}

function animateValue(el) {
  el.classList.remove('value-update');
  void el.offsetWidth;
  el.classList.add('value-update');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Shared Chart Tooltip Config ──────────────
const TOOLTIP_CFG = {
  backgroundColor: '#ffffff',
  titleColor: '#1e293b',
  bodyColor: '#475569',
  borderColor: 'rgba(0,0,0,0.08)',
  borderWidth: 1,
  padding: 12,
  cornerRadius: 8,
};

// ─── Chart Instances ──────────────────────────
let pieChart = null;
let trendChart = null;
let budgetBarChart = null;
let allocChart = null;
let savingsRateTrendChart = null;
let yearlyBarsChart = null;
let cumulativeChart = null;
let retirementPieChart = null;
let categoryHeatmapChart = null;

function initCharts() {
  Chart.defaults.color = '#475569';
  Chart.defaults.borderColor = 'rgba(0,0,0,0.06)';
  Chart.defaults.font.family = "'Inter', sans-serif";

  // -- Spending by Category Pie --
  pieChart = new Chart(document.getElementById('chart-category-pie'), {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } },
        tooltip: { ...TOOLTIP_CFG, callbacks: { label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` } },
      },
    },
  });

  // -- Monthly Trend (Income / Expenses / Retirement) --
  trendChart = new Chart(document.getElementById('chart-monthly-trend'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Income', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 },
        { label: 'Expenses', data: [], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 },
        { label: 'Retirement', data: [], borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.08)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => '$' + v.toLocaleString() } },
        x: { grid: { display: false } },
      },
      plugins: {
        legend: { labels: { usePointStyle: true, pointStyleWidth: 10, padding: 16, font: { size: 12 } } },
        tooltip: { ...TOOLTIP_CFG, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } },
      },
    },
  });

  // -- Income Allocation (where money goes) --
  allocChart = new Chart(document.getElementById('chart-income-allocation'), {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } },
        tooltip: { ...TOOLTIP_CFG, callbacks: { label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` } },
      },
    },
  });

  // -- Savings Rate Trend --
  savingsRateTrendChart = new Chart(document.getElementById('chart-savings-trend'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Savings Rate %',
        data: [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.1)',
        fill: true, tension: 0.4, pointRadius: 5, pointHoverRadius: 7, borderWidth: 2.5,
        pointBackgroundColor: '#f59e0b',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => v + '%' } },
        x: { grid: { display: false } },
      },
      plugins: {
        legend: { display: false },
        tooltip: { ...TOOLTIP_CFG, callbacks: { label: ctx => ` Savings Rate: ${ctx.parsed.y.toFixed(1)}%` } },
      },
    },
  });

  // -- Budget Bar Chart --
  budgetBarChart = new Chart(document.getElementById('chart-budget-bar'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        { label: 'Budget', data: [], backgroundColor: 'rgba(99,102,241,0.4)', borderColor: '#6366f1', borderWidth: 1, borderRadius: 6, barPercentage: 0.6 },
        { label: 'Spent', data: [], backgroundColor: 'rgba(239,68,68,0.4)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 6, barPercentage: 0.6 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => '$' + v.toLocaleString() } },
        x: { grid: { display: false } },
      },
      plugins: {
        legend: { labels: { usePointStyle: true, pointStyleWidth: 10, padding: 16, font: { size: 12 } } },
        tooltip: { ...TOOLTIP_CFG, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } },
      },
    },
  });

  // ─── YEARLY CHARTS ────────────────────────────

  // -- Yearly Bars: Income vs Expenses vs Retirement per month --
  yearlyBarsChart = new Chart(document.getElementById('chart-yearly-bars'), {
    type: 'bar',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [
        { label: 'Income', data: new Array(12).fill(0), backgroundColor: 'rgba(16,185,129,0.6)', borderColor: '#10b981', borderWidth: 1, borderRadius: 4, barPercentage: 0.7 },
        { label: 'Expenses', data: new Array(12).fill(0), backgroundColor: 'rgba(239,68,68,0.5)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 4, barPercentage: 0.7 },
        { label: 'Retirement', data: new Array(12).fill(0), backgroundColor: 'rgba(124,58,237,0.5)', borderColor: '#7c3aed', borderWidth: 1, borderRadius: 4, barPercentage: 0.7 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => '$' + v.toLocaleString() } },
        x: { grid: { display: false } },
      },
      plugins: {
        legend: { labels: { usePointStyle: true, pointStyleWidth: 10, padding: 16, font: { size: 12 } } },
        tooltip: { ...TOOLTIP_CFG, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } },
      },
    },
  });

  // -- Cumulative Cash Flow --
  cumulativeChart = new Chart(document.getElementById('chart-cumulative'), {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [{
        label: 'Cumulative Net Cash',
        data: new Array(12).fill(0),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true, tension: 0.3, pointRadius: 5, pointHoverRadius: 7, borderWidth: 2.5,
        pointBackgroundColor: '#3b82f6',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => '$' + v.toLocaleString() } },
        x: { grid: { display: false } },
      },
      plugins: {
        legend: { display: false },
        tooltip: { ...TOOLTIP_CFG, callbacks: { label: ctx => ` Net Cash: ${formatCurrency(ctx.parsed.y)}` } },
      },
    },
  });

  // -- Retirement Pie by Account --
  retirementPieChart = new Chart(document.getElementById('chart-retirement-pie'), {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } },
        tooltip: { ...TOOLTIP_CFG, callbacks: { label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` } },
      },
    },
  });

  // -- Category Spending Across Months (stacked bar) --
  categoryHeatmapChart = new Chart(document.getElementById('chart-category-heatmap'), {
    type: 'bar',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => '$' + v.toLocaleString() } },
      },
      plugins: {
        legend: { labels: { usePointStyle: true, pointStyleWidth: 10, padding: 12, font: { size: 11 } } },
        tooltip: { ...TOOLTIP_CFG, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } },
      },
    },
  });
}

// ─── Dashboard Render ─────────────────────────
function renderDashboard(state) {
  const monthTx = filterByMonth(state.transactions, state.currentMonth, state.currentYear);
  const income = sumByType(monthTx, 'income');
  const expenses = sumByType(monthTx, 'expense');
  const retirement = sumByType(monthTx, 'retirement');
  const netCash = income - expenses - retirement;
  const rate = income > 0 ? Math.round(((income - expenses - retirement) / income) * 100) : 0;

  const els = {
    income: document.getElementById('total-income'),
    expenses: document.getElementById('total-expenses'),
    retirement: document.getElementById('total-retirement'),
    balance: document.getElementById('net-balance'),
    rate: document.getElementById('savings-rate'),
  };

  els.income.textContent = formatCurrency(income);
  els.expenses.textContent = formatCurrency(expenses);
  els.retirement.textContent = formatCurrency(retirement);
  els.balance.textContent = formatCurrency(netCash);
  els.rate.textContent = rate + '%';

  Object.values(els).forEach(animateValue);

  document.getElementById('current-month-label').textContent = getMonthLabel(state.currentMonth, state.currentYear);

  // -- Spending Pie --
  const expensesByCategory = {};
  monthTx.filter(t => t.type === 'expense').forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
  });
  const cats = Object.keys(expensesByCategory);
  const pieEmptyMsg = document.getElementById('pie-empty-msg');
  if (cats.length === 0) {
    pieChart.data.labels = [];
    pieChart.data.datasets[0].data = [];
    pieEmptyMsg.classList.add('visible');
  } else {
    pieChart.data.labels = cats.map(c => getCategoryById(c).name);
    pieChart.data.datasets[0].data = cats.map(c => expensesByCategory[c]);
    pieChart.data.datasets[0].backgroundColor = cats.map(c => getCategoryById(c).color);
    pieEmptyMsg.classList.remove('visible');
  }
  pieChart.update('none');

  // -- Income Allocation Pie (Expenses / Retirement / Remaining) --
  const allocEmpty = document.getElementById('alloc-empty-msg');
  if (income === 0) {
    allocChart.data.labels = [];
    allocChart.data.datasets[0].data = [];
    allocEmpty.classList.add('visible');
  } else {
    const remaining = Math.max(0, netCash);
    allocChart.data.labels = ['Expenses', 'Retirement', 'Remaining'];
    allocChart.data.datasets[0].data = [expenses, retirement, remaining];
    allocChart.data.datasets[0].backgroundColor = ['#ef4444', '#7c3aed', '#10b981'];
    allocEmpty.classList.remove('visible');
  }
  allocChart.update('none');

  // -- 6-Month Trend (now includes retirement) --
  const trendLabels = [], trendIncome = [], trendExpenses = [], trendRetirement = [];
  for (let i = 5; i >= 0; i--) {
    let m = state.currentMonth - i, y = state.currentYear;
    if (m < 0) { m += 12; y--; }
    trendLabels.push(new Date(y, m).toLocaleDateString('en-US', { month: 'short' }));
    const mTx = filterByMonth(state.transactions, m, y);
    trendIncome.push(sumByType(mTx, 'income'));
    trendExpenses.push(sumByType(mTx, 'expense'));
    trendRetirement.push(sumByType(mTx, 'retirement'));
  }
  trendChart.data.labels = trendLabels;
  trendChart.data.datasets[0].data = trendIncome;
  trendChart.data.datasets[1].data = trendExpenses;
  trendChart.data.datasets[2].data = trendRetirement;
  trendChart.update('none');

  // -- Savings Rate Trend (6 months) --
  const rateData = [];
  for (let i = 5; i >= 0; i--) {
    let m = state.currentMonth - i, y = state.currentYear;
    if (m < 0) { m += 12; y--; }
    const mTx = filterByMonth(state.transactions, m, y);
    const mInc = sumByType(mTx, 'income');
    const mExp = sumByType(mTx, 'expense');
    const mRet = sumByType(mTx, 'retirement');
    rateData.push(mInc > 0 ? Math.round(((mInc - mExp - mRet) / mInc) * 100) : 0);
  }
  savingsRateTrendChart.data.labels = trendLabels;
  savingsRateTrendChart.data.datasets[0].data = rateData;
  savingsRateTrendChart.update('none');

  // -- Recent Transactions --
  const list = document.getElementById('recent-transactions-list');
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  if (recent.length === 0) {
    list.innerHTML = '<p class="empty-state-text">No transactions yet. Add your first one!</p>';
  } else {
    list.innerHTML = recent.map(t => {
      const cat = getCategoryById(t.category);
      const isIncome = t.type === 'income';
      const amountClass = isIncome ? 'amount-income' : (t.type === 'retirement' ? 'amount-retirement' : 'amount-expense');
      const sign = isIncome ? '+' : '-';
      return `
        <div class="recent-tx-item">
          <div class="recent-tx-icon" style="background:${cat.color}18">${cat.icon}</div>
          <div class="recent-tx-details">
            <div class="recent-tx-desc">${escapeHtml(t.description)}</div>
            <div class="recent-tx-date">${formatDate(t.date)}</div>
          </div>
          <span class="recent-tx-amount ${amountClass}">${sign}${formatCurrency(t.amount)}</span>
        </div>`;
    }).join('');
  }
}

// ─── Yearly Overview Render ───────────────────
function renderYearly(state) {
  const year = state.viewYear;
  const yearTx = filterByYear(state.transactions, year);

  document.getElementById('current-year-label').textContent = year;

  const yInc = sumByType(yearTx, 'income');
  const yExp = sumByType(yearTx, 'expense');
  const yRet = sumByType(yearTx, 'retirement');
  const yNet = yInc - yExp - yRet;

  // Count months that have any transactions
  const activeMonths = new Set(yearTx.map(t => new Date(t.date + 'T00:00:00').getMonth())).size || 1;
  const avgMonthlySavings = yNet / activeMonths;

  document.getElementById('yearly-income').textContent = formatCurrency(yInc);
  document.getElementById('yearly-expenses').textContent = formatCurrency(yExp);
  document.getElementById('yearly-retirement').textContent = formatCurrency(yRet);
  document.getElementById('yearly-net').textContent = formatCurrency(yNet);
  document.getElementById('yearly-avg-savings').textContent = formatCurrency(avgMonthlySavings);

  // -- Monthly Breakdown Bars --
  const monthlyInc = [], monthlyExp = [], monthlyRet = [];
  for (let m = 0; m < 12; m++) {
    const mTx = filterByMonth(state.transactions, m, year);
    monthlyInc.push(sumByType(mTx, 'income'));
    monthlyExp.push(sumByType(mTx, 'expense'));
    monthlyRet.push(sumByType(mTx, 'retirement'));
  }
  yearlyBarsChart.data.datasets[0].data = monthlyInc;
  yearlyBarsChart.data.datasets[1].data = monthlyExp;
  yearlyBarsChart.data.datasets[2].data = monthlyRet;
  yearlyBarsChart.update('none');

  // -- Cumulative Cash Flow --
  const cumData = [];
  let cumulative = 0;
  for (let m = 0; m < 12; m++) {
    cumulative += monthlyInc[m] - monthlyExp[m] - monthlyRet[m];
    cumData.push(cumulative);
  }
  cumulativeChart.data.datasets[0].data = cumData;
  cumulativeChart.update('none');

  // -- Retirement Pie by Account --
  const retByAccount = {};
  yearTx.filter(t => t.type === 'retirement').forEach(t => {
    retByAccount[t.category] = (retByAccount[t.category] || 0) + t.amount;
  });
  const retCats = Object.keys(retByAccount);
  const retEmptyMsg = document.getElementById('ret-pie-empty-msg');
  if (retCats.length === 0) {
    retirementPieChart.data.labels = [];
    retirementPieChart.data.datasets[0].data = [];
    retEmptyMsg.classList.add('visible');
  } else {
    retirementPieChart.data.labels = retCats.map(c => getCategoryById(c).name);
    retirementPieChart.data.datasets[0].data = retCats.map(c => retByAccount[c]);
    retirementPieChart.data.datasets[0].backgroundColor = retCats.map(c => getCategoryById(c).color);
    retEmptyMsg.classList.remove('visible');
  }
  retirementPieChart.update('none');

  // -- Category Spending Across Months (stacked bar) --
  const expCats = CATEGORIES.expense.filter(c => {
    return yearTx.some(t => t.type === 'expense' && t.category === c.id);
  });
  categoryHeatmapChart.data.datasets = expCats.map(cat => {
    const monthData = [];
    for (let m = 0; m < 12; m++) {
      const mTx = filterByMonth(state.transactions, m, year);
      monthData.push(mTx.filter(t => t.type === 'expense' && t.category === cat.id).reduce((s, t) => s + t.amount, 0));
    }
    return {
      label: cat.name,
      data: monthData,
      backgroundColor: cat.color + 'AA',
      borderColor: cat.color,
      borderWidth: 1,
      borderRadius: 2,
    };
  });
  categoryHeatmapChart.update('none');
}

// ─── Transactions Render ──────────────────────
function renderTransactions(state) {
  const tbody = document.getElementById('transactions-tbody');
  const typeFilter = document.getElementById('filter-type').value;
  const catFilter = document.getElementById('filter-category').value;
  const searchFilter = document.getElementById('filter-search').value.toLowerCase();

  let filtered = [...state.transactions];
  if (typeFilter !== 'all') filtered = filtered.filter(t => t.type === typeFilter);
  if (catFilter !== 'all') filtered = filtered.filter(t => t.category === catFilter);
  if (searchFilter) filtered = filtered.filter(t => t.description.toLowerCase().includes(searchFilter));
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No transactions found.</td></tr>';
    return;
  }

  const typeLabels = { income: 'Income', expense: 'Expense', retirement: 'Retirement' };
  const typeColors = { income: '#059669', expense: '#dc2626', retirement: '#7c3aed' };

  tbody.innerHTML = filtered.map(t => {
    const cat = getCategoryById(t.category);
    const isIncome = t.type === 'income';
    const amountClass = isIncome ? 'amount-income' : (t.type === 'retirement' ? 'amount-retirement' : 'amount-expense');
    const sign = isIncome ? '+' : '-';
    return `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${escapeHtml(t.description)}</td>
        <td><span class="category-badge"><span class="category-dot" style="background:${cat.color}"></span>${cat.name}</span></td>
        <td><span class="type-badge" style="color:${typeColors[t.type]}">${typeLabels[t.type]}</span></td>
        <td class="${amountClass}">${sign}${formatCurrency(t.amount)}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" data-id="${t.id}" title="Edit" aria-label="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn delete" data-id="${t.id}" title="Delete" aria-label="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ─── Budgets Render ───────────────────────────
function renderBudgets(state) {
  const grid = document.getElementById('budgets-grid');
  const emptyEl = document.getElementById('budgets-empty');
  const monthTx = filterByMonth(state.transactions, state.currentMonth, state.currentYear);

  if (state.budgets.length === 0) {
    grid.innerHTML = '';
    if (emptyEl) { grid.appendChild(emptyEl); emptyEl.style.display = 'block'; }
    document.getElementById('total-budgeted').textContent = formatCurrency(0);
    document.getElementById('total-spent').textContent = formatCurrency(0);
    document.getElementById('total-remaining').textContent = formatCurrency(0);
    budgetBarChart.data.labels = [];
    budgetBarChart.data.datasets[0].data = [];
    budgetBarChart.data.datasets[1].data = [];
    budgetBarChart.update('none');
    document.getElementById('bar-empty-msg').classList.add('visible');
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  document.getElementById('bar-empty-msg').classList.remove('visible');

  let totalBudgeted = 0, totalSpent = 0;

  const budgetCards = state.budgets.map(b => {
    const cat = getCategoryById(b.category);
    const spent = monthTx.filter(t => t.type === 'expense' && t.category === b.category).reduce((s, t) => s + t.amount, 0);
    const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
    const remaining = Math.max(0, b.limit - spent);
    const barColor = pct < 70 ? 'green' : pct < 90 ? 'yellow' : 'red';
    totalBudgeted += b.limit;
    totalSpent += spent;
    return `
      <div class="budget-card">
        <div class="budget-card-header">
          <div class="budget-card-title">
            <span class="category-dot" style="background:${cat.color};width:12px;height:12px;border-radius:50%;display:inline-block"></span>
            ${cat.icon} ${cat.name}
          </div>
          <div class="action-btns">
            <button class="action-btn edit" data-budget-id="${b.id}" title="Edit budget" aria-label="Edit budget">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn delete" data-budget-id="${b.id}" title="Delete budget" aria-label="Delete budget">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="budget-amounts">
          <span class="spent">${formatCurrency(spent)} spent</span>
          <span>of ${formatCurrency(b.limit)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${barColor}" style="width:${Math.min(pct, 100)}%"></div>
        </div>
        <div class="budget-percentage">${pct}% used · ${formatCurrency(remaining)} remaining</div>
      </div>`;
  });

  grid.innerHTML = budgetCards.join('');
  document.getElementById('total-budgeted').textContent = formatCurrency(totalBudgeted);
  document.getElementById('total-spent').textContent = formatCurrency(totalSpent);
  document.getElementById('total-remaining').textContent = formatCurrency(Math.max(0, totalBudgeted - totalSpent));

  budgetBarChart.data.labels = state.budgets.map(b => getCategoryById(b.category).name);
  budgetBarChart.data.datasets[0].data = state.budgets.map(b => b.limit);
  budgetBarChart.data.datasets[1].data = state.budgets.map(b =>
    monthTx.filter(t => t.type === 'expense' && t.category === b.category).reduce((s, t) => s + t.amount, 0)
  );
  budgetBarChart.update('none');
}

// ─── Goals Render ─────────────────────────────
function renderGoals(state) {
  const grid = document.getElementById('goals-grid');
  const emptyEl = document.getElementById('goals-empty');

  if (state.goals.length === 0) {
    grid.innerHTML = '';
    if (emptyEl) { grid.appendChild(emptyEl); emptyEl.style.display = 'block'; }
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  const svgDefs = `<defs><linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#6366f1"/><stop offset="100%" style="stop-color:#8b5cf6"/></linearGradient></defs>`;

  grid.innerHTML = state.goals.map(g => {
    const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const dashoffset = circumference - (pct / 100) * circumference;
    const remaining = Math.max(0, g.target - g.current);
    const deadlineStr = g.deadline ? formatDate(g.deadline) : 'No deadline';
    return `
      <div class="goal-card">
        <div class="goal-card-header">
          <div>
            <div class="goal-name">${escapeHtml(g.name)}</div>
            <div class="goal-deadline">🗓 ${deadlineStr}</div>
          </div>
          <div class="action-btns">
            <button class="action-btn delete" data-goal-id="${g.id}" title="Delete goal" aria-label="Delete goal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="goal-progress-ring">
          <svg width="140" height="140" viewBox="0 0 140 140">
            ${svgDefs}
            <circle class="ring-bg" cx="70" cy="70" r="${radius}"/>
            <circle class="ring-fill" cx="70" cy="70" r="${radius}" stroke="url(#goalGrad)" stroke-dasharray="${circumference}" stroke-dashoffset="${dashoffset}"/>
          </svg>
          <span class="goal-percentage">${pct}%</span>
        </div>
        <div class="goal-amounts">
          <div class="goal-amount-item">
            <span class="goal-amount-label">Saved</span>
            <span class="goal-amount-value" style="color:#10b981">${formatCurrency(g.current)}</span>
          </div>
          <div class="goal-amount-item">
            <span class="goal-amount-label">Target</span>
            <span class="goal-amount-value">${formatCurrency(g.target)}</span>
          </div>
          <div class="goal-amount-item">
            <span class="goal-amount-label">Remaining</span>
            <span class="goal-amount-value" style="color:#f59e0b">${formatCurrency(remaining)}</span>
          </div>
        </div>
        <div class="goal-actions">
          <button class="btn btn-primary btn-sm" data-contribute-id="${g.id}">+ Add Funds</button>
          <button class="btn btn-outline btn-sm" data-edit-goal-id="${g.id}">Edit</button>
        </div>
      </div>`;
  }).join('');
}

// ─── Modal System ─────────────────────────────
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalForm = document.getElementById('modal-form');
const confirmOverlay = document.getElementById('confirm-overlay');
let confirmCallback = null;

function openModal(title, fields, onSubmit) {
  modalTitle.textContent = title;
  modalForm.innerHTML = fields + `
    <div class="form-actions">
      <button type="button" class="btn btn-ghost modal-cancel-btn">Cancel</button>
      <button type="submit" class="btn btn-primary">Save</button>
    </div>`;
  modalOverlay.classList.add('open');
  modalForm.onsubmit = e => { e.preventDefault(); onSubmit(); closeModal(); };
  modalForm.querySelector('.modal-cancel-btn').onclick = closeModal;
}

function closeModal() { modalOverlay.classList.remove('open'); modalForm.onsubmit = null; }

function openConfirm(title, message, onOk) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  confirmOverlay.classList.add('open');
  confirmCallback = onOk;
}

function closeConfirm() { confirmOverlay.classList.remove('open'); confirmCallback = null; }

// ─── Transaction Modal ────────────────────────
function openTransactionModal(existing = null) {
  const isEdit = !!existing;
  const title = isEdit ? 'Edit Transaction' : 'Add Transaction';
  const type = existing?.type || 'expense';

  const categoryOptions = (catType) =>
    CATEGORIES[catType].map(c => `<option value="${c.id}" ${existing?.category === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('');

  const fields = `
    <div class="form-row">
      <div class="form-group">
        <label for="tx-type">Type</label>
        <select id="tx-type" class="input-field" required>
          <option value="expense" ${type === 'expense' ? 'selected' : ''}>Expense</option>
          <option value="income" ${type === 'income' ? 'selected' : ''}>Income</option>
          <option value="retirement" ${type === 'retirement' ? 'selected' : ''}>Retirement Contribution</option>
        </select>
      </div>
      <div class="form-group">
        <label for="tx-category">Category</label>
        <select id="tx-category" class="input-field" required>
          ${categoryOptions(type)}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="tx-description">Description</label>
      <input type="text" id="tx-description" class="input-field" placeholder="e.g. Monthly 401(k) contribution" value="${existing?.description || ''}" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="tx-amount">Amount ($)</label>
        <input type="number" id="tx-amount" class="input-field" placeholder="0.00" step="0.01" min="0.01" value="${existing?.amount || ''}" required>
      </div>
      <div class="form-group">
        <label for="tx-date">Date</label>
        <input type="date" id="tx-date" class="input-field" value="${existing?.date || new Date().toISOString().split('T')[0]}" required>
      </div>
    </div>`;

  openModal(title, fields, () => {
    const data = {
      type: document.getElementById('tx-type').value,
      category: document.getElementById('tx-category').value,
      description: document.getElementById('tx-description').value.trim(),
      amount: parseFloat(document.getElementById('tx-amount').value),
      date: document.getElementById('tx-date').value,
    };
    Store.dispatch(isEdit ? 'UPDATE_TRANSACTION' : 'ADD_TRANSACTION', isEdit ? { ...data, id: existing.id } : data);
  });

  document.getElementById('tx-type').addEventListener('change', function () {
    document.getElementById('tx-category').innerHTML = categoryOptions(this.value);
  });
}

// ─── Budget Modal ─────────────────────────────
function openBudgetModal(existing = null) {
  const isEdit = !!existing;
  const usedCats = Store.state.budgets.map(b => b.category);
  const availableCats = CATEGORIES.expense.filter(c => !usedCats.includes(c.id) || (existing && c.id === existing.category));
  if (availableCats.length === 0 && !isEdit) { openConfirm('All Categories Used', 'All expense categories have budgets.', () => {}); return; }

  const catOptions = availableCats.map(c => `<option value="${c.id}" ${existing?.category === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('');
  const fields = `
    <div class="form-group">
      <label for="budget-category">Category</label>
      <select id="budget-category" class="input-field" required ${isEdit ? 'disabled' : ''}>${catOptions}</select>
    </div>
    <div class="form-group">
      <label for="budget-limit">Monthly Limit ($)</label>
      <input type="number" id="budget-limit" class="input-field" placeholder="500.00" step="0.01" min="1" value="${existing?.limit || ''}" required>
    </div>`;

  openModal(isEdit ? 'Edit Budget' : 'Add Budget', fields, () => {
    const data = { category: isEdit ? existing.category : document.getElementById('budget-category').value, limit: parseFloat(document.getElementById('budget-limit').value) };
    Store.dispatch(isEdit ? 'UPDATE_BUDGET' : 'ADD_BUDGET', isEdit ? { ...data, id: existing.id } : data);
  });
}

// ─── Goal Modal ───────────────────────────────
function openGoalModal(existing = null) {
  const isEdit = !!existing;
  const fields = `
    <div class="form-group">
      <label for="goal-name">Goal Name</label>
      <input type="text" id="goal-name" class="input-field" placeholder="e.g. Emergency Fund" value="${existing?.name || ''}" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="goal-target">Target Amount ($)</label>
        <input type="number" id="goal-target" class="input-field" placeholder="5000" step="0.01" min="1" value="${existing?.target || ''}" required>
      </div>
      <div class="form-group">
        <label for="goal-deadline">Deadline (optional)</label>
        <input type="date" id="goal-deadline" class="input-field" value="${existing?.deadline || ''}">
      </div>
    </div>`;

  openModal(isEdit ? 'Edit Goal' : 'Add Goal', fields, () => {
    const data = { name: document.getElementById('goal-name').value.trim(), target: parseFloat(document.getElementById('goal-target').value), deadline: document.getElementById('goal-deadline').value || null };
    Store.dispatch(isEdit ? 'UPDATE_GOAL' : 'ADD_GOAL', isEdit ? { ...data, id: existing.id, current: existing.current } : data);
  });
}

function openContributionModal(goalId) {
  const goal = Store.state.goals.find(g => g.id === goalId);
  if (!goal) return;
  const remaining = goal.target - goal.current;
  const fields = `
    <div class="form-group">
      <label>Contributing to: <strong>${escapeHtml(goal.name)}</strong></label>
      <p style="color:var(--text-muted);font-size:0.85rem;margin-top:4px">${formatCurrency(goal.current)} of ${formatCurrency(goal.target)} saved (${formatCurrency(remaining)} remaining)</p>
    </div>
    <div class="form-group">
      <label for="contribute-amount">Amount ($)</label>
      <input type="number" id="contribute-amount" class="input-field" placeholder="100.00" step="0.01" min="0.01" max="${remaining}" required>
    </div>`;
  openModal('Add Funds', fields, () => {
    Store.dispatch('CONTRIBUTE_GOAL', { id: goalId, amount: parseFloat(document.getElementById('contribute-amount').value) });
  });
}

// ─── Navigation ───────────────────────────────
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + viewName)?.classList.add('active');
  document.querySelector(`.nav-btn[data-view="${viewName}"]`)?.classList.add('active');
  Store.dispatch('SET_VIEW', viewName);
}

// ─── Category Filter Dropdown ─────────────────
function populateCategoryFilter() {
  const select = document.getElementById('filter-category');
  const current = select.value;
  select.innerHTML = '<option value="all">All Categories</option>';
  ALL_CATEGORIES.forEach(c => { select.innerHTML += `<option value="${c.id}">${c.icon} ${c.name}</option>`; });
  select.value = current || 'all';
}

// ─── Event Listeners ──────────────────────────
function initEventListeners() {
  // Nav
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Month navigation
  document.getElementById('prev-month').addEventListener('click', () => {
    let { currentMonth: m, currentYear: y } = Store.state;
    m--; if (m < 0) { m = 11; y--; }
    Store.dispatch('SET_MONTH', { month: m, year: y });
  });
  document.getElementById('next-month').addEventListener('click', () => {
    let { currentMonth: m, currentYear: y } = Store.state;
    m++; if (m > 11) { m = 0; y++; }
    Store.dispatch('SET_MONTH', { month: m, year: y });
  });

  // Year navigation
  document.getElementById('prev-year').addEventListener('click', () => {
    Store.dispatch('SET_VIEW_YEAR', Store.state.viewYear - 1);
  });
  document.getElementById('next-year').addEventListener('click', () => {
    Store.dispatch('SET_VIEW_YEAR', Store.state.viewYear + 1);
  });

  // Add buttons
  document.getElementById('btn-add-transaction').addEventListener('click', () => openTransactionModal());
  document.getElementById('btn-add-budget').addEventListener('click', () => openBudgetModal());
  document.getElementById('btn-add-goal').addEventListener('click', () => openGoalModal());
  document.getElementById('btn-goto-transactions').addEventListener('click', () => switchView('transactions'));

  // Transaction edit/delete
  document.getElementById('transactions-tbody').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.action-btn.edit');
    const deleteBtn = e.target.closest('.action-btn.delete');
    if (editBtn) {
      const tx = Store.state.transactions.find(t => t.id === editBtn.dataset.id);
      if (tx) openTransactionModal(tx);
    }
    if (deleteBtn) {
      openConfirm('Delete Transaction', 'Are you sure you want to delete this transaction?', () => {
        Store.dispatch('DELETE_TRANSACTION', { id: deleteBtn.dataset.id });
      });
    }
  });

  // Budget edit/delete
  document.getElementById('budgets-grid').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.action-btn.edit[data-budget-id]');
    const deleteBtn = e.target.closest('.action-btn.delete[data-budget-id]');
    if (editBtn) { const b = Store.state.budgets.find(b => b.id === editBtn.dataset.budgetId); if (b) openBudgetModal(b); }
    if (deleteBtn) { openConfirm('Delete Budget', 'Remove this budget?', () => { Store.dispatch('DELETE_BUDGET', { id: deleteBtn.dataset.budgetId }); }); }
  });

  // Goal actions
  document.getElementById('goals-grid').addEventListener('click', (e) => {
    const contributeBtn = e.target.closest('[data-contribute-id]');
    const editBtn = e.target.closest('[data-edit-goal-id]');
    const deleteBtn = e.target.closest('.action-btn.delete[data-goal-id]');
    if (contributeBtn) openContributionModal(contributeBtn.dataset.contributeId);
    if (editBtn) { const g = Store.state.goals.find(g => g.id === editBtn.dataset.editGoalId); if (g) openGoalModal(g); }
    if (deleteBtn) { openConfirm('Delete Goal', 'Remove this savings goal?', () => { Store.dispatch('DELETE_GOAL', { id: deleteBtn.dataset.goalId }); }); }
  });

  // Filters
  document.getElementById('filter-type').addEventListener('change', () => renderTransactions(Store.state));
  document.getElementById('filter-category').addEventListener('change', () => renderTransactions(Store.state));
  document.getElementById('filter-search').addEventListener('input', () => renderTransactions(Store.state));

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  // Confirm
  document.getElementById('confirm-ok').addEventListener('click', () => { if (confirmCallback) confirmCallback(); closeConfirm(); });
  document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
  confirmOverlay.addEventListener('click', (e) => { if (e.target === confirmOverlay) closeConfirm(); });

  // Clear all
  document.getElementById('btn-clear-data').addEventListener('click', () => {
    openConfirm('Clear All Data', 'This will permanently delete all data. Are you sure?', () => { Store.dispatch('CLEAR_ALL'); });
  });

  // ESC
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeConfirm(); } });
}

// ─── Initialize ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  populateCategoryFilter();
  initEventListeners();

  Store.subscribe(state => {
    renderDashboard(state);
    renderYearly(state);
    renderTransactions(state);
    renderBudgets(state);
    renderGoals(state);
  });

  Store.init();
});
