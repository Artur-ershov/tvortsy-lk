// Регистрация — шаг 1 из 2 (структура: lk3/it3-auth I3Reg, стиль: lk3/screens-reg v3)
import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, dobVerdict } from '../../state/store.jsx'
import { AuthSplit, PanelHead } from '../../components/AuthSplit.jsx'
import { Field, PasswordInput, Check, SocialRow, OrRow } from '../../components/ui.jsx'
import { useField, revealInvalid, vEmail, vPassword, vDob, maskDob } from '../../state/validation.js'
import g559 from '../../assets/group559.png'

export default function Register() {
  const { dispatch, toast } = useStore()
  const nav = useNavigate()
  const formRef = useRef(null)
  const emailF = useField('', vEmail)
  const passF = useField('', vPassword)
  const dobF = useField('', vDob, { mask: maskDob })
  const [agree, setAgree] = useState(false)
  const [agreeErr, setAgreeErr] = useState(false)
  const verdict = dobVerdict(dobF.value)

  const submit = () => {
    if (!emailF.valid || !passF.valid || !dobF.valid) { revealInvalid([emailF, passF, dobF], formRef.current); return }
    if (!agree) { setAgreeErr(true); return }
    dispatch({ type: 'register', email: emailF.value.trim(), dob: dobF.value.trim() })
    nav('/confirm')
  }

  return (
    <AuthSplit
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <span className="cluster">Уже с нами?</span>
          <button type="button" className="fbtn sm line" onClick={() => nav('/login')}>Войти</button>
        </div>
      }
      kicker="Творцы РФ · 2026"
      title="Сделай работу, которую увидят"
      titleSize="clamp(44px, 7vw, 92px)"
      lede="Пришли готовую работу или собери проект с соавторами. Пять направлений, грант на продакшн, финал в ноябре в Москве."
      art={<img src={g559} alt="" style={{ width: '88%', maxWidth: 560, display: 'block' }} />}
      stats={[
        ['5', 'направлений · аудио, визуал, танец, медиа, синтез'],
        ['14–35', 'возраст · РФ и иностранные студенты в России'],
        ['ноябрь', 'финал в Москве · приём заявок открыт'],
      ]}
    >
      <PanelHead
        kicker="Регистрация · шаг 1 из 2"
        title="Создать аккаунт"
        hint="В личном кабинете ты подашь заявку, загрузишь работу и увидишь статус на каждом этапе. Анкету заполнишь позже — когда будешь подавать заявку."
      />

      <div ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
        <Field label="Email" type="email" {...emailF.bind} placeholder="m.sokolova@mail.ru" autoComplete="email" />

        <div>
          <span className="ff-label">Пароль</span>
          <PasswordInput {...passF.bind} autoComplete="new-password" />
          {passF.error
            ? <span className="ff-err" style={{ display: 'block', marginTop: 'var(--sp-2)' }}>{passF.error}</span>
            : <span className="ff-hint" style={{ display: 'block', marginTop: 'var(--sp-2)' }}>Минимум 8 символов, хотя бы одна буква и одна цифра</span>}
        </div>

        <Field label="Дата рождения" {...dobF.bind} placeholder="ДД.ММ.ГГГГ" hint="от 14 до 35 лет на момент подачи" />
      </div>

      {verdict === 'minor' && (
        <div className="locked-banner">
          <span style={{ fontSize: 15, color: 'var(--ink-blue)', fontWeight: 500 }}>Понадобится согласие родителя</span>
          <p className="ff-hint" style={{ margin: 'var(--sp-1) 0 0' }}>
            Тебе ещё нет 18 лет — по закону для участия нужно согласие родителя или опекуна. Аккаунт создадим сейчас, а согласие поможем оформить позже.
          </p>
        </div>
      )}

      <div>
        <Check on={agree} onChange={v => { setAgree(v); setAgreeErr(false) }} style={{ marginTop: 2 }}>
          Согласен на обработку персональных данных —{' '}
          <a onClick={e => { e.stopPropagation(); toast('Демо: документ откроется в проде') }}>политика обработки</a>
        </Check>
        {agreeErr && <span className="ff-err" style={{ display: 'block', marginTop: 'var(--sp-2)' }}>Поставь галочку — без согласия на обработку данных не зарегистрировать</span>}
      </div>

      <button
        type="button"
        className="fbtn submit"
        onClick={submit}
      >Создать аккаунт</button>
      <div className="ff-hint" style={{ textAlign: 'center', marginTop: -6 }}>Дальше пришлём код подтверждения на почту</div>

      <OrRow color="var(--ink-blue)">или войти быстрее</OrRow>
      <SocialRow onClick={() => toast('Демо: быстрый вход недоступен в прототипе')} />

      <div style={{ height: 1, background: 'var(--line)', marginTop: 2 }}></div>
      <div style={{ textAlign: 'center', fontSize: 15.5, color: 'var(--ink-blue)' }}>
        Уже есть аккаунт?{' '}
        <a
          style={{ fontWeight: 600, color: 'var(--ink-blue-2)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
          onClick={() => nav('/login')}
        >Войти</a>
      </div>
    </AuthSplit>
  )
}
