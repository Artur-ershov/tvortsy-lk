// Восстановление пароля — 3 шага (структура: lk3/it3-auth I3Recovery, стиль: lk3/screens-auth ScrRecovery)
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { Logo } from '../../components/Nav.jsx'
import { Field, PasswordInput } from '../../components/ui.jsx'
import { useField, vEmail, vPassword, vMatch } from '../../state/validation.js'

const fmtTimer = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const RecStep = ({ n, title, active, children }) => (
  <div style={{
    background: active ? '#fff' : 'var(--paper)',
    border: active ? '1.5px solid var(--ink)' : '1px solid rgba(91,155,201,.25)',
    borderRadius: 'var(--r-lg)', padding: 'var(--sp-8)', flex: 1,
    display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)',
    pointerEvents: active ? 'auto' : 'none',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
      <span className="jbm" style={{
        width: 28, height: 28, borderRadius: 'var(--r-xs)',
        background: active ? 'var(--ink)' : 'var(--sky)',
        color: active ? '#fff' : 'var(--ink-blue)',
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
  const emailF = useField('', vEmail)
  const p1F = useField('', vPassword)
  const p2F = useField('', v => vMatch(p1F.value)(v))
  const [left, setLeft] = useState(60)

  const ticking = step === 2 && left > 0
  useEffect(() => {
    if (!ticking) return
    const t = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [ticking])

  const emailOk = emailF.valid
  const passOk = p1F.valid && p2F.valid

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

      <div className="rule-strong" style={{ flex: 1, paddingTop: 'var(--sp-7)' }}>
        <span className="kick">Восстановление пароля</span>

        <div className="recovery-row" style={{ display: 'flex', gap: 'var(--sp-4)', marginTop: 'var(--sp-5)', alignItems: 'stretch' }}>
          <RecStep n="1" title="Укажи email" active={step === 1}>
            <Field
              label="Email аккаунта"
              type="email"
              {...emailF.bind}
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
            <div className="ff-hint">Если на этот адрес есть аккаунт, пришлём письмо со ссылкой для сброса пароля.</div>
          </RecStep>

          <RecStep n="2" title="Проверь почту" active={step === 2}>
            <p className="ff-hint" style={{ margin: 0 }}>
              Письмо отправили на <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{emailF.value.trim() || 'm.sokolova@mail.ru'}</span>. Ссылка работает 24 часа — если не успеешь, запроси новую.
            </p>
            <div style={{ height: 1, background: 'var(--line)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-3)' }}>
              {step === 2 && left === 0
                ? <button type="button" className="mlink" onClick={resend}>Отправить ещё раз</button>
                : <span className="cluster" style={{ color: 'var(--gray-2)' }}>Можно отправить ещё раз через {fmtTimer(left)}</span>}
              <button type="button" className="mlink" disabled={step !== 2} onClick={() => setStep(1)}>Изменить адрес</button>
            </div>
            <button type="button" className="mlink" disabled={step !== 2} style={{ alignSelf: 'flex-start' }} onClick={() => setStep(3)}>
              (демо) открыть ссылку из письма
            </button>
          </RecStep>

          <RecStep n="3" title="Новый пароль" active={step === 3}>
            <div>
              <span className="ff-label">Новый пароль</span>
              <PasswordInput {...p1F.bind} autoComplete="new-password" />
              {p1F.error
                ? <div className="ff-err">{p1F.error}</div>
                : <div className="ff-hint" style={{ marginTop: 'var(--sp-2)' }}>Не короче 8 символов · буквы и цифры</div>}
            </div>
            <div>
              <span className="ff-label">Повтори пароль</span>
              <PasswordInput {...p2F.bind} autoComplete="new-password" />
              {p2F.error && <div className="ff-err">{p2F.error}</div>}
            </div>
            <button
              type="button"
              className={'fbtn submit' + (passOk ? '' : ' disabled')}
              style={{ height: 54 }}
              disabled={!passOk || step !== 3}
              onClick={save}
            >Сохранить пароль и войти</button>
          </RecStep>
        </div>
      </div>
    </div>
  )
}
