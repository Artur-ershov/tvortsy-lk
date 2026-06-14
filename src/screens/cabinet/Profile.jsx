// Профиль — визуал ScrProfile/ScrPasswordModal, данные и флоу it3-cabinet
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, initialsOf, fullName } from '../../state/store.jsx'
import { Nav } from '../../components/Nav.jsx'
import { Modal, PasswordInput } from '../../components/ui.jsx'
import { useField, vName, vNameOpt, vPhone, vRequired, vPassword, vMatch, maskPhone } from '../../state/validation.js'

// Строка анкеты: label | значение | действие (PRow из ScrProfile).
// Объявлена на уровне модуля, чтобы React не пересоздавал тип компонента
// на каждый ввод (иначе input ремоунтится и теряет каретку).
const PRow = ({ label, value, editable, editing, editVal, onEditVal, onStart, onSave, onCancel, validate, mask }) => {
  const empty = !value.trim()
  const err = editing && validate ? (validate(editVal) || {}).error : null
  return (
    <div className="prow">
      <span className="cluster" style={{ color: 'var(--gray-2)' }}>{label}</span>
      {editing ? (
        <div>
          <input
            className={'ff-input focus' + (err ? ' err' : '')}
            style={{ padding: 'var(--sp-2) var(--sp-3)', fontSize: 16 }}
            value={editVal}
            autoFocus
            onChange={e => onEditVal(mask ? mask(e.target.value) : e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !err) onSave(); if (e.key === 'Escape') onCancel() }}
          />
          {err && <span className="ff-err">{err}</span>}
        </div>
      ) : (
        <span style={{ fontSize: 16, color: empty ? 'var(--gray-2)' : 'var(--ink)' }}>{empty ? 'не указано' : value}</span>
      )}
      {editing ? (
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className={'fbtn sm' + (err ? ' disabled' : '')} onClick={() => { if (!err) onSave() }}>Сохранить</button>
          <button className="fbtn sm line" onClick={onCancel}>Отмена</button>
        </div>
      ) : editable ? (
        <button className="mlink" onClick={onStart}>{empty ? 'Добавить' : 'Редактировать'}</button>
      ) : (
        <span></span>
      )}
    </div>
  )
}

const SOCIALS = [
  ['VK ID', (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009Z" fill="#0077FF"/>
      <path d="M6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z" fill="#fff"/>
    </svg>
  ), 'vk'],
  ['Яндекс ID', (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10z" fill="#FC3F1D"/>
      <path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.959l1.045.704-3.003 4.487H7.49l2.695-4.014c-1.55-1.111-2.42-2.19-2.42-4.015 0-2.288 1.595-3.85 4.62-3.85h3.003v11.868H13.32V7.666z" fill="#fff"/>
    </svg>
  ), 'yandex'],
]

