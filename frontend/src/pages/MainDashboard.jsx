import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/authContext'
import { getTeams } from '../services/teamService'

const leaderSummary = {
  teamName: 'NA Alpha Team',
  teamMembers: 5,
  totalPoints: 300,
  topAchievement: 'NA Excellence',
  performanceNote: 'Top NA performance this cycle with strong participation.',
}

function MainDashboard() {
  const navigate = useNavigate()
  const { currentUser, isLeader, logout } = useAuth()
  const [teams, setTeams] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [teamsError, setTeamsError] = useState('')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    let isMounted = true

    async function loadTeams() {
      setTeamsLoading(true)
      setTeamsError('')

      try {
        const fetchedTeams = await getTeams()
        if (isMounted) {
          setTeams(fetchedTeams)
        }
      } catch (error) {
        if (isMounted) {
          setTeamsError(error.message || 'Unable to load teams')
        }
      } finally {
        if (isMounted) {
          setTeamsLoading(false)
        }
      }
    }

    loadTeams()

    return () => {
      isMounted = false
    }
  }, [])

  const roleLabel = currentUser?.role || 'member'

  function getMemberCount(team) {
    const memberIds = String(team?.memberIds || '')
      .split(',')
      .map(memberId => memberId.trim())
      .filter(Boolean)

    return memberIds.length
  }

  function openTeamMembers(teamId) {
    navigate(`/dashboard/team/${teamId}`)
  }

  function handleTeamRowKeyDown(event, teamId) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openTeamMembers(teamId)
    }
  }

  return (
    <main className='min-h-screen bg-slate-950 px-6 py-10 text-white'>
      <section className='mx-auto max-w-5xl'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300'>
              Dashboard Hub
            </p>
            <h1 className='mt-3 text-4xl font-bold'>Main Dashboard</h1>
            <p className='mt-3 max-w-2xl text-sm text-slate-300'>
              {isLeader
                ? `Leader overview for ${currentUser?.name}. Your authenticated profile is now coming from auth context.`
                : `Welcome back, ${currentUser?.name}. Your authenticated individual profile is now available across the app.`}
            </p>
          </div>

          <button
            className='rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white'
            type='button'
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>

        <section className='mt-8 grid gap-4 md:grid-cols-3'>
          <article className='rounded-2xl border border-slate-800 bg-slate-900 p-6'>
            <p className='text-sm text-slate-400'>Authenticated User</p>
            <h2 className='mt-2 text-2xl font-bold text-white'>
              {currentUser?.name}
            </h2>
            <p className='mt-2 text-sm text-slate-300'>{currentUser?.email}</p>
          </article>

          <article className='rounded-2xl border border-slate-800 bg-slate-900 p-6'>
            <p className='text-sm text-slate-400'>Role</p>
            <h2 className='mt-2 text-4xl font-bold text-cyan-300'>
              {roleLabel}
            </h2>
            <p className='mt-2 text-sm text-slate-300'>
              Region: {currentUser?.region || 'Unknown'}
            </p>
          </article>

          <article className='rounded-2xl border border-slate-800 bg-slate-900 p-6'>
            <p className='text-sm text-slate-400'>Individual ID</p>
            <h2 className='mt-2 text-4xl font-bold text-cyan-300'>
              {currentUser?.id ?? '--'}
            </h2>
            <p className='mt-2 text-sm text-slate-300'>
              Session persisted from the login service.
            </p>
          </article>
        </section>

        <section className='mt-8 rounded-3xl border border-slate-800 bg-slate-900/90 p-8'>
          <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
            <div>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300'>
                Team Directory
              </p>
              <h2 className='mt-3 text-2xl font-bold text-white'>All Teams</h2>
              <p className='mt-2 text-sm text-slate-300'>
                Live team records loaded from the backend.
              </p>
            </div>

            <div className='text-sm text-slate-400'>
              {teamsLoading ? 'Loading teams...' : `${teams.length} teams`}
            </div>
          </div>

          {teamsError ? (
            <div className='mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200'>
              {teamsError}
            </div>
          ) : null}

          <div className='mt-6 overflow-hidden rounded-2xl border border-slate-800'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-800'>
                <thead className='bg-slate-950/80'>
                  <tr className='text-left text-xs uppercase tracking-[0.18em] text-slate-400'>
                    <th className='px-4 py-4 font-semibold'>ID</th>
                    <th className='px-4 py-4 font-semibold'>Name</th>
                    <th className='px-4 py-4 font-semibold'>Region</th>
                    <th className='px-4 py-4 font-semibold'>Leader ID</th>
                    <th className='px-4 py-4 font-semibold'>Members</th>
                  </tr>
                </thead>

                <tbody className='divide-y divide-slate-800 bg-slate-900'>
                  {teamsLoading ? (
                    <tr>
                      <td
                        className='px-4 py-6 text-sm text-slate-300'
                        colSpan={5}
                      >
                        Loading team data...
                      </td>
                    </tr>
                  ) : teams.length > 0 ? (
                    teams.map(team => (
                      <tr
                        key={team._id || team.id}
                        className='cursor-pointer text-sm text-slate-200 transition hover:bg-slate-800/80 focus-within:bg-slate-800/80'
                        tabIndex={0}
                        role='button'
                        onClick={() => openTeamMembers(team.id)}
                        onKeyDown={event => handleTeamRowKeyDown(event, team.id)}
                      >
                        <td className='px-4 py-4 font-semibold text-cyan-300'>
                          {team.id}
                        </td>
                        <td className='px-4 py-4'>
                          <div className='font-semibold text-white'>{team.name}</div>
                          <div className='mt-1 text-xs text-slate-400'>
                            {team.description || 'No description'}
                          </div>
                        </td>
                        <td className='px-4 py-4'>{team.region || '--'}</td>
                        <td className='px-4 py-4'>{team.leaderId ?? '--'}</td>
                        <td className='px-4 py-4'>{getMemberCount(team)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className='px-4 py-6 text-sm text-slate-300'
                        colSpan={5}
                      >
                        No teams found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {isLeader ? (
          <>
            <div className='mt-6 grid gap-4 md:grid-cols-3'>
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
            <h2 className='text-2xl font-bold'>Member Overview</h2>
            <p className='mt-3 max-w-2xl text-sm text-slate-300'>
              You are signed in as an individual contributor. This landing view
              can now pull your profile from auth context and route you into
              more detailed personal screens.
            </p>

            <div className='mt-6'>
              <Link
                className='inline-flex rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200'
                to='/dashboard/individual'
              >
                Open Individual Dashboard
              </Link>
            </div>
          </section>
        )}

        <Link
          className='mt-8 inline-flex text-sm font-semibold text-cyan-300 transition hover:text-cyan-200'
          to='/dashboard/individual'
        >
          View Individual Dashboard
        </Link>
      </section>
    </main>
  )
}

export default MainDashboard
