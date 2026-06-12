// Хедер кабинета (FgNav из fig-shared)
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, initialsOf } from '../state/store.jsx'

// Имя без канцелярита: «Мария», не «Соколова М.А.» (в fio порядок Фамилия Имя Отчество)
const firstNameOf = fio => (fio || '').trim().split(/\s+/)[1] || (fio || '').trim()

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
      <button onClick={() => nav('/cabinet')} style={{ textAlign: 'left' }} aria-label="К заявкам"><Logo /></button>
      <div ref={menuRef} className="umenu">
        <button
          className="umenu-trigger"
          onClick={() => setOpen(o => !o)}
          aria-label="Меню профиля"
          aria-expanded={open}
        >
          <span className="umenu-ava">{initialsOf(state.profile.fio) || '·'}</span>
          <span className="umenu-name">{firstNameOf(state.profile.fio) || 'Профиль'}</span>
        </button>
        {open && (
          <div className="umenu-drop">
            <div className="umenu-head">
              <div className="umenu-head-name">{state.profile.fio}</div>
              <div className="umenu-head-mail jbm">{state.email}</div>
            </div>
            <div className="umenu-sep" />
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

