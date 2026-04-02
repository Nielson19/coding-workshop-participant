import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/authContext'

function TeamDashboard() {
  const navigate = useNavigate()
  const { currentUser, isLeader, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className='min-h-screen bg-emerald-50 px-6 py-10 text-slate-900'>
      <section className='mx-auto max-w-5xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600'>
              Team View
            </p>
            <h1 className='mt-3 text-4xl font-bold'>Team Dashboard</h1>
            <p className='mt-3 max-w-2xl text-sm text-slate-600'>
              This page can now read the logged-in individual directly from auth
              context and tailor team views from there.
            </p>
          </div>

          <button
            className='rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500'
            type='button'
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>

        <div className='mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-6'>
          <p className='text-sm text-slate-500'>Signed In As</p>
          <h2 className='mt-2 text-2xl font-bold'>{currentUser?.name}</h2>
          <p className='mt-2 text-sm text-slate-600'>
            {currentUser?.email} | Role: {currentUser?.role || 'member'} |{' '}
            {isLeader ? 'Leader access enabled' : 'Member view'}
          </p>
        </div>

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
