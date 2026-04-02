import { getServiceUrl } from './authService'

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Unable to load teams')
  }

  return data
}

export async function getTeams() {
  const response = await fetch(getServiceUrl('teams'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const data = await parseResponse(response)
  return Array.isArray(data.items) ? data.items : []
}

export async function getTeamById(teamId) {
  const response = await fetch(
    `${getServiceUrl('teams')}?id=${encodeURIComponent(teamId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  const data = await parseResponse(response)
  return data.item || data.items?.[0] || null
}

export async function addIndividualToTeam(teamId, individualId) {
  const response = await fetch(getServiceUrl('teams'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      action: 'add_individual',
      teamId,
      individualId,
    }),
  })

  const data = await parseResponse(response)
  return data.team || null
}

export async function removeIndividualFromTeam(teamId, individualId) {
  const response = await fetch(getServiceUrl('teams'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      action: 'remove_individual',
      teamId,
      individualId,
    }),
  })

  const data = await parseResponse(response)
  return data.team || null
}
