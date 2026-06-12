// Хедер кабинета (FgNav из fig-shared) + мобильные нижние табы (структура it3-mobile)
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore, initialsOf } from '../state/store.jsx'

export const Logo = ({ dark = false, style }) => (
  <div className="logo" style={{ color: dark ? '#fff' : 'var(--ink)', ...style }}>Творцы<br />будущего</div>
)

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" />
  </svg>
)

const IconExit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
)

export const Nav = ({ tab = 'apps' }) => {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false) }
    const esc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <div className="fnav">
      <button onClick={() => nav('/cabinet')} style={{ textAlign: 'left' }}><Logo /></button>
      <div className="links">
        <a className={tab === 'apps' ? 'on' : ''} onClick={() => nav('/cabinet')}>Заявки</a>
      </div>
      <div ref={menuRef} className="umenu" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span className="jbm nav-mail" style={{ fontSize: 13, letterSpacing: '.04em', opacity: .7 }}>{state.email}</span>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--sky)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#23425A' }}
          aria-label="Меню профиля"
          aria-expanded={open}
        >{initialsOf(state.profile.fio) || '·'}</button>
        {open && (
          <div className="umenu-drop">
            <button className={'umenu-item' + (tab === 'profile' ? ' on' : '')} onClick={() => { setOpen(false); nav('/profile') }}>
              <IconUser />Мой профиль
            </button>
            <div className="umenu-sep" />
            <button className="umenu-item danger" onClick={() => { setOpen(false); dispatch({ type: 'logout' }); nav('/login') }}>
              <IconExit />Выйти
            </button>
          </div>
        )}
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
