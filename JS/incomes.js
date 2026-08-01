document.addEventListener('DOMContentLoaded', async () => {
      const role = getIncomeUserRole();
      const categoryProfile = getIncomeCategoryProfile(role);
      const availableCategories = categoryProfile.categories || ['Other Income'];
      const quickFilters = categoryProfile.quickFilters || availableCategories.slice(0, 3);
      const fallbackCategory = availableCategories.includes('Other Income') ? 'Other Income' : availableCategories[0];

      function formatIncomeDate(dateValue) {
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

      const res = await fetch('https://finance-intelligence-q3zx.onrender.com/api/income', {
            headers: {
                  Authorization: 'Bearer ' + token,
            },
      });

      let incomes = await res.json();

      const list = document.getElementById('incomeList');
      const tableBody = document.getElementById('incomeTableBody');
      const incomeCount = document.getElementById('incomeCount');
      const searchInput = document.getElementById('income-search');
      const paginationPrev = document.getElementById('incomePaginationPrev');
      const paginationNext = document.getElementById('incomePaginationNext');
      const paginationStatus = document.getElementById('incomePaginationStatus');
      const filterPills = document.getElementById('incomeFilterPills');

      const editModal = document.getElementById('editIncomeModal');
      const editForm = document.getElementById('editIncomeForm');
      const cancelEdit = document.getElementById('cancelIncomeEdit');

      const editSource = document.getElementById('editIncomeSource');
      const editAmount = document.getElementById('editIncomeAmount');
      const editCategory = document.getElementById('editIncomeCategory');
      const editMode = document.getElementById('editIncomeMode');
      const editDate = document.getElementById('editIncomeDate');

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
                  { value: 'Bank', label: 'Bank' },
                  { value: 'Cash', label: 'Cash' },
                  { value: '10000+', label: '₹10000+' },
            ];

            filterPills.innerHTML = staticFilters
                  .map(
                        (filter, index) =>
                              `<button class="filter-pill${index === 0 ? ' active' : ''}" data-filter="${filter.value}">${filter.label}</button>`,
                  )
                  .join('');
      }

      function getFilteredIncomes() {
            let filtered = incomes;

            if (currentSearchTerm) {
                  filtered = filtered.filter(
                        (inc) =>
                              inc.source.toLowerCase().includes(currentSearchTerm) ||
                              inc.category.toLowerCase().includes(currentSearchTerm) ||
                              inc.mode.toLowerCase().includes(currentSearchTerm),
                  );
            }

            if (availableCategories.includes(currentFilter)) {
                  filtered = filtered.filter((inc) => inc.category === currentFilter);
            } else if (currentFilter === 'Bank' || currentFilter === 'Cash') {
                  filtered = filtered.filter((inc) => inc.mode === currentFilter);
            } else if (currentFilter === '10000+') {
                  filtered = filtered.filter((inc) => Number(inc.amount) >= 10000);
            }

            return filtered;
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

      function renderIncomes(data, totalCount = data.length) {
            list.innerHTML = '';
            tableBody.innerHTML = '';

            if (incomeCount) {
                  if (totalCount === 0) {
                        incomeCount.textContent = 'No transactions';
                  } else if (totalCount === 1) {
                        incomeCount.textContent = '1 Transaction';
                  } else {
                        incomeCount.textContent = `${totalCount} Transactions`;
                  }
            }

            if (data.length === 0) {
                  const hasAnyIncomes = incomes.length > 0;
                  const isMsme = role === 'msme';
                  const isSalaried = role === 'salaried';
                  const isStudent = role === 'student';

                  if (!hasAnyIncomes && isMsme) {
                        list.innerHTML = `
                  <div class="empty-state empty-state--rich">
                        <div class="empty-state__badge">MSME Income</div>
                        <h3 class="empty-state__title">No business income recorded yet</h3>
                        <p class="empty-state__body">
                              Record your first product sale, service revenue, or client payment so this ledger can begin tracking revenue streams and business momentum.
                        </p>
                        <div class="empty-state__actions">
                              <a href="add-income.html" class="empty-state__btn">Add First Income</a>
                        </div>
                  </div>
                  `;
                  } else if (!hasAnyIncomes && isSalaried) {
                        list.innerHTML = `
                  <div class="empty-state empty-state--rich">
                        <div class="empty-state__badge">Salaried Income</div>
                        <h3 class="empty-state__title">No income recorded yet</h3>
                        <p class="empty-state__body">
                              Add your salary, bonus, or other earnings so the dashboard can begin measuring this month’s income, savings rate, and net monthly position.
                        </p>
                        <div class="empty-state__actions">
                              <a href="add-income.html" class="empty-state__btn">Add First Income</a>
                              <a href="add-expense.html" class="empty-state__btn empty-state__btn--ghost">Add Expense Instead</a>
                        </div>
                  </div>
                  `;
                  } else if (!hasAnyIncomes && isStudent) {
                        list.innerHTML = `
                  <div class="empty-state empty-state--rich">
                        <div class="empty-state__badge">Student Income</div>
                        <h3 class="empty-state__title">No income recorded yet</h3>
                        <p class="empty-state__body">
                              Add scholarship, stipend, allowance, or side-income entries so your student dashboard reflects the full money picture, not just expenses.
                        </p>
                        <div class="empty-state__actions">
                              <a href="add-income.html" class="empty-state__btn">Add First Income</a>
                              <a href="add-expense.html" class="empty-state__btn empty-state__btn--ghost">Add Expense Instead</a>
                        </div>
                  </div>
                  `;
                  } else {
                        const emptyMessage = hasAnyIncomes
                              ? 'No income entries match your current search or filters.'
                              : 'No income recorded yet.';

                        list.innerHTML = `
                  <div class="empty-state">
                        <p>${emptyMessage}</p>
                  </div>
                  `;
                  }

                  tableBody.innerHTML = `
                  <tr>
                        <td colspan="6">${incomes.length > 0 ? 'No income entries match your current search or filters.' : 'No income recorded yet.'}</td>
                  </tr>
                  `;
                  return;
            }

            data.forEach((inc) => {
                  const formattedDate = formatIncomeDate(inc.date);
                  const categoryClass = normalizeIncomeCategory(inc.category || fallbackCategory).replace(/\s+/g, '-');

                  list.innerHTML += `
                  <div class="expense-card glass category-${categoryClass}" data-id="${inc._id}">
                        <div class="expense-icon">💰</div>

                        <div class="expense-details">
                              <h4 class="expense-title">${inc.source}</h4>
                              <p class="expense-meta">
                                    <span class="expense-category">${inc.category}</span> •
                                    <span class="expense-mode">${inc.mode}</span>
                              </p>
                        </div>

                        <div class="expense-amount">
                              <span class="income-value">₹${inc.amount}</span>
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
                  <tr data-id="${inc._id}">
                        <td>${formattedDate}</td>
                        <td>${inc.source}</td>
                        <td>${inc.category}</td>
                        <td>₹${inc.amount}</td>
                        <td>${inc.mode}</td>
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

      function renderCurrentIncomes() {
            const filtered = getFilteredIncomes();
            const startIndex = (currentPage - 1) * pageSize;
            const paginated = filtered.slice(startIndex, startIndex + pageSize);

            renderIncomes(paginated, filtered.length);
            updatePagination(filtered.length);
      }

      populateEditCategories();
      renderFilterPills();
      renderCurrentIncomes();

      if (searchInput) {
            searchInput.addEventListener('input', () => {
                  currentSearchTerm = searchInput.value.toLowerCase().trim();
                  currentPage = 1;
                  renderCurrentIncomes();
            });
      }

      filterPills?.addEventListener('click', (event) => {
            const button = event.target.closest('.filter-pill');
            if (!button) return;

            filterPills.querySelectorAll('.filter-pill').forEach((pill) => pill.classList.remove('active'));
            button.classList.add('active');

            currentFilter = button.dataset.filter;
            currentPage = 1;
            renderCurrentIncomes();
      });

      if (paginationPrev) {
            paginationPrev.addEventListener('click', () => {
                  if (currentPage > 1) {
                        currentPage -= 1;
                        renderCurrentIncomes();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
            });
      }

      if (paginationNext) {
            paginationNext.addEventListener('click', () => {
                  const totalItems = getFilteredIncomes().length;
                  const totalPages = Math.ceil(totalItems / pageSize);

                  if (currentPage < totalPages) {
                        currentPage += 1;
                        renderCurrentIncomes();
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

            const inc = incomes.find((item) => item._id === id);
            if (!inc) return;

            editSource.value = inc.source;
            editAmount.value = inc.amount;
            editCategory.value = availableCategories.includes(inc.category) ? inc.category : fallbackCategory;
            editMode.value = inc.mode;
            editDate.value = inc.date ? String(inc.date).split('T')[0] : '';

            editModal.classList.remove('hidden');
      });

      cancelEdit?.addEventListener('click', () => {
            editModal.classList.add('hidden');
      });

      editModal?.addEventListener('click', (e) => {
            if (e.target === editModal) {
                  editModal.classList.add('hidden');
            }
      });

      editForm?.addEventListener('submit', async (e) => {
            e.preventDefault();

            await fetch(`https://finance-intelligence-q3zx.onrender.com/api/income/${editingIndex}`, {
                  method: 'PUT',
                  headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token,
                  },
                  body: JSON.stringify({
                        source: editSource.value,
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

            if (!confirm('Are you sure you want to delete this income?')) return;

            await fetch(`https://finance-intelligence-q3zx.onrender.com/api/income/${id}`, {
                  method: 'DELETE',
                  headers: {
                        Authorization: 'Bearer ' + token,
                  },
            });

            location.reload();
      });
});

const cardBtn = document.getElementById('income-card-view');
const tableBtn = document.getElementById('income-table-view');

const cardContainer = document.getElementById('incomeList');
const tableContainer = document.getElementById('incomeTable');

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
