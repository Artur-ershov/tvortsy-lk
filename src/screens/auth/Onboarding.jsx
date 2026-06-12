// Онбординг — данные участника, шаг 2 из 2 (структура: lk3/it3-auth I3Onboarding, стиль: screens-reg/auth)
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, dobVerdict } from '../../state/store.jsx'
import { AuthSplit } from '../../components/AuthSplit.jsx'
import { Field, Wing } from '../../components/ui.jsx'

export default function Onboarding() {
  const { dispatch } = useStore()
  const nav = useNavigate()
  const [fio, setFio] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [nationality, setNationality] = useState('')
  const [city, setCity] = useState('')
  const [work, setWork] = useState('')
  const [dobTouched, setDobTouched] = useState(false)

  const verdict = dobVerdict(dob)
  const dobErr = !dob.trim() ? null
    : verdict === 'young' ? 'Участникам конкурса должно быть не менее 14 лет'
    : verdict === 'old' ? 'Участие открыто для людей до 35 лет включительно'
    : verdict === 'invalid' && (dobTouched || dob.trim().length >= 10) ? 'Формат: ДД.ММ.ГГГГ'
    : null

  const filled = fio.trim() && dob.trim() && phone.trim() && nationality.trim() && city.trim()
  const ok = filled && (verdict === 'ok' || verdict === 'minor')

  const submit = () => {
    if (!ok) return
    const profile = { fio: fio.trim(), dob: dob.trim(), phone: phone.trim(), nationality: nationality.trim(), city: city.trim(), work: work.trim() }
    dispatch({ type: 'onboarding', profile })
    nav(verdict === 'minor' ? '/wall' : '/cabinet')
  }

  return (
    <AuthSplit
      kicker="Путь участника · шаг 2 из 2"
      title="Данные участника"
      titleSize="clamp(42px, 6.5vw, 84px)"
      lede="Эти данные подставятся в заявку автоматически — заполнишь один раз."
      art={<Wing cols={18} rows={6} tile={20} waves={1} glass />}
    >
      <div className="form-grid2">
        <div className="full">
          <Field label="ФИО" value={fio} onChange={setFio} autoComplete="name" />
        </div>
        <div onBlur={() => setDobTouched(true)}>
          <Field
            label="Дата рождения"
            value={dob}
            onChange={setDob}
            placeholder="ДД.ММ.ГГГГ"
            hint="от 14 до 35 лет на момент подачи"
            error={dobErr}
          />
        </div>
        <Field label="Телефон" type="tel" value={phone} onChange={setPhone} autoComplete="tel" />
        <Field label="Национальность" value={nationality} onChange={setNationality} />
        <Field label="Город" value={city} onChange={setCity} />
        <Field label="Место работы или учёбы" optional value={work} onChange={setWork} placeholder="Университет или работодатель" />
      </div>

      <button
        type="button"
        className={'fbtn submit' + (ok ? '' : ' disabled')}
        disabled={!ok}
        style={{ marginTop: 4 }}
        onClick={submit}
      >Перейти в кабинет</button>
    </AuthSplit>
  )
}
