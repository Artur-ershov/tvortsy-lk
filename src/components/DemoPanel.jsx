// Демо-панель (аналог tweaks-кнопки прототипа): сценарии и действия,
// чтобы все задизайненные состояния были достижимы в один клик.
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, CYCLE } from '../state/store.jsx'

export const DemoPanel = () => {
  const [open, setOpen] = useState(false)
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()

  const scenario = (name, to) => {
    dispatch({ type: 'scenario', name })
    nav(to)
    setOpen(false)
  }

  const firstActive = state.apps.find(a => CYCLE.includes(a.status))
  const uploading = state.apps.flatMap(a => a.files.filter(f => f.state === 'progress').map(f => ({ app: a, f })))

  return (
    <>
      {open && (
        <div className="demo-panel">
          <span className="dp-title">Демо · сценарии</span>
          <button className="dp-btn" onClick={() => scenario('fresh', '/register')}>Новый пользователь → регистрация</button>
          <button className="dp-btn" onClick={() => scenario('maria-empty', '/cabinet')}>Мария · пустой кабинет</button>
          <button className="dp-btn" onClick={() => scenario('maria-full', '/cabinet')}>Мария · черновик + 2 заявки</button>
          <button className="dp-btn" onClick={() => scenario('maria-team', '/cabinet')}>Мария · командная заявка «Шум»</button>
          <button className="dp-btn" onClick={() => scenario('minor', '/wall')}>Тимур · 14–17 · стена согласий</button>
          <button className="dp-btn" onClick={() => scenario('invitee', '/join/team-shum')}>Кирилл · приглашение в команду</button>
          <button className="dp-btn" onClick={() => scenario('invitee', '/cabinet')}>Кирилл · приглашение в кабинете (А/Б)</button>
          <button className="dp-btn" onClick={() => scenario('invitee-minor', '/join/team-shum')}>Тимур · приглашение (14–17)</button>

          <span className="dp-title">Действия</span>
          {state.stage === 'minor-wall' && (
            <button className="dp-btn" onClick={() => {
              dispatch({ type: 'accept-docs' })
              toast('Документы приняты — кабинет открыт')
              // отложенное приглашение важнее кабинета — возвращаем к ответу
              nav(state.pendingInvite ? '/join/' + state.pendingInvite : '/cabinet')
            }}>
              Принять документы (модератор)
            </button>
          )}
          {state.stage === 'minor-wall' && state.minorDocs.pdn === 'review' && (
            <button className="dp-btn" onClick={() => { dispatch({ type: 'replace-minor-doc', doc: 'pdn' }); toast('Документ возвращён — нужна замена') }}>
              Вернуть документ на замену (модератор)
            </button>
          )}
          {firstActive && (
            <button className="dp-btn" onClick={() => { dispatch({ type: 'advance-status', id: firstActive.id }); toast('Статус продвинут') }}>
              Продвинуть статус «{firstActive.title || firstActive.num}»
            </button>
          )}
          {firstActive && (
            <button className="dp-btn" onClick={() => { dispatch({ type: 'rework-app', id: firstActive.id }); toast('Заявка возвращена на доработку') }}>
              Вернуть «{firstActive.title || firstActive.num}» на доработку
            </button>
          )}
          {uploading.length > 0 && (
            <button className="dp-btn" onClick={() => {
              uploading.forEach(({ app, f }) => dispatch({ type: 'patch-file', id: app.id, fileId: f.id, patch: { state: 'broken' } }))
              toast('Соединение прервано — файл можно докачать')
            }}>Оборвать загрузку файла</button>
          )}
          <button className="dp-btn" onClick={() => {
            state.apps.forEach(a => a.members.filter(m => m.tag === 'invited').forEach(m =>
              dispatch({ type: 'member-tag', id: a.id, memberId: m.id, tag: 'confirmed' })))
            toast('Приглашённые подтвердили участие')
          }}>Подтвердить все приглашения</button>
        </div>
      )}
      <button className="demo-fab" onClick={() => setOpen(o => !o)} aria-label="Демо-панель">{open ? '×' : 'demo'}</button>
    </>
  )
}
