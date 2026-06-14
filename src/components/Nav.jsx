// Хедер кабинета (FgNav из fig-shared)
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, initialsOf, fullName } from '../state/store.jsx'

export const Logo = ({ dark = false, style }) => (
  <div className="logo" style={{ color: dark ? '#fff' : 'var(--ink)', ...style }}>Творцы<br />РФ 2026</div>
)

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" />
  </svg>
)

const IconDoc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h5" />
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
      <button onClick={() => nav('/cabinet')} style={{ textAlign: 'left' }} aria-label="На главную"><Logo /></button>
      <div ref={menuRef} className="umenu">
        <button
          className="umenu-trigger"
          onClick={() => setOpen(o => !o)}
          aria-label="Меню профиля"
          aria-expanded={open}
        >
          <span className="umenu-ava">{initialsOf(fullName(state.profile)) || '·'}</span>
          <span className="umenu-name">{state.profile.firstName || 'Профиль'}</span>
        </button>
        {open && (
          <div className="umenu-drop">
            <div className="umenu-head">
              <div className="umenu-head-name">{fullName(state.profile)}</div>
              <div className="umenu-head-mail jbm">{state.email}</div>
            </div>
            <div className="umenu-sep" />
            <button className={'umenu-item' + (tab === 'apps' ? ' on' : '')} onClick={() => { setOpen(false); nav('/cabinet') }}>
              <IconDoc />Мои заявки
            </button>
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

