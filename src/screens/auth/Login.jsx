// Вход — сплит с постером «С возвращением» (структура: lk3/it3-auth I3Login, стиль: lk3/screens-auth ScrLogin)
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { AuthSplit, PanelHead } from '../../components/AuthSplit.jsx'
import { Field, PasswordInput, SocialRow, OrRow } from '../../components/ui.jsx'

export default function Login() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState(false)

  const submit = () => {
    const e = email.trim()
    const known = e === 'm.sokolova@mail.ru' || (state.email && e === state.email)
    if (known && pass) {
      dispatch({ type: 'login', email: e })
      // редьюсер 'login' сохраняет незавершённые стадии — навигируем по стадии до dispatch
      nav(state.stage === 'registered' ? '/confirm'
        : state.stage === 'confirmed' ? '/onboarding'
        : state.stage === 'minor-wall' ? '/wall'
        : '/cabinet')
    } else {
      setErr(true)
    }
  }

  return (
    <AuthSplit
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span className="cluster">Первый раз?</span>
          <button type="button" className="fbtn sm line" onClick={() => nav('/register')}>Зарегистрироваться</button>
        </div>
      }
      kicker="Кабинет участника · 2026"
      title={'С возвра­щением'}
      titleSize="clamp(44px, 7vw, 92px)"
      posterBottom={
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, borderTop: '1px solid rgba(255,255,255,.18)', paddingTop: 26 }}>
          {[
            ['Статус заявки', 'виден в кабинете, изменения — на email'],
            ['Черновики', 'сохраняются, можно заполнять в несколько подходов'],
          ].map(([n, t]) => (
            <div key={n}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#fff' }}>{n}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.45, color: 'rgba(255,255,255,.6)', marginTop: 6 }}>{t}</div>
            </div>
          ))}
        </div>
      }
    >
      <PanelHead kicker="Вход" title="Войти в кабинет" kickerColor="var(--ink)" titleColor="var(--ink)" />

      <Field
        label="Email"
        type="email"
        value={email}
        onChange={v => { setEmail(v); setErr(false) }}
        placeholder="m.sokolova@mail.ru"
        autoComplete="email"
        error={err ? 'Неверный email или пароль' : null}
      />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
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

      <button type="button" className="fbtn submit" style={{ marginTop: 4 }} onClick={submit}>Войти</button>

      <OrRow>или</OrRow>
      <SocialRow onClick={() => toast('Демо: быстрый вход недоступен в прототипе')} />

      <div style={{ height: 1, background: 'var(--line)' }}></div>
      <div style={{ textAlign: 'center', fontSize: 15.5 }}>
        Нет аккаунта?{' '}
        <a
          style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
          onClick={() => nav('/register')}
        >Зарегистрироваться</a>
      </div>
      <div className="cluster" style={{ color: 'var(--gray-2)', textAlign: 'center' }}>демо: m.sokolova@mail.ru · пароль любой</div>
    </AuthSplit>
  )
}
