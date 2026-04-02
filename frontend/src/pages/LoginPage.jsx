import { useState } from 'react'
import { useNavigate } from 'react-router'
import CitiLogo from '../assets/Citi-Logo.png'
import { useAuth } from '../context/authContext'
import { getDefaultDashboardPath } from '../services/authService'

const DEFAULT_SIGNUP_VALUES = {
  name: '',
  email: '',
  password: '',
  region: 'NA',
  role: 'member',
}

function LoginPage() {
  const navigate = useNavigate()
  const { login, signup, isLoading } = useAuth()
  const [isSignupMode, setIsSignupMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupValues, setSignupValues] = useState(DEFAULT_SIGNUP_VALUES)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    try {
      const authenticatedUser = await login({ email, password })
      navigate(getDefaultDashboardPath(authenticatedUser), { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'Unable to sign in right now')
    }
  }

  async function handleSignup(event) {
    event.preventDefault()
    setErrorMessage('')

    try {
      const authenticatedUser = await signup(signupValues)
      navigate(getDefaultDashboardPath(authenticatedUser), { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'Unable to create your account right now')
    }
  }

  function updateSignupValue(field, value) {
    setSignupValues(currentValues => ({
      ...currentValues,
      [field]: value,
    }))
  }

  function toggleMode() {
    setErrorMessage('')
    setIsSignupMode(currentValue => !currentValue)
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12'>
      <section className='w-full max-w-md rounded-2xl bg-white p-8 shadow-lg shadow-slate-200'>
        <div className='flex justify-center'>
          <img src={CitiLogo} alt='Citi Logo' className='h-36 w-48' />
        </div>
        <p className='text-sm font-semibold uppercase tracking-[0.2em] text-slate-500'>
          {isSignupMode ? 'Create Account' : 'Welcome Back'}
        </p>
        <h1 className='mt-3 text-3xl font-bold text-slate-900'>
          {isSignupMode ? 'Sign Up' : 'Login Page'}
        </h1>
        <p className='mt-3 text-sm text-slate-600'>
          {isSignupMode
            ? 'Create your individual account to start using the dashboard.'
            : 'Sign in with your email and password to continue.'}
        </p>

        <form
          className='mt-8 space-y-5'
          onSubmit={isSignupMode ? handleSignup : handleSubmit}
        >
          {isSignupMode ? (
            <>
              <div>
                <label
                  className='mb-2 block text-sm font-semibold text-slate-700'
                  htmlFor='name'
                >
                  Name
                </label>
                <input
                  id='name'
                  name='name'
                  type='text'
                  value={signupValues.name}
                  onChange={event => updateSignupValue('name', event.target.value)}
                  placeholder='Jane Doe'
                  className='w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500'
                  autoComplete='name'
                />
              </div>

              <div>
                <label
                  className='mb-2 block text-sm font-semibold text-slate-700'
                  htmlFor='signup-email'
                >
                  Email
                </label>
                <input
                  id='signup-email'
                  name='email'
                  type='email'
                  value={signupValues.email}
                  onChange={event => updateSignupValue('email', event.target.value)}
                  placeholder='you@example.com'
                  className='w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500'
                  autoComplete='email'
                />
              </div>

              <div>
                <label
                  className='mb-2 block text-sm font-semibold text-slate-700'
                  htmlFor='signup-password'
                >
                  Password
                </label>
                <input
                  id='signup-password'
                  name='password'
                  type='password'
                  value={signupValues.password}
                  onChange={event => updateSignupValue('password', event.target.value)}
                  placeholder='Create a password'
                  className='w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500'
                  autoComplete='new-password'
                />
              </div>

              <div className='grid gap-5 sm:grid-cols-2'>
                <div>
                  <label
                    className='mb-2 block text-sm font-semibold text-slate-700'
                    htmlFor='region'
                  >
                    Region
                  </label>
                  <select
                    id='region'
                    name='region'
                    value={signupValues.region}
                    onChange={event => updateSignupValue('region', event.target.value)}
                    className='w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500'
                  >
                    <option value='NA'>NA</option>
                    <option value='LATAM'>LATAM</option>
                    <option value='EU'>EU</option>
                    <option value='ASIA'>ASIA</option>
                  </select>
                </div>

                <div>
                  <label
                    className='mb-2 block text-sm font-semibold text-slate-700'
                    htmlFor='role'
                  >
                    Role
                  </label>
                  <select
                    id='role'
                    name='role'
                    value={signupValues.role}
                    onChange={event => updateSignupValue('role', event.target.value)}
                    className='w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500'
                  >
                    <option value='member'>Member</option>
                    <option value='leader'>Leader</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label
                  className='mb-2 block text-sm font-semibold text-slate-700'
                  htmlFor='email'
                >
                  Email
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder='you@example.com'
                  className='w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500'
                  autoComplete='email'
                />
              </div>

              <div>
                <label
                  className='mb-2 block text-sm font-semibold text-slate-700'
                  htmlFor='password'
                >
                  Password
                </label>
                <input
                  id='password'
                  name='password'
                  type='password'
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder='Enter your password'
                  className='w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500'
                  autoComplete='current-password'
                />
              </div>
            </>
          )}

          {errorMessage ? (
            <p className='rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
              {errorMessage}
            </p>
          ) : null}

          <button
            className='w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
            type='submit'
            disabled={isLoading}
          >
            {isLoading
              ? isSignupMode
                ? 'Creating Account...'
                : 'Signing In...'
              : isSignupMode
                ? 'Create Account'
                : 'Sign In'}
          </button>
        </form>

        <div className='mt-6 border-t border-slate-200 pt-6'>
          <button
            className='block w-full text-center text-sm font-semibold text-slate-600 transition hover:text-slate-900'
            type='button'
            onClick={toggleMode}
          >
            {isSignupMode
              ? 'Already have an account? Sign in'
              : 'Need an account? Sign up'}
          </button>
          <p className='mt-3 text-center text-sm text-slate-500'>
            Your session will stay active until you log out.
          </p>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
