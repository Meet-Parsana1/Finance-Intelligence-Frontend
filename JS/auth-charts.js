/**
 * auth-charts.js
 * Finance Intelligence — Analytics Preview Charts
 *
 * Depends on: Chart.js (loaded before this script)
 * Targets:    #donutChart, #lineChart
 */

(function () {
      'use strict';

      /* ── Shared tooltip defaults ──────────────────────────── */
      const sharedTooltip = {
            backgroundColor: '#1a1a1a',
            borderColor: '#2f2f2f',
            borderWidth: 1,
            titleColor: '#a1a1aa',
            bodyColor: '#ffffff',
            padding: 10,
            cornerRadius: 6,
      };

      /* ── Shared chart options ─────────────────────────────── */
      const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                  duration: 900,
                  easing: 'easeInOutQuart',
            },
            plugins: {
                  legend: { display: false },
                  tooltip: sharedTooltip,
            },
      };

      /* ── Donut Chart — Expense Distribution ──────────────── */
      function initDonutChart() {
            const canvas = document.getElementById('donutChart');
            if (!canvas) return;

            new Chart(canvas, {
                  type: 'doughnut',
                  data: {
                        labels: ['Food', 'Travel', 'Shopping', 'Utilities'],
                        datasets: [
                              {
                                    data: [36, 22, 27, 15],
                                    backgroundColor: ['#3b82f6', '#1d4ed8', '#10b981', '#374151'],
                                    borderColor: '#121212',
                                    borderWidth: 3,
                                    hoverBorderColor: '#1f1f1f',
                                    hoverOffset: 4,
                              },
                        ],
                  },
                  options: {
                        ...baseOptions,
                        cutout: '68%',
                        plugins: {
                              ...baseOptions.plugins,
                              legend: {
                                    display: true,
                                    position: 'right',
                                    labels: {
                                          color: '#71717a',
                                          font: { family: "'DM Sans', sans-serif", size: 9 },
                                          boxWidth: 8,
                                          boxHeight: 8,
                                          borderRadius: 2,
                                          padding: 6,
                                    },
                              },
                        },
                  },
            });
      }

      /* ── Line Chart — Monthly Spending Trend ─────────────── */
      function initLineChart() {
            const canvas = document.getElementById('lineChart');
            if (!canvas) return;

            new Chart(canvas, {
                  type: 'line',
                  data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                        datasets: [
                              {
                                    data: [4200, 3800, 5120, 4650],
                                    borderColor: '#3b82f6',
                                    borderWidth: 2,
                                    pointBackgroundColor: '#3b82f6',
                                    pointBorderColor: '#0f0f0f',
                                    pointBorderWidth: 2,
                                    pointRadius: 4,
                                    pointHoverRadius: 6,
                                    fill: true,
                                    /* Gradient fill built at render time */
                                    backgroundColor: (ctx) => {
                                          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 110);
                                          gradient.addColorStop(0, 'rgba(59,130,246,0.18)');
                                          gradient.addColorStop(1, 'rgba(59,130,246,0.00)');
                                          return gradient;
                                    },
                                    tension: 0.38,
                              },
                        ],
                  },
                  options: {
                        ...baseOptions,
                        scales: {
                              x: {
                                    grid: { color: '#1a1a1a', drawBorder: false },
                                    ticks: { color: '#52525b', font: { family: "'DM Sans'", size: 10 } },
                                    border: { display: false },
                              },
                              y: {
                                    grid: { color: '#1a1a1a', drawBorder: false },
                                    ticks: {
                                          color: '#52525b',
                                          font: { family: "'JetBrains Mono', monospace", size: 9 },
                                          callback: (v) => '₹' + (v / 1000).toFixed(1) + 'k',
                                          maxTicksLimit: 4,
                                    },
                                    border: { display: false },
                              },
                        },
                  },
            });
      }

      /* ── Initialise both charts on DOM ready ─────────────── */
      function init() {
            initDonutChart();
            initLineChart();
      }

      if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
      } else {
            init();
      }
})();
