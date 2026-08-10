import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { IconSun, IconMoon, IconList, IconBrain } from '../components/icons';
import { PIE_COLORS } from '../utils/constants';

export default function DashboardView({
  theme,
  isDark,
  setIsDark,
  setActiveTab,
  income,
  setIncome,
  budgets,
  monthlyTransactions,
  totalExpenses,
  totalMonthlyIncome,
  unpaidBillsTotal,
  balance,
  formatCurrency,
}) {
  const handleIncomeChange = (event) => {
    const nextIncome = Number(event.target.value);
    if (Number.isNaN(nextIncome)) return;
    setIncome(Math.max(nextIncome, 0));
  };

  const expensesByCategory = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const budgetByCategory = budgets.reduce((acc, budget) => {
    acc[budget.category] = budget;
    return acc;
  }, {});

  const trackedBudgetCategories = Array.from(
    new Set([...budgets.map((budget) => budget.category), ...Object.keys(expensesByCategory)])
  );

  const pieData = Object.keys(expensesByCategory).map(key => ({ name: key, value: expensesByCategory[key] }));

  const savingsRate = totalMonthlyIncome > 0 ? ((totalMonthlyIncome - totalExpenses) / totalMonthlyIncome) * 100 : 0;
  let healthScore = 50;
  if (savingsRate > 20) healthScore += 25;
  else if (savingsRate > 0) healthScore += 10;
  else if (savingsRate < 0) healthScore -= 20;

  const unpaidRatio = totalMonthlyIncome > 0 ? unpaidBillsTotal / totalMonthlyIncome : 0;
  if (unpaidRatio < 0.1) healthScore += 15;
  else if (unpaidRatio > 0.4) healthScore -= 15;

  const budgetAdherence = budgets.reduce((acc, b) => {
    const spent = expensesByCategory[b.category] || 0;
    return acc + (spent <= b.limit ? 1 : -1);
  }, 0);
  healthScore += budgetAdherence * 5;
  healthScore = Math.min(Math.max(Math.round(healthScore), 0), 100);

  let healthStatus = { text: 'Good', color: 'text-emerald-500' };
  if (healthScore >= 80) healthStatus = { text: 'Excellent', color: 'text-indigo-500' };
  if (healthScore < 50) healthStatus = { text: 'Needs Work', color: 'text-amber-500' };
  if (healthScore < 30) healthStatus = { text: 'Critical', color: 'text-rose-500' };

  const cashFlowData = [
    { name: 'May', income: income * 0.9, expenses: totalExpenses * 0.8 },
    { name: 'Jun', income: income * 0.95, expenses: totalExpenses * 1.1 },
    { name: 'Jul', income: income * 1.0, expenses: totalExpenses * 0.9 },
    { name: 'Aug', income: income * 1.05, expenses: totalExpenses * 0.95 },
    { name: 'Sep', income: income * 1.1, expenses: totalExpenses * 0.85 },
    { name: 'Oct', income: totalMonthlyIncome, expenses: totalExpenses },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className={`text-2xl font-bold ${theme.text}`}>Financial Overview</h2>
          <p className={`${theme.textMuted} text-sm`}>Your money at a glance for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
        </div>
        <button onClick={() => setIsDark(!isDark)} className={`md:hidden p-2 rounded-full ${theme.card} border`}>
          {isDark ? <IconSun /> : <IconMoon />}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
          <p className="text-indigo-100 text-sm font-medium mb-1">Available Balance</p>
          <h3 className="text-4xl font-bold">{formatCurrency(balance)}</h3>
          <div className="mt-4 flex items-center text-sm">
            <span className="bg-white/20 px-2 py-1 rounded-md">
              {formatCurrency(unpaidBillsTotal)} needed for upcoming bills
            </span>
          </div>
        </div>
        <div className={`${theme.card} rounded-2xl p-6 border shadow-sm flex flex-col justify-center`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`${theme.textMuted} text-sm font-medium`}>Monthly Income</p>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full"><IconList /></div>
          </div>
          <h3 className={`text-2xl font-bold ${theme.text}`}>{formatCurrency(totalMonthlyIncome)}</h3>
          <label className={`mt-4 text-xs ${theme.textMuted}`} htmlFor="base-income-input">Base Salary</label>
          <input
            id="base-income-input"
            type="number"
            min="0"
            step="100"
            value={income}
            onChange={handleIncomeChange}
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${theme.card} ${theme.text} ${isDark ? 'border-slate-600' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
          />
        </div>
        <div className={`${theme.card} rounded-2xl p-6 border shadow-sm flex flex-col justify-center`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`${theme.textMuted} text-sm font-medium`}>Monthly Expenses</p>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-full"><IconList /></div>
          </div>
          <h3 className={`text-2xl font-bold ${theme.text}`}>{formatCurrency(totalExpenses)}</h3>
        </div>
      </div>

      <div className={`mt-6 ${theme.card} rounded-2xl p-6 border shadow-sm flex flex-col md:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r ${isDark ? 'from-slate-800 to-slate-800' : 'from-white to-gray-50'} overflow-hidden relative`}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 z-10">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-gray-200 dark:text-slate-700" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className={`${healthStatus.color} transition-all duration-1000 ease-out`} strokeDasharray={`${healthScore}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute text-xl font-bold">{healthScore}</div>
          </div>
          <div>
            <h3 className={`text-lg font-bold ${theme.text}`}>Financial Health: <span className={healthStatus.color}>{healthStatus.text}</span></h3>
            <p className={`${theme.textMuted} text-sm mt-1 max-w-md`}>Your score is based on your saving rate, budget adherence, and upcoming bills.</p>
          </div>
        </div>
        <button onClick={() => setActiveTab('advisor')} className="z-10 w-full sm:w-auto px-4 py-2 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl hover:bg-indigo-600/20 transition-colors flex items-center justify-center gap-2">
          <IconBrain /> Ask Advisor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${theme.card} rounded-2xl p-6 border shadow-sm`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>Spending by Category</h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No expenses this month.</div>
            )}
          </div>
        </div>
        <div className={`${theme.card} rounded-2xl p-6 border shadow-sm`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>Budget Tracker</h3>
          <div className="space-y-4">
            {trackedBudgetCategories.map((category) => {
              const budget = budgetByCategory[category];
              const spent = expensesByCategory[category] || 0;
              const hasBudget = Boolean(budget && Number(budget.limit) > 0);
              const limit = hasBudget ? Number(budget.limit) : Math.max(spent, 1);
              const percent = hasBudget ? Math.min((spent / limit) * 100, 100) : spent > 0 ? 100 : 0;
              const isWarning = hasBudget && percent > 85;
              const isDanger = hasBudget && percent >= 100;

              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`${theme.text} font-medium`}>{category}</span>
                    <span className={theme.textMuted}>
                      {hasBudget ? `${formatCurrency(spent)} / ${formatCurrency(limit)}` : `${formatCurrency(spent)} / No budget set`}
                    </span>
                  </div>
                  <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-2.5`}>
                    <div className={`${isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : hasBudget ? 'bg-indigo-500' : 'bg-slate-400'} h-2.5 rounded-full transition-all`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
            {trackedBudgetCategories.length === 0 && (
              <div className="text-sm text-slate-400">No spending categories yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className={`${theme.card} rounded-2xl p-6 border shadow-sm mt-6`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h3 className={`text-lg font-semibold ${theme.text}`}>6-Month Cash Flow Trend</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Income</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Expenses</span>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '0.5rem' }} formatter={(value) => formatCurrency(value)} />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
