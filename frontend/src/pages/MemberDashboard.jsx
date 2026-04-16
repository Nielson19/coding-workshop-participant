import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/authContext'
import {
  createAchievement,
  getAchievementsByIndividual,
} from '../services/achievementService'
import { getIndividualsByTeam } from '../services/individualService'
import { getTeams } from '../services/teamService'

function parseMemberIds(value) {
  return String(value || '')
    .split(',')
    .map(memberId => Number(memberId.trim()))
    .filter(memberId => Number.isFinite(memberId) && memberId > 0)
}

function findCurrentTeam(teams, userId) {
  const numericUserId = Number(userId)

  if (!Number.isFinite(numericUserId)) {
    return null
  }

  const ledTeam = teams.find(team => Number(team?.leaderId) === numericUserId)
  if (ledTeam) {
    return ledTeam
  }

  return (
    teams.find(team => parseMemberIds(team?.memberIds).includes(numericUserId)) ||
    null
  )
}

function getDefaultOwnerId(teamMembers, currentOwnerId) {
  const normalizedCurrentOwnerId = String(currentOwnerId || '')

  if (
    normalizedCurrentOwnerId &&
    teamMembers.some(member => String(member.id) === normalizedCurrentOwnerId)
  ) {
    return normalizedCurrentOwnerId
  }

  return teamMembers[0]?.id ? String(teamMembers[0].id) : ''
}

