// Регистрация — шаг 1 из 2 (структура: lk3/it3-auth I3Reg, стиль: lk3/screens-reg v3)
import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, dobVerdict } from '../../state/store.jsx'
import { AuthSplit, PanelHead } from '../../components/AuthSplit.jsx'
import { Field, PasswordInput, Check, SocialRow, OrRow } from '../../components/ui.jsx'
import { useField, revealInvalid, vEmail, vPassword, vDobRegister, maskDob } from '../../state/validation.js'
import wing from '../../assets/wing.svg'

export default function Register() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const formRef = useRef(null)
  // регистрация по ссылке-приглашению: старше 35 можно — но только в команде
  const hasInvite = !!state.pendingInvite
  const emailF = useField('', vEmail)
  const passF = useField('', vPassword)
  const dobF = useField('', vDobRegister(hasInvite), { mask: maskDob })
  const [agree, setAgree] = useState(false)
  const [agreeErr, setAgreeErr] = useState(false)
  const verdict = dobVerdict(dobF.value)
  // у 14–17 и 35+ объяснение даёт баннер ниже — не дублируем его подсказкой/инлайн-варном у поля
  const dobBanner = verdict === 'minor' || verdict === 'old'

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
      art={<img src={wing} alt="" style={{ width: '88%', maxWidth: 560, display: 'block' }} />}
      stats={[
        ['5', 'направлений · аудио, визуал, танец, медиа, синтез'],
        ['14–35', 'возраст · РФ и иностранные студенты в России'],
        ['ноябрь', 'финал в Москве · приём заявок открыт'],
      ]}
    >
      <PanelHead
        title="Создать аккаунт"
        hint="В личном кабинете ты подашь заявку, загрузишь работу и увидишь статус на каждом этапе. Анкету заполнишь позже — когда будешь подавать заявку."
      />

      <div ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
        <Field label="Email" type="email" {...emailF.bind} placeholder="example@mail.ru" autoComplete="email" />

        <div>
          <span className="ff-label">Пароль</span>
          <PasswordInput {...passF.bind} autoComplete="new-password" />
          {passF.error
            ? <span className="ff-err" style={{ display: 'block', marginTop: 'var(--sp-2)' }}>{passF.error}</span>
            : <span className="ff-hint" style={{ display: 'block', marginTop: 'var(--sp-2)' }}>Минимум 8 символов, хотя бы одна буква и одна цифра</span>}
        </div>

        <Field
          label="Дата рождения"
          {...dobF.bind}
          warn={dobBanner ? null : dobF.bind.warn}
          placeholder="ДД.ММ.ГГГГ"
          hint={dobBanner ? undefined : 'от 14 до 35 лет на момент подачи'}
        />
      </div>

      {verdict === 'minor' && (
        <div className="locked-banner">
          <span style={{ fontSize: 'var(--fs-base)', color: 'var(--ink-blue)', fontWeight: 500 }}>Понадобится согласие родителя</span>
          <p className="ff-hint" style={{ margin: 'var(--sp-1) 0 0' }}>
            Тебе ещё нет 18 лет — по закону для участия нужно согласие родителя или опекуна. Аккаунт создадим сейчас, а согласие поможем оформить позже.
          </p>
        </div>
      )}

      {/* Старше 35: по приглашению — можно (только в команде); без приглашения — самостоятельно нельзя */}
      {verdict === 'old' && hasInvite && (
        <div className="locked-banner">
          <span style={{ fontSize: 'var(--fs-base)', color: 'var(--ink-blue)', fontWeight: 500 }}>Участие — только в составе команды</span>
          <p className="ff-hint" style={{ margin: 'var(--sp-1) 0 0' }}>
            Тебе больше 35 — самостоятельно подать заявку нельзя, но капитан позвал тебя в команду, и так участвовать можно. Создадим аккаунт и вернём к приглашению.
          </p>
        </div>
      )}
      {verdict === 'old' && !hasInvite && (
        <div className="locked-banner" style={{ background: 'rgba(179, 64, 46, .07)' }}>
          <span style={{ fontSize: 'var(--fs-base)', color: 'var(--err)', fontWeight: 500 }}>Самостоятельно участвовать нельзя</span>
          <p className="ff-hint" style={{ margin: 'var(--sp-1) 0 0' }}>
            Подать заявку самому можно до 35 лет. Старше — только в составе команды: попроси капитана прислать ссылку-приглашение и открой её, тогда регистрация откроется.
          </p>
        </div>
      )}

      <div>
        <Check on={agree} onChange={v => { setAgree(v); setAgreeErr(false) }} style={{ marginTop: 2 }}>
          Даю <a href="/docs/consent.html" target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>согласие на обработку персональных данных</a>{' '}
          и принимаю <a href="/docs/privacy.html" target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>политику обработки</a>
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
      <div style={{ textAlign: 'center', fontSize: 'var(--fs-base)', color: 'var(--ink-blue)' }}>
        Уже есть аккаунт?{' '}
        <a
          style={{ fontWeight: 600, color: 'var(--ink-blue-2)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
          onClick={() => nav('/login')}
        >Войти</a>
      </div>
    </AuthSplit>
  )
}
