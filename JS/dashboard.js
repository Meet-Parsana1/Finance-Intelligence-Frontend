/* ===============================
      GLOBAL CHART REFERENCES
================================ */
let categoryChart = null;
let monthlyTrendChart = null;
let profitTrendChart = null;
let incomeSourcesChart = null;
let dashboardExpensesCache = [];
let dashboardIncomeCache = [];
let plDateFilterState = {
      mode: '3m',
      customStart: '',
      customEnd: '',
};
let profitTrendFilterState = {
      mode: '3m',
      customStart: '',
      customEnd: '',
};
let incomeSourcesFilterState = {
      mode: '3m',
      customStart: '',
      customEnd: '',
};

/* ===============================
      PROTECT DASHBOARD
================================ */

if (typeof protectDashboard === 'function') {
      protectDashboard();
}

const token = localStorage.getItem('token');

if (!token) {
      window.location.href = 'login.html';
}

/* ===============================
      FORMAT HELPERS
================================ */
function formatCurrency(value) {
      return '\u20B9 ' + new Intl.NumberFormat('en-IN').format(value || 0);
}

function formatPercentage(value) {
      return (value || 0).toFixed(1) + '%';
}

function getRangeLabel(range) {
      const labels = {
            '15d': 'Last 15 Days',
            '1m': 'Last 1 Month',
            '2m': 'Last 2 Months',
            '3m': 'Last 3 Months',
            '6m': 'Last 6 Months',
            '1y': 'Last 1 Year',
            custom: 'Custom Range',
      };

      return labels[range] || range;
}

function getMonthlyBucketCount(range) {
      const bucketMap = {
            '2m': 2,
            '3m': 3,
            '6m': 6,
            '1y': 12,
      };

      return bucketMap[range] || 0;
}

function getRangeBoundary(range, endDate = new Date()) {
      const boundary = new Date(endDate);

      switch (range) {
            case '15d':
                  boundary.setDate(boundary.getDate() - 15);
                  break;
            case '1m':
                  boundary.setMonth(boundary.getMonth() - 1);
                  break;
            case '2m':
                  boundary.setMonth(boundary.getMonth() - 2);
                  break;
            case '3m':
                  boundary.setMonth(boundary.getMonth() - 3);
                  break;
            case '6m':
                  boundary.setMonth(boundary.getMonth() - 6);
                  break;
            case '1y':
                  boundary.setFullYear(boundary.getFullYear() - 1);
                  break;
            default:
                  boundary.setMonth(boundary.getMonth() - 3);
      }

      boundary.setHours(0, 0, 0, 0);
      return boundary;
}

function getRangeEndDate(endDate = new Date()) {
      const boundary = new Date(endDate);
      boundary.setHours(23, 59, 59, 999);
      return boundary;
}

function parseDashboardDate(value) {
      if (value instanceof Date) {
            return new Date(value.getTime());
      }

      if (typeof value === 'string') {
            const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

            if (dateMatch) {
                  const year = Number(dateMatch[1]);
                  const month = Number(dateMatch[2]);
                  const day = Number(dateMatch[3]);
                  return new Date(year, month - 1, day, 12, 0, 0, 0);
            }
      }

      return new Date(value);
}

function isSameMonthAsCurrent(dateValue, referenceDate = new Date()) {
      const parsedDate = parseDashboardDate(dateValue);
      if (Number.isNaN(parsedDate.getTime())) return false;

      return (
            parsedDate.getMonth() === referenceDate.getMonth() &&
            parsedDate.getFullYear() === referenceDate.getFullYear()
      );
}

function getLatestRecordDate(records = []) {
      const parsedDates = records
            .map((record) => parseDashboardDate(record?.date))
            .filter((date) => !Number.isNaN(date.getTime()))
            .sort((a, b) => b - a);

      return parsedDates[0] || null;
}

function resolveMonthlyReferenceDate(expenses = [], incomes = [], preferredDate = new Date()) {
      const combinedRecords = [...expenses, ...incomes];

      if (combinedRecords.some((record) => isSameMonthAsCurrent(record.date, preferredDate))) {
            return new Date(preferredDate);
      }

      return getLatestRecordDate(combinedRecords) || new Date(preferredDate);
}

function formatMonthYear(date) {
      return date.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
      });
}

function getMonthDateRange(referenceDate) {
      const parsedDate = parseDashboardDate(referenceDate);

      if (Number.isNaN(parsedDate.getTime())) {
            return null;
      }

      return {
            start: new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1),
            end: new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 0),
      };
}

function getCurrentMonthToDateRange(referenceDate = new Date()) {
      const parsedDate = parseDashboardDate(referenceDate);

      if (Number.isNaN(parsedDate.getTime())) {
            return null;
      }

      const start = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(parsedDate);
      end.setHours(23, 59, 59, 999);

      return { start, end };
}

function getMonthEntries(records = [], referenceDate = new Date()) {
      const parsedReference = parseDashboardDate(referenceDate);

      if (Number.isNaN(parsedReference.getTime())) {
            return [];
      }

      return records.filter((record) => {
            const parsedDate = parseDashboardDate(record?.date);

            return (
                  !Number.isNaN(parsedDate.getTime()) &&
                  parsedDate.getMonth() === parsedReference.getMonth() &&
                  parsedDate.getFullYear() === parsedReference.getFullYear()
            );
      });
}

function updateSelectedRangeLabel(range, id) {
      const endDate = getRangeEndDate(new Date());
      updateDateLabel(getRangeBoundary(range, endDate), endDate, id);
}

function buildExactMonthlyTrendSeries(data = [], range, endDate = new Date()) {
      const bucketCount = getMonthlyBucketCount(range);
      const safeEndDate = parseDashboardDate(endDate);

      if (!bucketCount || Number.isNaN(safeEndDate.getTime())) {
            return { labels: [], values: [], startDate: null, endDate: safeEndDate };
      }

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyTotals = new Map();

      data.forEach((entry) => {
            if (!entry?._id?.year || !entry?._id?.month) return;
            const key = `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`;
            monthlyTotals.set(key, Number(entry.total) || 0);
      });

      const labels = [];
      const values = [];
      const startDate = new Date(safeEndDate.getFullYear(), safeEndDate.getMonth() - (bucketCount - 1), 1);

      for (let offset = bucketCount - 1; offset >= 0; offset -= 1) {
            const bucketDate = new Date(safeEndDate.getFullYear(), safeEndDate.getMonth() - offset, 1);
            const key = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, '0')}`;

            labels.push(`${monthNames[bucketDate.getMonth()]} ${bucketDate.getFullYear()}`);
            values.push(monthlyTotals.get(key) || 0);
      }

      return {
            labels,
            values,
            startDate,
            endDate: safeEndDate,
      };
}

function getRecordHistoryStats(records = []) {
      if (!records.length) {
            return {
                  hasData: false,
                  earliest: null,
                  latest: null,
                  spanDays: 0,
                  spanMonths: 0,
            };
      }

      const timestamps = records
            .map((record) => parseDashboardDate(record.date))
            .filter((date) => !Number.isNaN(date.getTime()))
            .sort((a, b) => a - b);

      if (!timestamps.length) {
            return {
                  hasData: false,
                  earliest: null,
                  latest: null,
                  spanDays: 0,
                  spanMonths: 0,
            };
      }

      const earliest = timestamps[0];
      const latest = timestamps[timestamps.length - 1];
      const spanDays = Math.floor((latest - earliest) / (1000 * 60 * 60 * 24)) + 1;
      const spanMonths = (latest.getFullYear() - earliest.getFullYear()) * 12 + (latest.getMonth() - earliest.getMonth()) + 1;

      return {
            hasData: true,
            earliest,
            latest,
            spanDays,
            spanMonths,
      };
}

function hasEnoughHistoryForRange(result, range, mode = 'generic', records = dashboardExpensesCache) {
      const stats = getRecordHistoryStats(records);

      if (!stats.hasData) return false;

      if (range === '15d') return stats.spanDays >= 15;
      if (range === '1m') return stats.spanDays >= 28 || stats.spanMonths >= 1;

      const requiredMonths = {
            '2m': 2,
            '3m': 3,
            '6m': 6,
            '1y': 12,
      };

      if (requiredMonths[range]) {
            return stats.spanMonths >= requiredMonths[range];
      }

      const explicitFlag = typeof result?.hasSufficientHistory === 'boolean' ? result.hasSufficientHistory : null;
      if (explicitFlag !== null) return explicitFlag;

      return true;
}

function destroyChartInstance(chartRefName) {
      if (chartRefName === 'categoryChart' && categoryChart) {
            categoryChart.destroy();
            categoryChart = null;
      }

      if (chartRefName === 'monthlyTrendChart' && monthlyTrendChart) {
            monthlyTrendChart.destroy();
            monthlyTrendChart = null;
      }

      if (chartRefName === 'profitTrendChart' && profitTrendChart) {
            profitTrendChart.destroy();
            profitTrendChart = null;
      }

      if (chartRefName === 'incomeSourcesChart' && incomeSourcesChart) {
            incomeSourcesChart.destroy();
            incomeSourcesChart = null;
      }
}

function setChartEmptyState(canvasId, chartRefName, title, description) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      destroyChartInstance(chartRefName);

      const wrap = canvas.closest('.chart-wrap');
      if (!wrap) return;

      wrap.classList.add('chart-wrap--empty');
      canvas.style.display = 'none';

      let state = wrap.querySelector('.chart-empty-state');

      if (!state) {
            state = document.createElement('div');
            state.className = 'chart-empty-state';
            wrap.appendChild(state);
      }

      state.innerHTML = `
            <div class="chart-empty-icon">\u231B</div>
            <h5>${title}</h5>
            <p>${description}</p>
      `;
}

function clearChartEmptyState(canvasId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const wrap = canvas.closest('.chart-wrap');
      if (!wrap) return;

      wrap.classList.remove('chart-wrap--empty');
      canvas.style.display = '';

      const state = wrap.querySelector('.chart-empty-state');
      if (state) state.remove();
}

function filterRecordsByRange(records, range) {
      const endDate = getRangeEndDate(new Date());
      const boundary = getRangeBoundary(range, endDate);

      return records.filter((record) => {
            const recordDate = parseDashboardDate(record.date);
            return !Number.isNaN(recordDate.getTime()) && recordDate >= boundary && recordDate <= endDate;
      });
}

function buildMonthlyAmountMap(records, keyName) {
      const map = new Map();

      records.forEach((record) => {
            const date = parseDashboardDate(record.date);
            if (Number.isNaN(date.getTime())) return;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            map.set(key, (map.get(key) || 0) + Number(record[keyName] ?? record.amount ?? 0));
      });

      return map;
}

function buildMonthlyBusinessSeries(expenses, incomes) {
      const expenseMap = buildMonthlyAmountMap(expenses, 'amount');
      const incomeMap = buildMonthlyAmountMap(incomes, 'amount');
      const keys = Array.from(new Set([...expenseMap.keys(), ...incomeMap.keys()])).sort();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      return {
            labels: keys.map((key) => {
                  const [year, month] = key.split('-').map(Number);
                  return `${monthNames[month - 1]} ${year}`;
            }),
            incomeValues: keys.map((key) => incomeMap.get(key) || 0),
            expenseValues: keys.map((key) => expenseMap.get(key) || 0),
            profitValues: keys.map((key) => (incomeMap.get(key) || 0) - (expenseMap.get(key) || 0)),
      };
}

function updateRangeLabelFromRecords(records, fallbackStart, fallbackEnd, id) {
      if (!records.length) {
            updateDateLabel(fallbackStart, fallbackEnd, id);
            return;
      }

      updateDateLabel(fallbackStart, fallbackEnd, id);
}

function truncateLabel(label, maxLength = 22) {
      if (!label) return 'Untitled';
      return label.length > maxLength ? `${label.slice(0, maxLength - 1)}...` : label;
}

function prepareRankedBreakdown(entries, limit = 6, othersLabel = 'Others') {
      const sortedEntries = [...entries].sort((a, b) => b[1] - a[1]);
      const primaryEntries = sortedEntries.slice(0, limit);
      const remainingEntries = sortedEntries.slice(limit);
      const othersTotal = remainingEntries.reduce((sum, entry) => sum + entry[1], 0);

      if (othersTotal > 0) {
            primaryEntries.push([othersLabel, othersTotal]);
      }

      return primaryEntries;
}

function getPLSignalLevel(sharePercent, kind = 'expense') {
      if (kind === 'expense') {
            if (sharePercent >= 35) return { label: 'High weight', className: 'pl-signal-pill--high' };
            if (sharePercent >= 18) return { label: 'Watch closely', className: 'pl-signal-pill--medium' };
            return { label: 'Healthy mix', className: 'pl-signal-pill--healthy' };
      }

      if (sharePercent >= 30) return { label: 'Core driver', className: 'pl-signal-pill--healthy' };
      if (sharePercent >= 15) return { label: 'Growth source', className: 'pl-signal-pill--medium' };
      return { label: 'Supporting', className: 'pl-signal-pill--high' };
}

function setTextContent(id, value) {
      const element = document.getElementById(id);
      if (element) {
            element.textContent = value;
      }
}

function setPLEmptyState(isVisible, title = '', body = '') {
      const emptyState = document.getElementById('plEmptyState');
      const emptyStateTitle = document.getElementById('plEmptyStateTitle');
      const emptyStateBody = document.getElementById('plEmptyStateBody');

      if (!emptyState) return;

      emptyState.classList.toggle('hidden', !isVisible);

      if (emptyStateTitle) {
            emptyStateTitle.textContent = title;
      }

      if (emptyStateBody) {
            emptyStateBody.textContent = body;
      }
}

function formatDateShort(dateValue) {
      const parsed = parseDashboardDate(dateValue);
      if (Number.isNaN(parsed?.getTime?.())) return '--';

      return parsed.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
      });
}

function filterRecordsByDateWindow(records, startDate, endDate) {
      return records.filter((record) => {
            const recordDate = parseDashboardDate(record.date);
            return !Number.isNaN(recordDate.getTime()) && recordDate >= startDate && recordDate <= endDate;
      });
}

function getPLDateWindow() {
      return getDateWindowForMode(plDateFilterState.mode, plDateFilterState.customStart, plDateFilterState.customEnd);
}

function getDateWindowForMode(mode, customStart = '', customEnd = '') {
      if (mode === 'custom') {
            if (!customStart || !customEnd) {
                  return null;
            }

            const startDate = parseDashboardDate(customStart);
            const endDate = parseDashboardDate(customEnd);

            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
                  return null;
            }

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            return {
                  startDate,
                  endDate,
                  label: 'Custom Range',
            };
      }

      const endDate = getRangeEndDate(new Date());
      const startDate = getRangeBoundary(mode, endDate);

      return {
            startDate,
            endDate,
            label: getRangeLabel(mode),
      };
}

function getPLFilteredData(expenses = [], incomes = []) {
      const activeWindow = getPLDateWindow();

      if (!activeWindow) {
            return {
                  activeWindow: null,
                  filteredExpenses: [],
                  filteredIncomes: [],
            };
      }

      return {
            activeWindow,
            filteredExpenses: filterRecordsByDateWindow(expenses, activeWindow.startDate, activeWindow.endDate),
            filteredIncomes: filterRecordsByDateWindow(incomes, activeWindow.startDate, activeWindow.endDate),
      };
}

async function loadCategoryChart(range) {
      const res = await fetch(`https://finance-intelligence-q3zx.onrender.com/api/expenses/category-summary?range=${range}`, {
            headers: { Authorization: 'Bearer ' + token },
      });

      const result = await res.json();

      if (!result || !result.data) {
            console.error('Category API failed', result);
            return;
      }

      const labels = result.data.map((d) => d._id);
      const values = result.data.map((d) => d.total);

      updateSelectedRangeLabel(range, 'chartDateRange');

      if (!hasEnoughHistoryForRange(result, range, 'category')) {
            setChartEmptyState(
                  'categoryChart',
                  'categoryChart',
                  'Not enough history yet',
                  `Expense Distribution needs at least ${getRangeLabel(range)} of expense history before it can be shown.`,
            );
            return;
      }

      if (!values.length) {
            setChartEmptyState(
                  'categoryChart',
                  'categoryChart',
                  'No expenses in this window',
                  `There are no expenses recorded in the selected ${getRangeLabel(range)} range.`,
            );
            return;
      }

      renderTopCategoryChartFromAPI(labels, values);
}

