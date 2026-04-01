import { Link } from 'react-router'

function TeamDashboard() {
  return (
    <main className='min-h-screen bg-emerald-50 px-6 py-10 text-slate-900'>
      <section className='mx-auto max-w-5xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm'>
        <p className='text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600'>
          Team View
        </p>
        <h1 className='mt-3 text-4xl font-bold'>Team Dashboard</h1>
        <p className='mt-3 max-w-2xl text-sm text-slate-600'>
          Use this page for team-level stats, location rollups, and shared
          achievement summaries.
        </p>

        <div className='mt-8 flex gap-4'>
          <Link
            className='rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500'
            to='/dashboard'
          >
            Main Dashboard
          </Link>
          <Link
            className='rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400'
            to='/dashboard/individual'
          >
            Individual Dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}

export default TeamDashboard
