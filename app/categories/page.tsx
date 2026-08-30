'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function CategoriesPage() {
  const categories = useAppStore((state) => state.categories);
  const tasks = useAppStore((state) => state.tasks);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Folder');
  const visible = categories.filter((category) => !category.deleted).sort((a, b) => a.sortOrder - b.sortOrder);

  function addCategory() {
    if (!name.trim()) return;
    useAppStore.setState((state) => ({
      categories: [...state.categories, { id: crypto.randomUUID(), name: name.trim(), icon: icon.trim() || 'Folder', sortOrder: visible.length + 1, deleted: false }],
    }));
    setName('');
    setIcon('Folder');
  }

  function updateCategory(id: string, patch: { name?: string; icon?: string }) {
    useAppStore.setState((state) => ({ categories: state.categories.map((category) => category.id === id ? { ...category, ...patch } : category) }));
  }

  function removeCategory(id: string) {
    const category = categories.find((item) => item.id === id);
    if (!category || id === 'personal') return;
    const affected = tasks.filter((task) => !task.deleted && task.categoryId === id).length;
    if (!confirm(`Remove “${category.name}”? ${affected ? `${affected} task(s) will be moved to Personal.` : 'No tasks will be lost.'}`)) return;
    useAppStore.setState((state) => ({
      categories: state.categories.map((item) => item.id === id ? { ...item, deleted: true } : item),
      tasks: state.tasks.map((task) => task.categoryId === id ? { ...task, categoryId: 'personal' } : task),
    }));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-slate-500">Organization</p>
      <h1 className="mb-6 text-3xl font-black">Categories</h1>

      <div className="space-y-2">
        {visible.map((category) => (
          <div key={category.id} className="card grid gap-2 p-4 sm:grid-cols-[1fr_180px_auto]">
            <input className="input" aria-label="Category name" value={category.name} onChange={(e) => updateCategory(category.id, { name: e.target.value })} />
            <input className="input" aria-label={`${category.name} icon`} value={category.icon} onChange={(e) => updateCategory(category.id, { icon: e.target.value })} />
            <button disabled={category.id === 'personal'} aria-label={`Delete ${category.name}`} onClick={() => removeCategory(category.id)} className="rounded-xl p-3 text-red-600 disabled:cursor-not-allowed disabled:opacity-25 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>

      <form className="card mt-5 grid gap-3 p-4 sm:grid-cols-[1fr_180px_auto]" onSubmit={(event) => { event.preventDefault(); addCategory(); }}>
        <input className="input" placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input" placeholder="Lucide icon name" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <button className="btn-primary"><Plus size={17} /> Add</button>
      </form>
      <p className="mt-3 text-xs text-slate-500">Personal is kept as the safe fallback category. Removing another category moves its tasks to Personal and keeps all historical task logs.</p>
    </div>
  );
}