async function loadMonthlyTrend(range) {
      const res = await fetch(`https://finance-intelligence-q3zx.onrender.com/api/expenses/monthly-summary?range=${range}`, {
            headers: { Authorization: 'Bearer ' + token },
      });

      const result = await res.json();

      if (!result || !result.data) {
            console.error('Monthly API failed', result);
            return;
      }

      const selectedEndDate = getRangeEndDate(new Date());
      const selectedStartDate = getRangeBoundary(range, selectedEndDate);
      const bucketCount = getMonthlyBucketCount(range);
      const series = bucketCount
            ? buildExactMonthlyTrendSeries(result.data, range, selectedEndDate)
            : { labels: [], values: [] };
      const labels = bucketCount
            ? series.labels
            : result.data.map((d) => (d?._id?.month ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d._id.month - 1]} ${d._id.year}` : 'Unknown'));
      const values = bucketCount ? series.values : result.data.map((d) => d.total);

      updateDateLabel(selectedStartDate, selectedEndDate, 'trendDateRange');

      if (!hasEnoughHistoryForRange(result, range, 'monthly')) {
            setChartEmptyState(
                  'monthlyTrendChart',
                  'monthlyTrendChart',
                  'Not enough history yet',
                  `Monthly Trend needs at least ${getRangeLabel(range)} of expense history before it can be shown.`,
            );
            return;
      }

      if (!values.some((value) => value > 0)) {
            setChartEmptyState(
                  'monthlyTrendChart',
                  'monthlyTrendChart',
                  'No expenses in this window',
                  `There are no expenses recorded in the selected ${getRangeLabel(range)} range.`,
            );
            return;
      }

      renderMonthlyTrendChartFromAPI(labels, values);
}

function updateDateLabel(start, end, id) {
      const el = document.getElementById(id);

      if (!el) return;

      const s = new Date(start).toLocaleDateString('en-IN');
      const e = new Date(end).toLocaleDateString('en-IN');

      el.textContent = `${s} to ${e}`;
}

function updateBudgetUI(monthlyBudget, editCount = 0, spent = 0, initialBudget = 0) {
      const btn = document.getElementById('budgetBtn');
      const input = document.getElementById('budgetInput');
      const status = document.getElementById('budgetStatus');

      if (!btn || !input) return;

      // Autofill input
      if (monthlyBudget) {
            input.value = monthlyBudget;
      }

      // If no budget
      if (!monthlyBudget) {
            btn.textContent = 'Set Budget';
            btn.disabled = false;
            btn.dataset.budgetMode = 'create';
            status.textContent = '';
            return;
      }

      // Rule 1: Lock only if strictly greater than 50%
      const isLockedBySpending = spent > initialBudget * 0.5 && editCount >= 1;

      // Rule 2: Max 3 edits
      const isEditLimitReached = editCount >= 3;

      if (isLockedBySpending || isEditLimitReached) {
            btn.textContent = 'Locked';
            btn.disabled = true;

            if (isEditLimitReached) {
                  status.textContent = 'Edit limit reached (max 3)';
            } else {
                  status.textContent = 'Budget locked after 50% spending';
            }
            return;
      }

      // Editable state
      btn.textContent = 'Update Budget';
      btn.disabled = false;
      btn.dataset.budgetMode = 'update';

      status.textContent = `Edits left: ${3 - editCount} / 3`;
}

function formatDate(dateString) {
      const date = new Date(dateString);

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
}

/* ===============================
      THEME COLORS
================================ */
function isDarkTheme() {
      return (
            document.documentElement.getAttribute('data-theme') === 'dark' ||
            document.body.getAttribute('data-theme') === 'dark'
      );
}

function getChartColors() {
      const isDark = isDarkTheme();

      return {
            isDark,
            text: isDark ? '#9ca3af' : '#6b7280',
            textStrong: isDark ? '#e6e6e6' : '#0f172a',
            grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            cardBg: isDark ? '#141414' : '#ffffff',
            palette: [
                  '#3b82f6', // blue
                  '#22c55e', // green
                  '#f59e0b', // amber
                  '#ec4899', // pink
                  '#8b5cf6', // violet
                  '#06b6d4', // cyan
                  '#f97316', // orange
                  '#a3e635', // lime
                  '#e879f9', // fuchsia
                  '#38bdf8', // sky
            ],
      };
}

function getTooltipTheme() {
      const isDark = isDarkTheme();

      return {
            enabled: true,
            backgroundColor: isDark ? '#1c1c1c' : '#ffffff',
            titleColor: isDark ? '#f3f4f6' : '#111827',
            bodyColor: isDark ? '#9ca3af' : '#6b7280',
            borderColor: isDark ? '#2a2a2a' : '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            displayColors: true,
            boxPadding: 4,
            callbacks: {
                  label: function (context) {
                        const val = context.parsed ?? context.raw;
                        const num = typeof val === 'object' ? val.y : val;
                        return '  \u20B9 ' + new Intl.NumberFormat('en-IN').format(num || 0);
                  },
            },
      };
}

function formatCurrencyValue(value) {
      return '\u20b9 ' + new Intl.NumberFormat('en-IN').format(value || 0);
}

function formatCompactCurrency(value) {
      return (
            '\u20b9 ' +
            new Intl.NumberFormat('en-IN', {
                  notation: 'compact',
                  maximumFractionDigits: value >= 100000 ? 1 : 0,
            }).format(value || 0)
      );
}

function formatInsightCurrencyValue(value) {
      const numericValue = Number(String(value).replace(/,/g, ''));

      if (Number.isNaN(numericValue)) {
            return value;
      }

      return '\u20b9' + new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
      }).format(numericValue);
}

function normalizeInsightText(text = '') {
      if (!text) return '';

      return String(text)
            .replace(/(?:USD|\$)\s?(\d[\d,]*(?:\.\d+)?)/gi, (_, amount) => formatInsightCurrencyValue(amount))
            .replace(/(?:INR|Rs\.?|\u20B9)\s?(\d[\d,]*(?:\.\d+)?)/gi, (_, amount) => formatInsightCurrencyValue(amount));
}

const doughnutCenterTextPlugin = {
      id: 'doughnutCenterText',
      afterDraw(chart, args, options) {
            const { ctx, chartArea } = chart;
            if (!chartArea || !options?.valueText) return;

            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = options.valueColor || '#e6e6e6';
            ctx.font = '600 18px Poppins, sans-serif';
            ctx.fillText(options.valueText, centerX, centerY - 10);
            ctx.fillStyle = options.labelColor || '#9ca3af';
            ctx.font = '500 12px Inter, sans-serif';
            ctx.fillText(options.labelText || '', centerX, centerY + 14);
            ctx.restore();
      },
};

function renderTopCategoryChartFromAPI(labels, values) {
      const ctx = document.getElementById('categoryChart');
      if (!ctx) return;
      clearChartEmptyState('categoryChart');
      if (!values.length) {
            console.warn('No category data available');
            if (categoryChart) {
                  categoryChart.destroy();
                  categoryChart = null;
            }
            return;
      }
      const { text, textStrong, palette, cardBg } = getChartColors();
      if (categoryChart) categoryChart.destroy();
      const total = values.length ? values.reduce((a, b) => a + b, 0) : 0;
      const topCategory = labels[0] || 'Expenses';
      categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                  labels,
                  datasets: [
                        {
                              data: values,
                              backgroundColor: palette,
                              borderWidth: 3,
                              borderColor: cardBg,
                              hoverOffset: 10,
                              spacing: 2,
                        },
                  ],
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '62%',
                  layout: {
                        padding: {
                              top: 8,
                              bottom: 8,
                        },
                  },
                  plugins: {
                        legend: {
                              position: 'top',
                              align: 'center',
                              labels: {
                                    color: text,
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    boxWidth: 10,
                                    boxHeight: 10,
                                    padding: 18,
                                    font: { size: 12, family: 'Inter' },
                              },
                        },
                        tooltip: {
                              ...getTooltipTheme(),
                              callbacks: {
                                    label: (c) => {
                                          const val = c.parsed;
                                          const pct = ((val / total) * 100).toFixed(1);
                                          return formatCurrencyValue(val) + ' (' + pct + '%)';
                                    },
                              },
                        },
                        doughnutCenterText: {
                              valueText: formatCompactCurrency(total),
                              labelText: topCategory,
                              valueColor: textStrong,
                              labelColor: text,
                        },
                  },
                  animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 850,
                        easing: 'easeOutQuart',
                  },
            },
            plugins: [doughnutCenterTextPlugin],
      });
}
function renderMonthlyTrendChartFromAPI(labels, values) {
      const ctx = document.getElementById('monthlyTrendChart');
      if (!ctx) return;
      clearChartEmptyState('monthlyTrendChart');
      const { text, textStrong, grid, isDark } = getChartColors();
      if (monthlyTrendChart) monthlyTrendChart.destroy();
      const trendCtx = ctx.getContext('2d');
      const gradient = trendCtx.createLinearGradient(0, 0, 0, 320);
      if (isDark) {
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.95)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.28)');
      } else {
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.92)');
            gradient.addColorStop(1, 'rgba(96, 165, 250, 0.28)');
      }
      monthlyTrendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                  labels,
                  datasets: [
                        {
                              label: 'Monthly Expenses',
                              data: values,
                              backgroundColor: gradient,
                              borderColor: isDark ? 'rgba(96, 165, 250, 0.95)' : 'rgba(37, 99, 235, 1)',
                              borderWidth: 1,
                              borderRadius: 14,
                              borderSkipped: false,
                              barPercentage: 0.7,
                              categoryPercentage: 0.72,
                              maxBarThickness: 56,
                        },
                  ],
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                        legend: {
                              display: true,
                              position: 'top',
                              align: 'end',
                              labels: {
                                    color: textStrong,
                                    usePointStyle: true,
                                    pointStyle: 'rectRounded',
                                    boxWidth: 14,
                                    boxHeight: 8,
                                    padding: 16,
                                    font: { size: 12, family: 'Inter' },
                              },
                        },
                        tooltip: {
                              ...getTooltipTheme(),
                              callbacks: {
                                    label: (context) => formatCurrencyValue(context.parsed.y),
                              },
                        },
                  },
                  scales: {
                        x: {
                              offset: true,
                              ticks: {
                                    color: text,
                                    font: { size: 12, family: 'Inter' },
                                    maxRotation: 0,
                                    minRotation: 0,
                              },
                              grid: { display: false },
                              border: { display: false },
                        },
                        y: {
                              beginAtZero: true,
                              ticks: {
                                    color: text,
                                    font: { size: 12, family: 'Inter' },
                                    padding: 10,
                                    callback: (value) =>
                                          '\u20b9' +
                                          new Intl.NumberFormat('en-IN', {
                                                notation: 'compact',
                                                maximumFractionDigits: 1,
                                          }).format(value),
                              },
                              grid: {
                                    color: grid,
                                    drawBorder: false,
                              },
                              border: { display: false },
                        },
                  },
                  animation: {
                        duration: 800,
                        easing: 'easeOutCubic',
                  },
            },
      });
}
/* ===============================
      DOM READY
================================ */
document.addEventListener('DOMContentLoaded', async () => {
      const rangeSelect = document.getElementById('timeRange');
      const trendSelect = document.getElementById('trendRange');
      const profitTrendRange = document.getElementById('profitTrendRange');
      const incomeSourcesRange = document.getElementById('incomeSourcesRange');
      const salaryPlRange = document.getElementById('salaryPlRange');
      const salaryPlDateRange = document.getElementById('salaryPlDateRange');
      const salaryPlCustomRange = document.getElementById('salaryPlCustomRange');
      const salaryPlCustomStart = document.getElementById('salaryPlCustomStart');
      const salaryPlCustomEnd = document.getElementById('salaryPlCustomEnd');
      const salaryPlCustomApply = document.getElementById('salaryPlCustomApply');
      const salaryPlEmptyState = document.getElementById('salaryPlEmptyState');
      const salaryPlEmptyTitle = document.getElementById('salaryPlEmptyTitle');
      const salaryPlEmptyBody = document.getElementById('salaryPlEmptyBody');
      const salaryPlGrid = document.querySelector('.dashboard-pl .pl-grid');
      const salaryPlFilterState = {
            mode: 'current',
            customStart: '',
            customEnd: '',
      };

      if (rangeSelect) {
            rangeSelect.addEventListener('change', () => {
                  loadCategoryChart(rangeSelect.value);
            });
      }

      if (trendSelect) {
            trendSelect.addEventListener('change', () => {
                  loadMonthlyTrend(trendSelect.value);
            });
      }

      const plDatePreset = document.getElementById('plDatePreset');
      const plCustomRange = document.getElementById('plCustomRange');
      const plCustomStart = document.getElementById('plCustomStart');
      const plCustomEnd = document.getElementById('plCustomEnd');
      const plCustomApply = document.getElementById('plCustomApply');
      const profitTrendCustomRange = document.getElementById('profitTrendCustomRange');
      const profitTrendCustomStart = document.getElementById('profitTrendCustomStart');
      const profitTrendCustomEnd = document.getElementById('profitTrendCustomEnd');
      const profitTrendCustomApply = document.getElementById('profitTrendCustomApply');
      const incomeSourcesCustomRange = document.getElementById('incomeSourcesCustomRange');
      const incomeSourcesCustomStart = document.getElementById('incomeSourcesCustomStart');
      const incomeSourcesCustomEnd = document.getElementById('incomeSourcesCustomEnd');
      const incomeSourcesCustomApply = document.getElementById('incomeSourcesCustomApply');

      function syncPLRangeSelectors() {
            if (plDatePreset) {
                  plDatePreset.value = plDateFilterState.mode;
            }

            if (plCustomStart) {
                  plCustomStart.value = plDateFilterState.customStart;
            }

            if (plCustomEnd) {
                  plCustomEnd.value = plDateFilterState.customEnd;
            }
      }

      function togglePLCustomRange() {
            if (!plCustomRange) return;
            plCustomRange.classList.toggle('hidden', plDateFilterState.mode !== 'custom');
      }

      function toggleChartCustomRange(container, mode) {
            if (!container) return;
            container.classList.toggle('hidden', mode !== 'custom');
      }

      function syncChartCustomInputs() {
            if (profitTrendCustomStart) {
                  profitTrendCustomStart.value = profitTrendFilterState.customStart;
            }
            if (profitTrendCustomEnd) {
                  profitTrendCustomEnd.value = profitTrendFilterState.customEnd;
            }
            if (incomeSourcesCustomStart) {
                  incomeSourcesCustomStart.value = incomeSourcesFilterState.customStart;
            }
            if (incomeSourcesCustomEnd) {
                  incomeSourcesCustomEnd.value = incomeSourcesFilterState.customEnd;
            }
      }

      function renderMSMEPLSection() {
            renderPLTables(dashboardExpensesCache, dashboardIncomeCache);
            renderPLCharts(dashboardExpensesCache, dashboardIncomeCache);
      }

      function applyPLFilterMode(mode) {
            plDateFilterState.mode = mode;
            syncPLRangeSelectors();
            togglePLCustomRange();

            if (plDateFilterState.mode !== 'custom') {
                  renderMSMEPLSection();
            }
      }

      if (plDatePreset) {
            plDatePreset.addEventListener('change', () => {
                  applyPLFilterMode(plDatePreset.value);
            });
      }

      if (plCustomApply) {
            plCustomApply.addEventListener('click', () => {
                  const startValue = plCustomStart?.value || '';
                  const endValue = plCustomEnd?.value || '';

                  if (!startValue || !endValue) {
                        alert('Please select both start and end dates for the custom range.');
                        return;
                  }

                  if (startValue > endValue) {
                        alert('The custom start date must be earlier than the end date.');
                        return;
                  }

                  plDateFilterState.customStart = startValue;
                  plDateFilterState.customEnd = endValue;
                  syncPLRangeSelectors();
                  renderMSMEPLSection();
            });
      }

      if (profitTrendRange) {
            profitTrendFilterState.mode = profitTrendRange.value || '3m';
            profitTrendRange.addEventListener('change', () => {
                  profitTrendFilterState.mode = profitTrendRange.value || '3m';
                  toggleChartCustomRange(profitTrendCustomRange, profitTrendFilterState.mode);
                  renderProfitTrendChart(dashboardExpensesCache, dashboardIncomeCache);
            });
      }

      if (incomeSourcesRange) {
            incomeSourcesFilterState.mode = incomeSourcesRange.value || '3m';
            incomeSourcesRange.addEventListener('change', () => {
                  incomeSourcesFilterState.mode = incomeSourcesRange.value || '3m';
                  toggleChartCustomRange(incomeSourcesCustomRange, incomeSourcesFilterState.mode);
                  renderIncomeSourcesChart(dashboardIncomeCache);
            });
      }

      if (profitTrendCustomApply) {
            profitTrendCustomApply.addEventListener('click', () => {
                  const startValue = profitTrendCustomStart?.value || '';
                  const endValue = profitTrendCustomEnd?.value || '';

                  if (!startValue || !endValue) {
                        alert('Please select both start and end dates for the profitability trend custom range.');
                        return;
                  }

                  if (startValue > endValue) {
                        alert('The profitability trend start date must be earlier than the end date.');
                        return;
                  }

                  profitTrendFilterState.customStart = startValue;
                  profitTrendFilterState.customEnd = endValue;
                  syncChartCustomInputs();
                  renderProfitTrendChart(dashboardExpensesCache, dashboardIncomeCache);
            });
      }

      if (incomeSourcesCustomApply) {
            incomeSourcesCustomApply.addEventListener('click', () => {
                  const startValue = incomeSourcesCustomStart?.value || '';
                  const endValue = incomeSourcesCustomEnd?.value || '';

                  if (!startValue || !endValue) {
                        alert('Please select both start and end dates for the income sources custom range.');
                        return;
                  }

                  if (startValue > endValue) {
                        alert('The income sources start date must be earlier than the end date.');
                        return;
                  }

                  incomeSourcesFilterState.customStart = startValue;
                  incomeSourcesFilterState.customEnd = endValue;
                  syncChartCustomInputs();
                  renderIncomeSourcesChart(dashboardIncomeCache);
            });
      }

      syncPLRangeSelectors();
      syncChartCustomInputs();
      togglePLCustomRange();
      toggleChartCustomRange(profitTrendCustomRange, profitTrendFilterState.mode);
      toggleChartCustomRange(incomeSourcesCustomRange, incomeSourcesFilterState.mode);

      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (!user || !user.role) return;

      const role = user.role;
      // const token = localStorage.getItem('token');

      const res = await fetch('https://finance-intelligence-q3zx.onrender.com/api/expenses', {
            headers: {
                  Authorization: 'Bearer ' + token,
            },
      });

      const expenses = await res.json();
      dashboardExpensesCache = Array.isArray(expenses) ? expenses : [];

      const incomeRes = await fetch('https://finance-intelligence-q3zx.onrender.com/api/income', {
            headers: {
                  Authorization: 'Bearer ' + token,
            },
      });

      const incomes = await incomeRes.json();
      dashboardIncomeCache = Array.isArray(incomes) ? incomes : [];

            applyRoleUI();
            showOnboardingMessage();
            renderSalaryLaunchpad(expenses, incomes);
            renderMSMELaunchpad(expenses, incomes);
            renderKPIs(expenses, incomes);
            renderRecentExpenses(expenses);
            renderRecentIncomes(incomes);

      // New system
      setTimeout(() => {
            loadCategoryChart('3m');
            loadMonthlyTrend('3m');
      }, 100);

      await loadInsights(expenses, incomes);

      // === SALARIED + MSME ONLY
      if (role === 'salaried' || role === 'msme') {
            updatePLSummary(expenses, incomes);
      }

      // === MSME ONLY
      if (role === 'msme') {
            renderCashFlow(expenses, incomes);
            renderMSMEPLSection();
      }

      if (role === 'student') {
            const budgetRes = await fetch('https://finance-intelligence-q3zx.onrender.com/api/budget', {
                  headers: {
                        Authorization: 'Bearer ' + token,
                  },
            });

            const budgetData = await budgetRes.json();

            renderStudentLaunchpad(expenses, incomes, budgetData.monthlyBudget);
            renderStudentDashboard(expenses, budgetData.monthlyBudget);

            // Add below

            const monthlyExpenses = expenses.filter((e) => {
                  return isSameMonthAsCurrent(e.date);
            });

            const spent = monthlyExpenses.reduce((s, e) => s + Number(e.amount), 0);

            updateBudgetUI(budgetData.monthlyBudget, budgetData.editCount || 0, spent, budgetData.initialBudget);
      }

      if (role === 'salaried') {
            renderSalariedDashboard(expenses, incomes);
      }

      if (role === 'salaried' && salaryPlRange) {
            salaryPlRange.addEventListener('change', () => {
                  salaryPlFilterState.mode = salaryPlRange.value;

                  if (salaryPlCustomRange) {
                        salaryPlCustomRange.classList.toggle('hidden', salaryPlRange.value !== 'custom');
                  }

                  updatePLSummary(expenses, incomes);
            });

            if (salaryPlCustomStart) {
                  salaryPlCustomStart.addEventListener('change', () => {
                        salaryPlFilterState.customStart = salaryPlCustomStart.value;
                  });
            }

            if (salaryPlCustomEnd) {
                  salaryPlCustomEnd.addEventListener('change', () => {
                        salaryPlFilterState.customEnd = salaryPlCustomEnd.value;
                  });
            }

            if (salaryPlCustomApply) {
                  salaryPlCustomApply.addEventListener('click', () => {
                        salaryPlFilterState.customStart = salaryPlCustomStart?.value || '';
                        salaryPlFilterState.customEnd = salaryPlCustomEnd?.value || '';
                        updatePLSummary(expenses, incomes);
                  });
            }
      }

      // === RE-RENDER ALL CHARTS ON THEME TOGGLE ===
      const themeObserver = new MutationObserver(() => {
            setTimeout(() => {
                  loadCategoryChart(rangeSelect?.value || '3m');
                  loadMonthlyTrend(trendSelect?.value || '3m');
            }, 100);
            if (role === 'msme') renderMSMEPLSection();
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

      /* ===============================
            ROLE-BASED UI
  ================================ */
      function applyRoleUI() {
            document.querySelectorAll('[data-role]').forEach((el) => {
                  const allowed = el.dataset.role.split(' ');
                  el.style.display = allowed.includes(role) ? '' : 'none';
            });
      }

      function showOnboardingMessage() {
            const title = document.getElementById('welcomeTitle');
            const text = document.getElementById('welcomeText');

            const map = {
                  student: [`Welcome, ${user.name}`, 'Track your spending and stay within your budget.'],
                  salaried: [`Welcome back, ${user.name}`, 'Monitor salary and expenses with clarity.'],
                  msme: [`Welcome, ${user.name}`, 'Analyze revenue and grow profitably.'],
            };

            if (title && text && map[role]) {
                  title.textContent = map[role][0];
                  text.textContent = map[role][1];
            }
      }

      function renderMSMELaunchpad(expenses, incomes) {
            const launchpad = document.getElementById('msmeLaunchpad');
            const launchpadCopy = document.getElementById('msmeLaunchpadCopy');

            if (!launchpad || role !== 'msme') return;

            const hasExpenses = Array.isArray(expenses) && expenses.length > 0;
            const hasIncomes = Array.isArray(incomes) && incomes.length > 0;
            const shouldShowLaunchpad = !hasExpenses && !hasIncomes;

            launchpad.classList.toggle('hidden', !shouldShowLaunchpad);

            if (launchpadCopy) {
                  launchpadCopy.textContent = shouldShowLaunchpad
                        ? 'Start by recording your first business income and expense so the dashboard can unlock cash flow, profitability, and operating insights.'
                        : 'Your MSME dashboard is active. Keep recording business income and operating costs to sharpen trends, cash flow, and profitability signals.';
            }
      }

      function renderSalaryLaunchpad(expenses, incomes) {
            const launchpad = document.getElementById('salaryLaunchpad');
            const launchpadCopy = document.getElementById('salaryLaunchpadCopy');

            if (!launchpad || role !== 'salaried') return;

            const hasExpenses = Array.isArray(expenses) && expenses.length > 0;
            const hasIncomes = Array.isArray(incomes) && incomes.length > 0;
            const shouldShowLaunchpad = !hasExpenses && !hasIncomes;

            launchpad.classList.toggle('hidden', !shouldShowLaunchpad);

            if (launchpadCopy) {
                  launchpadCopy.textContent = shouldShowLaunchpad
                        ? 'Add your salary income and day-to-day expenses so this dashboard can start tracking spending, savings rate, and monthly profit or loss with clarity.'
                        : 'Your salaried dashboard is active. Keep salary and expense entries current so the month-to-date picture stays accurate.';
            }
      }

      function renderStudentLaunchpad(expenses, incomes, monthlyBudget = 0) {
            const launchpad = document.getElementById('studentLaunchpad');
            const launchpadCopy = document.getElementById('studentLaunchpadCopy');

            if (!launchpad || role !== 'student') return;

            const hasExpenses = Array.isArray(expenses) && expenses.length > 0;
            const hasIncomes = Array.isArray(incomes) && incomes.length > 0;
            const hasBudget = Number(monthlyBudget) > 0;
            const shouldShowLaunchpad = !hasExpenses && !hasIncomes && !hasBudget;

            launchpad.classList.toggle('hidden', !shouldShowLaunchpad);

            if (launchpadCopy) {
                  launchpadCopy.textContent = shouldShowLaunchpad
                        ? 'Set a monthly budget and add your first expenses or income so your dashboard can begin tracking spending, remaining balance, and student insights.'
                        : 'Your student dashboard is active. Keep your budget and entries up to date so your remaining balance and spending insight stay accurate.';
            }
      }

      /* ===============================
            KPI
  ================================ */
      function renderKPIs(exp, inc) {
            const totalSpent = exp.reduce((s, e) => s + Number(e.amount), 0);
            const totalEntries = exp.length;
            const history = getRecordHistoryStats(exp);
            const monthlyReferenceDate = new Date();
            const activeMonthRange = getCurrentMonthToDateRange(monthlyReferenceDate);
            const monthlyExpenseEntries = activeMonthRange
                  ? filterRecordsByDateWindow(exp, activeMonthRange.start, activeMonthRange.end)
                  : [];
            const thisMonthTotal = monthlyExpenseEntries.reduce((sum, e) => sum + Number(e.amount), 0);
            const historyWindowLabel = history.hasData
                  ? `All recorded expenses • ${formatDateShort(history.earliest)} to ${formatDateShort(history.latest)}`
                  : 'All recorded expenses • no history yet';
            const activeMonthLabel = formatMonthYear(monthlyReferenceDate);
            const activeMonthWindowLabel = activeMonthRange
                  ? `${activeMonthLabel} • ${formatDateShort(activeMonthRange.start)} to ${formatDateShort(activeMonthRange.end)}`
                  : `${activeMonthLabel} • monthly window unavailable`;
            const monthsTracked = new Set(
                  exp
                        .map((entry) => parseDashboardDate(entry.date))
                        .filter((date) => !Number.isNaN(date.getTime()))
                        .map((date) => `${date.getFullYear()}-${date.getMonth()}`),
            ).size;
            const averageMonthlySpend = monthsTracked > 0 ? totalSpent / monthsTracked : 0;

            const thisMonthEl = document.getElementById('thisMonthTotal');
            const cardOneWindow = document.getElementById('kpiCardOneWindow');
            const cardOneMeta = document.getElementById('kpiCardOneMeta');
            const cardOneInsight = document.getElementById('kpiCardOneInsight');
            const cardTwoWindow = document.getElementById('kpiCardTwoWindow');
            const cardTwoMeta = document.getElementById('kpiCardTwoMeta');
            const cardTwoInsight = document.getElementById('kpiCardTwoInsight');
            const monthWindow = document.getElementById('kpiCardMonthWindow');
            const monthMeta = document.getElementById('kpiCardMonthMeta');
            const monthInsight = document.getElementById('kpiCardMonthInsight');

            if (thisMonthEl) {
                  thisMonthEl.textContent = formatCurrency(thisMonthTotal);
            }

            document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);

            const map = {};
            exp.forEach((e) => {
                  map[e.category] = (map[e.category] || 0) + Number(e.amount);
            });

            const topCategoryEntry = Object.entries(map).sort((a, b) => b[1] - a[1])[0] || null;

            if (Object.keys(map).length) {
                  document.getElementById('topCategory').textContent = topCategoryEntry[0];
            }

            if (role === 'student' || role === 'salaried') {
                  if (cardOneWindow) {
                        cardOneWindow.textContent = historyWindowLabel;
                  }

                  if (cardOneMeta) {
                        cardOneMeta.textContent = totalEntries
                              ? `${totalEntries} expense ${totalEntries === 1 ? 'entry' : 'entries'} tracked across ${Math.max(monthsTracked, 1)} ${Math.max(monthsTracked, 1) === 1 ? 'month' : 'months'}.`
                              : 'Add expenses to build your lifetime spending baseline.';
                  }

                  if (cardOneInsight) {
                        cardOneInsight.textContent = totalEntries
                              ? `Average monthly spend is ${formatCurrency(averageMonthlySpend)} across your recorded history.`
                              : 'This card totals every expense you have recorded so far.';
                  }

                  if (cardTwoWindow) {
                        cardTwoWindow.textContent = historyWindowLabel;
                  }

                  if (cardTwoMeta) {
                        cardTwoMeta.textContent = topCategoryEntry
                              ? `${formatCurrency(topCategoryEntry[1])} spent here, which is ${formatPercentage((topCategoryEntry[1] / totalSpent) * 100)} of total spending.`
                              : 'Your highest-spend category will appear once expenses are recorded.';
                  }

                  if (cardTwoInsight) {
                        cardTwoInsight.textContent = topCategoryEntry
                              ? `${topCategoryEntry[0]} is your biggest expense bucket across all recorded expenses.`
                              : 'This card highlights the category that absorbs the most money overall.';
                  }

                  if (monthWindow) {
                        monthWindow.textContent = `Active month in focus • ${activeMonthWindowLabel}`;
                  }

                  if (monthMeta) {
                        monthMeta.textContent = monthlyExpenseEntries.length
                              ? `${monthlyExpenseEntries.length} expense ${monthlyExpenseEntries.length === 1 ? 'entry' : 'entries'} recorded from the 1st of ${activeMonthLabel} through today.`
                              : `No expenses recorded from 01 ${activeMonthLabel} through today.`;
                  }

                  if (monthInsight) {
                        monthInsight.textContent = monthlyExpenseEntries.length
                              ? `This card resets every month and totals only the expenses recorded from the start of ${activeMonthLabel} up to today.`
                              : 'This card resets to zero on the 1st of every month and grows only with expenses recorded in the current month.';
                  }
            }

            if (role === 'msme') {
                  const totalIncome = inc.reduce((sum, item) => sum + Number(item.amount), 0);
                  const profit = totalIncome - totalSpent;
                  const expenseRatio = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;
                  const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
                  const combinedRecords = [...exp, ...inc]
                        .map((record) => parseDashboardDate(record.date))
                        .filter((date) => !Number.isNaN(date.getTime()))
                        .sort((a, b) => a - b);
                  const windowLabel = combinedRecords.length
                        ? `Reporting window: ${formatDateShort(combinedRecords[0])} to ${formatDateShort(combinedRecords[combinedRecords.length - 1])}`
                        : 'Reporting window: No business history yet';

                  const expenseMap = {};
                  exp.forEach((entry) => {
                        expenseMap[entry.category] = (expenseMap[entry.category] || 0) + Number(entry.amount);
                  });

                  const incomeMap = {};
                  inc.forEach((entry) => {
                        incomeMap[entry.source] = (incomeMap[entry.source] || 0) + Number(entry.amount);
                  });

                  const topExpenseEntry = Object.entries(expenseMap).sort((a, b) => b[1] - a[1])[0] || null;
                  const topIncomeEntry = Object.entries(incomeMap).sort((a, b) => b[1] - a[1])[0] || null;
                  const topIncomeShare = totalIncome > 0 && topIncomeEntry ? (topIncomeEntry[1] / totalIncome) * 100 : 0;

                  const cardOneTitle = document.getElementById('kpiCardOneTitle');
                  const cardTwoTitle = document.getElementById('kpiCardTwoTitle');
                  const cardThreeTitle = document.getElementById('kpiCardThreeTitle');
                  const cardThreeWindow = document.getElementById('kpiCardThreeWindow');
                  const cardThreeMeta = document.getElementById('kpiCardThreeMeta');
                  const cardThreeInsight = document.getElementById('kpiCardThreeInsight');
                  const totalSpentEl = document.getElementById('totalSpent');
                  const topCategoryEl = document.getElementById('topCategory');
                  const profitEl = document.getElementById('operatingProfit');

                  if (cardOneTitle) cardOneTitle.textContent = 'Expense Load';
                  if (cardTwoTitle) cardTwoTitle.textContent = 'Revenue Driver';
                  if (cardThreeTitle) cardThreeTitle.textContent = 'Operating Profit';

                  if (totalSpentEl) {
                        totalSpentEl.textContent = formatCurrency(totalSpent);
                  }

                  if (topCategoryEl) {
                        topCategoryEl.textContent = topIncomeEntry ? topIncomeEntry[0] : '-';
                  }

                  if (profitEl) {
                        profitEl.textContent = formatCurrency(profit);
                        profitEl.className = profit >= 0 ? 'pl-profit' : 'pl-loss';
                  }

                  if (cardOneWindow) cardOneWindow.textContent = windowLabel;
                  if (cardOneMeta) {
                        cardOneMeta.textContent = totalIncome > 0
                              ? `${formatPercentage(expenseRatio)} of income is being consumed by expenses.`
                              : 'Expense ratio will appear once income is recorded.';
                  }
                  if (cardOneInsight) {
                        cardOneInsight.textContent = topExpenseEntry
                              ? `${topExpenseEntry[0]} is the heaviest cost center right now.`
                              : 'The largest cost center will appear here once expenses are recorded.';
                  }

                  if (cardTwoWindow) cardTwoWindow.textContent = windowLabel;
                  if (cardTwoMeta) {
                        cardTwoMeta.textContent = topIncomeEntry
                              ? `${formatPercentage(topIncomeShare)} of total income is coming from this source.`
                              : 'Revenue contribution will appear once income is recorded.';
                  }
                  if (cardTwoInsight) {
                        cardTwoInsight.textContent = topIncomeEntry
                              ? `${formatCurrency(topIncomeEntry[1])} has been generated by this source in the current business history.`
                              : 'Your strongest revenue source will be highlighted here.';
                  }

                  if (cardThreeWindow) cardThreeWindow.textContent = windowLabel;
                  if (cardThreeMeta) {
                        cardThreeMeta.textContent = totalIncome > 0
                              ? `Profit margin is ${formatPercentage(margin)} on income of ${formatCurrency(totalIncome)}.`
                              : 'Profit margin will appear once income and expenses are both available.';
                  }
                  if (cardThreeInsight) {
                        cardThreeInsight.textContent = profit >= 0
                              ? 'This period is profitable and the business is retaining value after costs.'
                              : 'This period is under pressure and cost control should be prioritized.';
                  }
            }
      }

      function renderCashFlow(expenses, incomes) {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);
            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            const isInCurrentCashFlowWindow = (dateValue) => {
                  const parsedDate = parseDashboardDate(dateValue);
                  return !Number.isNaN(parsedDate.getTime()) && parsedDate >= startOfMonth && parsedDate <= endOfToday;
            };

            const monthlyIncome = incomes.filter((i) => isInCurrentCashFlowWindow(i.date));
            const monthlyExpenses = expenses.filter((e) => isInCurrentCashFlowWindow(e.date));

            const cashIn = monthlyIncome.reduce((s, i) => s + Number(i.amount), 0);
            const cashOut = monthlyExpenses.reduce((s, e) => s + Number(e.amount), 0);
            const netCash = cashIn - cashOut;

            document.getElementById('cashIn').textContent = formatCurrency(cashIn);
            document.getElementById('cashOut').textContent = formatCurrency(cashOut);
            document.getElementById('cashNet').textContent = formatCurrency(netCash);

            // Color logic
            const netEl = document.getElementById('cashNet');
            if (netEl) {
                  netEl.style.color = netCash >= 0 ? '#22c55e' : '#ef4444';
            }

            const subtitleEl = document.getElementById('cashFlowSubtitle');
            if (subtitleEl) {
                  const monthLabel = today.toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric',
                  });
                  const rangeLabel = `${startOfMonth.toLocaleDateString('en-IN')} to ${today.toLocaleDateString('en-IN')}`;
                  const noCashMovement = cashIn === 0 && cashOut === 0;
                  if (noCashMovement) {
                        subtitleEl.textContent = `${monthLabel} • ${rangeLabel} • No business cash movement recorded yet`;
                        return;
                  }
                  subtitleEl.textContent = `${monthLabel} • ${rangeLabel}`;
            }
      }

      function renderStudentDashboard(expenses, monthlyBudget) {
            if (!monthlyBudget || monthlyBudget <= 0) {
                  document.getElementById('studentBudget').textContent = 'Not Set';
                  document.getElementById('studentSpent').textContent = '\u20B9 0';
                  document.getElementById('studentRemaining').textContent = '\u20B9 0';

                  document.getElementById('studentInsight').textContent =
                        expenses.length === 0
                              ? 'Set your monthly budget first, then start adding expenses to track campus spending clearly.'
                              : 'Please set your monthly budget to start tracking.';

                  const status = document.getElementById('budgetStatus');
                  if (status && expenses.length === 0) {
                        status.textContent = 'Start by setting a budget for this month.';
                  }

                  const bar = document.getElementById('budgetBar');
                  if (bar) bar.style.width = '0%';

                  return;
            }

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const monthlyExpenses = expenses.filter((e) => {
                  return isSameMonthAsCurrent(e.date);
            });

            const spent = monthlyExpenses.reduce((s, e) => s + Number(e.amount), 0);

            const remaining = monthlyBudget - spent;

            document.getElementById('studentBudget').textContent = formatCurrency(monthlyBudget);
            document.getElementById('studentSpent').textContent = formatCurrency(spent);
            document.getElementById('studentRemaining').textContent = formatCurrency(Math.max(remaining, 0));

            /* Budget Progress Bar */

            const percent = Math.min((spent / monthlyBudget) * 100, 100);

            const bar = document.getElementById('budgetBar');

            if (bar) {
                  bar.style.width = percent + '%';

                  if (percent < 50) bar.style.background = '#22c55e';
                  else if (percent < 80) bar.style.background = '#f59e0b';
                  else bar.style.background = '#ef4444';
            }

            /* Insight */

            const insight = document.getElementById('studentInsight');

            if (!insight) return;

            if (spent === 0) {
                  insight.textContent = 'Start tracking your expenses this month.';
            } else if (percent < 40) {
                  insight.textContent = 'Excellent control. You are spending wisely.';
            } else if (percent < 70) {
                  insight.textContent = "Good. You're managing your budget well.";
            } else if (percent < 90) {
                  insight.textContent = 'Careful. You are approaching your budget limit.';
            } else if (percent <= 100) {
                  insight.textContent = 'Almost exhausted. Avoid unnecessary expenses.';
            } else {
                  insight.textContent = 'Budget exceeded. Immediate control required.';
            }
      }

      function renderSalariedDashboard(expenses, incomes) {
            const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
            const incomeTotal = incomes.reduce((s, i) => s + Number(i.amount), 0);
            const monthlyReferenceDate = new Date();
            const activeMonthLabel = formatMonthYear(monthlyReferenceDate);
            const activeMonthRange = getCurrentMonthToDateRange(monthlyReferenceDate);
            const monthlyExpenses = activeMonthRange
                  ? filterRecordsByDateWindow(expenses, activeMonthRange.start, activeMonthRange.end)
                  : [];
            const monthlyIncomes = activeMonthRange
                  ? filterRecordsByDateWindow(incomes, activeMonthRange.start, activeMonthRange.end)
                  : [];
            const monthlyExpenseTotal = monthlyExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
            const monthlyIncomeTotal = monthlyIncomes.reduce((sum, item) => sum + Number(item.amount), 0);
            const savings = monthlyIncomeTotal - monthlyExpenseTotal;
            const rate = monthlyIncomeTotal > 0 ? (savings / monthlyIncomeTotal) * 100 : 0;

            const incomeEl = document.getElementById('salaryIncome');
            const expenseEl = document.getElementById('salaryExpenses');
            const savingsEl = document.getElementById('salarySavings');
            const savingsWindowEl = document.getElementById('savingsRateWindow');
            const savingsMetaEl = document.getElementById('savingsRateMeta');
            const savingsInsightEl = document.getElementById('savingsRateInsight');

            if (incomeEl && expenseEl && savingsEl) {
                  incomeEl.textContent = formatCurrency(incomeTotal);
                  expenseEl.textContent = formatCurrency(expenseTotal);
                  savingsEl.textContent = formatCurrency(savings);
            }

            if (savingsWindowEl) {
                  savingsWindowEl.textContent = activeMonthRange
                        ? `${activeMonthLabel} salary cycle • ${formatDateShort(activeMonthRange.start)} to ${formatDateShort(activeMonthRange.end)}`
                        : `${activeMonthLabel} salary cycle`;
            }

            if (savingsMetaEl) {
                  if (monthlyIncomeTotal > 0) {
                        savingsMetaEl.textContent = `${formatCurrency(savings)} kept from income of ${formatCurrency(monthlyIncomeTotal)} after expenses of ${formatCurrency(monthlyExpenseTotal)} from the 1st of ${activeMonthLabel} through today.`;
                  } else {
                        savingsMetaEl.textContent =
                              expenses.length === 0 && incomes.length === 0
                                    ? `No salary or income has been recorded yet for ${activeMonthLabel}. Add income first, then this card will measure how much you keep after spending.`
                                    : `No income recorded from 01 ${activeMonthLabel} through today, so the savings rate cannot be measured yet.`;
                  }
            }

            // document.getElementById('salaryRate').textContent = rate.toFixed(1) + '%';
            const rateEl = document.getElementById('salaryRateText');
            const progressEl = document.getElementById('savingsProgress');

            if (rateEl && progressEl) {
                  let safeRate = Math.max(0, Math.min(rate, 100)); // clamp 0-100
                  progressEl.style.setProperty('--final-width', `${safeRate}%`);

                  // TEXT LOGIC
                  if (monthlyIncomeTotal === 0) {
                        rateEl.textContent =
                              expenses.length === 0 && incomes.length === 0
                                    ? `Add income for ${activeMonthLabel} to activate savings tracking.`
                                    : `No income recorded for ${activeMonthLabel}.`;
                        progressEl.style.width = '0%';
                        progressEl.style.background = '#6b7280';
                        if (savingsInsightEl) {
                              savingsInsightEl.textContent =
                                    expenses.length === 0 && incomes.length === 0
                                          ? 'This card activates once you add salary income and then compares it against current-month expenses from the 1st through today.'
                                          : 'This card resets on the 1st of every month and tracks savings using only current-month income and expenses up to today.';
                        }
                  } else if (rate < 0) {
                        rateEl.textContent = `Overspending by ${Math.abs(rate).toFixed(1)}%`;
                        progressEl.style.width = '100%';
                        progressEl.style.background = '#ef4444'; // red
                        if (savingsInsightEl) {
                              savingsInsightEl.textContent = `Current-month expenses up to today are higher than current-month income, so your savings rate is negative right now.`;
                        }
                  } else if (rate < 20) {
                        rateEl.textContent = `Low savings: ${rate.toFixed(1)}%`;
                        progressEl.style.width = safeRate + '%';
                        progressEl.style.background = '#f59e0b'; // orange
                        if (savingsInsightEl) {
                              savingsInsightEl.textContent = `You saved a small share of current-month income from the 1st through today. There is room to retain more after expenses.`;
                        }
                  } else if (rate < 50) {
                        rateEl.textContent = `Good: ${rate.toFixed(1)}% saved`;
                        progressEl.style.width = safeRate + '%';
                        progressEl.style.background = '#3b82f6'; // blue
                        if (savingsInsightEl) {
                              savingsInsightEl.textContent = `You retained a healthy part of current-month income after covering expenses recorded up to today.`;
                        }
                  } else {
                        rateEl.textContent = `Excellent: ${rate.toFixed(1)}% saved`;
                        progressEl.style.width = safeRate + '%';
                        progressEl.style.background = '#22c55e'; // green
                        if (savingsInsightEl) {
                              savingsInsightEl.textContent = `More than half of current-month income has been preserved after spending up to today, which is a very strong savings position.`;
                        }
                  }
            }
      }

      /* ===============================
            RECENT EXPENSES
      ================================ */
      function renderRecentExpenses(exp) {
            const tbody = document.getElementById('recentExpenses');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (!Array.isArray(exp) || exp.length === 0) {
                  tbody.innerHTML = `
            <tr>
                  <td colspan="4">${
                        role === 'msme'
                              ? 'No business expenses recorded yet. Add your first operating cost to start tracking cost centers.'
                              : role === 'salaried'
                                    ? 'No expenses recorded yet. Add your first month-to-date expense to start tracking spending and savings.'
                                    : role === 'student'
                                          ? 'No expenses recorded yet. Add your first student expense to start tracking your budget.'
                                    : 'No expenses added yet.'
                  }</td>
            </tr>`;
                  return;
            }

            [...exp]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 5)
                  .forEach((e) => {
                        tbody.innerHTML += `
            <tr>
                  <td>${e.description}</td>
                  <td>${e.category}</td>
                  <td>${formatCurrency(e.amount)}</td>
                  <td>${formatDate(e.date)}</td>
            </tr>`;
                  });
      }

      /* ===============================
            RECENT INCOMES
      ================================ */
      function renderRecentIncomes(inc) {
            const tbody = document.getElementById('recentIncomes');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (!Array.isArray(inc) || inc.length === 0) {
                  tbody.innerHTML = `
            <tr>
                  <td colspan="4">${
                        role === 'msme'
                              ? 'No business income recorded yet. Add your first sale or client payment to activate revenue tracking.'
                              : role === 'salaried'
                                    ? 'No income recorded yet. Add your salary or other earnings to activate savings and monthly balance tracking.'
                                    : role === 'student'
                                          ? 'No income recorded yet. Add scholarship, stipend, allowance, or side income to complete your student money view.'
                                    : 'No incomes added yet.'
                  }</td>
            </tr>`;
                  return;
            }

            [...inc]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 5)
                  .forEach((i) => {
                        tbody.innerHTML += `
            <tr>
                  <td>${i.source}</td>
                  <td>${i.category || i.type || 'Income'}</td>
                  <td>${formatCurrency(i.amount)}</td>
                  <td>${formatDate(i.date)}</td>
            </tr>`;
                  });
      }

      /* ===============================
            P&L SUMMARY
      ================================ */
      function getSalaryPLWindow() {
            const today = new Date();
            const endDate = getRangeEndDate(today);

            if (salaryPlFilterState.mode === 'custom') {
                  if (!salaryPlFilterState.customStart || !salaryPlFilterState.customEnd) {
                        return null;
                  }

                  const startDate = parseDashboardDate(salaryPlFilterState.customStart);
                  const customEndDate = parseDashboardDate(salaryPlFilterState.customEnd);

                  if (
                        Number.isNaN(startDate.getTime()) ||
                        Number.isNaN(customEndDate.getTime()) ||
                        startDate > customEndDate
                  ) {
                        return null;
                  }

                  startDate.setHours(0, 0, 0, 0);
                  customEndDate.setHours(23, 59, 59, 999);

                  return {
                        startDate,
                        endDate: customEndDate,
                        label: 'Custom',
                  };
            }

            if (salaryPlFilterState.mode === 'current') {
                  return {
                        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
                        endDate,
                        label: 'Current Month',
                  };
            }

            const monthSpanMap = {
                  '2m': 2,
                  '4m': 4,
                  '6m': 6,
            };

            const span = monthSpanMap[salaryPlFilterState.mode] || 1;
            const startDate = new Date(today.getFullYear(), today.getMonth() - (span - 1), 1);
            startDate.setHours(0, 0, 0, 0);

            return {
                  startDate,
                  endDate,
                  label:
                        salaryPlFilterState.mode === '2m'
                              ? 'Last 2 Months'
                              : salaryPlFilterState.mode === '4m'
                              ? 'Last 4 Months'
                              : 'Last 6 Months',
            };
      }

      function setSalaryPLEmptyState(isVisible, title, body) {
            if (salaryPlEmptyState) {
                  salaryPlEmptyState.classList.toggle('hidden', !isVisible);
            }

            if (salaryPlGrid) {
                  salaryPlGrid.style.display = isVisible ? 'none' : '';
            }

            if (salaryPlEmptyTitle && title) {
                  salaryPlEmptyTitle.textContent = title;
            }

            if (salaryPlEmptyBody && body) {
                  salaryPlEmptyBody.textContent = body;
            }
      }

      function hasEnoughHistoryForSalaryPL(exp, inc) {
            if (salaryPlFilterState.mode === 'custom' || salaryPlFilterState.mode === 'current') {
                  return true;
            }

            const combinedRecords = [...exp, ...inc];
            const stats = getRecordHistoryStats(combinedRecords);

            if (!stats.hasData) {
                  return false;
            }

            const requiredMonths = {
                  '2m': 2,
                  '4m': 4,
                  '6m': 6,
            };

            return stats.spanMonths >= (requiredMonths[salaryPlFilterState.mode] || 0);
      }

      function updatePLSummary(exp, inc) {
            const activeWindow = getSalaryPLWindow();
            const totalIncomeEl = document.getElementById('totalIncome');
            const totalExpensesEl = document.getElementById('totalExpenses');
            const netEl = document.getElementById('netProfit');

            if (!totalIncomeEl || !totalExpensesEl || !netEl) return;

            if (!activeWindow) {
                  if (salaryPlDateRange) {
                        salaryPlDateRange.textContent = 'Select a valid custom date range';
                  }

                  totalIncomeEl.textContent = formatCurrency(0);
                  totalExpensesEl.textContent = formatCurrency(0);
                  netEl.textContent = formatCurrency(0);
                  netEl.className = 'pl-profit';

                  setSalaryPLEmptyState(
                        true,
                        'Choose a valid custom range',
                        'Select both start and end dates, with the start date before or equal to the end date.',
                  );
                  return;
            }

            const filteredExpenses = filterRecordsByDateWindow(exp, activeWindow.startDate, activeWindow.endDate);
            const filteredIncomes = filterRecordsByDateWindow(inc, activeWindow.startDate, activeWindow.endDate);
            const totalExpense = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
            const totalIncome = filteredIncomes.reduce((s, i) => s + Number(i.amount), 0);
            const hasActivity = filteredExpenses.length > 0 || filteredIncomes.length > 0;
            const hasEnoughHistory = hasEnoughHistoryForSalaryPL(exp, inc);

            if (salaryPlDateRange) {
                  salaryPlDateRange.textContent = `${activeWindow.label} • ${formatDateShort(activeWindow.startDate)} to ${formatDateShort(activeWindow.endDate)}`;
            }

            if (!hasEnoughHistory) {
                  totalIncomeEl.textContent = formatCurrency(0);
                  totalExpensesEl.textContent = formatCurrency(0);
                  netEl.textContent = formatCurrency(0);
                  netEl.className = 'pl-profit';

                  setSalaryPLEmptyState(
                        true,
                        'Not enough history for this range',
                        `This view needs at least ${activeWindow.label.toLowerCase()} of recorded income or expense history before it can be shown.`,
                  );
                  return;
            }

            totalIncomeEl.textContent = formatCurrency(totalIncome);
            totalExpensesEl.textContent = formatCurrency(totalExpense);

            const net = totalIncome - totalExpense;
            netEl.textContent = formatCurrency(net);
            netEl.className = net >= 0 ? 'pl-profit' : 'pl-loss';

            if (!hasActivity) {
                  setSalaryPLEmptyState(
                        true,
                        exp.length === 0 && inc.length === 0 ? 'Start with salary and expenses' : 'No activity in this time range',
                        exp.length === 0 && inc.length === 0
                              ? 'No income or expense records exist yet. Add your salary and current-month expenses to unlock this summary.'
                              : 'No income or expense records were found for the selected period. Try another range or add entries inside this window.',
                  );
                  return;
            }

            setSalaryPLEmptyState(false);
      }

      /* ===============================
            TOP CHARTS
      ================================ */

      /* ===============================
            MSME P&L TABLES + CHARTS
      ================================ */
      function renderPLTables(exp, inc) {
            const eBody = document.getElementById('expenseBreakdownBody');
            const iBody = document.getElementById('incomeBreakdownBody');
            if (!eBody || !iBody) return;

            eBody.innerHTML = '';
            iBody.innerHTML = '';

            const eTotal = exp.reduce((s, e) => s + Number(e.amount), 0);
            const iTotal = inc.reduce((s, i) => s + Number(i.amount), 0);
            const netProfit = iTotal - eTotal;
            const netMargin = iTotal > 0 ? (netProfit / iTotal) * 100 : 0;

            const eMap = {};
            exp.forEach((e) => (eMap[e.category] = (eMap[e.category] || 0) + Number(e.amount)));

            const iMap = {};
            inc.forEach((i) => (iMap[i.source] = (iMap[i.source] || 0) + Number(i.amount)));
            const combinedRecords = [...exp, ...inc]
                  .map((record) => parseDashboardDate(record.date))
                  .filter((date) => !Number.isNaN(date.getTime()))
                  .sort((a, b) => a - b);
            const expenseEntries = prepareRankedBreakdown(Object.entries(eMap), 8, 'Other Categories');
            const incomeEntries = prepareRankedBreakdown(Object.entries(iMap), 8, 'Other Sources');

            if (combinedRecords.length) {
                  const startDate = combinedRecords[0];
                  const endDate = combinedRecords[combinedRecords.length - 1];
                  const durationDays = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
                  const approxMonths = Math.max(1, Math.round(durationDays / 30));

                  setTextContent(
                        'plReportingWindow',
                        durationDays >= 30
                              ? `Last ${approxMonths} month${approxMonths > 1 ? 's' : ''} of tracked business activity`
                              : `Last ${durationDays} day${durationDays > 1 ? 's' : ''} of tracked business activity`,
                  );
                  setTextContent('plReportingRange', `${formatDateShort(startDate)} to ${formatDateShort(endDate)}`);
            } else {
                  setTextContent('plReportingWindow', 'Current available business history');
                  setTextContent('plReportingRange', 'No business records available yet');
            }

            setTextContent('plSummaryIncome', formatCurrency(iTotal));
            setTextContent('plSummaryExpense', formatCurrency(eTotal));
            setTextContent('plSummaryMargin', `${netMargin.toFixed(1)}%`);

            const topExpenseEntry = expenseEntries[0] || null;
            const topIncomeEntry = incomeEntries[0] || null;
            const topExpenseShare = eTotal > 0 && topExpenseEntry ? (topExpenseEntry[1] / eTotal) * 100 : 0;
            const topIncomeShare = iTotal > 0 && topIncomeEntry ? (topIncomeEntry[1] / iTotal) * 100 : 0;

            const primaryDriver =
                  topIncomeShare >= topExpenseShare && topIncomeEntry
                        ? `${topIncomeEntry[0]}`
                        : topExpenseEntry
                        ? `${topExpenseEntry[0]}`
                        : '--';

            setTextContent('plSummaryDriver', primaryDriver);
            setTextContent(
                  'plSummaryDriverMeta',
                  topIncomeShare >= topExpenseShare && topIncomeEntry
                        ? `${formatPercentage(topIncomeShare)} of total income is being driven by this source.`
                        : topExpenseEntry
                        ? `${formatPercentage(topExpenseShare)} of total spend is concentrated in this category.`
                        : 'Waiting for enough business activity to identify the main driver.',
            );

            const statusBadge =
                  netMargin >= 25
                        ? 'Excellent margin profile'
                        : netMargin >= 12
                        ? 'Stable operating position'
                        : netMargin >= 0
                        ? 'Tight margin, monitor closely'
                        : 'Loss pressure detected';
            setTextContent('plStatusBadge', statusBadge);

            const headline =
                  netProfit >= 0
                        ? `${formatCurrency(netProfit)} net profit is being generated from ${Object.keys(iMap).length} active revenue streams.`
                        : `${formatCurrency(Math.abs(netProfit))} net loss is pulling down current operating performance.`;
            setTextContent('plHeadline', headline);

            const narrative =
                  topExpenseEntry && topIncomeEntry
                        ? `${topIncomeEntry[0]} is your strongest revenue engine at ${formatPercentage(topIncomeShare)}, while ${topExpenseEntry[0]} is the heaviest cost center at ${formatPercentage(topExpenseShare)}. Use this view to decide whether scale or cost control gives the faster operating gain.`
                        : 'Start recording both revenue and operating costs to unlock a sharper business readout.';
            setTextContent('plNarrative', narrative);

            setTextContent(
                  'plFocusIncome',
                  topIncomeEntry
                        ? `Protect ${topIncomeEntry[0]} because it currently contributes ${formatPercentage(topIncomeShare)} of total income.`
                        : 'Track which revenue source becomes your leading contributor.',
            );
            setTextContent(
                  'plFocusExpense',
                  topExpenseEntry
                        ? `Audit ${topExpenseEntry[0]} first because it consumes ${formatPercentage(topExpenseShare)} of total expenses.`
                        : 'Monitor which operating category starts taking the biggest cost share.',
            );
            setTextContent(
                  'plFocusBalance',
                  netProfit >= 0
                        ? `Your current net margin is ${netMargin.toFixed(1)}%, so the next decision is whether to defend margin or push growth.`
                        : `Current net margin is ${netMargin.toFixed(1)}%, so cost discipline should take priority before expanding spend.`,
            );

            setTextContent(
                  'expenseBreakdownMeta',
                  `${Object.keys(eMap).length} categories • ${expenseEntries.length} visible rows`,
            );
            setTextContent(
                  'incomeBreakdownMeta',
                  `${Object.keys(iMap).length} sources • ${incomeEntries.length} visible rows`,
            );

            if (!expenseEntries.length) {
                  eBody.innerHTML = `<tr><td colspan="5">No expense data available yet.</td></tr>`;
            } else {
                  expenseEntries.forEach(([name, amount], index) => {
                        const share = eTotal > 0 ? (amount / eTotal) * 100 : 0;
                        const signal = getPLSignalLevel(share, 'expense');

                        eBody.innerHTML += `
                              <tr>
                                    <td><span class="pl-rank">#${index + 1}</span></td>
                                    <td>
                                          <div class="pl-name">
                                                <strong>${name}</strong>
                                                <span>${index === 0 ? 'Highest expense load' : 'Tracked cost bucket'}</span>
                                          </div>
                                    </td>
                                    <td class="pl-amount">${formatCurrency(amount)}</td>
                                    <td><span class="pl-share-pill">${formatPercentage(share)}</span></td>
                                    <td><span class="pl-signal-pill ${signal.className}">${signal.label}</span></td>
                              </tr>`;
                  });
            }

            if (!incomeEntries.length) {
                  iBody.innerHTML = `<tr><td colspan="5">No income data available yet.</td></tr>`;
            } else {
                  incomeEntries.forEach(([name, amount], index) => {
                        const share = iTotal > 0 ? (amount / iTotal) * 100 : 0;
                        const signal = getPLSignalLevel(share, 'income');

                        iBody.innerHTML += `
                              <tr>
                                    <td><span class="pl-rank">#${index + 1}</span></td>
                                    <td>
                                          <div class="pl-name">
                                                <strong>${name}</strong>
                                                <span>${index === 0 ? 'Strongest revenue source' : 'Tracked income source'}</span>
                                          </div>
                                    </td>
                                    <td class="pl-amount">${formatCurrency(amount)}</td>
                                    <td><span class="pl-share-pill">${formatPercentage(share)}</span></td>
                                    <td><span class="pl-signal-pill ${signal.className}">${signal.label}</span></td>
                              </tr>`;
                  });
            }

            setTextContent(
                  'expenseBreakdownNote',
                  topExpenseEntry
                        ? `${topExpenseEntry[0]} is the most cost-intensive area right now. Any efficiency gain there will have the fastest expense impact.`
                        : 'Your highest cost categories will be highlighted here.',
            );
            setTextContent(
                  'incomeBreakdownNote',
                  topIncomeEntry
                        ? `${topIncomeEntry[0]} is leading revenue contribution right now. Protect and replicate what is working in this source.`
                        : 'Your strongest revenue channels will be highlighted here.',
            );
      }

      function renderProfitTrendChart(exp, inc) {
            const profitCanvas = document.getElementById('profitTrendChart');
            const profitRange = document.getElementById('profitTrendRange')?.value || '3m';
            if (!profitCanvas) return;

            const { text, textStrong, grid, isDark } = getChartColors();

            const filteredExpensesForProfit = filterRecordsByRange(exp, profitRange);
            const filteredIncomeForProfit = filterRecordsByRange(inc, profitRange);
            updateRangeLabelFromRecords(
                  [...filteredExpensesForProfit, ...filteredIncomeForProfit],
                  getRangeBoundary(profitRange),
                  new Date(),
                  'profitTrendDateRange',
            );

            if (
                  !hasEnoughHistoryForRange(null, profitRange, 'monthly', [...exp, ...inc]) ||
                  (!filteredExpensesForProfit.length && !filteredIncomeForProfit.length)
            ) {
                  setChartEmptyState(
                        'profitTrendChart',
                        'profitTrendChart',
                        'Not enough business history yet',
                        `Profitability Trend needs at least ${getRangeLabel(profitRange)} of business activity before it can be shown.`,
                  );
            } else {
                  clearChartEmptyState('profitTrendChart');

                  const monthlySeries = buildMonthlyBusinessSeries(filteredExpensesForProfit, filteredIncomeForProfit);

                  if (profitTrendChart) profitTrendChart.destroy();

                  const profitCtx = profitCanvas.getContext('2d');
                  const netGradient = profitCtx.createLinearGradient(0, 0, 0, 320);
                  netGradient.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(37, 99, 235, 0.28)');
                  netGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

                  profitTrendChart = new Chart(profitCanvas, {
                        type: 'line',
                        data: {
                              labels: monthlySeries.labels,
                              datasets: [
                                    {
                                          label: 'Revenue',
                                          data: monthlySeries.incomeValues,
                                          borderColor: '#22c55e',
                                          backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                          borderWidth: 2,
                                          tension: 0.35,
                                          fill: false,
                                          pointRadius: 3,
                                          pointHoverRadius: 5,
                                    },
                                    {
                                          label: 'Expenses',
                                          data: monthlySeries.expenseValues,
                                          borderColor: '#f97316',
                                          backgroundColor: 'rgba(249, 115, 22, 0.12)',
                                          borderWidth: 2,
                                          tension: 0.35,
                                          fill: false,
                                          pointRadius: 3,
                                          pointHoverRadius: 5,
                                    },
                                    {
                                          label: 'Net',
                                          data: monthlySeries.profitValues,
                                          borderColor: '#3b82f6',
                                          backgroundColor: netGradient,
                                          borderWidth: 3,
                                          tension: 0.38,
                                          fill: true,
                                          pointRadius: 4,
                                          pointHoverRadius: 6,
                                    },
                              ],
                        },
                        options: {
                              responsive: true,
                              maintainAspectRatio: false,
                              interaction: { intersect: false, mode: 'index' },
                              plugins: {
                                    legend: {
                                          position: 'top',
                                          align: 'end',
                                          labels: {
                                                color: textStrong,
                                                usePointStyle: true,
                                                pointStyle: 'circle',
                                                boxWidth: 10,
                                                boxHeight: 10,
                                                padding: 16,
                                                font: { size: 12, family: 'Inter' },
                                          },
                                    },
                                    tooltip: {
                                          ...getTooltipTheme(),
                                          callbacks: {
                                                label: (context) => `${context.dataset.label}: ${formatCurrencyValue(context.parsed.y)}`,
                                          },
                                    },
                              },
                              scales: {
                                    x: {
                                          ticks: {
                                                color: text,
                                                font: { size: 12, family: 'Inter' },
                                          },
                                          grid: { display: false },
                                          border: { display: false },
                                    },
                                    y: {
                                          ticks: {
                                                color: text,
                                                font: { size: 12, family: 'Inter' },
                                                callback: (value) =>
                                                      '\u20b9' +
                                                      new Intl.NumberFormat('en-IN', {
                                                            notation: 'compact',
                                                            maximumFractionDigits: 1,
                                                      }).format(value),
                                          },
                                          grid: { color: grid },
                                          border: { display: false },
                                    },
                              },
                              animation: { duration: 850, easing: 'easeOutQuart' },
                        },
                  });
            }
      }

      function renderIncomeSourcesChart(inc) {
            const incomeCanvas = document.getElementById('incomeSourcesChart');
            const incomeRange = document.getElementById('incomeSourcesRange')?.value || '3m';
            if (!incomeCanvas) return;

            const { text, textStrong, grid, isDark } = getChartColors();
            const filteredIncomeSources = filterRecordsByRange(inc, incomeRange);
            updateRangeLabelFromRecords(filteredIncomeSources, getRangeBoundary(incomeRange), new Date(), 'incomeSourcesDateRange');

            if (!hasEnoughHistoryForRange(null, incomeRange, 'monthly', inc) || !filteredIncomeSources.length) {
                  setChartEmptyState(
                        'incomeSourcesChart',
                        'incomeSourcesChart',
                        'Not enough income history yet',
                        `Income Sources needs at least ${getRangeLabel(incomeRange)} of income history before it can be shown.`,
                  );
                  return;
            }

            clearChartEmptyState('incomeSourcesChart');

            const incomeWrap = incomeCanvas.closest('.chart-wrap');
            const incomeMap = {};
            filteredIncomeSources.forEach((income) => {
                  incomeMap[income.source] = (incomeMap[income.source] || 0) + Number(income.amount);
            });

            const incomeEntries = prepareRankedBreakdown(Object.entries(incomeMap), 6, 'Other Sources');
            const incomeFullLabels = incomeEntries.map((entry) => entry[0]);
            const incomeLabels = incomeFullLabels.map((label) => truncateLabel(label, 24));
            const incomeValues = incomeEntries.map((entry) => entry[1]);
            const incomeTotal = incomeValues.reduce((sum, value) => sum + value, 0);

            if (!incomeValues.length) {
                  setChartEmptyState(
                        'incomeSourcesChart',
                        'incomeSourcesChart',
                        'No income sources in this window',
                        `There are no income entries recorded in the selected ${getRangeLabel(incomeRange)} range.`,
                  );
                  return;
            }

            if (incomeSourcesChart) incomeSourcesChart.destroy();

            const incomeCtx = incomeCanvas.getContext('2d');
            const incomeGradient = incomeCtx.createLinearGradient(0, 0, 420, 0);
            if (isDark) {
                  incomeGradient.addColorStop(0, 'rgba(34,197,94,0.88)');
                  incomeGradient.addColorStop(1, 'rgba(34,197,94,0.22)');
            } else {
                  incomeGradient.addColorStop(0, 'rgba(22,163,74,0.84)');
                  incomeGradient.addColorStop(1, 'rgba(22,163,74,0.16)');
            }

            if (incomeWrap) {
                  const dynamicHeight = Math.min(Math.max(incomeEntries.length * 48 + 52, 320), 460);
                  incomeWrap.style.height = `${dynamicHeight}px`;
            }

            incomeSourcesChart = new Chart(incomeCanvas, {
                  type: 'bar',
                  data: {
                        labels: incomeLabels,
                        datasets: [
                              {
                                    label: 'Income Sources',
                                    data: incomeValues,
                                    backgroundColor: incomeGradient,
                                    borderColor: isDark ? 'rgba(74, 222, 128, 0.9)' : 'rgba(22, 163, 74, 0.95)',
                                    borderWidth: 1,
                                    borderRadius: 14,
                                    borderSkipped: false,
                                    barPercentage: 0.82,
                                    categoryPercentage: 0.76,
                                    maxBarThickness: 28,
                              },
                        ],
                  },
                  options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                              legend: {
                                    display: true,
                                    position: 'top',
                                    align: 'end',
                                    labels: {
                                          color: textStrong,
                                          usePointStyle: true,
                                          pointStyle: 'rectRounded',
                                          boxWidth: 14,
                                          boxHeight: 8,
                                          padding: 16,
                                          font: { size: 12, family: 'Inter' },
                                    },
                              },
                              tooltip: {
                                    ...getTooltipTheme(),
                                    callbacks: {
                                          title: (items) => {
                                                const item = items?.[0];
                                                return item ? incomeFullLabels[item.dataIndex] : '';
                                          },
                                          label: (context) => {
                                                const pct = ((context.parsed.x / incomeTotal) * 100).toFixed(1);
                                                return `${formatCurrencyValue(context.parsed.x)} (${pct}%)`;
                                          },
                                    },
                              },
                        },
                        scales: {
                              x: {
                                    beginAtZero: true,
                                    ticks: {
                                          color: text,
                                          font: { size: 12, family: 'Inter' },
                                          padding: 10,
                                          callback: (value) =>
                                                '\u20b9' +
                                                new Intl.NumberFormat('en-IN', {
                                                      notation: 'compact',
                                                      maximumFractionDigits: 1,
                                                }).format(value),
                                    },
                                    grid: { color: grid },
                                    border: { display: false },
                              },
                              y: {
                                    ticks: {
                                          color: text,
                                          font: { size: 12, family: 'Inter' },
                                          padding: 8,
                                    },
                                    grid: { display: false },
                                    border: { display: false },
                              },
                        },
                        animation: { duration: 850, easing: 'easeOutCubic' },
                  },
            });
      }

      function renderPLCharts(exp, inc) {
            renderProfitTrendChart(exp, inc);
            renderIncomeSourcesChart(inc);
      }

      function renderPLTables(exp, inc) {
            const eBody = document.getElementById('expenseBreakdownBody');
            const iBody = document.getElementById('incomeBreakdownBody');
            if (!eBody || !iBody) return;

            eBody.innerHTML = '';
            iBody.innerHTML = '';

            const combinedSourceRecords = [...exp, ...inc];
            const hasRequiredHistory =
                  plDateFilterState.mode === 'custom' ||
                  hasEnoughHistoryForRange(null, plDateFilterState.mode, 'monthly', combinedSourceRecords);

            const { activeWindow, filteredExpenses, filteredIncomes } = getPLFilteredData(exp, inc);

            if (!activeWindow) {
                  setPLEmptyState(
                        true,
                        'Choose a valid custom reporting window',
                        'Select both start and end dates, then apply the range to generate a meaningful profit and loss readout for that exact operating period.',
                  );
                  setTextContent('plReportingWindow', 'Custom range');
                  setTextContent('plReportingRange', 'Select a valid start and end date');
                  setTextContent('plSummaryIncome', formatCurrency(0));
                  setTextContent('plSummaryExpense', formatCurrency(0));
                  setTextContent('plSummaryMargin', '0.0%');
                  setTextContent('plSummaryDriver', '-');
                  setTextContent('plSummaryDriverMeta', 'Add a valid date window to identify the strongest business driver.');
                  setTextContent('plStatusBadge', 'Waiting for date range');
                  setTextContent('plHeadline', 'Choose a custom reporting window to analyze this operating period.');
                  setTextContent('plNarrative', 'Once both dates are selected, this section will rebuild the full P&L view for that exact business window.');
                  setTextContent('plFocusIncome', 'Select a custom range to review revenue concentration.');
                  setTextContent('plFocusExpense', 'Select a custom range to review cost concentration.');
                  setTextContent('plFocusBalance', 'The margin story will appear after the reporting window is applied.');
                  setTextContent('expenseBreakdownMeta', '0 categories - 0 visible rows');
                  setTextContent('incomeBreakdownMeta', '0 sources - 0 visible rows');
                  setTextContent('expenseBreakdownNote', 'Apply a custom date range to inspect business costs.');
                  setTextContent('incomeBreakdownNote', 'Apply a custom date range to inspect revenue sources.');
                  eBody.innerHTML = `<tr><td colspan="5">Select a valid custom date range to view expense breakdown.</td></tr>`;
                  iBody.innerHTML = `<tr><td colspan="5">Select a valid custom date range to view income breakdown.</td></tr>`;
                  return;
            }

            if (!hasRequiredHistory) {
                  setPLEmptyState(
                        true,
                        'Not enough business history yet',
                        `Detailed Profit & Loss Breakdown needs at least ${getRangeLabel(plDateFilterState.mode)} of business activity before this window can be analyzed confidently.`,
                  );
                  setTextContent('plReportingWindow', `${activeWindow.label} of tracked business activity`);
                  setTextContent('plReportingRange', `${formatDateShort(activeWindow.startDate)} to ${formatDateShort(activeWindow.endDate)}`);
                  setTextContent('plSummaryIncome', formatCurrency(0));
                  setTextContent('plSummaryExpense', formatCurrency(0));
                  setTextContent('plSummaryMargin', '0.0%');
                  setTextContent('plSummaryDriver', '-');
                  setTextContent('plSummaryDriverMeta', `At least ${getRangeLabel(plDateFilterState.mode).toLowerCase()} of business history is needed to identify a reliable operating driver.`);
                  setTextContent('plStatusBadge', 'History still building');
                  setTextContent('plHeadline', `More business history is needed before ${activeWindow.label.toLowerCase()} can be evaluated properly.`);
                  setTextContent('plNarrative', 'Keep recording income and expense entries consistently. Once the requested history window is available, the full profitability view will unlock again.');
                  setTextContent('plFocusIncome', 'Continue recording revenue sources to build a stronger comparison window.');
                  setTextContent('plFocusExpense', 'Continue recording expense categories to build a stronger cost trend.');
                  setTextContent('plFocusBalance', 'Margin analysis will become available after enough history is accumulated.');
                  setTextContent('expenseBreakdownMeta', '0 categories - 0 visible rows');
                  setTextContent('incomeBreakdownMeta', '0 sources - 0 visible rows');
                  setTextContent('expenseBreakdownNote', `Expense breakdown will appear after ${getRangeLabel(plDateFilterState.mode).toLowerCase()} of business history is available.`);
                  setTextContent('incomeBreakdownNote', `Income breakdown will appear after ${getRangeLabel(plDateFilterState.mode).toLowerCase()} of business history is available.`);
                  eBody.innerHTML = `<tr><td colspan="5">Not enough expense history is available for the selected ${activeWindow.label.toLowerCase()} window.</td></tr>`;
                  iBody.innerHTML = `<tr><td colspan="5">Not enough income history is available for the selected ${activeWindow.label.toLowerCase()} window.</td></tr>`;
                  return;
            }

            const expenseTotal = filteredExpenses.reduce((sum, entry) => sum + Number(entry.amount), 0);
            const incomeTotal = filteredIncomes.reduce((sum, entry) => sum + Number(entry.amount), 0);
            const netProfit = incomeTotal - expenseTotal;
            const netMargin = incomeTotal > 0 ? (netProfit / incomeTotal) * 100 : 0;

            const expenseMap = {};
            filteredExpenses.forEach((entry) => {
                  expenseMap[entry.category] = (expenseMap[entry.category] || 0) + Number(entry.amount);
            });

            const incomeMap = {};
            filteredIncomes.forEach((entry) => {
                  incomeMap[entry.source] = (incomeMap[entry.source] || 0) + Number(entry.amount);
            });

            const combinedRecords = [...filteredExpenses, ...filteredIncomes]
                  .map((record) => parseDashboardDate(record.date))
                  .filter((date) => !Number.isNaN(date.getTime()))
                  .sort((a, b) => a - b);

            const expenseEntries = prepareRankedBreakdown(Object.entries(expenseMap), 8, 'Other Categories');
            const incomeEntries = prepareRankedBreakdown(Object.entries(incomeMap), 8, 'Other Sources');
            const hasActivity = filteredExpenses.length > 0 || filteredIncomes.length > 0;

            setPLEmptyState(
                  !hasActivity,
                  `No business activity found in ${activeWindow.label.toLowerCase()}`,
                  `This reporting window covers ${formatDateShort(activeWindow.startDate)} to ${formatDateShort(activeWindow.endDate)}. Try a wider range or add income and expense entries inside this period to unlock a complete profitability view.`,
            );

            setTextContent('plReportingWindow', `${activeWindow.label} of tracked business activity`);
            setTextContent(
                  'plReportingRange',
                  `${formatDateShort(activeWindow.startDate)} to ${formatDateShort(activeWindow.endDate)}`,
            );
            setTextContent('plSummaryIncome', formatCurrency(incomeTotal));
            setTextContent('plSummaryExpense', formatCurrency(expenseTotal));
            setTextContent('plSummaryMargin', `${netMargin.toFixed(1)}%`);

            const topExpenseEntry = expenseEntries[0] || null;
            const topIncomeEntry = incomeEntries[0] || null;
            const topExpenseShare = expenseTotal > 0 && topExpenseEntry ? (topExpenseEntry[1] / expenseTotal) * 100 : 0;
            const topIncomeShare = incomeTotal > 0 && topIncomeEntry ? (topIncomeEntry[1] / incomeTotal) * 100 : 0;

            const primaryDriver =
                  topIncomeShare >= topExpenseShare && topIncomeEntry
                        ? topIncomeEntry[0]
                        : topExpenseEntry
                        ? topExpenseEntry[0]
                        : '-';

            setTextContent('plSummaryDriver', primaryDriver);
            setTextContent(
                  'plSummaryDriverMeta',
                  topIncomeShare >= topExpenseShare && topIncomeEntry
                        ? `${formatPercentage(topIncomeShare)} of total income is being driven by this source.`
                        : topExpenseEntry
                        ? `${formatPercentage(topExpenseShare)} of total spend is concentrated in this category.`
                        : 'Waiting for enough business activity to identify the main driver.',
            );

            const statusBadge =
                  !hasActivity
                        ? 'No activity in selected window'
                        : netMargin >= 25
                        ? 'Excellent margin profile'
                        : netMargin >= 12
                        ? 'Stable operating position'
                        : netMargin >= 0
                        ? 'Tight margin, monitor closely'
                        : 'Loss pressure detected';
            setTextContent('plStatusBadge', statusBadge);

            const headline =
                  !hasActivity
                        ? `No operating activity was recorded in the selected ${activeWindow.label.toLowerCase()} window.`
                        : netProfit >= 0
                        ? `${formatCurrency(netProfit)} net profit is being generated from ${Object.keys(incomeMap).length} active revenue streams.`
                        : `${formatCurrency(Math.abs(netProfit))} net loss is pulling down current operating performance.`;
            setTextContent('plHeadline', headline);

            const narrative =
                  !hasActivity
                        ? 'Try a wider reporting window or add more recent business records to unlock a more meaningful profitability picture.'
                        : topExpenseEntry && topIncomeEntry
                        ? `${topIncomeEntry[0]} is your strongest revenue engine at ${formatPercentage(topIncomeShare)}, while ${topExpenseEntry[0]} is the heaviest cost center at ${formatPercentage(topExpenseShare)}. Use this view to decide whether scale or cost control gives the faster operating gain.`
                        : 'Start recording both revenue and operating costs to unlock a sharper business readout.';
            setTextContent('plNarrative', narrative);

            setTextContent(
                  'plFocusIncome',
                  topIncomeEntry
                        ? `Protect ${topIncomeEntry[0]} because it currently contributes ${formatPercentage(topIncomeShare)} of total income.`
                        : 'Track which revenue source becomes your leading contributor.',
            );
            setTextContent(
                  'plFocusExpense',
                  topExpenseEntry
                        ? `Audit ${topExpenseEntry[0]} first because it consumes ${formatPercentage(topExpenseShare)} of total expenses.`
                        : 'Monitor which operating category starts taking the biggest cost share.',
            );
            setTextContent(
                  'plFocusBalance',
                  !hasActivity
                        ? 'Use a wider date window to compare margin behavior over a more meaningful operating period.'
                        : netProfit >= 0
                        ? `Your current net margin is ${netMargin.toFixed(1)}%, so the next decision is whether to defend margin or push growth.`
                        : `Current net margin is ${netMargin.toFixed(1)}%, so cost discipline should take priority before expanding spend.`,
            );

            setTextContent('expenseBreakdownMeta', `${Object.keys(expenseMap).length} categories - ${expenseEntries.length} visible rows`);
            setTextContent('incomeBreakdownMeta', `${Object.keys(incomeMap).length} sources - ${incomeEntries.length} visible rows`);

            if (!expenseEntries.length) {
                  eBody.innerHTML = `<tr><td colspan="5">No expense data was recorded in this reporting window.</td></tr>`;
            } else {
                  expenseEntries.forEach(([name, amount], index) => {
                        const share = expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0;
                        const signal = getPLSignalLevel(share, 'expense');

                        eBody.innerHTML += `
                              <tr>
                                    <td><span class="pl-rank">#${index + 1}</span></td>
                                    <td>
                                          <div class="pl-name">
                                                <strong>${name}</strong>
                                                <span>${index === 0 ? 'Highest expense load' : 'Tracked cost bucket'}</span>
                                          </div>
                                    </td>
                                    <td class="pl-amount">${formatCurrency(amount)}</td>
                                    <td><span class="pl-share-pill">${formatPercentage(share)}</span></td>
                                    <td><span class="pl-signal-pill ${signal.className}">${signal.label}</span></td>
                              </tr>`;
                  });
            }

            if (!incomeEntries.length) {
                  iBody.innerHTML = `<tr><td colspan="5">No income data was recorded in this reporting window.</td></tr>`;
            } else {
                  incomeEntries.forEach(([name, amount], index) => {
                        const share = incomeTotal > 0 ? (amount / incomeTotal) * 100 : 0;
                        const signal = getPLSignalLevel(share, 'income');

                        iBody.innerHTML += `
                              <tr>
                                    <td><span class="pl-rank">#${index + 1}</span></td>
                                    <td>
                                          <div class="pl-name">
                                                <strong>${name}</strong>
                                                <span>${index === 0 ? 'Strongest revenue source' : 'Tracked income source'}</span>
                                          </div>
                                    </td>
                                    <td class="pl-amount">${formatCurrency(amount)}</td>
                                    <td><span class="pl-share-pill">${formatPercentage(share)}</span></td>
                                    <td><span class="pl-signal-pill ${signal.className}">${signal.label}</span></td>
                              </tr>`;
                  });
            }

            setTextContent(
                  'expenseBreakdownNote',
                  topExpenseEntry
                        ? `${topExpenseEntry[0]} is the most cost-intensive area right now. Any efficiency gain there will have the fastest expense impact.`
                        : 'Your highest cost categories will be highlighted here.',
            );
            setTextContent(
                  'incomeBreakdownNote',
                  topIncomeEntry
                        ? `${topIncomeEntry[0]} is leading revenue contribution right now. Protect and replicate what is working in this source.`
                        : 'Your strongest revenue channels will be highlighted here.',
            );
      }

      function renderProfitTrendChart(exp, inc) {
            const profitCanvas = document.getElementById('profitTrendChart');
            if (!profitCanvas) return;
            const profitMode = profitTrendFilterState.mode;
            const combinedSourceRecords = [...exp, ...inc];
            const hasRequiredHistory =
                  profitMode === 'custom' || hasEnoughHistoryForRange(null, profitMode, 'monthly', combinedSourceRecords);

            const activeWindow = getDateWindowForMode(
                  profitMode,
                  profitTrendFilterState.customStart,
                  profitTrendFilterState.customEnd,
            );
            if (!activeWindow) {
                  setChartEmptyState(
                        'profitTrendChart',
                        'profitTrendChart',
                        'Select a custom range',
                        'Apply a valid start and end date to build the profitability trend.',
                  );
                  setTextContent('profitTrendDateRange', 'Waiting for custom range');
                  return;
            }

            const { text, textStrong, grid, isDark } = getChartColors();
            const filteredExpenses = filterRecordsByDateWindow(exp, activeWindow.startDate, activeWindow.endDate);
            const filteredIncomes = filterRecordsByDateWindow(inc, activeWindow.startDate, activeWindow.endDate);
            setTextContent('profitTrendDateRange', `${formatDateShort(activeWindow.startDate)} to ${formatDateShort(activeWindow.endDate)}`);

            if (!hasRequiredHistory) {
                  setChartEmptyState(
                        'profitTrendChart',
                        'profitTrendChart',
                        'Not enough business history yet',
                        `Profitability Trend needs at least ${getRangeLabel(profitMode)} of business activity before it can be shown.`,
                  );
                  return;
            }

            if (!filteredExpenses.length && !filteredIncomes.length) {
                  setChartEmptyState(
                        'profitTrendChart',
                        'profitTrendChart',
                        'No business activity in this window',
                        `There are no income or expense records inside the selected ${activeWindow.label.toLowerCase()} range.`,
                  );
                  return;
            }

            clearChartEmptyState('profitTrendChart');

            const monthlySeries = buildMonthlyBusinessSeries(filteredExpenses, filteredIncomes);

            if (profitTrendChart) profitTrendChart.destroy();

            const profitCtx = profitCanvas.getContext('2d');
            const netGradient = profitCtx.createLinearGradient(0, 0, 0, 320);
            netGradient.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(37, 99, 235, 0.28)');
            netGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

            profitTrendChart = new Chart(profitCanvas, {
                  type: 'line',
                  data: {
                        labels: monthlySeries.labels,
                        datasets: [
                              {
                                    label: 'Revenue',
                                    data: monthlySeries.incomeValues,
                                    borderColor: '#22c55e',
                                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                    borderWidth: 2,
                                    tension: 0.35,
                                    fill: false,
                                    pointRadius: 3,
                                    pointHoverRadius: 5,
                              },
                              {
                                    label: 'Expenses',
                                    data: monthlySeries.expenseValues,
                                    borderColor: '#f97316',
                                    backgroundColor: 'rgba(249, 115, 22, 0.12)',
                                    borderWidth: 2,
                                    tension: 0.35,
                                    fill: false,
                                    pointRadius: 3,
                                    pointHoverRadius: 5,
                              },
                              {
                                    label: 'Net',
                                    data: monthlySeries.profitValues,
                                    borderColor: '#3b82f6',
                                    backgroundColor: netGradient,
                                    borderWidth: 3,
                                    tension: 0.38,
                                    fill: true,
                                    pointRadius: 4,
                                    pointHoverRadius: 6,
                              },
                        ],
                  },
                  options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { intersect: false, mode: 'index' },
                        plugins: {
                              legend: {
                                    position: 'top',
                                    align: 'end',
                                    labels: {
                                          color: textStrong,
                                          usePointStyle: true,
                                          pointStyle: 'circle',
                                          boxWidth: 10,
                                          boxHeight: 10,
                                          padding: 16,
                                          font: { size: 12, family: 'Inter' },
                                    },
                              },
                              tooltip: {
                                    ...getTooltipTheme(),
                                    callbacks: {
                                          label: (context) => `${context.dataset.label}: ${formatCurrencyValue(context.parsed.y)}`,
                                    },
                              },
                        },
                        scales: {
                              x: {
                                    ticks: {
                                          color: text,
                                          font: { size: 12, family: 'Inter' },
                                    },
                                    grid: { display: false },
                                    border: { display: false },
                              },
                              y: {
                                    ticks: {
                                          color: text,
                                          font: { size: 12, family: 'Inter' },
                                          callback: (value) =>
                                                '\u20b9' +
                                                new Intl.NumberFormat('en-IN', {
                                                      notation: 'compact',
                                                      maximumFractionDigits: 1,
                                                }).format(value),
                                    },
                                    grid: { color: grid },
                                    border: { display: false },
                              },
                        },
                        animation: { duration: 850, easing: 'easeOutQuart' },
                  },
            });
      }

      function renderIncomeSourcesChart(inc) {
            const incomeCanvas = document.getElementById('incomeSourcesChart');
            if (!incomeCanvas) return;
            const incomeMode = incomeSourcesFilterState.mode;
            const hasRequiredHistory =
                  incomeMode === 'custom' || hasEnoughHistoryForRange(null, incomeMode, 'monthly', inc);

            const activeWindow = getDateWindowForMode(
                  incomeMode,
                  incomeSourcesFilterState.customStart,
                  incomeSourcesFilterState.customEnd,
            );
            if (!activeWindow) {
                  setChartEmptyState(
                        'incomeSourcesChart',
                        'incomeSourcesChart',
                        'Select a custom range',
                        'Apply a valid start and end date to build the income source mix.',
                  );
                  setTextContent('incomeSourcesDateRange', 'Waiting for custom range');
                  return;
            }

            const { text, textStrong, grid, isDark } = getChartColors();
            const filteredIncomes = filterRecordsByDateWindow(inc, activeWindow.startDate, activeWindow.endDate);
            setTextContent('incomeSourcesDateRange', `${formatDateShort(activeWindow.startDate)} to ${formatDateShort(activeWindow.endDate)}`);

            if (!hasRequiredHistory) {
                  setChartEmptyState(
                        'incomeSourcesChart',
                        'incomeSourcesChart',
                        'Not enough income history yet',
                        `Income Sources needs at least ${getRangeLabel(incomeMode)} of income history before it can be shown.`,
                  );
                  return;
            }

            if (!filteredIncomes.length) {
                  setChartEmptyState(
                        'incomeSourcesChart',
                        'incomeSourcesChart',
                        'No income sources in this window',
                        `There are no income entries recorded in the selected ${activeWindow.label.toLowerCase()} range.`,
                  );
                  return;
            }

            clearChartEmptyState('incomeSourcesChart');

            const incomeWrap = incomeCanvas.closest('.chart-wrap');
            const incomeMap = {};
            filteredIncomes.forEach((income) => {
                  incomeMap[income.source] = (incomeMap[income.source] || 0) + Number(income.amount);
            });

            const incomeEntries = prepareRankedBreakdown(Object.entries(incomeMap), 6, 'Other Sources');
            const incomeFullLabels = incomeEntries.map((entry) => entry[0]);
            const incomeLabels = incomeFullLabels.map((label) => truncateLabel(label, 24));
            const incomeValues = incomeEntries.map((entry) => entry[1]);
            const incomeTotal = incomeValues.reduce((sum, value) => sum + value, 0);

            if (incomeSourcesChart) incomeSourcesChart.destroy();

            const incomeCtx = incomeCanvas.getContext('2d');
            const incomeGradient = incomeCtx.createLinearGradient(0, 0, 420, 0);
            if (isDark) {
                  incomeGradient.addColorStop(0, 'rgba(34,197,94,0.88)');
                  incomeGradient.addColorStop(1, 'rgba(34,197,94,0.22)');
            } else {
                  incomeGradient.addColorStop(0, 'rgba(22,163,74,0.84)');
                  incomeGradient.addColorStop(1, 'rgba(22,163,74,0.16)');
            }

            if (incomeWrap) {
                  const dynamicHeight = Math.min(Math.max(incomeEntries.length * 48 + 52, 320), 460);
                  incomeWrap.style.height = `${dynamicHeight}px`;
            }

            incomeSourcesChart = new Chart(incomeCanvas, {
                  type: 'bar',
                  data: {
                        labels: incomeLabels,
                        datasets: [
                              {
                                    label: 'Income Sources',
                                    data: incomeValues,
                                    backgroundColor: incomeGradient,
                                    borderColor: isDark ? 'rgba(74, 222, 128, 0.9)' : 'rgba(22, 163, 74, 0.95)',
                                    borderWidth: 1,
                                    borderRadius: 14,
                                    borderSkipped: false,
                                    barPercentage: 0.82,
                                    categoryPercentage: 0.76,
                                    maxBarThickness: 28,
                              },
                        ],
                  },
                  options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                              legend: {
                                    display: true,
                                    position: 'top',
                                    align: 'end',
                                    labels: {
                                          color: textStrong,
                                          usePointStyle: true,
                                          pointStyle: 'rectRounded',
                                          boxWidth: 14,
                                          boxHeight: 8,
                                          padding: 16,
                                          font: { size: 12, family: 'Inter' },
                                    },
                              },
                              tooltip: {
                                    ...getTooltipTheme(),
                                    callbacks: {
                                          title: (items) => {
                                                const item = items?.[0];
                                                return item ? incomeFullLabels[item.dataIndex] : '';
                                          },
                                          label: (context) => {
                                                const pct = ((context.parsed.x / incomeTotal) * 100).toFixed(1);
                                                return `${formatCurrencyValue(context.parsed.x)} (${pct}%)`;
                                          },
                                    },
                              },
                        },
                        scales: {
                              x: {
                                    beginAtZero: true,
                                    ticks: {
                                          color: text,
                                          font: { size: 12, family: 'Inter' },
                                          padding: 10,
                                          callback: (value) =>
                                                '\u20b9' +
                                                new Intl.NumberFormat('en-IN', {
                                                      notation: 'compact',
                                                      maximumFractionDigits: 1,
                                                }).format(value),
                                    },
                                    grid: { color: grid },
                                    border: { display: false },
                              },
                              y: {
                                    ticks: {
                                          color: text,
                                          font: { size: 12, family: 'Inter' },
                                          padding: 8,
                                    },
                                    grid: { display: false },
                                    border: { display: false },
                              },
                        },
                        animation: { duration: 850, easing: 'easeOutCubic' },
                  },
            });
      }

      function renderPLCharts(exp, inc) {
            renderProfitTrendChart(exp, inc);
            renderIncomeSourcesChart(inc);
      }
});

async function saveBudget() {
      const input = document.getElementById('budgetInput');
      const value = Number(input.value);

      if (!value || value <= 0) {
            alert('Please enter a valid budget');
            return;
      }

      openBudgetRulesModal(value);
}

let pendingBudgetValue = null;

function formatBudgetCurrency(value) {
      return '\u20b9 ' + new Intl.NumberFormat('en-IN').format(value || 0);
}

function closeBudgetRulesModal() {
      const overlay = document.getElementById('budgetRulesOverlay');
      if (overlay) {
            overlay.classList.add('hidden');
      }
      pendingBudgetValue = null;
}

function openBudgetRulesModal(value) {
      const overlay = document.getElementById('budgetRulesOverlay');
      const action = document.getElementById('budgetRulesAction');
      const amount = document.getElementById('budgetRulesAmount');
      const copy = document.getElementById('budgetRulesCopy');
      const btn = document.getElementById('budgetBtn');

      if (!overlay || !action || !amount || !copy || !btn) {
            submitBudget(value);
            return;
      }

      const mode = btn.dataset.budgetMode === 'update' ? 'update' : 'create';
      pendingBudgetValue = value;

      action.textContent = mode === 'update' ? 'Update Budget' : 'Set Budget';
      amount.textContent = formatBudgetCurrency(value);
      copy.textContent =
            mode === 'update'
                  ? 'You are about to update your monthly budget. Please review the student budget rules so you know how edits and locking work.'
                  : 'You are about to set your monthly budget for the first time. Please review the student budget rules before continuing.';

      overlay.classList.remove('hidden');
}

async function submitBudget(value) {
      const token = localStorage.getItem('token');

      try {
            const res = await fetch('https://finance-intelligence-q3zx.onrender.com/api/budget', {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token,
                  },
                  body: JSON.stringify({ monthlyBudget: value }),
            });

            const data = await res.json();

            if (!res.ok) {
                  alert(data.message);
                  return;
            }

            document.getElementById('budgetStatus').textContent = 'Budget saved successfully.';
            location.reload();
      } catch (err) {
            alert('Something went wrong');
      }
}

function initializeBudgetRulesModal() {
      const overlay = document.getElementById('budgetRulesOverlay');
      const closeBtn = document.getElementById('budgetRulesClose');
      const cancelBtn = document.getElementById('budgetRulesCancel');
      const confirmBtn = document.getElementById('budgetRulesConfirm');

      if (!overlay || !closeBtn || !cancelBtn || !confirmBtn) return;

      closeBtn.addEventListener('click', closeBudgetRulesModal);
      cancelBtn.addEventListener('click', closeBudgetRulesModal);

      overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                  closeBudgetRulesModal();
            }
      });

      document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !overlay.classList.contains('hidden')) {
                  closeBudgetRulesModal();
            }
      });

      confirmBtn.addEventListener('click', async () => {
            if (!pendingBudgetValue) return;

            const budgetToSave = pendingBudgetValue;
            closeBudgetRulesModal();
            await submitBudget(budgetToSave);
      });
}

document.addEventListener('DOMContentLoaded', initializeBudgetRulesModal);

async function loadInsights(expenses = [], incomes = []) {
      const token = localStorage.getItem('token');
      const hasExpenseHistory = Array.isArray(expenses) && expenses.length > 0;
      const hasIncomeHistory = Array.isArray(incomes) && incomes.length > 0;

      if (!hasExpenseHistory && !hasIncomeHistory) {
            renderInsights([], 0);
            return;
      }

      try {
            const res = await fetch('https://finance-intelligence-q3zx.onrender.com/api/ai/insights', {
                  headers: {
                        Authorization: 'Bearer ' + token,
                  },
            });

            const data = await res.json();

            renderInsights(data.insights, data.score);
      } catch (err) {
            console.error('Insights error:', err);
            renderInsights([], 0);
      }
}

function renderInsights(insights, score) {
      const container = document.getElementById('insightsList');
      const scoreEl = document.getElementById('insightScore');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const currentRole = currentUser?.role || '';

      if (!container) return;

      // Update score
      if (scoreEl) {
            scoreEl.textContent = score + ' / 10';
      }

      // Safety check
      if (!insights || insights.length === 0) {
            container.innerHTML = `
            <div class="insights-empty-state">
                  <div class="insights-empty-icon">AI</div>
                  <h4>${
                        currentRole === 'msme'
                              ? 'No MSME insights yet'
                              : currentRole === 'salaried'
                                    ? 'No salaried insights yet'
                                    : currentRole === 'student'
                                          ? 'No student insights yet'
                                    : 'No insights available yet'
                  }</h4>
                  <p>${
                        currentRole === 'msme'
                              ? 'Add business income and expense activity to unlock operating warnings, margin signals, and growth opportunities here.'
                              : currentRole === 'salaried'
                                    ? 'Add your salary income and a few expenses to unlock savings guidance, spending patterns, and monthly balance insights here.'
                                    : currentRole === 'student'
                                          ? 'Set a budget and add a few expenses or student income entries to unlock budget warnings, spending patterns, and practical insights here.'
                              : 'Add a bit more activity and we will surface AI-powered patterns, warnings, and opportunities here.'
                  }</p>
            </div>`;
            return;
      }

      // Priority sort
      const priority = {
            warning: 1,
            trend: 2,
            tip: 3,
            positive: 4,
      };

      insights.sort((a, b) => {
            return (priority[a.type] || 5) - (priority[b.type] || 5);
      });

      // Icon and tag map
      const iconMap = {
            warning: '\u26A0\uFE0F',
            trend: '\uD83D\uDCC8',
            tip: '\uD83D\uDCA1',
            positive: '\u2705',
      };

      const tagClass = {
            warning: 'insight-tag insight-tag--warning',
            trend: 'insight-tag insight-tag--trend',
            tip: 'insight-tag insight-tag--tip',
            positive: 'insight-tag insight-tag--good',
            default: 'insight-tag insight-tag--trend',
      };

      const MAX_VISIBLE = 6;
      let expanded = false;

      // Card render function
      function renderCard(i) {
            const card = document.createElement('div');

            const type = ['warning', 'trend', 'tip', 'positive'].includes(i.type) ? i.type : 'trend';

            card.className = `insight-card ${type}`;

            const title = i.title || 'Insight';
            const text = normalizeInsightText(i.text || '');

            card.innerHTML = `
            <div class="insight-header">
                  <div class="insight-icon">${iconMap[type] || '\uD83D\uDCC8'}</div>
                  <div class="insight-title">${title}</div>
            </div>

            <div class="insight-body">
                  ${text}
            </div>

            <div class="insight-footer">
                  <span class="${tagClass[type] || tagClass.default}">
                        ${type}
                  </span>
            </div>
`;

            // Smooth animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';

            setTimeout(() => {
                  card.style.transition = 'all 0.3s ease';
                  card.style.opacity = '1';
                  card.style.transform = 'translateY(0)';
            }, 50);

            container.appendChild(card);
      }

      // Main render function
      function renderList() {
            container.innerHTML = '';

            const list = expanded ? insights : insights.slice(0, MAX_VISIBLE);

            list.forEach((i) => renderCard(i));

            // Button (View More / Less)
            if (insights.length > MAX_VISIBLE) {
                  const btn = document.createElement('button');
                  btn.className = 'insight-expand-btn';

                  btn.textContent = expanded ? 'View less' : `View more (${insights.length - MAX_VISIBLE})`;

                  btn.onclick = () => {
                        expanded = !expanded;
                        renderList();
                  };

                  container.appendChild(btn);
            }
      }

      // Initial call
      renderList();

      console.log('Total insights:', insights.length);
}

/* ================================
      GLASS NAVBAR BEHAVIOR
================================ */

const navbar = document.getElementById('glassNavbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;

      if (currentScroll > 20) {
            navbar.classList.add('scrolled');
      } else {
            navbar.classList.remove('scrolled');
      }

      lastScrollY = currentScroll;
});

/* Active tab handling */
document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach((i) => i.classList.remove('active'));
            item.classList.add('active');

            const page = item.dataset.page;

            if (page === 'dashboard') {
                  window.location.href = 'dashboard.html';
            }

            if (page === 'expenses') {
                  window.location.href = 'expenses.html';
            }

            if (page === 'income') {
                  window.location.href = 'incomes.html';
            }

            if (page === 'reports') {
                  window.location.href = 'reports.html';
            }
      });
});

/* ===============================
      iOS 26 MAGNETIC NAVBAR EFFECT
================================ */

document.querySelectorAll('.nav-item').forEach((item) => {
      let rect = null;

      item.addEventListener('mousemove', (e) => {
            rect = item.getBoundingClientRect();

            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Magnetic strength (tweak but keep subtle)
            const strength = 0.35;

            item.style.transform = `translate(${x * strength}px, ${y * strength}px) scale(1.05)`;
      });

      item.addEventListener('mouseleave', () => {
            item.style.transform = `translate(0px, 0px)scale(1)`;
      });
});


