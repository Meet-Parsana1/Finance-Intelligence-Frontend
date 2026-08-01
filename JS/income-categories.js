window.INCOME_CATEGORY_CONFIG = {
      student: {
            categories: [
                  'Scholarship / Stipend',
                  'Allowance / Pocket Money',
                  'Family Support',
                  'Part-Time Job',
                  'Internship Stipend',
                  'Freelance Income',
                  'Tutoring Income',
                  'Project / Assignment Work',
                  'Competition Prize',
                  'Cash Gift',
                  'Festival / Occasion Gift',
                  'Refund / Reimbursement',
                  'Cashback / Rewards',
                  'Resale Income',
                  'Rental / Sharing Income',
                  'Interest Income',
                  'Investment Return',
                  'Grant / Financial Aid',
                  'Side Hustle Income',
                  'Other Income',
            ],
            quickFilters: ['Scholarship / Stipend', 'Part-Time Job', 'Freelance Income'],
      },
      salaried: {
            categories: [
                  'Primary Salary',
                  'Bonus',
                  'Incentive / Performance Pay',
                  'Overtime Pay',
                  'Commission',
                  'Freelance / Contract Income',
                  'Consulting Income',
                  'Business Side Income',
                  'Rental Income',
                  'Interest Income',
                  'Dividend Income',
                  'Investment Return',
                  'Capital Gains',
                  'Cashback / Rewards',
                  'Refund / Reimbursement',
                  'Gift Received',
                  'Family Support Received',
                  'Pension',
                  'Passive Income',
                  'Other Income',
            ],
            quickFilters: ['Primary Salary', 'Bonus', 'Freelance / Contract Income'],
      },
      msme: {
            categories: [
                  'Product Sales',
                  'Service Revenue',
                  'Client Project Payment',
                  'Contract Revenue',
                  'Wholesale Revenue',
                  'Retail Revenue',
                  'Subscription Revenue',
                  'Commission Income',
                  'Consulting Revenue',
                  'Maintenance / AMC Income',
                  'Installation / Setup Charges',
                  'Delivery / Logistics Charges',
                  'Rental Income',
                  'Interest Income',
                  'Investment Return',
                  'Government Grant / Subsidy',
                  'Tax Refund',
                  'Reimbursement / Recovery',
                  'Asset Sale Income',
                  'Other Business Income',
            ],
            quickFilters: ['Product Sales', 'Service Revenue', 'Client Project Payment'],
      },
};

window.getIncomeUserRole = function getIncomeUserRole() {
      try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            return currentUser?.role || currentUser?.accountType || 'salaried';
      } catch (error) {
            return 'salaried';
      }
};

window.getIncomeCategoryProfile = function getIncomeCategoryProfile(role) {
      return window.INCOME_CATEGORY_CONFIG[role] || window.INCOME_CATEGORY_CONFIG.salaried;
};

window.normalizeIncomeCategory = function normalizeIncomeCategory(value) {
      return String(value || '')
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
};
