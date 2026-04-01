import { Link } from 'react-router'

function IndividualDashboard() {
  return (
    <main className='min-h-screen bg-amber-50 px-6 py-10 text-slate-900'>
      <section className='mx-auto max-w-5xl rounded-3xl border border-amber-100 bg-white p-8 shadow-sm'>
        <p className='text-sm font-semibold uppercase tracking-[0.2em] text-amber-600'>
          Participant View
        </p>
        <h1 className='mt-3 text-4xl font-bold'>Individual Dashboard</h1>
        <p className='mt-3 max-w-2xl text-sm text-slate-600'>
          Use this page for user-level profile data, milestones, and individual
          achievement tracking.
        </p>

        <div className='mt-8 flex gap-4'>
          <Link
            className='rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
            to='/dashboard'
          >
            Main Dashboard
          </Link>
          <Link
            className='rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400'
            to='/dashboard/team'
          >
            Team Dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}

export default IndividualDashboard
