'use client';
import { useParams } from 'next/navigation';
import { TaskEditor } from '@/components/TaskEditor';
import { useAppStore } from '@/store/useAppStore';
export default function EditTaskPage(){const {id}=useParams<{id:string}>();const task=useAppStore(s=>s.tasks.find(t=>t.id===id));if(!task)return <div className="card p-8">Task not found.</div>;return <div><div className="mb-6"><p className="text-sm text-slate-500">Targets can change without rewriting old logs</p><h1 className="text-3xl font-black">Edit Task</h1></div><TaskEditor existing={task}/></div>}
