// Вход — сплит с постером «С возвращением» (структура: lk3/it3-auth I3Login, стиль: lk3/screens-auth ScrLogin)
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { AuthSplit, PanelHead } from '../../components/AuthSplit.jsx'
import { Field, PasswordInput, SocialRow, OrRow } from '../../components/ui.jsx'
import { useField, vEmail } from '../../state/validation.js'
import g559 from '../../assets/group559.png'

export default function Login() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const emailF = useField('', vEmail)
  const [pass, setPass] = useState('')
  const [err, setErr] = useState(false)

  const submit = () => {
    const e = emailF.value.trim()
    const known = e === 'm.sokolova@mail.ru' || (state.email && e === state.email)
    if (known && pass) {
      dispatch({ type: 'login', email: e })
      // редьюсер 'login' сохраняет незавершённые стадии — навигируем по стадии до dispatch
      nav(state.stage === 'registered' ? '/confirm'
        : state.stage === 'confirmed' ? '/onboarding'
        : state.stage === 'minor-wall' ? '/wall'
        : state.pendingInvite ? '/join/' + state.pendingInvite
        : '/cabinet')
    } else {
      setErr(true)
    }
  }

  return (
    <AuthSplit
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <span className="cluster">Первый раз?</span>
          <button type="button" className="fbtn sm line" onClick={() => nav('/register')}>Зарегистрироваться</button>
        </div>
      }
      kicker="Творцы РФ · 2026"
      title={'С возвращением'}
      titleSize="clamp(44px, 7vw, 92px)"
      art={<img src={g559} alt="" style={{ width: '88%', maxWidth: 560, display: 'block' }} />}
      posterBottom={
        <div className="poster-pairs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)', borderTop: '1px solid rgba(255,255,255,.18)', paddingTop: 'var(--sp-6)' }}>
          {[
            ['Статус заявки', 'виден в кабинете, об изменениях напишем на e-mail'],
            ['Черновики', 'сохраняются сами — заполняй частями, когда удобно'],
          ].map(([n, t]) => (
            <div key={n}>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 500, color: '#fff' }}>{n}</div>
              <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.45, color: 'rgba(255,255,255,.6)', marginTop: 'var(--sp-1)' }}>{t}</div>
            </div>
          ))}
        </div>
      }
    >
      <PanelHead kicker="Вход" title="Войти в кабинет" kickerColor="var(--ink)" titleColor="var(--ink)" />

      <Field
        label="Email"
        type="email"
        {...emailF.bind}
        onChange={v => { emailF.setValue(v); setErr(false) }}
        placeholder="m.sokolova@mail.ru"
        autoComplete="email"
        error={emailF.error || (err ? 'Не удалось войти. Проверь e-mail и пароль или восстанови доступ' : null)}
      />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-2)' }}>
          <span className="ff-label" style={{ margin: 0 }}>Пароль</span>
          <button type="button" className="mlink" onClick={() => nav('/recovery')}>Забыли пароль?</button>
        </div>
        <PasswordInput
          value={pass}
          onChange={v => { setPass(v); setErr(false) }}
          error={err}
          autoComplete="current-password"
        />
      </div>

      <button type="button" className="fbtn submit" style={{ marginTop: 'var(--sp-1)' }} onClick={submit}>Войти</button>

      <OrRow>или</OrRow>
      <SocialRow onClick={() => toast('Демо: быстрый вход недоступен в прототипе')} />

      <div style={{ height: 1, background: 'var(--line)' }}></div>
      <div style={{ textAlign: 'center', fontSize: 'var(--fs-base)' }}>
        Нет аккаунта?{' '}
        <a
          style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
          onClick={() => nav('/register')}
        >Зарегистрироваться</a>
      </div>
    </AuthSplit>
  )
}
