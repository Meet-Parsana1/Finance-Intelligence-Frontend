document.addEventListener('DOMContentLoaded', () => {
      const role = getIncomeUserRole();
      const categoryProfile = getIncomeCategoryProfile(role);
      const availableCategories = categoryProfile.categories || ['Other Income'];

      const form = document.getElementById('addIncomeForm');
      const categorySelect = document.getElementById('incomeCategory');
      const dateInput = document.getElementById('incomeDate');

      if (categorySelect) {
            categorySelect.innerHTML = '';

            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Select income category';
            placeholder.disabled = true;
            placeholder.selected = true;
            categorySelect.appendChild(placeholder);

            availableCategories.forEach((category) => {
                  const option = document.createElement('option');
                  option.value = category;
                  option.textContent = category;
                  categorySelect.appendChild(option);
            });
      }

      if (dateInput) {
            dateInput.valueAsDate = new Date();
      }

      if (!form) return;

      form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const source = document.getElementById('incomeSource').value.trim();
            const amount = document.getElementById('incomeAmount').value;
            const category = document.getElementById('incomeCategory').value;
            const mode = document.getElementById('incomeMode').value;
            const date = document.getElementById('incomeDate').value;

            const newIncome = {
                  source,
                  amount: Number(amount),
                  category,
                  mode,
                  date,
            };

            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/income', {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token,
                  },
                  body: JSON.stringify(newIncome),
            });

            if (!response.ok) {
                  throw new Error('Failed to save income');
            }

            alert('Income added successfully!');
            window.location.href = 'incomes.html';
      });
});
