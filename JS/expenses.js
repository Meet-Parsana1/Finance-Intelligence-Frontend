document.addEventListener('DOMContentLoaded', async () => {
      const role = getExpenseUserRole();
      const categoryProfile = getExpenseCategoryProfile(role);
      const availableCategories = categoryProfile.categories || ['Other'];
      const quickFilters = categoryProfile.quickFilters || availableCategories.slice(0, 3);
      const fallbackCategory = availableCategories.includes('Other') ? 'Other' : availableCategories[0];

      function formatExpenseDate(dateValue) {
            const safeDate = new Date(dateValue);

            if (Number.isNaN(safeDate.getTime())) {
                  return '';
            }

            const day = String(safeDate.getDate()).padStart(2, '0');
            const month = String(safeDate.getMonth() + 1).padStart(2, '0');
            const year = safeDate.getFullYear();

            return `${day}/${month}/${year}`;
      }

      const token = localStorage.getItem('token');

      const res = await fetch('https://finance-intelligence-q3zx.onrender.com/api/expenses', {
            headers: {
                  Authorization: 'Bearer ' + token,
            },
      });

      let expenses = await res.json();
      expenses = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

      const list = document.getElementById('expenseList');
      const tableBody = document.getElementById('expenseTableBody');
      const expenseCount = document.getElementById('expenseCount');
      const searchInput = document.getElementById('expense-search');
      const paginationPrev = document.getElementById('paginationPrev');
      const paginationNext = document.getElementById('paginationNext');
      const paginationStatus = document.getElementById('paginationStatus');
      const filterPills = document.getElementById('expenseFilterPills');

      const editModal = document.getElementById('editModal');
      const editForm = document.getElementById('editExpenseForm');
      const cancelEdit = document.getElementById('cancelEdit');

      const editDescription = document.getElementById('editDescription');
      const editAmount = document.getElementById('editAmount');
      const editCategory = document.getElementById('editCategory');
      const editMode = document.getElementById('editMode');
      const editDate = document.getElementById('editDate');

      let editingIndex = null;
      let currentPage = 1;
      const pageSize = 10;
      let currentFilter = 'all';
      let currentSearchTerm = '';

      if (!list || !tableBody) return;

      function populateEditCategories() {
            if (!editCategory) return;

            editCategory.innerHTML = '';

            availableCategories.forEach((category) => {
                  const option = document.createElement('option');
                  option.value = category;
                  option.textContent = category;
                  editCategory.appendChild(option);
            });
      }

      function renderFilterPills() {
            if (!filterPills) return;

            const staticFilters = [
                  { value: 'all', label: 'All' },
                  ...quickFilters.map((category) => ({ value: category, label: category })),
                  { value: 'UPI', label: 'UPI' },
                  { value: 'Cash', label: 'Cash' },
                  { value: '1000+', label: '₹1000+' },
            ];

            filterPills.innerHTML = staticFilters
                  .map(
                        (filter, index) =>
                              `<button class="filter-pill${index === 0 ? ' active' : ''}" data-filter="${filter.value}">${filter.label}</button>`,
                  )
                  .join('');
      }

      function getFilteredExpenses() {
            let filteredExpenses = expenses;

            if (currentSearchTerm) {
                  filteredExpenses = filteredExpenses.filter(
                        (exp) =>
                              exp.description.toLowerCase().includes(currentSearchTerm) ||
                              exp.category.toLowerCase().includes(currentSearchTerm) ||
                              exp.mode.toLowerCase().includes(currentSearchTerm),
                  );
            }

            if (availableCategories.includes(currentFilter)) {
                  filteredExpenses = filteredExpenses.filter((exp) => exp.category === currentFilter);
            } else if (currentFilter === 'UPI' || currentFilter === 'Cash') {
                  filteredExpenses = filteredExpenses.filter((exp) => exp.mode === currentFilter);
            } else if (currentFilter === '1000+') {
                  filteredExpenses = filteredExpenses.filter((exp) => Number(exp.amount) >= 1000);
            }

            return filteredExpenses;
      }

      function updatePagination(totalItems) {
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            currentPage = Math.min(currentPage, totalPages);

            const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
            const endItem = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

            if (paginationStatus) {
                  paginationStatus.textContent = `Showing ${startItem}-${endItem} of ${totalItems}`;
            }

            if (paginationPrev) {
                  paginationPrev.disabled = currentPage === 1 || totalItems === 0;
            }

            if (paginationNext) {
                  paginationNext.disabled = currentPage >= totalPages || totalItems === 0;
            }
      }

      function renderExpenses(data, totalCount = data.length) {
            list.innerHTML = '';
            tableBody.innerHTML = '';

            if (expenseCount) {
                  if (totalCount === 0) {
                        expenseCount.textContent = 'No transactions';
                  } else if (totalCount === 1) {
                        expenseCount.textContent = '1 Transaction';
                  } else {
                        expenseCount.textContent = `${totalCount} Transactions`;
                  }
            }

            if (data.length === 0) {
                  const hasAnyExpenses = expenses.length > 0;
                  const isMsme = role === 'msme';
                  const isSalaried = role === 'salaried';
                  const isStudent = role === 'student';

                  if (!hasAnyExpenses && isMsme) {
                        list.innerHTML = `
                  <div class="empty-state empty-state--rich">
                        <div class="empty-state__badge">MSME Expenses</div>
                        <h3 class="empty-state__title">No business expenses recorded yet</h3>
                        <p class="empty-state__body">
                              Start logging operating costs like raw materials, salaries, logistics, or utilities so this ledger can surface category trends and spending signals.
                        </p>
                        <div class="empty-state__actions">
                              <a href="add-expense.html" class="empty-state__btn">Add First Expense</a>
                        </div>
                  </div>
                  `;
                  } else if (!hasAnyExpenses && isSalaried) {
                        list.innerHTML = `
                  <div class="empty-state empty-state--rich">
                        <div class="empty-state__badge">Salaried Expenses</div>
                        <h3 class="empty-state__title">No expenses recorded yet</h3>
                        <p class="empty-state__body">
                              Start logging groceries, transport, utilities, and other day-to-day costs so your month-to-date spending and savings rate stay accurate.
                        </p>
                        <div class="empty-state__actions">
                              <a href="add-expense.html" class="empty-state__btn">Add First Expense</a>
                              <a href="add-income.html" class="empty-state__btn empty-state__btn--ghost">Add Income Instead</a>
                        </div>
                  </div>
                  `;
                  } else if (!hasAnyExpenses && isStudent) {
                        list.innerHTML = `
                  <div class="empty-state empty-state--rich">
                        <div class="empty-state__badge">Student Expenses</div>
                        <h3 class="empty-state__title">No expenses recorded yet</h3>
                        <p class="empty-state__body">
                              Start logging food, transport, education, and daily campus spending so your budget tracking and monthly insight become useful.
                        </p>
                        <div class="empty-state__actions">
                              <a href="add-expense.html" class="empty-state__btn">Add First Expense</a>
                              <a href="dashboard.html" class="empty-state__btn empty-state__btn--ghost">Set Budget First</a>
                        </div>
                  </div>
                  `;
                  } else {
                        const emptyMessage = hasAnyExpenses
                              ? 'No expenses match your current search or filters.'
                              : 'No expenses recorded yet.';

                        list.innerHTML = `
                  <div class="empty-state">
                        <p>${emptyMessage}</p>
                  </div>
                  `;
                  }

                  tableBody.innerHTML = `
                  <tr>
                        <td colspan="6">${expenses.length > 0 ? 'No expenses match your current search or filters.' : 'No expenses recorded yet.'}</td>
                  </tr>
                  `;
                  return;
            }

            data.forEach((exp) => {
                  const formattedDate = formatExpenseDate(exp.date);
                  const categoryClass = normalizeExpenseCategory(exp.category).replace(/\s+/g, '-');

                  list.innerHTML += `
                  <div class="expense-card glass category-${categoryClass}" data-id="${exp._id}">
                        <div class="expense-icon">💳</div>

                        <div class="expense-details">
                              <h4 class="expense-title">${exp.description}</h4>
                              <p class="expense-meta">
                                    <span class="expense-category">${exp.category}</span> •
                                    <span class="expense-mode">${exp.mode}</span>
                              </p>
                        </div>

                        <div class="expense-amount">
                              <span class="expense-amount-value">₹${exp.amount}</span>
                              <span class="date">${formattedDate}</span>
                        </div>

                        <div class="expense-actions">
                              <button class="edit-btn">
                                    <i data-lucide="pencil"></i>
                              </button>

                              <button class="delete-btn">
                                    <i data-lucide="trash-2"></i>
                              </button>
                        </div>
                  </div>
                  `;

                  tableBody.innerHTML += `
                  <tr data-id="${exp._id}">
                        <td>${formattedDate}</td>
                        <td>${exp.description}</td>
                        <td>${exp.category}</td>
                        <td>₹${exp.amount}</td>
                        <td>${exp.mode}</td>
                        <td>
                              <button class="edit-btn">
                                    <i data-lucide="pencil"></i>
                              </button>

                              <button class="delete-btn">
                                    <i data-lucide="trash-2"></i>
                              </button>
                        </td>
                  </tr>
                  `;
            });

            lucide.createIcons();
      }

      function renderCurrentExpenses() {
            const filteredExpenses = getFilteredExpenses();
            const startIndex = (currentPage - 1) * pageSize;
            const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + pageSize);

            renderExpenses(paginatedExpenses, filteredExpenses.length);
            updatePagination(filteredExpenses.length);
      }

      populateEditCategories();
      renderFilterPills();
      renderCurrentExpenses();

      if (searchInput) {
            searchInput.addEventListener('input', () => {
                  currentSearchTerm = searchInput.value.toLowerCase().trim();
                  currentPage = 1;
                  renderCurrentExpenses();
            });
      }

      filterPills?.addEventListener('click', (event) => {
            const button = event.target.closest('.filter-pill');
            if (!button) return;

            filterPills.querySelectorAll('.filter-pill').forEach((pill) => pill.classList.remove('active'));
            button.classList.add('active');

            currentFilter = button.dataset.filter;
            currentPage = 1;
            renderCurrentExpenses();
      });

      if (paginationPrev) {
            paginationPrev.addEventListener('click', () => {
                  if (currentPage > 1) {
                        currentPage -= 1;
                        renderCurrentExpenses();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
            });
      }

      if (paginationNext) {
            paginationNext.addEventListener('click', () => {
                  const totalItems = getFilteredExpenses().length;
                  const totalPages = Math.ceil(totalItems / pageSize);

                  if (currentPage < totalPages) {
                        currentPage += 1;
                        renderCurrentExpenses();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
            });
      }

      document.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            if (!editBtn) return;

            const parent = editBtn.closest('[data-id]');
            const id = parent.dataset.id;

            editingIndex = id;

            const exp = expenses.find((entry) => entry._id === id);
            if (!exp) return;

            editDescription.value = exp.description;
            editAmount.value = exp.amount;
            editCategory.value = availableCategories.includes(exp.category) ? exp.category : fallbackCategory;
            editMode.value = exp.mode;
            editDate.value = exp.date ? String(exp.date).split('T')[0] : '';

            editModal.classList.remove('hidden');
      });

      cancelEdit?.addEventListener('click', () => {
            editModal.classList.add('hidden');
      });

      editForm?.addEventListener('submit', async (e) => {
            e.preventDefault();

            await fetch(`https://finance-intelligence-q3zx.onrender.com/api/expenses/${editingIndex}`, {
                  method: 'PUT',
                  headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token,
                  },
                  body: JSON.stringify({
                        description: editDescription.value,
                        amount: Number(editAmount.value),
                        category: editCategory.value,
                        mode: editMode.value,
                        date: editDate.value,
                  }),
            });

            location.reload();
      });

      document.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (!deleteBtn) return;

            const parent = deleteBtn.closest('[data-id]');
            const id = parent.dataset.id;

            if (!confirm('Delete this expense?')) return;

            await fetch(`https://finance-intelligence-q3zx.onrender.com/api/expenses/${id}`, {
                  method: 'DELETE',
                  headers: {
                        Authorization: 'Bearer ' + token,
                  },
            });

            location.reload();
      });
});

const cardBtn = document.getElementById('card-view');
const tableBtn = document.getElementById('table-view');

const cardContainer = document.getElementById('expenseList');
const tableContainer = document.getElementById('expenseTable');

if (cardBtn && tableBtn) {
      cardBtn.addEventListener('click', () => {
            cardBtn.classList.add('active');
            tableBtn.classList.remove('active');

            cardContainer.classList.remove('hidden');
            tableContainer.classList.add('hidden');
      });

      tableBtn.addEventListener('click', () => {
            tableBtn.classList.add('active');
            cardBtn.classList.remove('active');

            tableContainer.classList.remove('hidden');
            cardContainer.classList.add('hidden');
      });
}
