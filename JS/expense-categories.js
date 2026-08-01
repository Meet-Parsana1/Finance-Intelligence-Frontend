window.EXPENSE_CATEGORY_CONFIG = {
      student: {
            categories: [
                  'Food',
                  'Transport',
                  'Rent / Hostel',
                  'Utilities',
                  'Education',
                  'Books & Study Materials',
                  'Tuition / Coaching',
                  'Mobile & Internet',
                  'Health & Medicine',
                  'Personal Care',
                  'Clothing',
                  'Entertainment',
                  'Shopping',
                  'Subscriptions',
                  'Social / Friends',
                  'Family Support',
                  'Travel',
                  'Emergency',
                  'Savings / Investment',
                  'Other',
            ],
            quickFilters: ['Food', 'Transport', 'Education'],
      },
      salaried: {
            categories: [
                  'Rent / Home Loan',
                  'Groceries',
                  'Dining Out',
                  'Transport',
                  'Fuel',
                  'Utilities',
                  'Mobile & Internet',
                  'Insurance',
                  'EMI / Loan Repayment',
                  'Health & Medical',
                  'Family Expenses',
                  'Childcare / Education',
                  'Personal Care',
                  'Clothing',
                  'Entertainment',
                  'Travel',
                  'Gifts / Donations',
                  'Subscriptions',
                  'Savings / Investment',
                  'Other',
            ],
            quickFilters: ['Groceries', 'Transport', 'Utilities'],
      },
      msme: {
            categories: [
                  'Raw Materials',
                  'Inventory Purchase',
                  'Salaries & Wages',
                  'Rent / Lease',
                  'Utilities',
                  'Office Supplies',
                  'Equipment / Machinery',
                  'Maintenance & Repairs',
                  'Transport / Logistics',
                  'Fuel / Travel',
                  'Marketing / Advertising',
                  'Packaging',
                  'Software / SaaS',
                  'Professional Fees',
                  'Internet / Telecom',
                  'Loan / EMI / Interest',
                  'Taxes / Compliance',
                  'Client Hospitality',
                  'Miscellaneous Operations',
                  'Other',
            ],
            quickFilters: ['Raw Materials', 'Salaries & Wages', 'Marketing / Advertising'],
      },
};

window.getExpenseUserRole = function getExpenseUserRole() {
      try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            return currentUser?.role || currentUser?.accountType || 'salaried';
      } catch (error) {
            return 'salaried';
      }
};

window.getExpenseCategoryProfile = function getExpenseCategoryProfile(role) {
      return window.EXPENSE_CATEGORY_CONFIG[role] || window.EXPENSE_CATEGORY_CONFIG.salaried;
};

window.normalizeExpenseCategory = function normalizeExpenseCategory(value) {
      return String(value || '')
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
};

