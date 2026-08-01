// ===============================
// Add Expense Form Logic
// ===============================

document.addEventListener('DOMContentLoaded', () => {
      const role = getExpenseUserRole();
      const categoryProfile = getExpenseCategoryProfile(role);
      const availableCategories = categoryProfile.categories || ['Other'];
      const fallbackCategory = availableCategories.includes('Other') ? 'Other' : availableCategories[0];

      const form = document.getElementById('expenseForm');
      const descriptionInput = document.getElementById('description');
      const categorySelect = document.getElementById('category');

      function populateCategoryOptions() {
            if (!categorySelect) return;

            categorySelect.innerHTML = '';

            availableCategories.forEach((category) => {
                  const option = document.createElement('option');
                  option.value = category;
                  option.textContent = category;
                  categorySelect.appendChild(option);
            });

            categorySelect.value = fallbackCategory;
      }

      async function getAICategory(description) {
            try {
                  const res = await fetch('https://finance-intelligence-q3zx.onrender.com/api/ai/category', {
                        method: 'POST',
                        headers: {
                              'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                              description,
                              role,
                              categories: availableCategories,
                        }),
                  });

                  if (!res.ok) {
                        throw new Error('AI request failed');
                  }

                  const data = await res.json();
                  return findBestExpenseCategoryMatch(data.category || fallbackCategory, role, description);
            } catch (err) {
                  console.error('AI error:', err);
                  return findBestExpenseCategoryMatch(fallbackCategory, role, description);
            }
      }

      populateCategoryOptions();

      let timeout = null;
      let currentRequestId = 0;

      if (descriptionInput && categorySelect) {
            descriptionInput.addEventListener('input', () => {
                  clearTimeout(timeout);

                  const value = descriptionInput.value.trim();

                  if (value.length < 3) {
                        categorySelect.value = fallbackCategory;
                        return;
                  }

                  const requestId = ++currentRequestId;

                  timeout = setTimeout(async () => {
                        const category = await getAICategory(value);

                        if (requestId !== currentRequestId) return;

                        categorySelect.value = availableCategories.includes(category) ? category : fallbackCategory;
                  }, 700);
            });
      }

      if (!form) return;

      form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const description = document.getElementById('description').value;
            const amount = document.getElementById('amount').value;
            const category = document.getElementById('category').value;
            const mode = document.getElementById('mode').value;
            const date = document.getElementById('date').value;

            const token = localStorage.getItem('token');

            try {
                  const response = await fetch('https://finance-intelligence-q3zx.onrender.com/api/expenses', {
                        method: 'POST',
                        headers: {
                              'Content-Type': 'application/json',
                              Authorization: 'Bearer ' + token,
                        },
                        body: JSON.stringify({
                              description,
                              amount,
                              category,
                              mode,
                              date,
                        }),
                  });

                  if (!response.ok) {
                        throw new Error('Failed to save expense');
                  }

                  alert('Expense added successfully');
                  window.location.href = 'expenses.html';
            } catch (error) {
                  console.error(error);
                  alert('Failed to save expense');
            }
      });
});
