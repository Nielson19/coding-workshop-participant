import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import LoginPage from './pages/LoginPage'
import MainDashboard from './pages/MainDashboard'
import MemberDashboard from './pages/MemberDashboard'
import IndividualDashboard from './pages/IndividualDashboard'
import TeamMembersPage from './pages/TeamMembersPage'
import { useAuth } from './context/authContext'
import './App.css'

function AuthGate({ children, requiresAuth }) {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12'>
        <div className='rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-600 shadow-sm'>
          Loading session...
        </div>
      </main>
    )
  }

  if (requiresAuth && !isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  if (!requiresAuth && isAuthenticated) {
    return <Navigate to='/dashboard' replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path='/' element={<Navigate to='/login' replace />} />
      <Route
        path='/login'
        element={
          <AuthGate requiresAuth={false}>
            <LoginPage />
          </AuthGate>
        }
      />
      <Route
        path='/dashboard'
        element={
          <AuthGate requiresAuth>
            <MainDashboard />
          </AuthGate>
        }
      />
      <Route
        path='/dashboard/member'
        element={
          <AuthGate requiresAuth>
            <MemberDashboard />
          </AuthGate>
        }
      />
      <Route path='/dashboard/team' element={<Navigate to='/dashboard/member' replace />} />
      <Route
        path='/dashboard/team/:teamId'
        element={
          <AuthGate requiresAuth>
            <TeamMembersPage />
          </AuthGate>
        }
      />
      <Route
        path='/dashboard/individual'
        element={
          <AuthGate requiresAuth>
            <IndividualDashboard />
          </AuthGate>
        }
      />
      <Route path='*' element={<Navigate to='/login' replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
