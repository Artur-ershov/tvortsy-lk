import React from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './state/store.jsx'
import { DemoPanel } from './components/DemoPanel.jsx'

import Register from './screens/auth/Register.jsx'
import Confirm from './screens/auth/Confirm.jsx'
import Onboarding from './screens/auth/Onboarding.jsx'
import Wall from './screens/auth/Wall.jsx'
import Login from './screens/auth/Login.jsx'
import Recovery from './screens/auth/Recovery.jsx'
import Cabinet from './screens/cabinet/Cabinet.jsx'
import Profile from './screens/cabinet/Profile.jsx'
import Success from './screens/cabinet/Success.jsx'
import ApplyForm from './screens/form/ApplyForm.jsx'

// Куда ведёт стартовый «/» в зависимости от стадии аккаунта (статусная модель из handoff)
const HOME = {
  guest: '/login',
  registered: '/confirm',
  confirmed: '/onboarding',
  'minor-wall': '/wall',
  active: '/cabinet',
}

const Index = () => {
  const { state } = useStore()
  return <Navigate to={HOME[state.stage] || '/login'} replace />
}

// Стена 14–17 и неактивные стадии не пускают в кабинет
const RequireActive = ({ children }) => {
  const { state } = useStore()
  if (state.stage === 'active') return children
  return <Navigate to={HOME[state.stage] || '/login'} replace />
}

const ScrollTop = () => {
  const { pathname } = useLocation()
  React.useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/wall" element={<Wall />} />
          <Route path="/login" element={<Login />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/cabinet" element={<RequireActive><Cabinet /></RequireActive>} />
          <Route path="/profile" element={<RequireActive><Profile /></RequireActive>} />
          <Route path="/apply/:id" element={<RequireActive><ApplyForm /></RequireActive>} />
          <Route path="/success/:id" element={<RequireActive><Success /></RequireActive>} />
          <Route path="*" element={<Index />} />
        </Routes>
        <DemoPanel />
      </HashRouter>
    </StoreProvider>
  )
}
