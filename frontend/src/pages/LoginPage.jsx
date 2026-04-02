import { Link } from 'react-router'
import CitiLogo from '../assets/Citi-Logo.png'
import { useAuth } from '../context/authContext'
import { toast } from 'react-hot-toast'
function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()

  const handleSignIn = () => { 
    
      try {
        // Simulate successful login
        login({ email, password })
        toast.success('Logged in successfully')
      } catch (error) {
        toast.error('Failed to login')
      }
  }
  return (
    <main className='flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12'>
      <section className='w-full max-w-md rounded-2xl bg-white p-8 shadow-lg shadow-slate-200'>
        <div className='flex justify-center'>
          <img src={CitiLogo} alt='Citi Logo' className='h-36 w-48' />
        </div>
        <p className='text-sm font-semibold uppercase tracking-[0.2em] text-slate-500'>
          Welcome Back
        </p>
        <h1 className='mt-3 text-3xl font-bold text-slate-900'>Login Page</h1>
        <p className='mt-3 text-sm text-slate-600'>
          Sign in with your email and password to continue.
        </p>

        <form className='mt-8 space-y-5'>
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
              placeholder='you@example.com'
              className='w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500'
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
              placeholder='Enter your password'
              className='w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500'
            />
          </div>

          <button
            onClick={handleSignIn}
            className='w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
            type='submit'
          >
            Sign In
          </button>
        </form>

        <div className='mt-6 border-t border-slate-200 pt-6'>
          <Link
            className='block text-center text-sm font-semibold text-slate-600 transition hover:text-slate-900'
            to='/dashboard'
          >
            Continue to Main Dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
