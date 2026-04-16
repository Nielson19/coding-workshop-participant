import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/authContext'
import { createTeam, getTeams } from '../services/teamService'

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
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false)
  const [createTeamValues, setCreateTeamValues] = useState({
    name: '',
    description: '',
  })
  const [createTeamError, setCreateTeamError] = useState('')
  const [createTeamMessage, setCreateTeamMessage] = useState('')
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)

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
  const canCreateTeam = Boolean(currentUser?.id && currentUser?.region)

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

  function updateCreateTeamValues(event) {
    const { name, value } = event.target
    setCreateTeamValues(currentValues => ({
      ...currentValues,
      [name]: value,
    }))
  }

  function toggleCreateTeamForm() {
    setShowCreateTeamForm(currentValue => !currentValue)
    setCreateTeamError('')
    setCreateTeamMessage('')
  }

  async function handleCreateTeam(event) {
    event.preventDefault()

    const trimmedName = createTeamValues.name.trim()
    const trimmedDescription = createTeamValues.description.trim()

    if (!trimmedName) {
      setCreateTeamError('Team name is required.')
      return
    }

    if (!trimmedDescription) {
      setCreateTeamError('Team description is required.')
      return
    }

    if (!canCreateTeam) {
      setCreateTeamError('Your account is missing the ID or region needed to create a team.')
      return
    }

    setIsCreatingTeam(true)
    setCreateTeamError('')
    setCreateTeamMessage('')

    try {
      const createdTeam = await createTeam({
        name: trimmedName,
        description: trimmedDescription,
        region: currentUser.region,
        leaderId: currentUser.id,
        memberIds: [currentUser.id],
      })

      if (createdTeam) {
        setTeams(currentTeams =>
          [...currentTeams, createdTeam].sort((leftTeam, rightTeam) => {
            const leftId = Number(leftTeam?.id) || 0
            const rightId = Number(rightTeam?.id) || 0
            return leftId - rightId
          }),
        )
      }

      setCreateTeamValues({
        name: '',
        description: '',
      })
      setCreateTeamMessage('Team created and you were added as the first member.')
      setShowCreateTeamForm(false)
    } catch (error) {
      setCreateTeamError(error.message || 'Unable to create team')
    } finally {
      setIsCreatingTeam(false)
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

            <div className='flex flex-col gap-3 md:items-end'>
              <button
                className='rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300'
                type='button'
                onClick={toggleCreateTeamForm}
                disabled={!canCreateTeam || isCreatingTeam}
              >
                {showCreateTeamForm ? 'Close Create Team' : 'Create Team'}
              </button>

              <div className='text-sm text-slate-400'>
                {teamsLoading ? 'Loading teams...' : `${teams.length} teams`}
              </div>
            </div>
          </div>

          {!canCreateTeam ? (
            <div className='mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100'>
              Your account needs both an individual ID and a region before it can
              create a team.
            </div>
          ) : null}

          {createTeamMessage ? (
            <div className='mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100'>
              {createTeamMessage}
            </div>
          ) : null}

          {showCreateTeamForm ? (
            <section className='mt-6 rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-6'>
              <div className='flex flex-col gap-2'>
                <p className='text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300'>
                  New Team
                </p>
                <h3 className='text-2xl font-bold text-white'>Create a team</h3>
                <p className='text-sm text-slate-300'>
                  You will be saved as the team leader and automatically added as
                  the first member.
                </p>
              </div>

              <form className='mt-6 grid gap-4' onSubmit={handleCreateTeam}>
                <label className='grid gap-2 text-sm text-slate-300'>
                  Team Name
                  <input
                    className='rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400'
                    type='text'
                    name='name'
                    value={createTeamValues.name}
                    onChange={updateCreateTeamValues}
                    placeholder='North America Platform'
                    disabled={isCreatingTeam}
                  />
                </label>

                <label className='grid gap-2 text-sm text-slate-300'>
                  Description
                  <textarea
                    className='min-h-28 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400'
                    name='description'
                    value={createTeamValues.description}
                    onChange={updateCreateTeamValues}
                    placeholder='Share what this team focuses on.'
                    disabled={isCreatingTeam}
                  />
                </label>

                <div className='grid gap-4 md:grid-cols-2'>
                  <article className='rounded-2xl border border-slate-800 bg-slate-900 p-4'>
                    <p className='text-xs uppercase tracking-[0.18em] text-slate-400'>
                      Region
                    </p>
                    <p className='mt-2 text-sm font-semibold text-white'>
                      {currentUser?.region || '--'}
                    </p>
                  </article>

                  <article className='rounded-2xl border border-slate-800 bg-slate-900 p-4'>
                    <p className='text-xs uppercase tracking-[0.18em] text-slate-400'>
                      First Member
                    </p>
                    <p className='mt-2 text-sm font-semibold text-white'>
                      {currentUser?.name || 'Current user'}
                    </p>
                  </article>
                </div>

                {createTeamError ? (
                  <div className='rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200'>
                    {createTeamError}
                  </div>
                ) : null}

                <div className='flex flex-wrap gap-3'>
                  <button
                    className='rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300'
                    type='submit'
                    disabled={isCreatingTeam}
                  >
                    {isCreatingTeam ? 'Creating Team...' : 'Create Team'}
                  </button>

                  <button
                    className='rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500'
                    type='button'
                    onClick={toggleCreateTeamForm}
                    disabled={isCreatingTeam}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : null}

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
                  to='/dashboard/member'
                >
                  <h3 className='text-xl font-semibold'>Member Dashboard</h3>
                  <p className='mt-2 text-sm text-slate-300'>
                    Open the member dashboard for broader team metrics and
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
