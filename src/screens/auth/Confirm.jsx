// Подтверждение email — 4-значный код (структура: lk3/it3-auth I3Confirm, стиль: lk3/screens-auth ScrConfirm)
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { AuthSplit } from '../../components/AuthSplit.jsx'

const fmtTimer = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function Confirm() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const [code, setCode] = useState(['', '', '', ''])
  const [left, setLeft] = useState(60)
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  const ticking = left > 0
  useEffect(() => {
    if (!ticking) return
    const t = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [ticking])

  const setCell = (i, raw) => {
    const d = raw.replace(/\D/g, '').slice(-1)
    setCode(c => c.map((v, j) => (j === i ? d : v)))
    if (d && i < 3) refs[i + 1].current?.focus()
  }
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs[i - 1].current?.focus()
  }

  const full = code.every(d => /^\d$/.test(d))
  const submit = () => {
    if (!full) return
    dispatch({ type: 'confirm-email' })
    nav('/onboarding')
  }
  const resend = () => {
    setLeft(60)
    toast('Код отправлен повторно')
  }

  return (
    <AuthSplit
      kicker="Регистрация · шаг 1 из 2 · подтверждение"
      title={'Прове­рьте почту'}
      titleSize="clamp(42px, 6.5vw, 84px)"
      posterBottom={
        <div className="cluster" style={{ color: 'rgba(255,255,255,.65)', maxWidth: 480 }}>
          Код отправлен на <span style={{ color: '#fff' }}>{state.email}</span>. В письме есть и кнопка-ссылка — подтверждает адрес без ввода кода.
        </div>
      }
    >
      <div>
        <span className="kick">Подтверждение email</span>
        <div style={{ fontSize: 20, lineHeight: 1.4, marginTop: 14, color: 'var(--gray-2)' }}>Введи 4-значный код из письма</div>
      </div>

      <div className="code-cells" style={{ margin: '8px 0' }}>
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
        className={'fbtn submit' + (full ? '' : ' disabled')}
        disabled={!full}
        onClick={submit}
      >Подтвердить</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {left > 0
          ? <span className="cluster" style={{ color: 'var(--gray-2)' }}>Отправить ещё раз — через {fmtTimer(left)}</span>
          : <button type="button" className="mlink" onClick={resend}>Отправить ещё раз</button>}
        <button
          type="button"
          className="mlink"
          onClick={() => { dispatch({ type: 'change-email' }); nav('/register') }}
        >Изменить адрес</button>
      </div>

      <div style={{ height: 1, background: 'var(--line)' }}></div>
      <div className="ff-hint">В письме есть и кнопка-ссылка — она подтверждает адрес без ввода кода.</div>
    </AuthSplit>
  )
}