window.findBestExpenseCategoryMatch = function findBestExpenseCategoryMatch(value, role, description = '') {
      const profile = window.getExpenseCategoryProfile(role);
      const categories = profile.categories || [];
      const normalizedValue = window.normalizeExpenseCategory(value);
      const normalizedDescription = window.normalizeExpenseCategory(description);

      const exactMatch = categories.find((category) => window.normalizeExpenseCategory(category) === normalizedValue);
      if (exactMatch) return exactMatch;

      const containedMatch = categories.find((category) => {
            const normalizedCategory = window.normalizeExpenseCategory(category);
            return normalizedValue.includes(normalizedCategory) || normalizedCategory.includes(normalizedValue);
      });
      if (containedMatch) return containedMatch;

      const aliasMap = {
            student: {
                  food: 'Food',
                  transport: 'Transport',
                  travel: 'Travel',
                  hostel: 'Rent / Hostel',
                  rent: 'Rent / Hostel',
                  utility: 'Utilities',
                  utilities: 'Utilities',
                  education: 'Education',
                  books: 'Books & Study Materials',
                  book: 'Books & Study Materials',
                  stationery: 'Books & Study Materials',
                  coaching: 'Tuition / Coaching',
                  tuition: 'Tuition / Coaching',
                  internet: 'Mobile & Internet',
                  mobile: 'Mobile & Internet',
                  recharge: 'Mobile & Internet',
                  health: 'Health & Medicine',
                  medicine: 'Health & Medicine',
                  medical: 'Health & Medicine',
                  care: 'Personal Care',
                  grooming: 'Personal Care',
                  clothes: 'Clothing',
                  clothing: 'Clothing',
                  entertainment: 'Entertainment',
                  movies: 'Entertainment',
                  shopping: 'Shopping',
                  subscription: 'Subscriptions',
                  subscriptions: 'Subscriptions',
                  friends: 'Social / Friends',
                  social: 'Social / Friends',
                  family: 'Family Support',
                  emergency: 'Emergency',
                  investment: 'Savings / Investment',
                  savings: 'Savings / Investment',
                  other: 'Other',
            },
            salaried: {
                  rent: 'Rent / Home Loan',
                  home: 'Rent / Home Loan',
                  loan: 'EMI / Loan Repayment',
                  groceries: 'Groceries',
                  grocery: 'Groceries',
                  dining: 'Dining Out',
                  restaurant: 'Dining Out',
                  food: 'Dining Out',
                  transport: 'Transport',
                  travel: 'Travel',
                  fuel: 'Fuel',
                  petrol: 'Fuel',
                  diesel: 'Fuel',
                  utility: 'Utilities',
                  utilities: 'Utilities',
                  electricity: 'Utilities',
                  water: 'Utilities',
                  internet: 'Mobile & Internet',
                  mobile: 'Mobile & Internet',
                  recharge: 'Mobile & Internet',
                  insurance: 'Insurance',
                  emi: 'EMI / Loan Repayment',
                  medical: 'Health & Medical',
                  health: 'Health & Medical',
                  hospital: 'Health & Medical',
                  family: 'Family Expenses',
                  childcare: 'Childcare / Education',
                  school: 'Childcare / Education',
                  education: 'Childcare / Education',
                  personal: 'Personal Care',
                  care: 'Personal Care',
                  clothing: 'Clothing',
                  clothes: 'Clothing',
                  entertainment: 'Entertainment',
                  movie: 'Entertainment',
                  gift: 'Gifts / Donations',
                  donation: 'Gifts / Donations',
                  subscription: 'Subscriptions',
                  subscriptions: 'Subscriptions',
                  investment: 'Savings / Investment',
                  savings: 'Savings / Investment',
                  other: 'Other',
            },
            msme: {
                  raw: 'Raw Materials',
                  material: 'Raw Materials',
                  inventory: 'Inventory Purchase',
                  stock: 'Inventory Purchase',
                  salaries: 'Salaries & Wages',
                  salary: 'Salaries & Wages',
                  wages: 'Salaries & Wages',
                  rent: 'Rent / Lease',
                  lease: 'Rent / Lease',
                  utility: 'Utilities',
                  utilities: 'Utilities',
                  office: 'Office Supplies',
                  supplies: 'Office Supplies',
                  equipment: 'Equipment / Machinery',
                  machinery: 'Equipment / Machinery',
                  maintenance: 'Maintenance & Repairs',
                  repairs: 'Maintenance & Repairs',
                  logistics: 'Transport / Logistics',
                  transport: 'Transport / Logistics',
                  fuel: 'Fuel / Travel',
                  travel: 'Fuel / Travel',
                  marketing: 'Marketing / Advertising',
                  advertising: 'Marketing / Advertising',
                  ads: 'Marketing / Advertising',
                  packaging: 'Packaging',
                  software: 'Software / SaaS',
                  saas: 'Software / SaaS',
                  professional: 'Professional Fees',
                  consultant: 'Professional Fees',
                  legal: 'Professional Fees',
                  telecom: 'Internet / Telecom',
                  internet: 'Internet / Telecom',
                  phone: 'Internet / Telecom',
                  interest: 'Loan / EMI / Interest',
                  emi: 'Loan / EMI / Interest',
                  tax: 'Taxes / Compliance',
                  compliance: 'Taxes / Compliance',
                  hospitality: 'Client Hospitality',
                  client: 'Client Hospitality',
                  misc: 'Miscellaneous Operations',
                  operations: 'Miscellaneous Operations',
                  other: 'Other',
            },
      };

      const roleAliases = aliasMap[role] || {};
      const searchableText = `${normalizedValue} ${normalizedDescription}`;

      for (const [alias, category] of Object.entries(roleAliases)) {
            if (searchableText.includes(alias) && categories.includes(category)) {
                  return category;
            }
      }

      return categories.includes('Other') ? 'Other' : categories[categories.length - 1] || 'Other';
};
