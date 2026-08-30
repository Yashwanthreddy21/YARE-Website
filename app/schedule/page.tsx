'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [showCopy, setShowCopy] = useState(false);
  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  const { scheduleItems, addScheduleItem, updateScheduleItem, deleteScheduleItem, copyScheduleDay, moveScheduleItem } = useAppStore();
  const items = scheduleItems.filter((item) => item.dayOfWeek === selectedDay).sort((a, b) => a.sortOrder - b.sortOrder);

  const addItem = () => addScheduleItem({
    id: crypto.randomUUID(),
    dayOfWeek: selectedDay,
    title: 'New schedule item',
    startTime: '12:00',
    sortOrder: items.length + 1,
  });

  return (
    <div>
      <p className="text-sm text-slate-500">Your editable day</p>
      <div className="mb-5 flex items-end justify-between gap-3">
        <h1 className="text-3xl font-black">Routine</h1>
        <button className="btn-secondary" onClick={() => setShowCopy((value) => !value)}><Copy size={16} /> Copy day</button>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {days.map((day, index) => (
          <button key={day} onClick={() => setSelectedDay(index)} className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${selectedDay === index ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {showCopy && (
        <div className="card mb-5 p-4">
          <p className="font-semibold">Copy {days[selectedDay]} schedule to:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {days.map((day, index) => index === selectedDay ? null : (
              <button key={day} type="button" onClick={() => setCopyTargets((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])} className={`rounded-xl px-3 py-2 text-sm font-semibold ${copyTargets.includes(index) ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 dark:bg-slate-800'}`}>{day.slice(0, 3)}</button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" disabled={!copyTargets.length} onClick={() => { copyScheduleDay(selectedDay, copyTargets); setCopyTargets([]); setShowCopy(false); }}>Copy schedule</button>
            <button className="btn-secondary" onClick={() => { setCopyTargets([]); setShowCopy(false); }}>Cancel</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Copying replaces existing schedule items on the selected target days.</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div className="card p-3" key={item.id}>
            <div className="flex items-center gap-2">
              <input aria-label={`${item.title} start time`} className="input max-w-28" type="time" value={item.startTime} onChange={(e) => updateScheduleItem(item.id, { startTime: e.target.value })} />
              <input aria-label="Schedule item title" className="input min-w-0 flex-1" value={item.title} onChange={(e) => updateScheduleItem(item.id, { title: e.target.value })} />
              <button aria-label="Delete schedule item" className="rounded-lg p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" onClick={() => deleteScheduleItem(item.id)}><Trash2 size={18} /></button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <label className="flex min-w-0 items-center gap-2 text-xs text-slate-500">End <input aria-label={`${item.title} end time`} className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 dark:border-slate-700" type="time" value={item.endTime ?? ''} onChange={(e) => updateScheduleItem(item.id, { endTime: e.target.value || undefined })} /></label>
              <div className="flex gap-1">
                <button disabled={index === 0} aria-label="Move schedule item up" className="rounded-lg p-2 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => moveScheduleItem(item.id, -1)}><ArrowUp size={17} /></button>
                <button disabled={index === items.length - 1} aria-label="Move schedule item down" className="rounded-lg p-2 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => moveScheduleItem(item.id, 1)}><ArrowDown size={17} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!items.length && <div className="card p-8 text-center text-slate-500">No schedule for {days[selectedDay]}. Add an item or copy another day.</div>}
      <button className="btn-primary mt-4" onClick={addItem}><Plus size={18} /> Add schedule item</button>
    </div>
  );
}
