import React, { useEffect, useState } from 'react';
import Navigation from './components/Navigation';
import DashboardView from './views/DashboardView';
import TransactionsView from './views/TransactionsView';
import BillsView from './views/BillsView';
import GoalsView from './views/GoalsView';
import ScannerView from './views/ScannerView';
import AdvisorView from './views/AdvisorView';
import { TRANSACTION_CATEGORIES } from './utils/constants';
import { createTheme } from './utils/theme';
import { formatCurrency } from './utils/format';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(() => JSON.parse(localStorage.getItem('wm_dark')) || false);

  const [income, setIncome] = useState(() => JSON.parse(localStorage.getItem('wm_income')) || 5000);
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('wm_transactions');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, type: 'expense', amount: 150.5, date: '2023-10-25', merchant: 'Whole Foods', category: 'Groceries' },
          { id: 2, type: 'expense', amount: 45.0, date: '2023-10-24', merchant: 'Shell Station', category: 'Transport' },
          { id: 3, type: 'income', amount: 200.0, date: '2023-10-20', merchant: 'Side Hustle', category: 'Income' },
        ];
  });

  const [bills, setBills] = useState(() => {
    const saved = localStorage.getItem('wm_bills');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, name: 'Rent', amount: 1500, dueDate: '2023-11-01', isPaid: false, category: 'Housing' },
          { id: 2, name: 'Electricity', amount: 120, dueDate: '2023-10-28', isPaid: true, category: 'Utilities' },
        ];
  });

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('wm_budgets');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, category: 'Groceries', limit: 600 },
          { id: 2, category: 'Transport', limit: 200 },
          { id: 3, category: 'Dining', limit: 300 },
        ];
  });

  const [savingsGoals, setSavingsGoals] = useState(() => {
    const saved = localStorage.getItem('wm_goals');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, name: 'Emergency Fund', target: 10000, current: 4500, deadline: '2024-12-31', color: '#10b981' },
          { id: 2, name: 'Vacation', target: 3000, current: 850, deadline: '2024-06-15', color: '#6366f1' },
        ];
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('wm_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return TRANSACTION_CATEGORIES;
  });

  useEffect(() => localStorage.setItem('wm_dark', JSON.stringify(isDark)), [isDark]);
  useEffect(() => localStorage.setItem('wm_income', JSON.stringify(income)), [income]);
  useEffect(() => localStorage.setItem('wm_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('wm_bills', JSON.stringify(bills)), [bills]);
  useEffect(() => localStorage.setItem('wm_budgets', JSON.stringify(budgets)), [budgets]);
  useEffect(() => localStorage.setItem('wm_goals', JSON.stringify(savingsGoals)), [savingsGoals]);
  useEffect(() => localStorage.setItem('wm_categories', JSON.stringify(categories)), [categories]);

  useEffect(() => {
    const categoriesFromTransactions = transactions
      .map((t) => (t.category || '').trim())
      .filter(Boolean);

    if (categoriesFromTransactions.length === 0) return;

    setCategories((prev) => {
      const lowerSet = new Set(prev.map((category) => category.toLowerCase()));
      const toAdd = categoriesFromTransactions.filter((category) => !lowerSet.has(category.toLowerCase()));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
  }, [transactions]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const parseTransactionDate = (value) => {
    if (!value) return null;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const direct = new Date(`${raw}T00:00:00`);
      return Number.isNaN(direct.getTime()) ? null : direct;
    }

    const direct = new Date(raw);
    if (!Number.isNaN(direct.getTime())) return direct;

    const slash = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (slash) {
      let [, mm, dd, yy] = slash;
      if (yy.length === 2) yy = `20${yy}`;
      const normalized = `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00`;
      const parsed = new Date(normalized);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  };

  const toIsoDate = (value) => {
    const parsed = parseTransactionDate(value);
    return parsed ? parsed.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  };

  const now = new Date();
  const monthlyTransactions = transactions.filter((t) => {
    const parsedDate = parseTransactionDate(t.date);
    return (
      parsedDate &&
      parsedDate.getFullYear() === now.getFullYear() &&
      parsedDate.getMonth() === now.getMonth()
    );
  });

  const totalExpenses = monthlyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const additionalIncome = monthlyTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalMonthlyIncome = income + additionalIncome;
  const balance = totalMonthlyIncome - totalExpenses;
  const unpaidBillsTotal = bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);

  const apiKey = (import.meta.env.VITE_DEEPSEEK_API_KEY || '').trim();
  const aiConfig = {
    apiKey,
    apiUrl: 'https://api.deepseek.com/chat/completions',
    chatModel: import.meta.env.VITE_DEEPSEEK_CHAT_MODEL || 'deepseek-chat',
    visionModel: import.meta.env.VITE_DEEPSEEK_VISION_MODEL || 'deepseek-vl2',
    visionFallbackModel: import.meta.env.VITE_DEEPSEEK_VISION_FALLBACK_MODEL || '',
  };

  const addTransaction = (transaction) => {
    const normalizedTransaction = {
      ...transaction,
      amount: Number(transaction.amount) || 0,
      date: toIsoDate(transaction.date),
      merchant: transaction.merchant || 'Unknown',
      category: transaction.category || 'Uncategorized',
    };

    setTransactions((prev) => [{ ...normalizedTransaction, id: Date.now() }, ...prev]);
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addCategory = (name) => {
    const normalized = (name || '').trim();
    if (!normalized) return null;

    setCategories((prev) => {
      const exists = prev.some((category) => category.toLowerCase() === normalized.toLowerCase());
      return exists ? prev : [...prev, normalized];
    });

    setBudgets((prev) => {
      const exists = prev.some((budget) => budget.category.toLowerCase() === normalized.toLowerCase());
      return exists ? prev : [...prev, { id: Date.now(), category: normalized, limit: 500 }];
    });

    return normalized;
  };

  const theme = createTheme(isDark);

  return (
    <div className={`min-h-screen ${theme.bg} font-sans transition-colors duration-300`}>
      <div className="flex min-h-dvh md:h-screen flex-col md:flex-row">
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDark={isDark}
          setIsDark={setIsDark}
          theme={theme}
        />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                theme={theme}
                isDark={isDark}
                setIsDark={setIsDark}
                setActiveTab={setActiveTab}
                income={income}
                setIncome={setIncome}
                budgets={budgets}
                monthlyTransactions={monthlyTransactions}
                totalExpenses={totalExpenses}
                totalMonthlyIncome={totalMonthlyIncome}
                unpaidBillsTotal={unpaidBillsTotal}
                balance={balance}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                theme={theme}
                isDark={isDark}
                transactions={transactions}
                categories={categories}
                addCategory={addCategory}
                addTransaction={addTransaction}
                deleteTransaction={deleteTransaction}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'bills' && (
              <BillsView
                theme={theme}
                bills={bills}
                setBills={setBills}
                addTransaction={addTransaction}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'goals' && (
              <GoalsView
                theme={theme}
                isDark={isDark}
                savingsGoals={savingsGoals}
                setSavingsGoals={setSavingsGoals}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'scanner' && (
              <ScannerView
                theme={theme}
                aiConfig={aiConfig}
                addTransaction={addTransaction}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'advisor' && (
              <AdvisorView
                theme={theme}
                isDark={isDark}
                aiConfig={aiConfig}
                balance={balance}
                income={income}
                totalExpenses={totalExpenses}
                bills={bills}
                budgets={budgets}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
