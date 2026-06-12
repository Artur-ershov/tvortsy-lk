// Хедер кабинета (FgNav из fig-shared) + мобильные нижние табы (структура it3-mobile)
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore, initialsOf } from '../state/store.jsx'

export const Logo = ({ dark = false, style }) => (
  <div className="logo" style={{ color: dark ? '#fff' : 'var(--ink)', ...style }}>Творцы<br />будущего</div>
)

export const Nav = ({ tab = 'apps' }) => {
  const { state } = useStore()
  const nav = useNavigate()
  return (
    <div className="fnav">
      <button onClick={() => nav('/cabinet')} style={{ textAlign: 'left' }}><Logo /></button>
      <div className="links">
        <a className={tab === 'apps' ? 'on' : ''} onClick={() => nav('/cabinet')}>Заявки</a>
        <a className={tab === 'profile' ? 'on' : ''} onClick={() => nav('/profile')}>Профиль</a>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span className="jbm nav-mail" style={{ fontSize: 13, letterSpacing: '.04em', opacity: .7 }}>{state.email}</span>
        <button
          onClick={() => nav('/profile')}
          style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--sky)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#23425A' }}
          aria-label="Профиль"
        >{initialsOf(state.profile.fio) || '·'}</button>
      </div>
    </div>
  )
}

export const BottomTabs = () => {
  const nav = useNavigate()
  const loc = useLocation()
  const tab = loc.pathname.startsWith('/profile') ? 'profile' : 'apps'
  return (
    <div className="btabs">
      <button className={'btab' + (tab === 'apps' ? ' on' : '')} onClick={() => nav('/cabinet')}>
        {tab === 'apps' && <div className="bt-line"></div>}
        <span>Заявки</span>
      </button>
      <button className={'btab' + (tab === 'profile' ? ' on' : '')} onClick={() => nav('/profile')}>
        {tab === 'profile' && <div className="bt-line"></div>}
        <span>Профиль</span>
      </button>
    </div>
  )
}
