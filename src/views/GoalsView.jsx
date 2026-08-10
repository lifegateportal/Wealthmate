import React, { useState } from 'react';
import { IconPlus, IconTarget, IconTrash } from '../components/icons';

export default function GoalsView({
  theme,
  isDark,
  savingsGoals,
  setSavingsGoals,
  formatCurrency,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalDraft, setGoalDraft] = useState(null);
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '', deadline: new Date().toISOString().split('T')[0], color: '#6366f1' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target) return;
    setSavingsGoals([
      {
        ...newGoal,
        target: parseFloat(newGoal.target),
        current: parseFloat(newGoal.current || 0),
        id: Date.now(),
      },
      ...savingsGoals,
    ]);
    setIsAdding(false);
    setNewGoal({ name: '', target: '', current: '', deadline: new Date().toISOString().split('T')[0], color: '#6366f1' });
  };

  const addFunds = (id, amount) => {
    setSavingsGoals(savingsGoals.map(g => g.id === id ? { ...g, current: Math.min(g.current + amount, g.target) } : g));
  };

  const startEditing = (goal) => {
    setEditingGoalId(goal.id);
    setGoalDraft({
      name: goal.name,
      target: String(goal.target),
      current: String(goal.current),
      deadline: goal.deadline,
      color: goal.color || '#6366f1',
    });
  };

  const cancelEditing = () => {
    setEditingGoalId(null);
    setGoalDraft(null);
  };

  const saveGoal = (id) => {
    if (!goalDraft?.name || !goalDraft?.target) return;

    const parsedTarget = parseFloat(goalDraft.target);
    const parsedCurrent = parseFloat(goalDraft.current || 0);
    if (Number.isNaN(parsedTarget) || Number.isNaN(parsedCurrent)) return;

    setSavingsGoals((prev) => prev.map((goal) => (
      goal.id === id
        ? {
            ...goal,
            name: goalDraft.name.trim(),
            target: parsedTarget,
            current: Math.min(parsedCurrent, parsedTarget),
            deadline: goalDraft.deadline,
            color: goalDraft.color,
          }
        : goal
    )));

    cancelEditing();
  };

  const deleteGoal = (id) => {
    setSavingsGoals((prev) => prev.filter((goal) => goal.id !== id));
    if (editingGoalId === id) {
      cancelEditing();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${theme.text} flex items-center gap-2`}>Savings Goals <span className="text-[10px] bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">Premium</span></h2>
          <p className={`${theme.textMuted} text-sm`}>Set targets and track your progress towards financial freedom.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="w-full sm:w-auto justify-center flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
          <IconPlus /> <span className="hidden sm:inline">New Goal</span>
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className={`${theme.card} p-5 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-6`}>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Goal Name</label>
            <input type="text" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="e.g. New Car" className={`w-full p-2 border rounded-lg outline-none ${theme.input}`} required />
          </div>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Target Amount</label>
            <input type="number" step="0.01" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} placeholder="0.00" className={`w-full p-2 border rounded-lg outline-none ${theme.input}`} required />
          </div>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Current Saved</label>
            <input type="number" step="0.01" value={newGoal.current} onChange={e => setNewGoal({ ...newGoal, current: e.target.value })} placeholder="0.00" className={`w-full p-2 border rounded-lg outline-none ${theme.input}`} />
          </div>
          <div>
            <label className={`block text-xs ${theme.textMuted} mb-1`}>Target Date</label>
            <input type="date" value={newGoal.deadline} onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })} className={`w-full p-2 border rounded-lg outline-none ${theme.input}`} required />
          </div>
          <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 font-medium">Create</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {savingsGoals.map(goal => {
          const isEditing = editingGoalId === goal.id;
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

          return (
            <div key={goal.id} className={`${theme.card} rounded-2xl p-6 border shadow-sm relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-10 -mt-10 blur-2xl transition-all group-hover:scale-150 duration-700" style={{ backgroundColor: goal.color }}></div>
              {isEditing ? (
                <div className="relative z-10 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={goalDraft?.name || ''}
                      onChange={(e) => setGoalDraft((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Goal name"
                      className={`w-full p-2 border rounded-lg outline-none ${theme.input}`}
                    />
                    <input
                      type="date"
                      value={goalDraft?.deadline || ''}
                      onChange={(e) => setGoalDraft((prev) => ({ ...prev, deadline: e.target.value }))}
                      className={`w-full p-2 border rounded-lg outline-none ${theme.input}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="number"
                      step="0.01"
                      value={goalDraft?.target || ''}
                      onChange={(e) => setGoalDraft((prev) => ({ ...prev, target: e.target.value }))}
                      placeholder="Target"
                      className={`w-full p-2 border rounded-lg outline-none ${theme.input}`}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={goalDraft?.current || ''}
                      onChange={(e) => setGoalDraft((prev) => ({ ...prev, current: e.target.value }))}
                      placeholder="Current"
                      className={`w-full p-2 border rounded-lg outline-none ${theme.input}`}
                    />
                    <input
                      type="color"
                      value={goalDraft?.color || '#6366f1'}
                      onChange={(e) => setGoalDraft((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10 rounded-lg cursor-pointer"
                      title="Goal color"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => saveGoal(goal.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors text-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className={`px-3 py-1.5 rounded-lg border ${theme.textMuted} hover:opacity-80 font-medium transition-colors text-sm`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGoal(goal.id)}
                      className="ml-auto px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-medium transition-colors text-sm flex items-center gap-1"
                    >
                      <IconTrash className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4 relative z-10 gap-2">
                    <div>
                      <h3 className={`text-xl font-bold ${theme.text}`}>{goal.name}</h3>
                      <p className={`text-sm ${theme.textMuted}`}>{daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(goal)} className="px-3 py-1.5 rounded-lg border text-indigo-600 hover:bg-indigo-500/10 font-medium transition-colors text-sm">
                        Edit
                      </button>
                      <button onClick={() => addFunds(goal.id, 100)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-medium transition-colors text-sm" title="Quick Add $100">
                        + $100
                      </button>
                    </div>
                  </div>

                  <div className="mb-2 flex justify-between items-end relative z-10">
                    <span className={`text-3xl font-light ${theme.text}`}>{formatCurrency(goal.current)}</span>
                    <span className={theme.textMuted}>of {formatCurrency(goal.target)}</span>
                  </div>

                  <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-3 mb-2 relative z-10 overflow-hidden`}>
                    <div className="h-3 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${progress}%`, backgroundColor: goal.color }}>
                      <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right text-xs font-semibold" style={{ color: goal.color }}>{progress.toFixed(1)}% Completed</div>
                </>
              )}
            </div>
          );
        })}
        {savingsGoals.length === 0 && !isAdding && (
          <div className={`col-span-full text-center py-12 ${theme.textMuted} ${theme.card} border rounded-2xl border-dashed`}>
            <div className="mx-auto h-12 w-12 opacity-50 mb-4 flex items-center justify-center"><IconTarget /></div>
            <p>No savings goals yet. Start tracking your dreams today!</p>
          </div>
        )}
      </div>
    </div>
  );
}
