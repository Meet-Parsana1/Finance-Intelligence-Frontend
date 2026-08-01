/**
      reports.js
      Finance Intelligence — Reports Dashboard Logic
      
      Modules:
            1. DATA LAYER  — role-specific datasets
            2. THEME       — dark/light toggle
            3. KPI CARDS   — populate values + sparklines
            4. CHARTS      — Pie, Line, Bar via Chart.js
            5. CATEGORIES  — top spending list
            6. TABLE       — monthly breakdown + search
            7. INSIGHTS    — smart insight cards
            8. STUDENT     — budget bars (student role only)
            9. NAVBAR      — scroll glass + mobile menu
            10. PERIOD BTNS — period switcher (UI only, data swap hook)
            11. BOOTSTRAP   — init on DOMContentLoaded
*/

(function () {
      'use strict';

      /* ══════════════════════════════════════════════════════════
      1. DATA LAYER
      ══════════════════════════════════════════════════════════ */

      /** Accent palette for charts — consistent across roles */
      const PALETTE = {
            blue: '#3b82f6',
            green: '#10b981',
            red: '#ef4444',
            amber: '#f59e0b',
            purple: '#8b5cf6',
            teal: '#14b8a6',
            pink: '#ec4899',
            indigo: '#6366f1',
      };

      const DATA = {
            /* ── SALARIED ──────────────────────────────────────── */
            salaried: {
                  kpi: {
                        totalExpenses: '₹42,180',
                        totalIncome: '₹95,000',
                        savingsRate: '31%',
                        healthScore: '74',
                        healthLabel: 'Good',
                        healthPct: 74,
                        expensesDelta: { label: '↑ 6.2%', dir: 'up' },
                        incomeDelta: { label: '→ Stable', dir: 'up' },
                        savingsDelta: { label: '↑ 3.1%', dir: 'up' },
                  },
                  sparklines: {
                        expenses: [38000, 41000, 39500, 43000, 40000, 42180],
                        income: [90000, 90000, 95000, 95000, 95000, 95000],
                        savings: [26, 27, 28, 30, 29, 31],
                        health: [65, 68, 70, 71, 73, 74],
                  },
                  categories: [
                        { name: 'Housing & Rent', emoji: '🏠', value: '₹12,000', pct: 28, color: PALETTE.blue },
                        { name: 'Food & Dining', emoji: '🍜', value: '₹8,400', pct: 20, color: PALETTE.red },
                        { name: 'Transport', emoji: '🚗', value: '₹5,800', pct: 14, color: PALETTE.amber },
                        { name: 'Utilities', emoji: '💡', value: '₹4,200', pct: 10, color: PALETTE.green },
                        { name: 'Entertainment', emoji: '🎬', value: '₹3,600', pct: 9, color: PALETTE.purple },
                  ],
                  monthlyTable: [
                        {
                              month: 'April 2025',
                              income: 95000,
                              expenses: 42180,
                              savings: 52820,
                              rate: 55.6,
                              status: 'good',
                        },
                        {
                              month: 'March 2025',
                              income: 95000,
                              expenses: 39700,
                              savings: 55300,
                              rate: 58.2,
                              status: 'good',
                        },
                        {
                              month: 'February 2025',
                              income: 95000,
                              expenses: 44100,
                              savings: 50900,
                              rate: 53.6,
                              status: 'good',
                        },
                        {
                              month: 'January 2025',
                              income: 90000,
                              expenses: 48200,
                              savings: 41800,
                              rate: 46.4,
                              status: 'warn',
                        },
                        {
                              month: 'December 2024',
                              income: 90000,
                              expenses: 52100,
                              savings: 37900,
                              rate: 42.1,
                              status: 'warn',
                        },
                        {
                              month: 'November 2024',
                              income: 90000,
                              expenses: 55800,
                              savings: 34200,
                              rate: 38.0,
                              status: 'bad',
                        },
                  ],
                  lineData: {
                        labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
                        data: [55800, 52100, 48200, 44100, 39700, 42180],
                  },
                  barData: {
                        labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
                        income: [90000, 90000, 90000, 95000, 95000, 95000],
                        expenses: [55800, 52100, 48200, 44100, 39700, 42180],
                  },
                  pieData: {
                        labels: ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Other'],
                        data: [28, 20, 14, 10, 9, 19],
                        colors: [PALETTE.blue, PALETTE.red, PALETTE.amber, PALETTE.green, PALETTE.purple, '#374151'],
                  },
                  insights: [
                        {
                              icon: '⚠️',
                              title: 'High food spending',
                              body: 'You spent 20% (₹8,400) on Food & Dining. Target is under 15%.',
                              tag: { label: 'Warning', type: 'warning' },
                        },
                        {
                              icon: '📈',
                              title: 'Expenses up 6.2%',
                              body: 'Spending increased ₹2,480 compared to last month. Review discretionary items.',
                              tag: { label: 'Trend', type: 'warning' },
                        },
                        {
                              icon: '💡',
                              title: 'Savings opportunity',
                              body: 'Reduce food & entertainment by ₹3,000 to push savings rate above 35%.',
                              tag: { label: 'Tip', type: 'tip' },
                        },
                        {
                              icon: '✅',
                              title: 'Housing on budget',
                              body: 'Rent at 28% of income is within the recommended 30% threshold.',
                              tag: { label: 'On track', type: 'good' },
                        },
                        {
                              icon: '🎯',
                              title: 'Investment window',
                              body: 'With ₹52,820 monthly surplus, consider investing ₹20,000 in index funds.',
                              tag: { label: 'Action', type: 'tip' },
                        },
                        {
                              icon: '📊',
                              title: 'Expense trend improving',
                              body: 'Your 3-month expense trend is downward. Keep it up!',
                              tag: { label: 'Positive', type: 'good' },
                        },
                  ],
            },

            /* ── STUDENT ────────────────────────────────────────── */
            student: {
                  kpi: {
                        totalExpenses: '₹11,240',
                        totalIncome: '₹18,000',
                        savingsRate: '18%',
                        healthScore: '52',
                        healthLabel: 'Fair',
                        healthPct: 52,
                        expensesDelta: { label: '↑ 12.4%', dir: 'up' },
                        incomeDelta: { label: '→ Allowance', dir: 'up' },
                        savingsDelta: { label: '↓ 2.0%', dir: 'down' },
                  },
                  sparklines: {
                        expenses: [9200, 9800, 10100, 11000, 10800, 11240],
                        income: [18000, 18000, 18000, 18000, 18000, 18000],
                        savings: [22, 20, 21, 19, 20, 18],
                        health: [56, 55, 54, 53, 53, 52],
                  },
                  categories: [
                        { name: 'Food & Canteen', emoji: '🍜', value: '₹4,270', pct: 38, color: PALETTE.red },
                        { name: 'Transport', emoji: '🚌', value: '₹2,020', pct: 18, color: PALETTE.amber },
                        { name: 'Books & Study', emoji: '📚', value: '₹1,680', pct: 15, color: PALETTE.blue },
                        { name: 'Entertainment', emoji: '🎮', value: '₹1,460', pct: 13, color: PALETTE.purple },
                        { name: 'Clothing', emoji: '👕', value: '₹900', pct: 8, color: PALETTE.teal },
                  ],
                  monthlyTable: [
                        {
                              month: 'April 2025',
                              income: 18000,
                              expenses: 11240,
                              savings: 6760,
                              rate: 37.6,
                              status: 'warn',
                        },
                        {
                              month: 'March 2025',
                              income: 18000,
                              expenses: 10800,
                              savings: 7200,
                              rate: 40.0,
                              status: 'warn',
                        },
                        {
                              month: 'February 2025',
                              income: 18000,
                              expenses: 11000,
                              savings: 7000,
                              rate: 38.9,
                              status: 'warn',
                        },
                        {
                              month: 'January 2025',
                              income: 18000,
                              expenses: 10100,
                              savings: 7900,
                              rate: 43.9,
                              status: 'good',
                        },
                        {
                              month: 'December 2024',
                              income: 18000,
                              expenses: 13400,
                              savings: 4600,
                              rate: 25.6,
                              status: 'bad',
                        },
                        {
                              month: 'November 2024',
                              income: 18000,
                              expenses: 9800,
                              savings: 8200,
                              rate: 45.6,
                              status: 'good',
                        },
                  ],
                  lineData: {
                        labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
                        data: [9800, 13400, 10100, 11000, 10800, 11240],
                  },
                  barData: {
                        labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
                        income: [18000, 18000, 18000, 18000, 18000, 18000],
                        expenses: [9800, 13400, 10100, 11000, 10800, 11240],
                  },
                  pieData: {
                        labels: ['Food', 'Transport', 'Books', 'Entertainment', 'Clothing', 'Other'],
                        data: [38, 18, 15, 13, 8, 8],
                        colors: [PALETTE.red, PALETTE.amber, PALETTE.blue, PALETTE.purple, PALETTE.teal, '#374151'],
                  },
                  insights: [
                        {
                              icon: '⚠️',
                              title: 'You spent 38% on Food',
                              body: '₹4,270 went to food — well above the 25% student budget guideline.',
                              tag: { label: 'Warning', type: 'warning' },
                        },
                        {
                              icon: '📈',
                              title: 'Spending up 12% this month',
                              body: 'Expenses increased ₹1,240 vs last month. December spike was holiday spending.',
                              tag: { label: 'Trend', type: 'warning' },
                        },
                        {
                              icon: '💡',
                              title: 'Save ₹2,000 on food',
                              body: 'Cook 3 meals per week at home to hit your ₹20,000 savings goal by June.',
                              tag: { label: 'Tip', type: 'tip' },
                        },
                        {
                              icon: '🚌',
                              title: 'Consider a monthly pass',
                              body: 'A monthly transit pass could save ₹400–600 vs per-ride fares.',
                              tag: { label: 'Tip', type: 'tip' },
                        },
                  ],
                  studentBudgets: [
                        { label: 'Food', spent: 4270, budget: 4500, color: PALETTE.red },
                        { label: 'Transport', spent: 2020, budget: 2000, color: PALETTE.amber },
                        { label: 'Books', spent: 1680, budget: 2000, color: PALETTE.blue },
                        { label: 'Entertainment', spent: 1460, budget: 1000, color: PALETTE.purple },
                        { label: 'Clothing', spent: 900, budget: 1200, color: PALETTE.teal },
                  ],
            },

            /* ── MSME ───────────────────────────────────────────── */
            msme: {
                  kpi: {
                        totalExpenses: '₹1,44,000',
                        totalIncome: '₹3,20,000',
                        savingsRate: '55%',
                        healthScore: '81',
                        healthLabel: 'Excellent',
                        healthPct: 81,
                        expensesDelta: { label: '↑ 3.1%', dir: 'up' },
                        incomeDelta: { label: '↑ 8.4%', dir: 'up' },
                        savingsDelta: { label: '↑ 4.2%', dir: 'up' },
                  },
                  sparklines: {
                        expenses: [130000, 135000, 138000, 140000, 141000, 144000],
                        income: [280000, 290000, 295000, 300000, 310000, 320000],
                        savings: [48, 50, 51, 52, 54, 55],
                        health: [74, 75, 77, 78, 80, 81],
                  },
                  categories: [
                        { name: 'Operations', emoji: '⚙️', value: '₹54,000', pct: 37, color: PALETTE.blue },
                        { name: 'Staff Salaries', emoji: '👥', value: '₹40,000', pct: 28, color: PALETTE.indigo },
                        { name: 'Raw Materials', emoji: '📦', value: '₹24,000', pct: 17, color: PALETTE.amber },
                        { name: 'Marketing', emoji: '📣', value: '₹14,400', pct: 10, color: PALETTE.pink },
                        { name: 'Logistics', emoji: '🚚', value: '₹11,600', pct: 8, color: PALETTE.teal },
                  ],
                  monthlyTable: [
                        {
                              month: 'April 2025',
                              income: 320000,
                              expenses: 144000,
                              savings: 176000,
                              rate: 55.0,
                              status: 'good',
                        },
                        {
                              month: 'March 2025',
                              income: 310000,
                              expenses: 141000,
                              savings: 169000,
                              rate: 54.5,
                              status: 'good',
                        },
                        {
                              month: 'February 2025',
                              income: 300000,
                              expenses: 140000,
                              savings: 160000,
                              rate: 53.3,
                              status: 'good',
                        },
                        {
                              month: 'January 2025',
                              income: 295000,
                              expenses: 138000,
                              savings: 157000,
                              rate: 53.2,
                              status: 'good',
                        },
                        {
                              month: 'December 2024',
                              income: 290000,
                              expenses: 149000,
                              savings: 141000,
                              rate: 48.6,
                              status: 'warn',
                        },
                        {
                              month: 'November 2024',
                              income: 280000,
                              expenses: 145000,
                              savings: 135000,
                              rate: 48.2,
                              status: 'warn',
                        },
                  ],
                  lineData: {
                        labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
                        data: [145000, 149000, 138000, 140000, 141000, 144000],
                  },
                  barData: {
                        labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
                        income: [280000, 290000, 295000, 300000, 310000, 320000],
                        expenses: [145000, 149000, 138000, 140000, 141000, 144000],
                  },
                  pieData: {
                        labels: ['Operations', 'Salaries', 'Raw Material', 'Marketing', 'Logistics', 'Other'],
                        data: [37, 28, 17, 10, 8, 0],
                        colors: [PALETTE.blue, PALETTE.indigo, PALETTE.amber, PALETTE.pink, PALETTE.teal, '#374151'],
                  },
                  insights: [
                        {
                              icon: '✅',
                              title: 'Profit margin at 55%',
                              body: 'Your gross margin is healthy. Industry average for MSME is 40–50%.',
                              tag: { label: 'Excellent', type: 'good' },
                        },
                        {
                              icon: '📈',
                              title: 'Revenue grew 8.4%',
                              body: 'Revenue increased ₹25,000 vs last month. Consistent growth trend.',
                              tag: { label: 'Growth', type: 'good' },
                        },
                        {
                              icon: '💡',
                              title: 'Optimize marketing spend',
                              body: 'Marketing at 10% of expenses. A/B test campaigns to improve ROI before scaling.',
                              tag: { label: 'Tip', type: 'tip' },
                        },
                        {
                              icon: '⚠️',
                              title: 'Watch raw material costs',
                              body: 'Material costs rising 3.1% MoM. Consider locking in supplier contracts.',
                              tag: { label: 'Risk', type: 'warning' },
                        },
                        {
                              icon: '🎯',
                              title: 'Q2 target on track',
                              body: 'At current growth rate you will exceed ₹4,00,000 revenue by June.',
                              tag: { label: 'Forecast', type: 'tip' },
                        },
                        {
                              icon: '📊',
                              title: 'Staff cost stable',
                              body: 'Salary/revenue ratio at 12.5% — well within the healthy 15% benchmark.',
                              tag: { label: 'Info', type: 'info' },
                        },
                  ],
            },
      };

      /* ══════════════════════════════════════════════════════════
      2. THEME TOGGLE
      ══════════════════════════════════════════════════════════ */
      const themeToggleBtn = document.getElementById('themeToggle');
      const iconSun = document.getElementById('iconSun');
      const iconMoon = document.getElementById('iconMoon');
      const html = document.documentElement;

      function applyTheme(theme) {
            html.setAttribute('data-theme', theme);
            if (theme === 'dark') {
                  iconSun.style.display = 'block';
                  iconMoon.style.display = 'none';
            } else {
                  iconSun.style.display = 'none';
                  iconMoon.style.display = 'block';
            }
            localStorage.setItem('fi-theme', theme);
            /* Re-render charts so they pick up new grid/tick colors */
            if (chartInstances.pie || chartInstances.line || chartInstances.bar) {
                  renderCharts(currentRole());
            }
      }

      themeToggleBtn.addEventListener('click', () => {
            const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
      });

      /* ══════════════════════════════════════════════════════════
      3. ROLE MANAGEMENT
      ══════════════════════════════════════════════════════════ */
      const roleSwitcher = document.getElementById('roleSwitcher');

      function currentRole() {
            return html.getAttribute('data-role') || 'salaried';
      }

      function applyRole(role) {
            html.setAttribute('data-role', role);
            localStorage.setItem('fi-role', role);
            renderAll(role);
      }

      roleSwitcher.addEventListener('change', () => applyRole(roleSwitcher.value));

      /* ══════════════════════════════════════════════════════════
      4. KPI CARDS
      ══════════════════════════════════════════════════════════ */
      function renderKPI(role) {
            const d = DATA[role].kpi;

            /* Text values */
            qs('[data-key="totalExpenses"]').textContent = d.totalExpenses;
            qs('[data-key="totalIncome"]').textContent = d.totalIncome;
            qs('[data-key="savingsRate"]').textContent = d.savingsRate;
            qs('[data-key="healthScore"]').textContent = d.healthScore;
            qs('[data-key="healthLabel"]').textContent = d.healthLabel;

            /* Deltas */
            setDelta('[data-key="expensesDelta"]', d.expensesDelta);
            setDelta('[data-key="incomeDelta"]', d.incomeDelta);
            setDelta('[data-key="savingsDelta"]', d.savingsDelta);

            /* Health bar */
            const fill = document.getElementById('healthBarFill');
            const pct = d.healthPct;
            fill.style.width = pct + '%';
            fill.style.background = pct >= 70 ? PALETTE.green : pct >= 45 ? PALETTE.amber : PALETTE.red;

            /* Sparklines */
            renderSparklines(role);
      }

      function setDelta(selector, delta) {
            const el = qs(selector);
            if (!el) return;
            el.textContent = delta.label;
            el.className = 'kpi-delta kpi-delta--' + delta.dir;
      }

      /* ══════════════════════════════════════════════════════════
      5. SPARKLINES
      ══════════════════════════════════════════════════════════ */
      const sparkInstances = {};

      function sparklineOptions(color) {
            return {
                  type: 'line',
                  data: {
                        labels: ['', '', '', '', '', ''],
                        datasets: [
                              {
                                    data: [],
                                    borderColor: color,
                                    borderWidth: 1.5,
                                    pointRadius: 0,
                                    tension: 0.4,
                                    fill: true,
                                    backgroundColor: hexToRgba(color, 0.08),
                              },
                        ],
                  },
                  options: {
                        responsive: false,
                        animation: { duration: 600 },
                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                        scales: {
                              x: { display: false },
                              y: { display: false },
                        },
                  },
            };
      }

      function renderSparklines(role) {
            const s = DATA[role].sparklines;
            renderSpark('sparkExpenses', s.expenses, PALETTE.red);
            renderSpark('sparkIncome', s.income, PALETTE.green);
            renderSpark('sparkSavings', s.savings, PALETTE.blue);
            renderSpark('sparkHealth', s.health, PALETTE.amber);
      }

      function renderSpark(id, data, color) {
            const canvas = document.getElementById(id);
            if (!canvas) return;

            if (sparkInstances[id]) {
                  sparkInstances[id].data.datasets[0].data = data;
                  sparkInstances[id].data.datasets[0].borderColor = color;
                  sparkInstances[id].update();
                  return;
            }

            const cfg = sparklineOptions(color);
            cfg.data.datasets[0].data = data;
            sparkInstances[id] = new Chart(canvas, cfg);
      }

      /* ══════════════════════════════════════════════════════════
      6. CHARTS
      ══════════════════════════════════════════════════════════ */
      const chartInstances = { pie: null, line: null, bar: null };

      /* Shared tooltip style */
      function tooltipPlugin() {
            return {
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  borderWidth: 1,
                  titleColor: '#ffffff',
                  bodyColor: '#a1a1aa',
                  padding: 10,
                  cornerRadius: 8,
                  displayColors: true,
                  boxWidth: 8,
                  boxHeight: 8,
            };
      }

      function gridColor() {
            return (
                  getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() ||
                  'rgba(255,255,255,0.04)'
            );
      }

      function tickColor() {
            return getComputedStyle(document.documentElement).getPropertyValue('--chart-tick').trim() || '#3f3f46';
      }

      function renderCharts(role) {
            const d = DATA[role];
            renderPieChart(d.pieData);
            renderLineChart(d.lineData);
            renderBarChart(d.barData);
      }

      /* Pie / Doughnut */
      function renderPieChart(data) {
            const canvas = document.getElementById('pieChart');
            if (!canvas) return;

            const cfg = {
                  type: 'doughnut',
                  data: {
                        labels: data.labels,
                        datasets: [
                              {
                                    data: data.data,
                                    backgroundColor: data.colors,
                                    borderColor: 'var(--bg-card)',
                                    borderWidth: 3,
                                    hoverOffset: 6,
                                    hoverBorderWidth: 0,
                              },
                        ],
                  },
                  options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '66%',
                        animation: { duration: 700, easing: 'easeInOutQuart' },
                        plugins: {
                              legend: {
                                    display: true,
                                    position: 'bottom',
                                    labels: {
                                          color: tickColor(),
                                          font: { family: "'DM Sans', sans-serif", size: 10 },
                                          boxWidth: 8,
                                          boxHeight: 8,
                                          borderRadius: 2,
                                          padding: 10,
                                          generateLabels(chart) {
                                                const ds = chart.data.datasets[0];
                                                return chart.data.labels.map((label, i) => ({
                                                      text: label + ' ' + ds.data[i] + '%',
                                                      fillStyle: ds.backgroundColor[i],
                                                      hidden: false,
                                                      index: i,
                                                      strokeStyle: ds.backgroundColor[i],
                                                      lineWidth: 0,
                                                }));
                                          },
                                    },
                              },
                              tooltip: { ...tooltipPlugin() },
                        },
                  },
            };

            if (chartInstances.pie) {
                  chartInstances.pie.data = cfg.data;
                  chartInstances.pie.options = cfg.options;
                  chartInstances.pie.update();
            } else {
                  chartInstances.pie = new Chart(canvas, cfg);
            }
      }

      /* Line chart */
      function renderLineChart(data) {
            const canvas = document.getElementById('lineChart');
            if (!canvas) return;

            const cfg = {
                  type: 'line',
                  data: {
                        labels: data.labels,
                        datasets: [
                              {
                                    label: 'Expenses',
                                    data: data.data,
                                    borderColor: PALETTE.blue,
                                    borderWidth: 2,
                                    pointBackgroundColor: PALETTE.blue,
                                    pointBorderColor: 'var(--bg-card)',
                                    pointBorderWidth: 2,
                                    pointRadius: 4,
                                    pointHoverRadius: 6,
                                    tension: 0.4,
                                    fill: true,
                                    backgroundColor: (ctx) => {
                                          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
                                          g.addColorStop(0, hexToRgba(PALETTE.blue, 0.15));
                                          g.addColorStop(1, hexToRgba(PALETTE.blue, 0));
                                          return g;
                                    },
                              },
                        ],
                  },
                  options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 700 },
                        plugins: {
                              legend: { display: false },
                              tooltip: {
                                    ...tooltipPlugin(),
                                    callbacks: {
                                          label: (ctx) => ' ₹' + ctx.parsed.y.toLocaleString('en-IN'),
                                    },
                              },
                        },
                        scales: {
                              x: {
                                    grid: { color: gridColor(), drawBorder: false },
                                    ticks: { color: tickColor(), font: { family: "'DM Sans'", size: 11 } },
                                    border: { display: false },
                              },
                              y: {
                                    grid: { color: gridColor(), drawBorder: false },
                                    ticks: {
                                          color: tickColor(),
                                          font: { family: "'JetBrains Mono'", size: 10 },
                                          callback: (v) =>
                                                '₹' +
                                                (v >= 100000
                                                      ? (v / 100000).toFixed(1) + 'L'
                                                      : (v / 1000).toFixed(0) + 'k'),
                                          maxTicksLimit: 5,
                                    },
                                    border: { display: false },
                              },
                        },
                  },
            };

            buildLegend('lineLegend', [{ label: 'Expenses', color: PALETTE.blue }]);

            if (chartInstances.line) {
                  chartInstances.line.data = cfg.data;
                  chartInstances.line.options = cfg.options;
                  chartInstances.line.update();
            } else {
                  chartInstances.line = new Chart(canvas, cfg);
            }
      }

      /* Bar chart */
      function renderBarChart(data) {
            const canvas = document.getElementById('barChart');
            if (!canvas) return;

            const cfg = {
                  type: 'bar',
                  data: {
                        labels: data.labels,
                        datasets: [
                              {
                                    label: 'Income',
                                    data: data.income,
                                    backgroundColor: hexToRgba(PALETTE.green, 0.75),
                                    borderColor: PALETTE.green,
                                    borderWidth: 1,
                                    borderRadius: 5,
                                    borderSkipped: false,
                                    barPercentage: 0.6,
                              },
                              {
                                    label: 'Expenses',
                                    data: data.expenses,
                                    backgroundColor: hexToRgba(PALETTE.red, 0.65),
                                    borderColor: PALETTE.red,
                                    borderWidth: 1,
                                    borderRadius: 5,
                                    borderSkipped: false,
                                    barPercentage: 0.6,
                              },
                        ],
                  },
                  options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 700 },
                        plugins: {
                              legend: { display: false },
                              tooltip: {
                                    ...tooltipPlugin(),
                                    callbacks: {
                                          label: (ctx) =>
                                                ' ' + ctx.dataset.label + ': ₹' + ctx.parsed.y.toLocaleString('en-IN'),
                                    },
                              },
                        },
                        scales: {
                              x: {
                                    grid: { display: false },
                                    ticks: { color: tickColor(), font: { family: "'DM Sans'", size: 11 } },
                                    border: { display: false },
                              },
                              y: {
                                    grid: { color: gridColor(), drawBorder: false },
                                    ticks: {
                                          color: tickColor(),
                                          font: { family: "'JetBrains Mono'", size: 10 },
                                          callback: (v) =>
                                                '₹' +
                                                (v >= 100000
                                                      ? (v / 100000).toFixed(1) + 'L'
                                                      : (v / 1000).toFixed(0) + 'k'),
                                          maxTicksLimit: 5,
                                    },
                                    border: { display: false },
                              },
                        },
                  },
            };

            buildLegend('barLegend', [
                  { label: 'Income', color: PALETTE.green },
                  { label: 'Expenses', color: PALETTE.red },
            ]);

            if (chartInstances.bar) {
                  chartInstances.bar.data = cfg.data;
                  chartInstances.bar.options = cfg.options;
                  chartInstances.bar.update();
            } else {
                  chartInstances.bar = new Chart(canvas, cfg);
            }
      }

      /** Build a custom HTML legend */
      function buildLegend(id, items) {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerHTML = items
                  .map(
                        (item) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${item.color}"></span>
        <span>${item.label}</span>
      </div>
    `,
                  )
                  .join('');
      }

      /* ══════════════════════════════════════════════════════════
     7. CATEGORIES
  ══════════════════════════════════════════════════════════ */
      function renderCategories(role) {
            const list = document.getElementById('categoryList');
            if (!list) return;

            list.innerHTML = DATA[role].categories
                  .map(
                        (cat) => `
      <div class="category-item">
        <div class="category-item-top">
          <span class="category-name">
            <span class="category-emoji">${cat.emoji}</span>
            ${cat.name}
          </span>
          <div class="category-amounts">
            <div class="category-value">${cat.value}</div>
            <div class="category-pct">${cat.pct}% of total</div>
          </div>
        </div>
        <div class="category-bar-track">
          <div class="category-bar-fill"
               style="width:${cat.pct}%; background:${cat.color}"></div>
        </div>
      </div>
    `,
                  )
                  .join('');
      }

      /* ══════════════════════════════════════════════════════════
     8. MONTHLY BREAKDOWN TABLE
  ══════════════════════════════════════════════════════════ */
      let currentTableData = [];

      function renderTable(role) {
            currentTableData = DATA[role].monthlyTable;
            populateTable(currentTableData);
      }

      function populateTable(rows) {
            const body = document.getElementById('breakdownBody');
            if (!body) return;

            body.innerHTML = rows
                  .map(
                        (row) => `
      <tr>
        <td>${row.month}</td>
        <td>₹${row.income.toLocaleString('en-IN')}</td>
        <td>₹${row.expenses.toLocaleString('en-IN')}</td>
        <td>₹${row.savings.toLocaleString('en-IN')}</td>
        <td>${row.rate.toFixed(1)}%</td>
        <td><span class="status-pill status-pill--${row.status}">
          ${row.status === 'good' ? 'On Track' : row.status === 'warn' ? 'Monitor' : 'Off Track'}
        </span></td>
      </tr>
    `,
                  )
                  .join('');
      }

      /* Live search filter */
      const tableSearch = document.getElementById('tableSearch');
      tableSearch.addEventListener('input', () => {
            const q = tableSearch.value.toLowerCase();
            const filtered = currentTableData.filter((r) => r.month.toLowerCase().includes(q));
            populateTable(filtered);
      });

      /* ══════════════════════════════════════════════════════════
     9. INSIGHTS
  ══════════════════════════════════════════════════════════ */
      function renderInsights(role) {
            const grid = document.getElementById('insightsGrid');
            const score = document.getElementById('insightScore');
            if (!grid) return;

            const items = DATA[role].insights;

            /* Compute an "insight score" — purely illustrative */
            const scoreMap = { salaried: '7.4 / 10', student: '5.2 / 10', msme: '8.1 / 10' };
            if (score) score.textContent = scoreMap[role] || '—';

            grid.innerHTML = items
                  .map(
                        (ins) => `
      <div class="insight-card fade-up">
        <div class="insight-icon">${ins.icon}</div>
        <div class="insight-content">
          <div class="insight-title">${ins.title}</div>
          <div class="insight-body">${ins.body}</div>
          <span class="insight-tag insight-tag--${ins.tag.type}">${ins.tag.label}</span>
        </div>
      </div>
    `,
                  )
                  .join('');
      }

      /* ══════════════════════════════════════════════════════════
     10. STUDENT BUDGETS
  ══════════════════════════════════════════════════════════ */
      function renderStudentBudgets(role) {
            const container = document.getElementById('studentBudgets');
            if (!container || role !== 'student') return;

            const budgets = DATA.student.studentBudgets;

            container.innerHTML = budgets
                  .map((b) => {
                        const pct = Math.min(100, Math.round((b.spent / b.budget) * 100));
                        const over = b.spent > b.budget;
                        const barColor = over ? PALETTE.red : b.color;

                        return `
        <div class="student-budget-item">
          <span class="student-budget-label">${b.label}</span>
          <div class="student-budget-track">
            <div class="student-budget-fill" style="width:${pct}%; background:${barColor}"></div>
          </div>
          <span class="student-budget-values">₹${b.spent.toLocaleString('en-IN')} / ₹${b.budget.toLocaleString('en-IN')}</span>
        </div>
      `;
                  })
                  .join('');
      }

      /* ══════════════════════════════════════════════════════════
     11. NAVBAR — scroll shrink + mobile menu
  ══════════════════════════════════════════════════════════ */
      const navbar = document.getElementById('navbar');
      const hamburger = document.getElementById('hamburger');
      const navLinks = document.getElementById('navLinks');

      window.addEventListener(
            'scroll',
            () => {
                  if (window.scrollY > 20) {
                        navbar.style.top = '6px';
                  } else {
                        navbar.style.top = '12px';
                  }
            },
            { passive: true },
      );

      hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('is-open');
      });

      /* Close menu on outside click */
      document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target)) {
                  navLinks.classList.remove('is-open');
            }
      });

      /* ══════════════════════════════════════════════════════════
     12. PERIOD BUTTONS
  ══════════════════════════════════════════════════════════ */
      document.querySelectorAll('.period-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                  document.querySelectorAll('.period-btn').forEach((b) => b.classList.remove('active'));
                  btn.classList.add('active');
                  /* TODO: swap dataset by period when multi-period data is available */
            });
      });

      /* ══════════════════════════════════════════════════════════
     13. RENDER ALL — master function called on role change
  ══════════════════════════════════════════════════════════ */
      function renderAll(role) {
            renderKPI(role);
            renderCharts(role);
            renderCategories(role);
            renderTable(role);
            renderInsights(role);
            renderStudentBudgets(role);
      }

      /* ══════════════════════════════════════════════════════════
     14. BOOTSTRAP
  ══════════════════════════════════════════════════════════ */

      /** Query selector shorthand */
      function qs(sel) {
            return document.querySelector(sel);
      }

      /** Hex to rgba helper */
      function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${alpha})`;
      }

      function init() {
            const savedTheme = localStorage.getItem('fi-theme') || 'dark';
            applyTheme(savedTheme);

            const savedRole = localStorage.getItem('fi-role') || 'salaried';
            roleSwitcher.value = savedRole;
            html.setAttribute('data-role', savedRole);

            renderAll(savedRole);
      }

      if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
      } else {
            init();
      }
})();
