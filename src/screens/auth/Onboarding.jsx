// Онбординг — данные участника (структура: lk3/it3-auth I3Onboarding, стиль: screens-reg/auth).
// Дата рождения собрана на регистрации — здесь только остальная анкета.
import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { AuthSplit, PanelHead } from '../../components/AuthSplit.jsx'
import { Field } from '../../components/ui.jsx'
import { useField, revealInvalid, vName, vNameOpt, vPhone, vRequired, maskPhone } from '../../state/validation.js'
import wing from '../../assets/wing.svg'

export default function Onboarding() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const formRef = useRef(null)

  const lastName = useField(state.profile.lastName || '', vName('Укажи фамилию'))
  const firstName = useField(state.profile.firstName || '', vName('Укажи имя'))
  const middleName = useField(state.profile.middleName || '', vNameOpt) // необязательно
  const phone = useField(state.profile.phone || '', vPhone, { mask: maskPhone })
  const nationality = useField(state.profile.nationality || '', vRequired('Укажи национальность'))
  const city = useField(state.profile.city || '', vRequired('Укажи город'))
  const work = useField(state.profile.work || '') // необязательно

  const required = [lastName, firstName, middleName, phone, nationality, city]
  const ready = required.every(f => f.valid)

  const submit = () => {
    if (!ready) { revealInvalid(required, formRef.current); return }
    const profile = {
      lastName: lastName.value.trim(), firstName: firstName.value.trim(), middleName: middleName.value.trim(),
      phone: phone.value.trim(), nationality: nationality.value.trim(), city: city.value.trim(), work: work.value.trim(),
    }
    dispatch({ type: 'onboarding', profile })
    // возраст/согласие уже пройдены — дальше кабинет или отложенное приглашение
    nav(state.pendingInvite ? '/join/' + state.pendingInvite : '/cabinet')
  }

  return (
    <AuthSplit
      kicker="Путь участника · шаг 2 из 2"
      title="Данные участника"
      header={<button type="button" className="mlink" onClick={() => { dispatch({ type: 'logout' }); nav('/login') }}>Выйти</button>}
      titleSize="clamp(42px, 6.5vw, 84px)"
      lede="Эти данные подставятся в заявку автоматически — заполнишь один раз."
      art={<img src={wing} alt="" style={{ width: '88%', maxWidth: 560, display: 'block' }} />}
    >
      <PanelHead kicker="Анкета" />
      <div className="form-grid2" ref={formRef}>
        <Field label="Фамилия" {...lastName.bind} placeholder="Иванова" autoComplete="family-name" />
        <Field label="Имя" {...firstName.bind} placeholder="Анна" autoComplete="given-name" />
        <Field label="Отчество" optional {...middleName.bind} placeholder="Сергеевна" autoComplete="additional-name" />
        <Field label="Телефон" type="tel" {...phone.bind} placeholder="+7 999 999-99-99" autoComplete="tel" />
        <Field label="Национальность" {...nationality.bind} placeholder="Русская" />
        <Field label="Город" {...city.bind} placeholder="Москва" />
        <div className="full">
          <Field label="Место работы или учёбы" optional {...work.bind} placeholder="Школа, вуз или работодатель" />
        </div>
      </div>

      <button
        type="button"
        className="fbtn submit"
        style={{ marginTop: 'var(--sp-1)' }}
        onClick={submit}
      >Сохранить и продолжить</button>
    </AuthSplit>
  )
}
