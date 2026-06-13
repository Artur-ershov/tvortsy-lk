// Кабинет «один лист» — визуал FgV9/ScrCabEmpty, флоу it3-cabinet
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useStore, NOMINATIONS, APP_LIMIT, newDraft, countSubmitted, filledCount, ageFrom, ageWord, shortName,
} from '../../state/store.jsx'
import { Nav } from '../../components/Nav.jsx'
import { StatusTag, StatusTimeline, Modal } from '../../components/ui.jsx'
import { NomCard, SynthCard, NOM_CARD_KEYS } from '../../components/NominationCards.jsx'

/* Склонения */
const memberWord = (n) => {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'участник'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'участника'
  return 'участников'
}

/* Пояснение статуса в правой колонке */
const SIDE_NOTE = {
  submitted: 'Пока заявка в статусе «Подана», её можно редактировать или отозвать.',
  review: 'Редактирование закрыто до результата проверки. Заявку можно отозвать.',
  rework: 'Исправь работу и подай снова — дедлайн не сгорает.',
  admitted: 'Работа в программе мастерских. Следующий этап — показы, июль.',
  results: 'Сезон завершён — спасибо за участие!',
}

export default function Cabinet() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()

  // командные заявки, где я не капитан — членство, а не моя заявка (read-only карточка)
  const myMemberIn = a => a.mode === 'team' && a.members.find(m => m.email === state.email && m.role !== 'captain')
  const memberships = state.apps.filter(a => { const m = myMemberIn(a); return m && m.tag === 'confirmed' })
  // приглашения без ответа — видны в кабинете, даже если ссылка из письма потерялась
  const invites = state.apps.filter(a => { const m = myMemberIn(a); return m && m.tag === 'invited' })
  const own = state.apps.filter(a => !myMemberIn(a))

  const acceptInvite = (app) => {
    dispatch({ type: 'respond-invite', id: app.id, tag: 'confirmed' })
    toast(`Вы в команде «${app.teamName}»`)
  }
  const declineInvite = (app) => {
    dispatch({ type: 'respond-invite', id: app.id, tag: 'declined' })
    toast('Приглашение отклонено')
  }

  const submitted = own.filter(a => a.status !== 'draft')
  const drafts = own.filter(a => a.status === 'draft')
  const subCount = countSubmitted(own)
  const limitReached = subCount >= APP_LIMIT

  const [withdrawApp, setWithdrawApp] = useState(null) // заявка для модалки «Отозвать»
  const [deleteDraft, setDeleteDraft] = useState(null) // черновик для модалки удаления
  const [leaveApp, setLeaveApp] = useState(null)       // команда для модалки «Покинуть»

  // «Подать заявку» → сразу форма; номинация выбирается уже внутри формы (необязательна тут).
  // С карточки витрины можно прийти с предвыбранной номинацией.
  const startApply = (nom = null) => {
    const d = { ...newDraft('ТВ-2026-0' + state.appSeq), nomination: nom }
    dispatch({ type: 'create-draft', draft: d })
    nav('/apply/' + d.id)
  }
  const reopen = (id) => {
    dispatch({ type: 'reopen-app', id })
    nav('/apply/' + id)
  }

  const age = ageFrom(state.profile.dob)
  const meta = [
    state.email,
    state.profile.city,
    age != null ? `${age} ${ageWord(age)}` : null,
    `заявки: ${subCount} из 2`,
  ].filter(Boolean).join(' · ')

  let sectionIdx = 0 // для marginTop: первая секция 52, дальше 10 (паддинг 30 даёт зазор 40 как в FgV9)
  const secTop = () => (sectionIdx++ === 0 ? 52 : 10)

  return (
    <div className="app-root">
      <style>{`
        .cab-meta{margin:16px 0 0 212px}
        @media(max-width:1080px){.cab-meta{margin-left:0}}
      `}</style>
      <Nav tab="apps" />
      <div className="sheet" style={{ flex: '1 0 auto' }}>

        {/* Шапка листа */}
        <div className="rule-strong cab-head">
          <span className="kick">Кабинет</span>
          <h1 style={{ margin: 0, fontSize: 'clamp(40px, 6.5vw, 76px)', fontWeight: 500, letterSpacing: '-.04em', lineHeight: .9 }}>
            {state.profile.fio}
          </h1>
          {limitReached ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span className="fbtn disabled">+ Подать заявку</span>
              <span className="ff-hint" style={{ textAlign: 'right' }}>достигнут лимит — 2 заявки на участника</span>
            </div>
          ) : (
            <button className="fbtn" onClick={() => startApply()}>+ Подать заявку</button>
          )}
        </div>
        <div className="meta cab-meta">{meta}</div>

        {/* Вариант Б: баннер-полоска над заявками */}
        {invites.map(app => {
          const captain = app.members.find(m => m.role === 'captain')
          return (
            <div key={'bn' + app.id} style={{
              marginTop: 28, border: '1px solid var(--ink)', borderRadius: 16, padding: '16px 22px',
              display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
            }}>
              <span className="kick">Приглашение</span>
              <span style={{ flex: 1, minWidth: 220, fontSize: 16.5 }}>
                {captain ? shortName(captain.name) : 'Капитан'} зовёт вас в команду «{app.teamName}» — «{app.title || 'Без названия'}»
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="fbtn sm" onClick={() => acceptInvite(app)}>Принять</button>
                <button className="fbtn sm line" onClick={() => declineInvite(app)}>Отклонить</button>
              </div>
            </div>
          )
        })}

        {/* Пустое состояние — витрина номинаций. Карточка ведёт сразу в форму с предвыбором. */}
        {state.apps.length === 0 && (
          <div className="rule-soft" style={{ marginTop: 40, paddingTop: 30, paddingBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              <div>
                <span className="kick">Заявок пока нет</span>
                <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', marginTop: 8 }}>Выбери номинацию</div>
                <p style={{ margin: '8px 0 0', fontSize: 15.5, lineHeight: 1.45, color: 'var(--gray-2)', maxWidth: 460 }}>
                  Бейдж подскажет, подходит ли работа по формату. Номинацию можно сменить уже в форме. Черновик сохраняется.
                </p>
              </div>
              <span className="jbm" style={{ fontSize: 11.5, letterSpacing: '.04em', color: 'var(--gray-2)', textAlign: 'right', lineHeight: 1.7 }}>
                до 1 июня · осталось 12 дней<br />не более 2 заявок на участника<br />14–35 лет · бесплатно · ~12 мин
              </span>
            </div>
            <div className="nom-grid">
              {NOM_CARD_KEYS.map(k => <NomCard key={k} k={k} onClick={startApply} />)}
            </div>
            <SynthCard onClick={startApply} />
          </div>
        )}

        {/* Черновики — компактная секция */}
        {drafts.map(app => (
          <div key={app.id} className="rule-soft cab-section" style={{ marginTop: secTop(), paddingBottom: 30 }}>
            <div>
              <span className="kick">Черновик</span>
              <div className="jbm" style={{ fontSize: 12.5, letterSpacing: '.05em', color: 'var(--gray-2)', marginTop: 14, lineHeight: 1.7 }}>
                {app.num}<br />изменён {app.updatedAt}
                {app.nomination ? <><br />{NOMINATIONS[app.nomination].label.toLowerCase()}</> : null}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1, color: app.title.trim() ? 'var(--ink)' : 'var(--gray-2)' }}>
                {app.title.trim() || 'Без названия'}
              </div>
              <div className="ff-hint" style={{ marginTop: 10 }}>заполнено {filledCount(app)} из 4 разделов</div>
            </div>
            <div className="cab-side">
              <StatusTag status="draft" />
              <button className="fbtn sm" onClick={() => nav('/apply/' + app.id)}>Продолжить</button>
              <button className="mlink" style={{ alignSelf: 'flex-start' }} onClick={() => setDeleteDraft(app)}>удалить черновик</button>
            </div>
          </div>
        ))}

        {/* Вариант А: приглашение карточкой в списке заявок */}
        {invites.map(app => {
          const captain = app.members.find(m => m.role === 'captain')
          return (
            <div key={'inv' + app.id} className="rule-soft cab-section" style={{ marginTop: secTop(), paddingBottom: 30 }}>
              <div>
                <span className="kick">Приглашение</span>
                <div className="jbm" style={{ fontSize: 12.5, letterSpacing: '.05em', color: 'var(--gray-2)', marginTop: 14, lineHeight: 1.7 }}>
                  {app.num}<br />
                  капитан {captain ? shortName(captain.name) : '—'}<br />
                  {app.nomination ? NOMINATIONS[app.nomination].label.toLowerCase() : ''} · {app.members.length} {memberWord(app.members.length)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1 }}>
                  «{app.teamName}» · {app.title || 'Без названия'}
                </div>
                <div className="ff-hint" style={{ marginTop: 10 }}>
                  {captain ? shortName(captain.name) : 'капитан'} приглашает вас в команду — участие подтверждается с вашего email
                </div>
              </div>
              <div className="cab-side">
                <span className="fst wait">Ждёт ответа</span>
                <button className="fbtn sm" onClick={() => acceptInvite(app)}>Принять</button>
                <button className="fbtn sm line" onClick={() => declineInvite(app)}>Отклонить</button>
                <button className="mlink" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/join/' + app.id)}>подробнее</button>
              </div>
            </div>
          )
        })}

        {/* Команды, где я участник (не капитан) — read-only, редактирует капитан */}
        {memberships.map(app => {
          const captain = app.members.find(m => m.role === 'captain')
          return (
            <div key={app.id} className="rule-soft cab-section" style={{ marginTop: secTop(), paddingBottom: 30 }}>
              <div>
                <span className="kick">Команда</span>
                <div className="jbm" style={{ fontSize: 12.5, letterSpacing: '.05em', color: 'var(--gray-2)', marginTop: 14, lineHeight: 1.7 }}>
                  {app.num}<br />
                  капитан {captain ? shortName(captain.name) : '—'}<br />
                  {app.nomination ? NOMINATIONS[app.nomination].label.toLowerCase() : ''} · {app.members.length} {memberWord(app.members.length)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1 }}>
                  «{app.teamName}» · {app.title || 'Без названия'}
                </div>
                <div className="ff-hint" style={{ marginTop: 10 }}>
                  вы участник команды — заявку заполняет и подаёт капитан
                </div>
              </div>
              <div className="cab-side">
                <StatusTag status={app.status} />
                <div style={{ fontSize: 15.5, lineHeight: 1.4, color: 'var(--gray-2)' }}>
                  Статус заявки виден здесь, изменения — на email.
                </div>
                <button className="mlink" style={{ alignSelf: 'flex-start' }} onClick={() => setLeaveApp(app)}>покинуть команду</button>
              </div>
            </div>
          )
        })}

        {/* Поданные заявки */}
        {submitted.map((app, i) => {
          const nn = String(i + 1).padStart(2, '0')
          const nomLabel = app.nomination ? NOMINATIONS[app.nomination].label : ''
          return (
            <div key={app.id} className="rule-soft cab-section" style={{ marginTop: secTop(), paddingBottom: 30 }}>
              {/* Левая колонка */}
              <div>
                <span className="kick" style={app.status === 'rework' ? { color: 'var(--err)' } : undefined}>{nn} / Заявка</span>
                <div className="jbm" style={{ fontSize: 12.5, letterSpacing: '.05em', color: 'var(--gray-2)', marginTop: 14, lineHeight: 1.7 }}>
                  {app.num}<br />
                  подана {app.submittedAt}<br />
                  {nomLabel.toLowerCase()} · {app.mode === 'solo' ? 'соло' : 'команда ' + app.members.length}
                </div>
              </div>

              {/* Центр */}
              <div>
                <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1 }}>
                  {app.title}
                </div>
                {app.status === 'rework' && (
                  <div style={{ fontSize: 16, color: 'var(--err)', marginTop: 12 }}>{app.reworkNote}</div>
                )}
                <div style={{ marginTop: 28, maxWidth: 720 }}>
                  <StatusTimeline status={app.status} submittedAt={app.submittedAt} />
                </div>
              </div>

              {/* Правая колонка */}
              <div className="cab-side">
                <StatusTag status={app.status} />
                <div style={{ fontSize: 15.5, lineHeight: 1.4, color: 'var(--gray-2)' }}>{SIDE_NOTE[app.status]}</div>
                {app.status === 'submitted' && (
                  <button className="fbtn sm" onClick={() => nav('/apply/' + app.id)}>Редактировать</button>
                )}
                {app.status === 'review' && (
                  <span className="tipwrap">
                    <span className="tip">Редактирование доступно только в статусе «Подана»</span>
                    <span className="fbtn sm disabled" style={{ flex: 1 }}>Редактировать</span>
                  </span>
                )}
                {app.status === 'rework' && (
                  <button className="fbtn sm" onClick={() => reopen(app.id)}>Исправить</button>
                )}
                {(app.status === 'submitted' || app.status === 'review') && (
                  <button className="fbtn sm line" onClick={() => setWithdrawApp(app)}>Отозвать</button>
                )}
              </div>
            </div>
          )
        })}

        {/* Подвал листа */}
        <div className="rule-strong sheet-foot">
          <span className="jbm" style={{ fontSize: 13, letterSpacing: '.05em', textTransform: 'uppercase' }}>заявки до 1 июня · осталось 12 дней</span>
          <span className="jbm" style={{ fontSize: 13, letterSpacing: '.05em', color: 'var(--gray-2)' }}>вопрос-ответ → help@tvorcy.ru</span>
        </div>
      </div>

      {/* Модалка «Отозвать заявку?» */}
      {withdrawApp && (
        <Modal onClose={() => setWithdrawApp(null)}>
          <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-.015em', marginBottom: 12 }}>Отозвать заявку?</div>
          <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.45, color: 'var(--gray-2)' }}>
            «{withdrawApp.title}» · {withdrawApp.nomination ? NOMINATIONS[withdrawApp.nomination].label : ''} · от {withdrawApp.submittedAt}. Заявка будет удалена, освобождённый слот можно использовать повторно.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="fbtn sm line" style={{ flex: 1 }} onClick={() => setWithdrawApp(null)}>Отмена</button>
            <button
              className="fbtn sm"
              style={{ flex: 1, background: 'var(--err)', color: '#fff' }}
              onClick={() => {
                dispatch({ type: 'withdraw-app', id: withdrawApp.id })
                toast('Заявка отозвана')
                setWithdrawApp(null)
              }}
            >Отозвать</button>
          </div>
        </Modal>
      )}

      {/* Модалка «Покинуть команду?» */}
      {leaveApp && (
        <Modal onClose={() => setLeaveApp(null)}>
          <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-.015em', marginBottom: 12 }}>Покинуть команду?</div>
          <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.45, color: 'var(--gray-2)' }}>
            «{leaveApp.teamName}» · {leaveApp.title || 'Без названия'}. Капитан увидит, что вы вышли. Вернуться можно по новому приглашению.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="fbtn sm line" style={{ flex: 1 }} onClick={() => setLeaveApp(null)}>Отмена</button>
            <button
              className="fbtn sm"
              style={{ flex: 1, background: 'var(--err)', color: '#fff' }}
              onClick={() => {
                dispatch({ type: 'leave-team', id: leaveApp.id })
                toast('Вы покинули команду')
                setLeaveApp(null)
              }}
            >Покинуть</button>
          </div>
        </Modal>
      )}

      {/* Модалка «Удалить черновик?» */}
      {deleteDraft && (
        <Modal onClose={() => setDeleteDraft(null)}>
          <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-.015em', marginBottom: 12 }}>Удалить черновик?</div>
          <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.45, color: 'var(--gray-2)' }}>
            «{deleteDraft.title.trim() || 'Без названия'}». Черновик будет удалён без возможности восстановления.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="fbtn sm line" style={{ flex: 1 }} onClick={() => setDeleteDraft(null)}>Отмена</button>
            <button
              className="fbtn sm"
              style={{ flex: 1, background: 'var(--err)', color: '#fff' }}
              onClick={() => {
                dispatch({ type: 'withdraw-app', id: deleteDraft.id })
                toast('Черновик удалён')
                setDeleteDraft(null)
              }}
            >Удалить</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
