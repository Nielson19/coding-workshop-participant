import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/authContext'

function IndividualDashboard() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className='min-h-screen bg-amber-50 px-6 py-10 text-slate-900'>
      <section className='mx-auto max-w-5xl rounded-3xl border border-amber-100 bg-white p-8 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-amber-600'>
              Participant View
            </p>
            <h1 className='mt-3 text-4xl font-bold'>Individual Dashboard</h1>
            <p className='mt-3 max-w-2xl text-sm text-slate-600'>
              Auth context is now providing the logged-in individual record for
              profile and personalized dashboard data.
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

        <div className='mt-8 grid gap-4 md:grid-cols-2'>
          <article className='rounded-2xl border border-amber-100 bg-amber-50 p-6'>
            <p className='text-sm text-slate-500'>Name</p>
            <h2 className='mt-2 text-2xl font-bold'>{currentUser?.name}</h2>
            <p className='mt-2 text-sm text-slate-600'>{currentUser?.email}</p>
          </article>

          <article className='rounded-2xl border border-amber-100 bg-amber-50 p-6'>
            <p className='text-sm text-slate-500'>Profile</p>
            <h2 className='mt-2 text-2xl font-bold'>ID {currentUser?.id}</h2>
            <p className='mt-2 text-sm text-slate-600'>
              Role: {currentUser?.role || 'member'} | Region:{' '}
              {currentUser?.region || 'Unknown'}
            </p>
          </article>
        </div>

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
