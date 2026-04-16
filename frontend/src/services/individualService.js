import { getServiceUrl } from './authService'

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Unable to load individuals')
  }

  return data
}

export async function getIndividuals() {
  const response = await fetch(getServiceUrl('individuals'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const data = await parseResponse(response)
  return Array.isArray(data.items) ? data.items : []
}

export async function getIndividualsByTeam(teamId) {
  const response = await fetch(
    `${getServiceUrl('individuals')}?teamId=${encodeURIComponent(teamId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  const data = await parseResponse(response)
  return {
    members: Array.isArray(data.items) ? data.items : [],
    team: data.team || null,
  }
}
