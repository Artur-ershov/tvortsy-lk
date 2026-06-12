// Регистрация — шаг 1 из 2 (структура: lk3/it3-auth I3Reg, стиль: lk3/screens-reg v3)
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { AuthSplit, PanelHead } from '../../components/AuthSplit.jsx'
import { Field, PasswordInput, Check, SocialRow, OrRow } from '../../components/ui.jsx'
import g559 from '../../assets/group559.png'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
  const { dispatch, toast } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [agree, setAgree] = useState(false)

  const passChars = /[A-Za-zА-Яа-яЁё]/.test(pass) && /\d/.test(pass)
  const passOk = pass.length >= 8 && passChars
  const ok = EMAIL_RE.test(email.trim()) && passOk && agree

  const submit = () => {
    if (!ok) return
    dispatch({ type: 'register', email: email.trim() })
    nav('/confirm')
  }

  return (
    <AuthSplit
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span className="cluster">Уже с нами?</span>
          <button type="button" className="fbtn sm line" onClick={() => nav('/login')}>Войти</button>
        </div>
      }
      kicker="Путь участника · 2026"
      title="Сделай работу, которую увидят"
      titleSize="clamp(44px, 7vw, 92px)"
      lede="Пришли готовую работу или собери проект с соавторами. Пять направлений, грант на продакшн, финал в Москве."
      art={<img src={g559} alt="" style={{ width: '88%', maxWidth: 560, display: 'block' }} />}
      stats={[
        ['5', 'направлений · аудио, визуал, танец, медиа, синтез'],
        ['14—35', 'возраст · РФ и иностранные студенты в России'],
        ['до 1 июня', 'приём заявок · финал — ноябрь, Москва'],
      ]}
    >
      <PanelHead
        kicker="Регистрация · шаг 1 из 2"
        title="Создать аккаунт"
        hint="Аккаунт открывает личный кабинет: подача заявки, файлы работы и статус по этапам. Анкета участника — позже, на этапе заявки."
      />

      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="m.sokolova@mail.ru" autoComplete="email" />

      <div>
        <span className="ff-label">Пароль</span>
        <PasswordInput value={pass} onChange={setPass} autoComplete="new-password" />
        {pass.length >= 8 && !passChars
          ? <span className="ff-err" style={{ display: 'block', marginTop: 8 }}>нужны и буквы, и цифры</span>
          : <span className="ff-hint" style={{ display: 'block', marginTop: 8 }}>не короче 8 символов · буквы и цифры</span>}
      </div>

      <Check on={agree} onChange={setAgree} style={{ marginTop: 2 }}>
        Согласен на обработку персональных данных —{' '}
        <a onClick={e => { e.stopPropagation(); toast('Демо: документ откроется в проде') }}>политика обработки</a>
      </Check>

      <button
        type="button"
        className={'fbtn submit' + (ok ? '' : ' disabled')}
        disabled={!ok}
        onClick={submit}
      >Создать аккаунт</button>
      <div className="ff-hint" style={{ textAlign: 'center', marginTop: -6 }}>далее отправим код подтверждения на email</div>

      <OrRow color="#23425A">или войти быстрее</OrRow>
      <SocialRow onClick={() => toast('Демо: быстрый вход недоступен в прототипе')} />

      <div style={{ height: 1, background: 'var(--line)', marginTop: 2 }}></div>
      <div style={{ textAlign: 'center', fontSize: 15.5, color: '#23425A' }}>
        Уже есть аккаунт?{' '}
        <a
          style={{ fontWeight: 600, color: '#0C1F2B', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
          onClick={() => nav('/login')}
        >Войти</a>
      </div>
    </AuthSplit>
  )
}
