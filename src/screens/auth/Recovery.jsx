// Восстановление пароля — 3 шага (структура: lk3/it3-auth I3Recovery, стиль: lk3/screens-auth ScrRecovery)
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { Logo } from '../../components/Nav.jsx'
import { Field, PasswordInput } from '../../components/ui.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const fmtTimer = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const RecStep = ({ n, title, active, children }) => (
  <div style={{
    background: '#fff',
    border: active ? '1.5px solid var(--ink)' : '1px solid rgba(0,0,0,.12)',
    borderRadius: 24, padding: 32, flex: 1,
    display: 'flex', flexDirection: 'column', gap: 16,
    opacity: active ? 1 : .55,
    pointerEvents: active ? 'auto' : 'none',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className="jbm" style={{
        width: 28, height: 28, borderRadius: 8,
        background: active ? 'var(--ink)' : 'var(--paper)',
        color: active ? '#fff' : 'var(--gray-2)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 600,
      }}>{n}</span>
      <span className="kick" style={{ fontSize: 13.5 }}>шаг {n} из 3</span>
    </div>
    <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.015em' }}>{title}</div>
    {children}
  </div>
)

export default function Recovery() {
  const { toast } = useStore()
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [left, setLeft] = useState(60)

  const ticking = step === 2 && left > 0
  useEffect(() => {
    if (!ticking) return
    const t = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [ticking])

  const emailOk = EMAIL_RE.test(email.trim())
  const passChars = /[A-Za-zА-Яа-яЁё]/.test(p1) && /\d/.test(p1)
  const passOk = p1.length >= 8 && passChars && p1 === p2

  const sendLink = () => {
    if (!emailOk) return
    setStep(2)
    setLeft(60)
    toast('Письмо отправлено')
  }
  const resend = () => {
    setLeft(60)
    toast('Письмо отправлено')
  }
  const save = () => {
    if (!passOk) return
    toast('Пароль обновлён')
    nav('/login')
  }

  return (
    <div className="auth-shell">
      <div className="auth-top">
        <Logo />
        <button type="button" className="mlink" onClick={() => nav('/login')}>← Вернуться ко входу</button>
      </div>

      <div className="rule-strong" style={{ flex: 1, paddingTop: 28 }}>
        <span className="kick">Восстановление пароля</span>

        <div className="recovery-row" style={{ display: 'flex', gap: 16, marginTop: 22, alignItems: 'stretch' }}>
          <RecStep n="1" title="Укажи email" active={step === 1}>
            <Field
              label="Email аккаунта"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="m.sokolova@mail.ru"
              autoComplete="email"
              disabled={step !== 1}
            />
            <button
              type="button"
              className={'fbtn submit' + (emailOk ? '' : ' disabled')}
              style={{ height: 54 }}
              disabled={!emailOk || step !== 1}
              onClick={sendLink}
            >Отправить ссылку</button>
            <div className="ff-hint">Если адрес есть в системе, придёт письмо со ссылкой на сброс пароля.</div>
          </RecStep>

          <RecStep n="2" title="Проверь почту" active={step === 2}>
            <p className="ff-hint" style={{ margin: 0 }}>
              Письмо отправлено на <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{email.trim() || 'm.sokolova@mail.ru'}</span>. Ссылка действует 24 часа.
            </p>
            <div style={{ height: 1, background: 'var(--line)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              {step === 2 && left === 0
                ? <button type="button" className="mlink" onClick={resend}>Отправить ещё раз</button>
                : <span className="cluster" style={{ color: 'var(--gray-2)' }}>Отправить ещё раз — через {fmtTimer(left)}</span>}
              <button type="button" className="mlink" disabled={step !== 2} onClick={() => setStep(1)}>Изменить адрес</button>
            </div>
            <button type="button" className="mlink" disabled={step !== 2} style={{ alignSelf: 'flex-start' }} onClick={() => setStep(3)}>
              (демо) открыть ссылку из письма
            </button>
          </RecStep>

          <RecStep n="3" title="Новый пароль" active={step === 3}>
            <div>
              <span className="ff-label">Новый пароль</span>
              <PasswordInput value={p1} onChange={setP1} autoComplete="new-password" />
            </div>
            <div>
              <span className="ff-label">Повтори пароль</span>
              <PasswordInput value={p2} onChange={setP2} autoComplete="new-password" />
            </div>
            {p1.length >= 8 && !passChars
              ? <div className="ff-err">нужны и буквы, и цифры</div>
              : <div className="ff-hint">не короче 8 символов · буквы и цифры</div>}
            <button
              type="button"
              className={'fbtn submit' + (passOk ? '' : ' disabled')}
              style={{ height: 54 }}
              disabled={!passOk || step !== 3}
              onClick={save}
            >Сохранить и войти</button>
          </RecStep>
        </div>
      </div>
    </div>
  )
}
