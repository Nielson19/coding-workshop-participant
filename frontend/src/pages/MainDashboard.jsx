import { Link } from 'react-router'

const currentUser = {
  id: 2,
  name: 'Emma Stone',
  role: 'leader',
  region: 'NA',
}

const leaderSummary = {
  teamName: 'NA Alpha Team',
  teamMembers: 5,
  totalPoints: 300,
  topAchievement: 'NA Excellence',
  performanceNote: 'Top NA performance this cycle with strong participation.',
}

function MainDashboard() {
  const isLeader = currentUser.role === 'leader'

  return (
    <main className='min-h-screen bg-slate-950 px-6 py-10 text-white'>
      <section className='mx-auto max-w-5xl'>
        <p className='text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300'>
          Dashboard Hub
        </p>
        <h1 className='mt-3 text-4xl font-bold'>Main Dashboard</h1>
        <p className='mt-3 max-w-2xl text-sm text-slate-300'>
          {isLeader
            ? `Leader overview for ${currentUser.name}. This layout is ready to receive role data from auth context later.`
            : 'This page can become the authenticated landing screen once the auth context is added.'}
        </p>

        {isLeader ? (
          <>
            <div className='mt-8 grid gap-4 md:grid-cols-3'>
              <article className='rounded-2xl border border-cyan-500/30 bg-slate-900 p-6'>
                <p className='text-sm text-slate-400'>Team</p>
                <h2 className='mt-2 text-2xl font-bold text-white'>
                  {leaderSummary.teamName}
                </h2>
                <p className='mt-2 text-sm text-slate-300'>
                  Region: {currentUser.region}
                </p>
              </article>

              <article className='rounded-2xl border border-slate-800 bg-slate-900 p-6'>
                <p className='text-sm text-slate-400'>Team Members</p>
                <h2 className='mt-2 text-4xl font-bold text-cyan-300'>
                  {leaderSummary.teamMembers}
                </h2>
                <p className='mt-2 text-sm text-slate-300'>
                  Active contributors in the current team roster.
                </p>
              </article>

              <article className='rounded-2xl border border-slate-800 bg-slate-900 p-6'>
                <p className='text-sm text-slate-400'>Performance Points</p>
                <h2 className='mt-2 text-4xl font-bold text-cyan-300'>
                  {leaderSummary.totalPoints}
                </h2>
                <p className='mt-2 text-sm text-slate-300'>
                  Team achievement points awarded so far.
                </p>
              </article>
            </div>

            <section className='mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8'>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300'>
                General Team Performance
              </p>
              <h2 className='mt-3 text-2xl font-bold text-white'>
                {leaderSummary.topAchievement}
              </h2>
              <p className='mt-3 max-w-3xl text-sm leading-6 text-slate-300'>
                {leaderSummary.performanceNote}
              </p>

              <div className='mt-8 grid gap-4 md:grid-cols-2'>
                <Link
                  className='rounded-2xl border border-slate-700 bg-slate-950 p-6 transition hover:border-cyan-400'
                  to='/dashboard/team'
                >
                  <h3 className='text-xl font-semibold'>Team Dashboard</h3>
                  <p className='mt-2 text-sm text-slate-300'>
                    Open the full team dashboard for broader team metrics and
                    performance details.
                  </p>
                </Link>

                <Link
                  className='rounded-2xl border border-slate-700 bg-slate-950 p-6 transition hover:border-cyan-400'
                  to='/dashboard/individual'
                >
                  <h3 className='text-xl font-semibold'>Individual Dashboard</h3>
                  <p className='mt-2 text-sm text-slate-300'>
                    Review participant-level progress, achievements, and
                    personal insights.
                  </p>
                </Link>
              </div>
            </section>
          </>
        ) : (
          <section className='mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8'>
            <h2 className='text-2xl font-bold'>Access Pending</h2>
            <p className='mt-3 max-w-2xl text-sm text-slate-300'>
              This dashboard is currently tailored for leaders. Once auth
              context is connected, we can render a different main view for
              members here.
            </p>
          </section>
        )}

        <Link
          className='mt-8 inline-flex text-sm font-semibold text-cyan-300 transition hover:text-cyan-200'
          to='/login'
        >
          Back to Login
        </Link>
      </section>
    </main>
  )
}

export default MainDashboard
