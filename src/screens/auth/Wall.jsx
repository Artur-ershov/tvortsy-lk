// Стена 14–17 — согласие представителя (структура: lk3/it3-auth I3Minor14Wall, стиль: fig)
// Пока без сканов и Госуслуг: согласие оформляем вручную через фонд (правка Артура).
import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { Logo } from '../../components/Nav.jsx'

// Контакты фонда — плейсхолдеры, в проде подставит реальные адреса
const FUND = { email: 'lk@tvortsy.online', tg: 'tvortsy_lk' }

const MailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)
const TgIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.2 5.1 2.6 12.3c-.7.3-.7 1.2.1 1.4l4.6 1.4 1.8 5.1c.2.5.8.6 1.2.2l2.5-2.5 4.4 3.2c.5.4 1.3.1 1.4-.6l3-13.6c.2-.7-.5-1.3-1.4-.8z" />
    <path d="m7.3 14.9 9.3-6.4-7.1 7.1" />
  </svg>
)

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
)

const ContactRow = ({ icon, label, value, href }) => (
  <a className="contact-row" href={href} target="_blank" rel="noreferrer">
    <span className="contact-ic">{icon}</span>
    <span className="contact-tx">
      <span className="contact-lab">{label}</span>
      <span className="contact-val">{value}</span>
    </span>
    <svg className="contact-go" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  </a>
)

export default function Wall() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()

  // согласие принято (модератор) → минор дозаполняет анкету; дальше кабинет/приглашение
  if (state.stage === 'confirmed') return <Navigate to="/onboarding" replace />
  if (state.stage === 'active') return <Navigate to={state.pendingInvite ? '/join/' + state.pendingInvite : '/cabinet'} replace />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--w)', padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column' }}>
      <div className="auth-top">
        <Logo />
        <button type="button" className="mlink" onClick={() => { dispatch({ type: 'logout' }); nav('/login') }}>Выйти</button>
      </div>

      <div style={{ maxWidth: 620, width: '100%', margin: '0 auto', paddingBottom: 60 }}>
        <div style={{ textAlign: 'center', marginTop: 'var(--sp-7)' }}>
          <span className="kick">Кабинет участника</span>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1.05, margin: 0, marginTop: 'var(--sp-3)' }}>Согласие представителя</h1>
        </div>

        <div className="wall-card" style={{ marginTop: 'var(--sp-8)' }}>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, letterSpacing: '-.015em' }}>
            По закону для участников младше 18 нужно согласие родителя или опекуна
          </div>
          <p className="ff-hint" style={{ margin: 'var(--sp-2) 0 var(--sp-6)' }}>
            Пока согласия оформляем вручную. Напиши нам: подскажем, какие документы
            нужны от родителя или опекуна, и поможем всё оформить.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <ContactRow icon={<MailIcon />} label="Почта фонда" value={FUND.email} href={'mailto:' + FUND.email} />
            <ContactRow icon={<TgIcon />} label="Telegram" value={'@' + FUND.tg} href={'https://t.me/' + FUND.tg} />
          </div>

          <div className="contact-hours">
            <ClockIcon />
            <span>Будни 10:00–19:00 (МСК) · отвечаем в течение рабочего дня</span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--sp-5)' }}>
            <span className="mtag wait">Что указать</span>
            <span className="ff-hint">Имя участника и почту аккаунта ({state.email || 'твой email'}) — так быстрее найдём заявку.</span>
          </div>
        </div>

        <div className="locked-banner" style={{ marginTop: 'var(--sp-5)' }}>
          <span style={{ fontSize: 'var(--fs-base)', color: 'var(--ink-blue)', fontWeight: 500 }}>Кабинет в режиме ожидания</span>
          <p className="ff-hint" style={{ margin: 'var(--sp-1) 0 0' }}>
            Подача заявок откроется, как только оформим согласие вместе с фондом.
          </p>
        </div>
      </div>
    </div>
  )
}
