import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import LoginPage from './pages/LoginPage'
import MainDashboard from './pages/MainDashboard'
import TeamDashboard from './pages/TeamDashboard'
import IndividualDashboard from './pages/IndividualDashboard'
import './App.css'

function AppRoutes() {
  return (
    <Routes>
      <Route path='/' element={<Navigate to='/login' replace />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/dashboard' element={<MainDashboard />} />
      <Route path='/dashboard/team' element={<TeamDashboard />} />
      <Route path='/dashboard/individual' element={<IndividualDashboard />} />
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
