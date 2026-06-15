// Просмотр поданной заявки — read-only. После подачи заявку нельзя редактировать,
// но автор должен видеть, что именно он отправил. Структура зеркалит форму
// (01 Номинация → 02 Работа → 03 Команда → 04 Согласия), но всё статично.
// Витрина-стиль переиспользован из read-only карточки участника в кабинете.
import React, { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  useStore, NOMINATIONS, fmtMB, fullName, initialsOf,
} from '../../state/store.jsx'
import { Nav } from '../../components/Nav.jsx'
import { StatusTimeline, StatusTag, Modal } from '../../components/ui.jsx'

/* Пояснение статуса в правой колонке (как в кабинете) */
const SIDE_NOTE = {
  submitted: 'Заявка принята. До результата проверки её можно отозвать.',
  review: 'Заявка на проверке. До результата её можно отозвать.',
  rework: 'Исправь работу и подай снова — дедлайн не сгорает.',
  admitted: 'Работа в программе мастерских. Следующий этап — показы, июль.',
  results: 'Сезон завершён — спасибо за участие!',
}

/* Статус участника в составе команды (без email, кроме приглашённых — это свои приглашения) */
const MEMBER_STATE = {
  in:        { label: 'в команде',   cls: 'ok' },
  confirmed: { label: 'в команде',   cls: 'ok' },
  invited:   { label: 'ждёт ответа', cls: 'wait' },
  declined:  { label: 'отклонил',    cls: '' },
}

const CONSENTS = [
  'С правилами фестиваля ознакомлен и согласен',
  'Предоставляю неисключительную лицензию на использование материалов',
]

/* Секция «один лист» в read-only: kick слева, контент справа (как FSection формы, без индикатора) */
const VSection = ({ num, title, children }) => (
  <div className="fsection">
    <div><div className="kick">{num} / {title}</div></div>
    <div>{children}</div>
  </div>
)

/* Подпись-метка над блоком */
const Lab = ({ children }) => (
  <span className="meta" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>{children}</span>
)

