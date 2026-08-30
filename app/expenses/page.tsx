'use client';

import { useMemo, useState } from 'react';
import { endOfWeek, startOfWeek } from 'date-fns';
import { Pencil, Save } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { localDateKey } from '@/utils/date';

const defaultCategories = ['Food', 'Gas', 'Shopping', 'Rent', 'Bills', 'Subscriptions', 'Gym', 'Travel', 'Other'];

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense } = useAppStore();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(localDateKey());
  const [editingId, setEditingId] = useState<string | null>(null);
  const today = localDateKey();
  const month = today.slice(0, 7);
  const weekStart = localDateKey(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = localDateKey(endOfWeek(new Date(), { weekStartsOn: 1 }));

  const todayTotal = expenses.filter((expense) => expense.date === today).reduce((sum, expense) => sum + expense.amount, 0);
  const weekTotal = expenses.filter((expense) => expense.date >= weekStart && expense.date <= weekEnd).reduce((sum, expense) => sum + expense.amount, 0);
  const monthTotal = expenses.filter((expense) => expense.date.startsWith(month)).reduce((sum, expense) => sum + expense.amount, 0);

  const knownCategories = useMemo(() => Array.from(new Set([...defaultCategories, ...expenses.map((expense) => expense.category)])), [expenses]);

  function submit() {
    const numericAmount = Number(amount);
    const finalCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !date || !finalCategory) return;
    addExpense({ id: crypto.randomUUID(), date, amount: numericAmount, category: finalCategory, description: description.trim(), notes: notes.trim() || undefined });
    setAmount('');
    setDescription('');
    setNotes('');
    setCustomCategory('');
  }

  return (
    <div>
      <p className="text-sm text-slate-500">Money</p>
      <h1 className="mb-6 text-3xl font-black">Expenses</h1>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="card p-4"><div className="text-xs text-slate-500">Today</div><div className="text-xl font-black sm:text-2xl">${todayTotal.toFixed(2)}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">This week</div><div className="text-xl font-black sm:text-2xl">${weekTotal.toFixed(2)}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">This month</div><div className="text-xl font-black sm:text-2xl">${monthTotal.toFixed(2)}</div></div>
      </div>

      <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <label className="text-sm font-medium">Amount<input className="input mt-1" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
        <label className="text-sm font-medium">Date<input className="input mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
        <label className="text-sm font-medium">Category<select className="input mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>{knownCategories.map((value) => <option key={value}>{value}</option>)}</select></label>
        {category === 'Other' && <label className="text-sm font-medium">Custom category<input className="input mt-1" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="e.g. Parking" /></label>}
        <label className="text-sm font-medium">Description<input className="input mt-1" placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <label className="text-sm font-medium">Note<input className="input mt-1" placeholder="Optional note" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <button className="btn-primary sm:col-span-2 lg:col-span-3">Add expense</button>
      </form>

      <div className="space-y-2">
        {[...expenses].sort((a, b) => b.date.localeCompare(a.date)).map((expense) => {
          const editing = editingId === expense.id;
          return (
            <div className="card p-4" key={expense.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className="input" value={expense.description} onChange={(e) => updateExpense(expense.id, { description: e.target.value })} />
                      <input className="input" type="number" min="0" step="0.01" value={expense.amount} onChange={(e) => updateExpense(expense.id, { amount: Number(e.target.value) })} />
                      <input className="input" type="date" value={expense.date} onChange={(e) => updateExpense(expense.id, { date: e.target.value })} />
                      <input className="input" value={expense.category} onChange={(e) => updateExpense(expense.id, { category: e.target.value })} />
                    </div>
                  ) : (
                    <>
                      <b className="block truncate">{expense.description || expense.category}</b>
                      <div className="text-xs text-slate-500">{expense.date} · {expense.category}</div>
                      {expense.notes && <div className="mt-1 text-xs text-slate-500">{expense.notes}</div>}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!editing && <b>${expense.amount.toFixed(2)}</b>}
                  <button aria-label={editing ? 'Finish editing expense' : 'Edit expense'} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setEditingId(editing ? null : expense.id)}>{editing ? <Save size={17} /> : <Pencil size={17} />}</button>
                </div>
              </div>
            </div>
          );
        })}
        {!expenses.length && <div className="card p-8 text-center text-slate-500">No expenses yet.</div>}
      </div>
    </div>
  );
}
