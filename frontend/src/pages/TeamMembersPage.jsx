import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../context/authContext'
import { getIndividuals, getIndividualsByTeam } from '../services/individualService'
import {
  addIndividualToTeam,
  getTeamById,
  removeIndividualFromTeam,
} from '../services/teamService'

function normalizeRegion(value) {
  return String(value || '').trim().toUpperCase()
}

function normalizeId(value) {
  return String(value || '').trim()
}

function TeamMembersPage() {
  const navigate = useNavigate()
  const { teamId } = useParams()
  const { logout } = useAuth()
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [allIndividuals, setAllIndividuals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [selectedIndividualId, setSelectedIndividualId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeMemberId, setActiveMemberId] = useState(null)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  async function fetchTeamData() {
    const [teamRecord, membersPayload, individuals] = await Promise.all([
      getTeamById(teamId),
      getIndividualsByTeam(teamId),
      getIndividuals(),
    ])

    return {
      team: teamRecord || membersPayload.team || null,
      members: membersPayload.members,
      individuals,
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadTeamData() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await fetchTeamData()

        if (!isMounted) {
          return
        }

        setTeam(data.team)
        setMembers(data.members)
        setAllIndividuals(data.individuals)
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Unable to load team members')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTeamData()

    return () => {
      isMounted = false
    }
  }, [teamId])

  const teamRegion = normalizeRegion(team?.region)
  const memberIds = new Set(members.map(member => normalizeId(member.id)))
  const visibleMembers = members.filter(member => {
    if (!teamRegion) {
      return true
    }

    return normalizeRegion(member.region) === teamRegion
  })
  const availableIndividuals = allIndividuals.filter(individual => {
    const isExistingMember = memberIds.has(normalizeId(individual.id))

    if (isExistingMember) {
      return false
    }

    if (!teamRegion) {
      return true
    }

    return normalizeRegion(individual.region) === teamRegion
  })

  async function reloadTeamData() {
    const data = await fetchTeamData()
    setTeam(data.team)
    setMembers(data.members)
    setAllIndividuals(data.individuals)
    return data
  }

  async function handleAddMember() {
    if (!selectedIndividualId) {
      setActionMessage('Select an individual to add to this team.')
      return
    }

    setIsSubmitting(true)
    setActionMessage('')
    setErrorMessage('')

    try {
      await addIndividualToTeam(teamId, selectedIndividualId)
      await reloadTeamData()
      setSelectedIndividualId('')
      setActionMessage('Individual added to the team.')
    } catch (error) {
      setErrorMessage(error.message || 'Unable to add individual to team')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveMember(individualId) {
    setIsSubmitting(true)
    setActiveMemberId(individualId)
    setActionMessage('')
    setErrorMessage('')

    try {
      await removeIndividualFromTeam(teamId, individualId)
      await reloadTeamData()
      setActionMessage('Individual removed from the team.')
    } catch (error) {
      setErrorMessage(error.message || 'Unable to remove individual from team')
    } finally {
      setActiveMemberId(null)
      setIsSubmitting(false)
    }
  }

  return (
    <main className='min-h-screen bg-emerald-50 px-6 py-10 text-slate-900'>
      <section className='mx-auto max-w-6xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm'>
        <div className='mb-6'>
          <button
            className='rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700'
            type='button'
            onClick={() => navigate('/dashboard')}
          >
            Back to Main Dashboard
          </button>
        </div>

        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600'>
              Team Members
            </p>
            <h1 className='mt-3 text-4xl font-bold'>
              {team?.name || `Team ${teamId}`}
            </h1>
            <p className='mt-3 max-w-2xl text-sm text-slate-600'>
              Review the members assigned to this team and basic team metadata.
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

        <div className='mt-8 grid gap-4 md:grid-cols-3'>
          <article className='rounded-2xl border border-emerald-100 bg-emerald-50 p-6'>
            <p className='text-sm text-slate-500'>Team ID</p>
            <h2 className='mt-2 text-2xl font-bold'>{team?.id ?? teamId}</h2>
          </article>

          <article className='rounded-2xl border border-emerald-100 bg-emerald-50 p-6'>
            <p className='text-sm text-slate-500'>Region</p>
            <h2 className='mt-2 text-2xl font-bold'>{team?.region || '--'}</h2>
          </article>

          <article className='rounded-2xl border border-emerald-100 bg-emerald-50 p-6'>
            <p className='text-sm text-slate-500'>Leader ID</p>
            <h2 className='mt-2 text-2xl font-bold'>{team?.leaderId ?? '--'}</h2>
          </article>
        </div>

        {team?.description ? (
          <section className='mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6'>
            <p className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500'>
              Description
            </p>
            <p className='mt-3 text-sm leading-6 text-slate-700'>
              {team.description}
            </p>
          </section>
        ) : null}

        {errorMessage ? (
          <div className='mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
            {errorMessage}
          </div>
        ) : null}

        {actionMessage ? (
          <div className='mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
            {actionMessage}
          </div>
        ) : null}

        <section className='mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <p className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500'>
                Add Member
              </p>
              <h2 className='mt-2 text-2xl font-bold text-slate-900'>
                Assign an individual to this team
              </h2>
              <p className='mt-2 text-sm text-slate-600'>
                Choose from individuals in the same region who are not already in
                this team roster.
              </p>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <select
                className='rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500'
                value={selectedIndividualId}
                onChange={event => setSelectedIndividualId(event.target.value)}
                disabled={isLoading || isSubmitting || availableIndividuals.length === 0}
              >
                <option value=''>
                  {availableIndividuals.length === 0
                    ? 'No matching individuals available'
                    : 'Select an individual'}
                </option>
                {availableIndividuals.map(individual => (
                  <option key={individual._id || individual.id} value={individual.id}>
                    {individual.name} ({individual.email})
                  </option>
                ))}
              </select>

              <button
                className='rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300'
                type='button'
                onClick={handleAddMember}
                disabled={
                  isLoading ||
                  isSubmitting ||
                  !selectedIndividualId ||
                  availableIndividuals.length === 0
                }
              >
                {isSubmitting && activeMemberId === null ? 'Adding...' : 'Add to Team'}
              </button>
            </div>
          </div>
        </section>

        <section className='mt-6 overflow-hidden rounded-2xl border border-slate-200'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-slate-200'>
              <thead className='bg-slate-50'>
                <tr className='text-left text-xs uppercase tracking-[0.18em] text-slate-500'>
                  <th className='px-4 py-4 font-semibold'>ID</th>
                  <th className='px-4 py-4 font-semibold'>Name</th>
                  <th className='px-4 py-4 font-semibold'>Email</th>
                  <th className='px-4 py-4 font-semibold'>Role</th>
                  <th className='px-4 py-4 font-semibold'>Region</th>
                  <th className='px-4 py-4 font-semibold'>Action</th>
                </tr>
              </thead>

              <tbody className='divide-y divide-slate-200 bg-white'>
                {isLoading ? (
                  <tr>
                    <td className='px-4 py-6 text-sm text-slate-500' colSpan={6}>
                      Loading team members...
                    </td>
                  </tr>
                ) : visibleMembers.length > 0 ? (
                  visibleMembers.map(member => (
                    <tr key={member._id || member.id} className='text-sm text-slate-700'>
                      <td className='px-4 py-4 font-semibold text-emerald-700'>
                        {member.id}
                      </td>
                      <td className='px-4 py-4'>
                        <div className='font-semibold text-slate-900'>
                          {member.name}
                        </div>
                        {team?.leaderId === member.id ? (
                          <div className='mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700'>
                            Team Leader
                          </div>
                        ) : null}
                      </td>
                      <td className='px-4 py-4'>{member.email}</td>
                      <td className='px-4 py-4'>{member.role || '--'}</td>
                      <td className='px-4 py-4'>{member.region || '--'}</td>
                      <td className='px-4 py-4'>
                        <button
                          className='rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400'
                          type='button'
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting && activeMemberId === member.id
                            ? 'Removing...'
                            : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className='px-4 py-6 text-sm text-slate-500' colSpan={6}>
                      {teamRegion
                        ? `No team members match the ${teamRegion} region.`
                        : 'No members found for this team.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className='mt-8 flex flex-wrap gap-4'>
          <Link
            className='rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500'
            to='/dashboard'
          >
            Main Dashboard
          </Link>
          <Link
            className='rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400'
            to='/dashboard/member'
          >
            Member Dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}

export default TeamMembersPage