export default function ApplyView() {
  const { id } = useParams()
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const app = state.apps.find(a => a.id === id)
  if (!app) return <Navigate to="/cabinet" replace />
  // участник (не капитан) видит командную заявку только на просмотр — заявку ведёт капитан
  const meMember = app.mode === 'team' ? app.members.find(m => m.email === state.email && m.role !== 'captain') : null
  const isMember = !!meMember
  // приглашён, но ещё не в команде (invited/declined): заявку можно посмотреть до решения, ответ — на /join
  const isPendingInvite = isMember && meMember.tag !== 'confirmed'
  // черновик автор продолжает заполнять в форме; у участника редактирования нет — остаётся витрина
  if (app.status === 'draft' && !isMember) return <Navigate to={'/apply/' + app.id} replace />

  const nomDef = app.nomination ? NOMINATIONS[app.nomination] : null
  const nomLabel = nomDef ? nomDef.label : '—'
  const canWithdraw = !isMember && (app.status === 'submitted' || app.status === 'review')

  const reopen = () => {
    dispatch({ type: 'reopen-app', id: app.id })
    nav('/apply/' + app.id)
  }
  const withdraw = () => {
    dispatch({ type: 'withdraw-app', id: app.id })
    toast('Заявка отозвана')
    nav('/cabinet')
  }
  const leave = () => {
    dispatch({ type: 'leave-team', id: app.id })
    toast('Ты вышел из команды')
    nav('/cabinet')
  }

  const fileLine = (f) =>
    f.state === 'done' ? fmtMB(f.sizeMB)
      : f.state === 'progress' ? `загружается ${f.pct || 0}%`
        : f.state === 'broken' ? 'загрузка прервана'
          : f.state === 'over' ? 'превышен размер — по ссылке'
            : '…'

  return (
    <div className="app-root" style={{ background: 'var(--w)' }}>
      <Nav tab="apps" />

      <div className="sheet" style={{ flex: '1 0 auto' }}>
        {/* Шапка: кикер → название работы, справа — номер и дата подачи */}
        <div className="rule-strong" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--sp-6)', paddingTop: 'var(--sp-6)' }}>
          <div>
            <span className="kick">{isMember ? 'Заявка команды · только просмотр' : 'Поданная заявка · только просмотр'}</span>
            <h1 style={{ fontSize: 'clamp(40px, 6.5vw, 76px)', fontWeight: 500, letterSpacing: '-.04em', lineHeight: .9, marginTop: 'var(--sp-3)' }}>
              {app.mode === 'team' && app.teamName ? `«${app.teamName}» · ${app.title || 'Без названия'}` : (app.title || 'Без названия')}
            </h1>
          </div>
          <span className="cluster" style={{ paddingBottom: 'var(--sp-2)', textAlign: 'right' }}>
            {app.num}<br />{app.submittedAt ? `подана ${app.submittedAt}${app.submittedTime ? ', ' + app.submittedTime : ''}` : 'ещё не подана'}
          </span>
        </div>

        {/* Статус — в той же сетке, что и секции: kick слева, контент справа (выравнивание) */}
        <div className="fsection" style={{ marginTop: 'var(--sp-7)' }}>
          <div><div className="kick">Статус</div></div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
              <StatusTag status={app.status} />
              <span style={{ fontSize: 'var(--fs-base)', lineHeight: 1.4, color: 'var(--gray-2)' }}>
                {isPendingInvite
                  ? 'Тебя позвали в эту команду — пока ты её только смотришь. Принять или отклонить можно внизу.'
                  : isMember
                    ? 'Заявку ведёт и подаёт капитан. Об изменениях статуса напишем на почту.'
                    : SIDE_NOTE[app.status]}
              </span>
            </div>
            {!isMember && app.status === 'rework' && app.reworkNote && (
              <div style={{ fontSize: 'var(--fs-base)', color: 'var(--err)', background: 'rgba(179, 64, 46, .08)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-2) var(--sp-3)', marginTop: 'var(--sp-3)', lineHeight: 1.4 }}>
                {app.reworkNote}
              </div>
            )}
            {app.status === 'draft' ? (
              <div className="ff-hint" style={{ marginTop: 'var(--sp-5)' }}>
                Капитан ещё заполняет заявку — она пока не подана.
              </div>
            ) : (
              <div style={{ marginTop: 'var(--sp-5)' }}>
                <StatusTimeline status={app.status} submittedAt={app.submittedAt} />
              </div>
            )}
          </div>
        </div>

        {/* 01 ── Номинация */}
        <VSection num="01" title="Номинация">
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 500, letterSpacing: '-.02em' }}>{nomLabel}</div>
          {app.nomination === 'synth' && app.synthDirs.length > 0 && (
            <div className="ff-hint" style={{ marginTop: 'var(--sp-2)' }}>
              направления: {app.synthDirs.map(k => NOMINATIONS[k].label.toLowerCase()).join(' · ')}
            </div>
          )}
          {nomDef && <div className="ff-hint" style={{ marginTop: 'var(--sp-2)' }}>{nomDef.fmt}</div>}
        </VSection>

        {/* 02 ── Работа */}
        <VSection num="02" title="Работа">
          <Lab>Описание</Lab>
          <p style={{ margin: 'var(--sp-2) 0 0', fontSize: 'var(--fs-base)', lineHeight: 1.5, color: app.description ? 'var(--ink)' : 'var(--gray-2)', maxWidth: 640, overflowWrap: 'anywhere' }}>
            {app.description || 'Без описания'}
          </p>

          <div style={{ marginTop: 'var(--sp-5)' }}>
            <Lab>Материалы</Lab>
            {app.files.length > 0 ? (
              <div style={{ display: 'grid', gap: 'var(--sp-1)', marginTop: 'var(--sp-3)' }}>
                {app.files.map(f => (
                  <div key={f.id} className="jbm" style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-2)', overflowWrap: 'anywhere' }}>
                    {f.name} · {fileLine(f)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="ff-hint" style={{ marginTop: 'var(--sp-3)' }}>файлы не приложены</div>
            )}
            {app.link && (
              <div className="jbm" style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-2)', marginTop: 'var(--sp-3)', overflowWrap: 'anywhere' }}>
                ссылка: {app.link}
              </div>
            )}
          </div>
        </VSection>

        {/* 03 ── Команда */}
        <VSection num="03" title="Команда">
          {app.mode === 'solo' ? (
            <>
              <div className="member-row" style={{ gap: 'var(--sp-3)' }}>
                <span className="init">{initialsOf(fullName(state.profile)) || '··'}</span>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 'var(--fs-base)', fontWeight: 500 }}>{fullName(state.profile) || 'Участник'}</div>
                  <div className="cluster" style={{ color: 'var(--gray-2)', marginTop: 2 }}>
                    {[state.profile.city, state.email].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span className="mtag ok">соло</span>
              </div>
              <div className="ff-hint" style={{ marginTop: 'var(--sp-3)' }}>заявка подана одним участником</div>
            </>
          ) : (
            <>
              {app.teamName && (
                <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 500, letterSpacing: '-.02em' }}>«{app.teamName}»</div>
              )}
              <div style={{ marginTop: 'var(--sp-4)', maxWidth: 460 }}>
                <Lab>Состав · {app.members.length}</Lab>
                <div style={{ display: 'grid', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
                  {app.members.map(m => {
                    const st = m.role === 'captain' ? { label: 'капитан', cls: 'ok' } : (MEMBER_STATE[m.tag] || MEMBER_STATE.invited)
                    const isMe = m.email === state.email
                    // себя показываем по своему профилю (имя приглашённого неизвестно до принятия);
                    // капитан видит email неотвеченных приглашений (это его приглашения); участник — нет (приватность)
                    const name = isMe
                      ? (fullName(state.profile) || m.name || 'Ты')
                      : m.name || (!isMember && m.tag === 'invited' ? m.email : 'Участник по приглашению')
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-3)', alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'var(--fs-base)', color: m.name ? 'var(--ink)' : 'var(--gray-2)', overflowWrap: 'anywhere' }}>
                          {name}{isMe ? ' · ты' : ''}
                        </span>
                        <span className={'mtag ' + st.cls}>{st.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </VSection>

        {/* 04 ── Согласия капитана — личная часть; участнику команды не показываем */}
        {!isMember && (
        <VSection num="04" title="Согласия">
          <div style={{ display: 'grid', gap: 'var(--sp-3)' }}>
            {CONSENTS.map((label, i) => {
              const on = app.consents[i]
              return (
                <div key={i} style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'baseline' }}>
                  <span aria-hidden style={{ fontSize: 'var(--fs-base)', color: on ? 'var(--ok)' : 'var(--gray-2)', lineHeight: 1 }}>{on ? '✓' : '—'}</span>
                  <span style={{ fontSize: 'var(--fs-base)', lineHeight: 1.4, color: on ? 'var(--ink)' : 'var(--gray-2)' }}>{label}</span>
                </div>
              )
            })}
          </div>
        </VSection>
        )}

        {/* Футер действий — навигация + контекстное действие по статусу/роли */}
        <div className="rule-strong" style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'center', paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-7)', marginTop: 'var(--sp-7)' }}>
          {isPendingInvite ? (
            <>
              {/* посмотрел → решает на экране приглашения (там слот-стена и бессрочность) */}
              <button className="fbtn" onClick={() => nav('/join/' + app.id)}>Ответить на приглашение</button>
              <button className="fbtn line" onClick={() => nav('/cabinet')}>В кабинет</button>
            </>
          ) : (
            <>
              <button className="fbtn" onClick={() => nav('/cabinet')}>{isMember ? 'В кабинет' : 'К моим заявкам'}</button>
              {!isMember && app.status === 'rework' && (
                <button className="fbtn line" onClick={reopen}>Исправить и подать снова</button>
              )}
              {canWithdraw && (
                <button className="fbtn line" onClick={() => setWithdrawOpen(true)}>Отозвать заявку</button>
              )}
              {isMember && (
                <button className="fbtn line" onClick={() => setLeaveOpen(true)}>Покинуть команду</button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Модалка «Отозвать заявку?» */}
      {withdrawOpen && (
        <Modal onClose={() => setWithdrawOpen(false)}>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, letterSpacing: '-.015em', marginBottom: 'var(--sp-3)' }}>Отозвать заявку?</div>
          <p style={{ margin: 0, fontSize: 'var(--fs-base)', lineHeight: 1.45, color: 'var(--gray-2)' }}>
            «{app.title}» · {nomLabel} · от {app.submittedAt}. Заявку удалим, а освободившееся место сможешь занять новой работой.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-6)' }}>
            <button className="fbtn sm line" style={{ flex: 1 }} onClick={() => setWithdrawOpen(false)}>Отмена</button>
            <button className="fbtn sm" style={{ flex: 1, background: 'var(--err)', color: '#fff' }} onClick={withdraw}>Отозвать</button>
          </div>
        </Modal>
      )}

      {/* Модалка «Покинуть команду?» (для участника) */}
      {leaveOpen && (
        <Modal onClose={() => setLeaveOpen(false)}>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, letterSpacing: '-.015em', marginBottom: 'var(--sp-3)' }}>Покинуть команду?</div>
          <p style={{ margin: 0, fontSize: 'var(--fs-base)', lineHeight: 1.45, color: 'var(--gray-2)' }}>
            «{app.teamName || 'Без названия'}» · {app.title || 'Без названия'}. Капитан увидит, что ты вышел. Вернуться можно по новому приглашению.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-6)' }}>
            <button className="fbtn sm line" style={{ flex: 1 }} onClick={() => setLeaveOpen(false)}>Отмена</button>
            <button className="fbtn sm" style={{ flex: 1, background: 'var(--err)', color: '#fff' }} onClick={leave}>Покинуть</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