export default function Profile() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()

  // Инлайн-редактирование анкеты
  const [editKey, setEditKey] = useState(null)
  const [editVal, setEditVal] = useState('')
  const startEdit = (key) => { setEditKey(key); setEditVal(state.profile[key] || '') }
  const cancelEdit = () => setEditKey(null)
  const saveEdit = () => {
    dispatch({ type: 'profile-patch', patch: { [editKey]: editVal } })
    toast('Данные сохранены')
    setEditKey(null)
  }

  // Модалка смены пароля
  const [pwOpen, setPwOpen] = useState(false)
  const oldF = useField('', vRequired('Введи текущий пароль'))
  const newF = useField('', vPassword)
  const repF = useField('', v => vMatch(newF.value)(v))
  const pwValid = oldF.valid && newF.valid && repF.valid
  const openPw = () => { oldF.reset(); newF.reset(); repF.reset(); setPwOpen(true) }
  const savePw = () => {
    if (!pwValid) { oldF.show(); newF.show(); repF.show(); return }
    toast('Пароль обновлён')
    setPwOpen(false)
  }

  // Пропсы строки анкеты для вынесенного на уровень модуля PRow
  const prow = (field, validate, mask) => ({
    value: state.profile[field] || '',
    editing: editKey === field,
    editVal,
    onEditVal: setEditVal,
    onStart: () => startEdit(field),
    onSave: saveEdit,
    onCancel: cancelEdit,
    validate,
    mask,
  })

  return (
    <div className="app-root">
      <style>{`
        .profile-grid{display:grid;grid-template-columns:1fr 400px;gap:16px;margin-top:28px;align-items:start}
        @media(max-width:920px){.profile-grid{grid-template-columns:1fr}}
      `}</style>
      <Nav tab="profile" />
      <div className="sheet" style={{ flex: '1 0 auto', paddingBottom: 60 }}>

        {/* Шапка */}
        <div className="rule-strong" style={{ paddingTop: 'var(--sp-6)' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(40px, 6vw, 56px)', fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1 }}>Профиль</h1>
        </div>

        <div className="profile-grid">
          {/* Анкета участника */}
          <div className="card-white">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
              <span style={{ width: 64, height: 64, borderRadius: 'var(--r-md)', background: 'var(--sky)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-jbm)', fontWeight: 700, fontSize: 22, color: 'var(--ink-blue)', flexShrink: 0 }}>{initialsOf(fullName(state.profile)) || '··'}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.015em' }}>{fullName(state.profile) || 'Участник'}</div>
                <div className="cluster" style={{ color: 'var(--gray-2)', marginTop: 'var(--sp-1)' }}>{[state.profile.city, state.email].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.015em' }}>Анкета участника</span>
              <span className="cluster" style={{ color: 'var(--gray-2)' }}>подставляется в заявки</span>
            </div>
            <div style={{ marginTop: 'var(--sp-2)' }}>
              <PRow label="Фамилия" editable {...prow('lastName', vName('Укажи фамилию'))} />
              <PRow label="Имя" editable {...prow('firstName', vName('Укажи имя'))} />
              <PRow label="Отчество" editable {...prow('middleName', vNameOpt)} />
              <PRow label="Дата рождения" {...prow('dob')} />
              <PRow label="Национальность" {...prow('nationality', vRequired('Укажи национальность'))} />
              <PRow label="Место работы / учёбы" editable {...prow('work')} />
              <PRow label="Телефон" editable {...prow('phone', vPhone, maskPhone)} />
              <PRow label="Город" editable {...prow('city', vRequired('Укажи город'))} />
            </div>
          </div>

          {/* Правая колонка */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {/* Вход в аккаунт */}
            <div className="card-white">
              <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.015em' }}>Вход в аккаунт</span>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--sp-4)', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,.1)', padding: 'var(--sp-4) 0', marginTop: 'var(--sp-2)' }}>
                <span className="cluster" style={{ color: 'var(--gray-2)' }}>Email</span>
                <span style={{ fontSize: 15.5 }}>{state.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)', borderTop: '1px solid rgba(0,0,0,.1)', padding: 'var(--sp-4) 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="cluster" style={{ color: 'var(--gray-2)' }}>Пароль</span>
                  <span className="cluster" style={{ color: 'var(--gray-2)', marginTop: 'var(--sp-1)' }}>изменён 12.05.2026</span>
                </div>
                <button className="fbtn sm line" onClick={openPw}>Сменить пароль</button>
              </div>
              <div style={{ borderTop: '1px solid rgba(0,0,0,.1)', paddingTop: 'var(--sp-4)' }}>
                <button className="mlink" onClick={() => { dispatch({ type: 'logout' }); nav('/login') }}>Выйти из аккаунта</button>
              </div>
            </div>

            {/* Быстрые входы */}
            <div className="card-white">
              <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.015em' }}>Быстрые входы</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
                {SOCIALS.map(([name, icon, key]) => {
                  const on = !!state.socials[key]
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                      {icon}
                      <span style={{ fontSize: 15.5, fontWeight: 500, flex: 1 }}>{name}</span>
                      {on && <span className="mtag ok">подключён</span>}
                      <button
                        className="mlink"
                        onClick={() => {
                          dispatch({ type: 'social-toggle', key })
                          toast(on ? `${name} отвязан` : `${name} подключён`)
                        }}
                      >{on ? 'Отвязать' : 'Подключить'}</button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка смены пароля */}
      {pwOpen && (
        <Modal onClose={() => setPwOpen(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-6)' }}>
            <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.015em' }}>Сменить пароль</span>
            <button
              style={{ fontSize: 28, color: 'var(--gray-2)', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              aria-label="Закрыть"
              onClick={() => setPwOpen(false)}
            >×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div>
              <span className="ff-label">Текущий пароль</span>
              <PasswordInput {...oldF.bind} ok={false} placeholder="••••••••" autoComplete="current-password" />
              {oldF.error && <div className="ff-err">{oldF.error}</div>}
            </div>
            <div>
              <span className="ff-label">Новый пароль</span>
              <PasswordInput {...newF.bind} />
              {newF.error
                ? <div className="ff-err">{newF.error}</div>
                : <div className="ff-hint" style={{ marginTop: 'var(--sp-2)' }}>Не короче 8 символов · буквы и цифры</div>}
            </div>
            <div>
              <span className="ff-label">Повтори новый пароль</span>
              <PasswordInput {...repF.bind} />
              {repF.error && <div className="ff-err">{repF.error}</div>}
            </div>
            <button
              className="fbtn submit"
              style={{ height: 58, marginTop: 'var(--sp-1)' }}
              onClick={savePw}
            >Сохранить пароль</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