function MemberDashboard() {
  const navigate = useNavigate()
  const { currentUser, isLeader, logout } = useAuth()
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [achievements, setAchievements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [achievementValues, setAchievementValues] = useState({
    title: '',
    description: '',
    points: '',
    ownerId: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    let isMounted = true

    async function loadTeamDashboard() {
      setIsLoading(true)
      setLoadError('')

      try {
        const allTeams = await getTeams()
        const currentTeam = findCurrentTeam(allTeams, currentUser?.id)

        if (!isMounted) {
          return
        }

        if (!currentTeam) {
          setTeam(null)
          setMembers([])
          setAchievements([])
          setAchievementValues({
            title: '',
            description: '',
            points: '',
            ownerId: '',
          })
          return
        }

        const teamData = await getIndividualsByTeam(currentTeam.id)
        const teamMembers = Array.isArray(teamData.members) ? teamData.members : []
        const achievementGroups = await Promise.all(
          teamMembers.map(async member => {
            const memberAchievements = await getAchievementsByIndividual(member.id)
            return memberAchievements.map(achievement => ({
              ...achievement,
              member,
            }))
          }),
        )

        if (!isMounted) {
          return
        }

        setTeam(currentTeam)
        setMembers(teamMembers)
        setAchievements(
          achievementGroups
            .flat()
            .sort((leftAchievement, rightAchievement) => {
              const leftId = Number(leftAchievement?.id) || 0
              const rightId = Number(rightAchievement?.id) || 0
              return rightId - leftId
            }),
        )
        setAchievementValues(currentValues => ({
          ...currentValues,
          ownerId: getDefaultOwnerId(teamMembers, currentValues.ownerId),
        }))
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message || 'Unable to load team dashboard')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTeamDashboard()

    return () => {
      isMounted = false
    }
  }, [currentUser?.id])

  const totalPoints = achievements.reduce((sum, achievement) => {
    const points = Number(achievement?.points) || 0
    return sum + points
  }, 0)

  function updateAchievementValues(event) {
    const { name, value } = event.target
    setAchievementValues(currentValues => ({
      ...currentValues,
      [name]: value,
    }))
  }

  async function reloadAchievements(currentTeam) {
    const teamData = await getIndividualsByTeam(currentTeam.id)
    const teamMembers = Array.isArray(teamData.members) ? teamData.members : []
    const achievementGroups = await Promise.all(
      teamMembers.map(async member => {
        const memberAchievements = await getAchievementsByIndividual(member.id)
        return memberAchievements.map(achievement => ({
          ...achievement,
          member,
        }))
      }),
    )

    setMembers(teamMembers)
    setAchievements(
      achievementGroups
        .flat()
        .sort((leftAchievement, rightAchievement) => {
          const leftId = Number(leftAchievement?.id) || 0
          const rightId = Number(rightAchievement?.id) || 0
          return rightId - leftId
        }),
    )
    setAchievementValues(currentValues => ({
      ...currentValues,
      ownerId: getDefaultOwnerId(teamMembers, currentValues.ownerId),
    }))
  }

  async function handleCreateAchievement(event) {
    event.preventDefault()

    const trimmedTitle = achievementValues.title.trim()
    const trimmedDescription = achievementValues.description.trim()
    const selectedOwnerId = Number(achievementValues.ownerId)
    const points = Number(achievementValues.points)

    if (!trimmedTitle) {
      setSubmitError('Achievement title is required.')
      return
    }

    if (!trimmedDescription) {
      setSubmitError('Achievement description is required.')
      return
    }

    if (!Number.isFinite(points) || points <= 0) {
      setSubmitError('Points must be a positive number.')
      return
    }

    if (!members.some(member => Number(member.id) === selectedOwnerId)) {
      setSubmitError('Select a member from this team.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setSubmitMessage('')

    try {
      await createAchievement({
        title: trimmedTitle,
        description: trimmedDescription,
        points,
        ownerId: selectedOwnerId,
        awardedBy: currentUser?.id,
      })

      if (team) {
        await reloadAchievements(team)
      }

      setAchievementValues({
        title: '',
        description: '',
        points: '',
        ownerId: achievementValues.ownerId,
      })
      setSubmitMessage('Achievement added to a member of this team.')
    } catch (error) {
      setSubmitError(error.message || 'Unable to create achievement')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className='min-h-screen bg-emerald-50 px-6 py-10 text-slate-900'>
      <section className='mx-auto max-w-5xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600'>
              Member View
            </p>
            <h1 className='mt-3 text-4xl font-bold'>Member Dashboard</h1>
            <p className='mt-3 max-w-2xl text-sm text-slate-600'>
              Review your current team, its members, and the achievements awarded
              inside that team.
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

        {loadError ? (
          <div className='mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
            {loadError}
          </div>
        ) : null}

        {isLoading ? (
          <section className='mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600'>
            Loading team dashboard...
          </section>
        ) : !team ? (
          <section className='mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800'>
            No team is currently associated with your account.
          </section>
        ) : (
          <>
            <section className='mt-8 grid gap-4 md:grid-cols-4'>
              <article className='rounded-2xl border border-emerald-100 bg-emerald-50 p-6'>
                <p className='text-sm text-slate-500'>Active Team</p>
                <h2 className='mt-2 text-2xl font-bold'>{team.name}</h2>
                <p className='mt-2 text-sm text-slate-600'>{team.region}</p>
              </article>

              <article className='rounded-2xl border border-emerald-100 bg-emerald-50 p-6'>
                <p className='text-sm text-slate-500'>Leader ID</p>
                <h2 className='mt-2 text-2xl font-bold'>{team.leaderId ?? '--'}</h2>
                <p className='mt-2 text-sm text-slate-600'>Current team owner</p>
              </article>

              <article className='rounded-2xl border border-emerald-100 bg-emerald-50 p-6'>
                <p className='text-sm text-slate-500'>Team Members</p>
                <h2 className='mt-2 text-2xl font-bold'>{members.length}</h2>
                <p className='mt-2 text-sm text-slate-600'>
                  Eligible recipients for new achievements
                </p>
              </article>

              <article className='rounded-2xl border border-emerald-100 bg-emerald-50 p-6'>
                <p className='text-sm text-slate-500'>Total Points</p>
                <h2 className='mt-2 text-2xl font-bold'>{totalPoints}</h2>
                <p className='mt-2 text-sm text-slate-600'>
                  Combined achievement points for this team
                </p>
              </article>
            </section>

            <section className='mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
              <div>
                <p className='text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600'>
                  Award Achievement
                </p>
                <h2 className='mt-2 text-2xl font-bold'>Add an achievement</h2>
                <p className='mt-2 text-sm text-slate-600'>
                  The recipient list is limited to members who are currently in
                  this team.
                </p>
              </div>

              <form className='mt-6 grid gap-4' onSubmit={handleCreateAchievement}>
                <div className='grid gap-4 md:grid-cols-2'>
                  <label className='grid gap-2 text-sm text-slate-700'>
                    Achievement Title
                    <input
                      className='rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500'
                      type='text'
                      name='title'
                      value={achievementValues.title}
                      onChange={updateAchievementValues}
                      placeholder='Quarterly Impact'
                      disabled={isSubmitting || members.length === 0}
                    />
                  </label>

                  <label className='grid gap-2 text-sm text-slate-700'>
                    Team Member
                    <select
                      className='rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500'
                      name='ownerId'
                      value={achievementValues.ownerId}
                      onChange={updateAchievementValues}
                      disabled={isSubmitting || members.length === 0}
                    >
                      <option value=''>
                        {members.length === 0
                          ? 'No team members available'
                          : 'Select a team member'}
                      </option>
                      {members.map(member => (
                        <option key={member._id || member.id} value={member.id}>
                          {member.name} ({member.role || 'member'})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className='grid gap-2 text-sm text-slate-700'>
                  Description
                  <textarea
                    className='min-h-28 rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500'
                    name='description'
                    value={achievementValues.description}
                    onChange={updateAchievementValues}
                    placeholder='Describe what this team member accomplished.'
                    disabled={isSubmitting || members.length === 0}
                  />
                </label>

                <label className='grid gap-2 text-sm text-slate-700 md:max-w-xs'>
                  Points
                  <input
                    className='rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500'
                    type='number'
                    min='1'
                    name='points'
                    value={achievementValues.points}
                    onChange={updateAchievementValues}
                    placeholder='25'
                    disabled={isSubmitting || members.length === 0}
                  />
                </label>

                {submitError ? (
                  <div className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
                    {submitError}
                  </div>
                ) : null}

                {submitMessage ? (
                  <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
                    {submitMessage}
                  </div>
                ) : null}

                <div className='flex flex-wrap gap-3'>
                  <button
                    className='rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300'
                    type='submit'
                    disabled={isSubmitting || members.length === 0}
                  >
                    {isSubmitting ? 'Adding Achievement...' : 'Add Achievement'}
                  </button>
                </div>
              </form>
            </section>

            <section className='mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
              <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
                <div>
                  <p className='text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600'>
                    Achievement List
                  </p>
                  <h2 className='mt-2 text-2xl font-bold'>Team achievements</h2>
                  <p className='mt-2 text-sm text-slate-600'>
                    Achievements awarded to members currently inside this team.
                  </p>
                </div>

                <div className='text-sm text-slate-500'>
                  {achievements.length} achievements
                </div>
              </div>

              <div className='mt-6 overflow-hidden rounded-2xl border border-slate-200'>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-slate-200'>
                    <thead className='bg-slate-50'>
                      <tr className='text-left text-xs uppercase tracking-[0.18em] text-slate-500'>
                        <th className='px-4 py-4 font-semibold'>ID</th>
                        <th className='px-4 py-4 font-semibold'>Title</th>
                        <th className='px-4 py-4 font-semibold'>Member</th>
                        <th className='px-4 py-4 font-semibold'>Points</th>
                        <th className='px-4 py-4 font-semibold'>Awarded By</th>
                      </tr>
                    </thead>

                    <tbody className='divide-y divide-slate-200 bg-white'>
                      {achievements.length > 0 ? (
                        achievements.map(achievement => (
                          <tr
                            key={achievement._id || achievement.id}
                            className='text-sm text-slate-700'
                          >
                            <td className='px-4 py-4 font-semibold text-emerald-700'>
                              {achievement.id}
                            </td>
                            <td className='px-4 py-4'>
                              <div className='font-semibold text-slate-900'>
                                {achievement.title}
                              </div>
                              <div className='mt-1 text-xs text-slate-500'>
                                {achievement.description || 'No description'}
                              </div>
                            </td>
                            <td className='px-4 py-4'>
                              {achievement.member?.name || `Member ${achievement.ownerId}`}
                            </td>
                            <td className='px-4 py-4'>{achievement.points ?? '--'}</td>
                            <td className='px-4 py-4'>{achievement.awardedBy ?? '--'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className='px-4 py-6 text-sm text-slate-500' colSpan={5}>
                            No achievements have been awarded to this team yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}

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

export default MemberDashboard
