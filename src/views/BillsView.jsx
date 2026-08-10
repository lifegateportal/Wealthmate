import React, { useState } from 'react';
import { IconPlus, IconCheck, IconCalendar, IconTrash } from '../components/icons';

export default function BillsView({
  theme,
  bills,
  setBills,
  addTransaction,
  formatCurrency,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newBill, setNewBill] = useState({ name: '', amount: '', dueDate: new Date().toISOString().split('T')[0], category: 'Bills' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newBill.name || !newBill.amount) return;
    setBills((prev) => [{ ...newBill, amount: parseFloat(newBill.amount), id: Date.now(), isPaid: false }, ...prev]);
    setIsAdding(false);
    setNewBill({ name: '', amount: '', dueDate: new Date().toISOString().split('T')[0], category: 'Bills' });
  };

  const handleTogglePaid = (bill) => {
    const isNowPaid = !bill.isPaid;
    setBills((prev) => prev.map((b) => (b.id === bill.id ? { ...b, isPaid: isNowPaid } : b)));

    if (isNowPaid) {
      if (window.confirm(`Do you want to automatically add "${bill.name}" (${formatCurrency(bill.amount)}) to your ledger as an expense?`)) {
        addTransaction({
          type: 'expense',
          amount: bill.amount,
          merchant: bill.name,
          category: bill.category || 'Bills',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  };

  const handleDeleteBill = (bill) => {
    if (!window.confirm(`Remove \"${bill.name}\" from monthly bills?`)) return;
    setBills((prev) => prev.filter((b) => b.id !== bill.id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
      <header className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${theme.text}`}>Monthly Bills</h2>
          <p className={`${theme.textMuted} text-sm`}>Track recurring payments and auto-log them.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
          <IconPlus /> <span className="hidden sm:inline">Add Bill</span>
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className={`${theme.card} p-5 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end`}>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Bill Name</label>
            <input type="text" value={newBill.name} onChange={e => setNewBill({ ...newBill, name: e.target.value })} placeholder="e.g. Rent" className={`w-full p-2 border rounded-lg outline-none ${theme.input}`} required />
          </div>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Amount</label>
            <input type="number" step="0.01" value={newBill.amount} onChange={e => setNewBill({ ...newBill, amount: e.target.value })} placeholder="0.00" className={`w-full p-2 border rounded-lg outline-none ${theme.input}`} required />
          </div>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Due Date</label>
            <input type="date" value={newBill.dueDate} onChange={e => setNewBill({ ...newBill, dueDate: e.target.value })} className={`w-full p-2 border rounded-lg outline-none ${theme.input}`} required />
          </div>
          <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 font-medium">Save Bill</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bills.map(bill => (
          <div key={bill.id} className={`${theme.card} rounded-2xl p-5 border shadow-sm transition-all ${bill.isPaid ? 'opacity-50 border-emerald-500/50' : ''}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${bill.isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {bill.isPaid ? <IconCheck /> : <IconCalendar />}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleTogglePaid(bill)} className={`text-sm font-medium px-3 py-1 rounded-full border transition-colors ${bill.isPaid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800' : 'bg-transparent text-slate-500 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  {bill.isPaid ? 'Paid' : 'Mark as Paid'}
                </button>
                <button
                  onClick={() => handleDeleteBill(bill)}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                  aria-label={`Delete ${bill.name}`}
                  title="Delete bill"
                >
                  <IconTrash width="16" height="16" />
                </button>
              </div>
            </div>
            <h3 className={`text-xl font-bold ${theme.text}`}>{bill.name}</h3>
            <p className={`text-2xl font-light ${theme.textMuted} my-2`}>{formatCurrency(bill.amount)}</p>
            <p className="text-sm text-slate-500">Due on {new Date(bill.dueDate).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
