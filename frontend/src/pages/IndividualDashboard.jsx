import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/authContext'
import { getAchievementsByIndividual } from '../services/achievementService'

function IndividualDashboard() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [achievements, setAchievements] = useState([])
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true)
  const [achievementsError, setAchievementsError] = useState('')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    let isMounted = true

    async function loadAchievements() {
      if (!currentUser?.id) {
        if (isMounted) {
          setAchievements([])
          setIsLoadingAchievements(false)
        }
        return
      }

      setIsLoadingAchievements(true)
      setAchievementsError('')

      try {
        const items = await getAchievementsByIndividual(currentUser.id)

        if (!isMounted) {
          return
        }

        setAchievements(items)
      } catch (error) {
        if (isMounted) {
          setAchievementsError(error.message || 'Unable to load achievements')
        }
      } finally {
        if (isMounted) {
          setIsLoadingAchievements(false)
        }
      }
    }

    loadAchievements()

    return () => {
      isMounted = false
    }
  }, [currentUser?.id])

  const totalPoints = achievements.reduce((sum, achievement) => {
    const points = Number(achievement?.points) || 0
    return sum + points
  }, 0)

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

        <section className='mt-8 rounded-3xl border border-amber-100 bg-white p-8 shadow-sm'>
          <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
            <div>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-amber-600'>
                Achievement History
              </p>
              <h2 className='mt-3 text-2xl font-bold'>My Achievements</h2>
              <p className='mt-2 max-w-2xl text-sm text-slate-600'>
                A live list of achievements assigned to your logged-in member profile.
              </p>
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <article className='rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4'>
                <p className='text-xs uppercase tracking-[0.18em] text-slate-500'>
                  Total Awards
                </p>
                <p className='mt-2 text-2xl font-bold'>{achievements.length}</p>
              </article>
              <article className='rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4'>
                <p className='text-xs uppercase tracking-[0.18em] text-slate-500'>
                  Total Points
                </p>
                <p className='mt-2 text-2xl font-bold'>{totalPoints}</p>
              </article>
            </div>
          </div>

          {achievementsError ? (
            <div className='mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
              {achievementsError}
            </div>
          ) : null}

          <div className='mt-6 overflow-hidden rounded-2xl border border-slate-200'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-200'>
                <thead className='bg-slate-50'>
                  <tr className='text-left text-xs uppercase tracking-[0.18em] text-slate-500'>
                    <th className='px-4 py-4 font-semibold'>ID</th>
                    <th className='px-4 py-4 font-semibold'>Title</th>
                    <th className='px-4 py-4 font-semibold'>Description</th>
                    <th className='px-4 py-4 font-semibold'>Points</th>
                    <th className='px-4 py-4 font-semibold'>Awarded By</th>
                  </tr>
                </thead>

                <tbody className='divide-y divide-slate-200 bg-white'>
                  {isLoadingAchievements ? (
                    <tr>
                      <td className='px-4 py-6 text-sm text-slate-500' colSpan={5}>
                        Loading achievements...
                      </td>
                    </tr>
                  ) : achievements.length > 0 ? (
                    achievements.map(achievement => (
                      <tr
                        key={achievement._id || achievement.id}
                        className='text-sm text-slate-700'
                      >
                        <td className='px-4 py-4 font-semibold text-amber-700'>
                          {achievement.id}
                        </td>
                        <td className='px-4 py-4 font-semibold text-slate-900'>
                          {achievement.title}
                        </td>
                        <td className='px-4 py-4'>
                          {achievement.description || 'No description'}
                        </td>
                        <td className='px-4 py-4'>{achievement.points ?? '--'}</td>
                        <td className='px-4 py-4'>{achievement.awardedBy ?? '--'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className='px-4 py-6 text-sm text-slate-500' colSpan={5}>
                        No achievements have been assigned to your profile yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className='mt-8 flex gap-4'>
          <Link
            className='rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
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

export default IndividualDashboard
