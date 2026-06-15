// Восстановление пароля — единый сплит-каркас как у входа/подтверждения, по одному шагу
// (структура: lk3/it3-auth I3Recovery, стиль: lk3/screens-auth ScrLogin/ScrConfirm)
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { AuthSplit, PanelHead } from '../../components/AuthSplit.jsx'
import { Field, PasswordInput } from '../../components/ui.jsx'
import { useField, vEmail, vPassword, vMatch } from '../../state/validation.js'
import wing from '../../assets/wing.svg'

const fmtTimer = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const STEP_TITLE = { 1: 'Укажи email', 2: 'Проверь почту', 3: 'Новый пароль' }

export default function Recovery() {
  const { toast } = useStore()
  const nav = useNavigate()
  const [step, setStep] = useState(1)                 // 1 email · 2 код · 3 новый пароль
  const emailF = useField('', vEmail)
  const [code, setCode] = useState(['', '', '', ''])
  const p1F = useField('', vPassword)
  const p2F = useField('', v => vMatch(p1F.value)(v))
  const [left, setLeft] = useState(60)
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  // Таймер «отправить ещё раз» тикает только на шаге кода
  const ticking = step === 2 && left > 0
  useEffect(() => {
    if (!ticking) return
    const t = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [ticking])

  const mail = emailF.value.trim() || 'm.sokolova@mail.ru'

  // Шаг 1 → отправляем код (любые 4 цифры подойдут — это прототип)
  const sendCode = () => {
    if (!emailF.valid) return
    setStep(2)
    setLeft(60)
    setCode(['', '', '', ''])
    toast(`Код отправили на ${mail}`)
    requestAnimationFrame(() => refs[0].current?.focus())
  }
  const resend = () => {
    setLeft(60)
    toast(`Новый код отправили на ${mail}. Нет письма — загляни в «Спам»`)
  }

  // Ввод ячеек кода — как на экране подтверждения почты
  const setCell = (i, raw) => {
    const d = raw.replace(/\D/g, '').slice(-1)
    setCode(c => c.map((v, j) => (j === i ? d : v)))
    if (d && i < 3) refs[i + 1].current?.focus()
  }
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs[i - 1].current?.focus()
  }
  const codeFull = code.every(d => /^\d$/.test(d))

  // Шаг 3 → новый пароль
  const passOk = p1F.valid && p2F.valid
  const save = () => {
    if (!passOk) return
    toast('Пароль обновлён — войди с новым')
    nav('/login')
  }

  return (
    <AuthSplit
      kicker={`Восстановление · шаг ${step} из 3`}
      title={'Вернём доступ'}
      titleSize="clamp(42px, 6.5vw, 84px)"
      art={<img src={wing} alt="" style={{ width: '88%', maxWidth: 560, display: 'block' }} />}
      posterBottom={
        <div className="cluster" style={{ color: 'rgba(255,255,255,.65)', maxWidth: 480 }}>
          {step === 1 && 'Укажи почту аккаунта — пришлём короткий код для сброса пароля.'}
          {step === 2 && <>Код отправлен на <span style={{ color: '#fff' }}>{mail}</span>.</>}
          {step === 3 && 'Почти готово — задай новый пароль, и сразу войдём в кабинет.'}
        </div>
      }
    >
      <button type="button" className="mlink" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/login')}>← Ко входу</button>
      <PanelHead kicker="Восстановление пароля" title={STEP_TITLE[step]} kickerColor="var(--ink)" titleColor="var(--ink)" />

      {step === 1 && (
        <>
          <Field
            label="Email аккаунта"
            type="email"
            {...emailF.bind}
            placeholder="example@mail.ru"
            autoComplete="email"
          />
          <button
            type="button"
            className={'fbtn submit' + (emailF.valid ? '' : ' disabled')}
            disabled={!emailF.valid}
            onClick={sendCode}
          >Получить код</button>
          <div className="ff-hint">Если на этот адрес есть аккаунт, пришлём письмо с кодом. Код действует 24 часа.</div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: 'var(--fs-lg)', lineHeight: 1.4, color: 'var(--gray-2)' }}>Введи код из письма — 4 цифры</div>
          <div className="code-cells" style={{ margin: 'var(--sp-2) 0' }}>
            {code.map((v, i) => (
              <input
                key={i}
                ref={refs[i]}
                className="code-cell"
                inputMode="numeric"
                maxLength={1}
                value={v}
                autoFocus={i === 0}
                onChange={e => setCell(i, e.target.value)}
                onKeyDown={e => onKey(i, e)}
                aria-label={`Цифра ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            className={'fbtn submit' + (codeFull ? '' : ' disabled')}
            disabled={!codeFull}
            onClick={() => setStep(3)}
          >Подтвердить код</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-3)' }}>
            {left > 0
              ? <span className="cluster" style={{ color: 'var(--gray-2)' }}>Отправить ещё раз через {fmtTimer(left)}</span>
              : <button type="button" className="mlink" onClick={resend}>Отправить код ещё раз</button>}
            <button type="button" className="mlink" onClick={() => { setStep(1); setLeft(60) }}>Изменить адрес</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div>
            <span className="ff-label">Новый пароль</span>
            <PasswordInput {...p1F.bind} autoComplete="new-password" />
            {p1F.error
              ? <div className="ff-err">{p1F.error}</div>
              : <div className="ff-hint" style={{ marginTop: 'var(--sp-2)' }}>Не короче 8 символов · буквы и цифры</div>}
          </div>
          <div>
            <span className="ff-label">Повтори пароль</span>
            <PasswordInput {...p2F.bind} autoComplete="new-password" />
            {p2F.error && <div className="ff-err">{p2F.error}</div>}
          </div>
          <button
            type="button"
            className={'fbtn submit' + (passOk ? '' : ' disabled')}
            disabled={!passOk}
            onClick={save}
          >Сохранить пароль и войти</button>
        </>
      )}
    </AuthSplit>
  )
}
