const AUTH_STORAGE_KEY = 'coding_workshop.auth_user'

function getApiBaseUrl() {
  const baseUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.REACT_APP_API_URL ||
    'http://localhost:3001'

  return baseUrl.replace(/\/$/, '')
}

function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toLowerCase()
}

export function isLeaderRole(role) {
  return ['leader', 'lead', 'manager', 'admin'].includes(normalizeRole(role))
}

export function getDefaultDashboardPath(user) {
  return isLeaderRole(user?.role) ? '/dashboard' : '/dashboard/individual'
}

function sanitizeUser(user) {
  if (!user || typeof user !== 'object') {
    return null
  }

  const { password, ...safeUser } = user

  return {
    ...safeUser,
    isLeader: isLeaderRole(safeUser.role),
  }
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed')
  }

  return data
}

function buildSignupPayload(formValues) {
  const name = String(formValues.name || '').trim()
  const email = String(formValues.email || '').trim()
  const password = String(formValues.password || '')
  const region = String(formValues.region || '').trim()
  const role = String(formValues.role || 'member').trim()

  if (!name) {
    throw new Error('Name is required')
  }

  if (!email) {
    throw new Error('Email is required')
  }

  if (!password) {
    throw new Error('Password is required')
  }

  if (!region) {
    throw new Error('Region is required')
  }

  return {
    name,
    email,
    password,
    region,
    role,
  }
}

export async function login({ email, password }) {
  const trimmedEmail = String(email || '').trim()
  const rawPassword = String(password || '')

  if (!trimmedEmail) {
    throw new Error('Email is required')
  }

  if (!rawPassword) {
    throw new Error('Password is required')
  }

  const response = await fetch(
    `${getApiBaseUrl()}/individuals?email=${encodeURIComponent(trimmedEmail)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  const data = await parseResponse(response)
  const individual = data.item || data.items?.[0]

  if (!individual) {
    throw new Error('No individual found for that email')
  }

  if (String(individual.password || '') !== rawPassword) {
    throw new Error('Invalid email or password')
  }

  const authenticatedUser = sanitizeUser(individual)
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser))
  return authenticatedUser
}

export async function signup(formValues) {
  const payload = buildSignupPayload(formValues)

  const response = await fetch(`${getApiBaseUrl()}/individuals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await parseResponse(response)
  const createdUser = sanitizeUser(data.individual)

  if (!createdUser) {
    throw new Error('Unable to create account')
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(createdUser))
  return createdUser
}

export function getStoredAuthUser() {
  const storedValue = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedValue) {
    return null
  }

  try {
    return sanitizeUser(JSON.parse(storedValue))
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export { AUTH_STORAGE_KEY }
