import { getServiceUrl } from './authService'

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Unable to load achievements')
  }

  return data
}

export async function getAchievementsByIndividual(individualId) {
  const response = await fetch(
    `${getServiceUrl('achievements')}?individualId=${encodeURIComponent(individualId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  const data = await parseResponse(response)
  return Array.isArray(data.items) ? data.items : []
}

export async function createAchievement({
  title,
  description,
  points,
  ownerId,
  awardedBy,
}) {
  const response = await fetch(getServiceUrl('achievements'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      title,
      description,
      points,
      ownerType: 'Individual',
      ownerId,
      awardedBy,
    }),
  })

  const data = await parseResponse(response)
  return data.achievement || null
}
