'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { JobStatus } from '@/types';
import { localDateKey } from '@/utils/date';

const statuses: JobStatus[] = ['Applied', 'Recruiter Contact', 'Interview', 'Assessment', 'Final Interview', 'Offer', 'Rejected', 'Withdrawn'];

export default function JobsPage() {
  const { jobs, addJob, updateJob } = useAppStore();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [dateApplied, setDateApplied] = useState(localDateKey());
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [jobUrl, setJobUrl] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [workType, setWorkType] = useState('');
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  function submit() {
    if (!company.trim() || !role.trim() || !dateApplied) return;
    addJob({
      id: crypto.randomUUID(),
      company: company.trim(),
      role: role.trim(),
      dateApplied,
      status,
      jobUrl: jobUrl.trim() || undefined,
      location: location.trim() || undefined,
      salary: salary.trim() || undefined,
      workType: workType.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setCompany('');
    setRole('');
    setJobUrl('');
    setLocation('');
    setSalary('');
    setWorkType('');
    setNotes('');
    setStatus('Applied');
  }

  return (
    <div>
      <p className="text-sm text-slate-500">Career pipeline</p>
      <h1 className="mb-6 text-3xl font-black">Job Applications</h1>

      <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <label className="text-sm font-medium">Company<input className="input mt-1" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} required /></label>
        <label className="text-sm font-medium">Role<input className="input mt-1" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} required /></label>
        <label className="text-sm font-medium">Date applied<input className="input mt-1" type="date" value={dateApplied} onChange={(e) => setDateApplied(e.target.value)} required /></label>
        <label className="text-sm font-medium">Status<select className="input mt-1" value={status} onChange={(e) => setStatus(e.target.value as JobStatus)}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>

        <button type="button" className="sm:col-span-2 flex items-center gap-2 text-left text-sm font-semibold text-slate-600 dark:text-slate-300" onClick={() => setShowDetails((value) => !value)}>
          {showDetails ? <ChevronUp size={17} /> : <ChevronDown size={17} />} Optional details
        </button>

        {showDetails && (
          <>
            <label className="text-sm font-medium">Job URL<input className="input mt-1" type="url" placeholder="https://…" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} /></label>
            <label className="text-sm font-medium">Location<input className="input mt-1" placeholder="City, State or Remote" value={location} onChange={(e) => setLocation(e.target.value)} /></label>
            <label className="text-sm font-medium">Salary<input className="input mt-1" placeholder="$80k–$100k" value={salary} onChange={(e) => setSalary(e.target.value)} /></label>
            <label className="text-sm font-medium">Work type<input className="input mt-1" placeholder="Remote, Hybrid, On-site" value={workType} onChange={(e) => setWorkType(e.target.value)} /></label>
            <label className="text-sm font-medium sm:col-span-2">Notes<textarea className="input mt-1 min-h-20 resize-y" placeholder="Recruiter, next step, interview notes…" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          </>
        )}

        <button className="btn-primary sm:col-span-2">Add application</button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {statuses.map((value) => {
          const count = jobs.filter((job) => job.status === value).length;
          return <span key={value} className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-800">{value}: {count}</span>;
        })}
      </div>

      <div className="space-y-2">
        {[...jobs].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied)).map((job) => (
          <div className="card p-4" key={job.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <b className="block truncate">{job.role}</b>
                <div className="text-sm text-slate-500">{job.company} · {job.dateApplied}</div>
                {(job.location || job.workType || job.salary) && <div className="mt-1 text-xs text-slate-500">{[job.location, job.workType, job.salary].filter(Boolean).join(' · ')}</div>}
                {job.notes && <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{job.notes}</div>}
                {job.jobUrl && <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline" href={job.jobUrl} target="_blank" rel="noreferrer">Open posting <ExternalLink size={13} /></a>}
              </div>
              <select aria-label={`Status for ${job.role} at ${job.company}`} className="rounded-xl border border-slate-200 bg-transparent px-2 py-2 text-xs font-bold dark:border-slate-700" value={job.status} onChange={(e) => updateJob(job.id, { status: e.target.value as JobStatus })}>
                {statuses.map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
          </div>
        ))}
        {!jobs.length && <div className="card p-8 text-center text-slate-500">No detailed applications yet. You can still track your daily application count from Today.</div>}
      </div>
    </div>
  );
}
