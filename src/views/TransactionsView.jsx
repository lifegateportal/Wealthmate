import React, { useEffect, useState } from 'react';
import { IconDownload, IconPlus, IconTrash } from '../components/icons';

const ADD_NEW_CATEGORY = '__add_new_category__';

export default function TransactionsView({
  theme,
  isDark,
  transactions,
  categories,
  addCategory,
  addTransaction,
  deleteTransaction,
  formatCurrency,
}) {
  const defaultCategory = categories[0] || 'General';
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTx, setNewTx] = useState({ type: 'expense', amount: '', merchant: '', date: new Date().toISOString().split('T')[0], category: defaultCategory });

  useEffect(() => {
    if (newTx.category === ADD_NEW_CATEGORY) return;
    if (categories.includes(newTx.category)) return;
    setNewTx((prev) => ({ ...prev, category: defaultCategory }));
  }, [categories, defaultCategory, newTx.category]);

  const handleCreateCategory = () => {
    const created = addCategory(newCategoryName);
    if (!created) return;

    setNewTx((prev) => ({ ...prev, category: created }));
    setNewCategoryName('');
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTx.amount || !newTx.merchant || newTx.category === ADD_NEW_CATEGORY) return;
    addTransaction({
      ...newTx,
      amount: parseFloat(newTx.amount),
    });
    setIsAdding(false);
    setNewTx({ type: 'expense', amount: '', merchant: '', date: new Date().toISOString().split('T')[0], category: defaultCategory });
    setNewCategoryName('');
  };

  const exportCSV = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const fileDate = now.toISOString().split('T')[0];

    const totalInc = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = totalInc - totalExp;

    const categoryTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const formatForSheet = (num) => `"${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)}"`;

    const rows = [];
    const addRow = (c1 = '', c2 = '', c3 = '', c4 = '', c5 = '') => {
      rows.push(`${c1},${c2},${c3},${c4},${c5}`);
    };

    addRow('"WEALTHMATE FINANCIAL STATEMENT"');
    addRow(`"Generated On: ${dateStr}"`);
    addRow('"Statement Period: All Time"');
    addRow();

    addRow('"=== EXECUTIVE SUMMARY ==="');
    addRow('"Metric"', '"Amount"');
    addRow('"Total Income"', formatForSheet(totalInc));
    addRow('"Total Expenses"', formatForSheet(totalExp));
    addRow('"Net Cash Flow"', formatForSheet(net));
    addRow();

    if (Object.keys(categoryTotals).length > 0) {
      addRow('"=== EXPENSE BREAKDOWN ==="');
      addRow('"Category"', '"Total Spent"');
      Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount]) => {
          addRow(`"${cat}"`, formatForSheet(amount));
        });
      addRow();
    }

    addRow('"=== DETAILED LEDGER ==="');
    addRow('"Date"', '"Merchant / Source"', '"Category"', '"Type"', '"Amount"');

    transactions.forEach(t => {
      const date = `"${new Date(t.date).toLocaleDateString()}"`;
      const merchant = `"${t.merchant.replace(/"/g, '""')}"`;
      const category = `"${t.category.replace(/"/g, '""')}"`;
      const type = `"${t.type.toUpperCase()}"`;
      const amount = formatForSheet(t.type === 'expense' ? -t.amount : t.amount);
      addRow(date, merchant, category, type, amount);
    });

    addRow();
    addRow('"End of Report"');

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WealthMate_Statement_${fileDate}.csv`;
    a.click();
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${theme.text}`}>Ledger</h2>
          <p className={`${theme.textMuted} text-sm`}>Search, filter, and export your history.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className={`flex items-center gap-2 ${theme.card} ${theme.text} border px-4 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors`}>
            <IconDownload /> <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
            <IconPlus /> <span className="hidden sm:inline">Add Entry</span>
          </button>
        </div>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className={`${theme.card} p-5 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-end`}>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Type</label>
            <select value={newTx.type} onChange={e => setNewTx({ ...newTx, type: e.target.value })} className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${theme.input}`}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Date</label>
            <input type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${theme.input}`} required />
          </div>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Merchant / Source</label>
            <input type="text" value={newTx.merchant} onChange={e => setNewTx({ ...newTx, merchant: e.target.value })} placeholder="e.g. Walmart" className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${theme.input}`} required />
          </div>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Category</label>
            <select
              value={newTx.category}
              onChange={e => setNewTx({ ...newTx, category: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${theme.input}`}
              required
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
              <option value={ADD_NEW_CATEGORY}>+ Add new category...</option>
            </select>
          </div>
          {newTx.category === ADD_NEW_CATEGORY && (
            <div className="md:col-span-2">
              <label className={`block text-xs ${theme.textMuted} mb-1`}>New Category Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Pets"
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${theme.input}`}
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            </div>
          )}
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Amount</label>
            <input type="number" step="0.01" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} placeholder="0.00" className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${theme.input}`} required />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <button type="submit" disabled={newTx.category === ADD_NEW_CATEGORY} className="bg-indigo-600 disabled:opacity-60 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium">Save Transaction</button>
          </div>
        </form>
      )}

      <div className={`${theme.card} rounded-2xl border shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.border} flex flex-col sm:flex-row gap-4`}>
          <input type="text" placeholder="Search merchants or categories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${theme.input}`} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`p-2 border rounded-lg outline-none ${theme.input}`}>
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className={`${isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-gray-50 text-gray-700'} text-xs uppercase font-semibold`}>
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Merchant</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.id} className={`border-b ${theme.border} ${theme.hover} transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                  <td className={`px-6 py-4 font-medium ${theme.text}`}>{t.merchant}</td>
                  <td className="px-6 py-4"><span className={`${isDark ? 'bg-slate-700' : 'bg-gray-100'} px-2 py-1 rounded-md text-xs`}>{t.category}</span></td>
                  <td className={`px-6 py-4 text-right font-semibold ${t.type === 'income' ? 'text-emerald-500' : theme.text}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => deleteTransaction(t.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
