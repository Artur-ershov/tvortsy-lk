// Экран принятия приглашения в команду — /join/:id (узел m-invite-screen из ux-flow).
// Доступен гостю: до авторизации показывает превью команды и ведёт через Login/Register,
// приглашение ждёт в pendingInvite. Принять/отклонить можно только в стадии active.
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, NOMINATIONS, shortName } from '../../state/store.jsx'
import { Logo } from '../../components/Nav.jsx'
import { AuthSplit, PanelHead } from '../../components/AuthSplit.jsx'

/* Сводка приглашения: команда · произведение · капитан · номинация */
const InviteRows = ({ app, light = false }) => {
  const captain = app.members.find(m => m.role === 'captain')
  const rows = [
    ['Команда', `«${app.teamName || 'Без названия'}»`],
    ['Произведение', app.title || 'Без названия'],
    ['Капитан', captain ? shortName(captain.name) : '—'],
    ['Номинация', app.nomination ? NOMINATIONS[app.nomination].label : '—'],
  ]
  return (
    <div style={{ display: 'grid', gap: 0 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{
          display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-4)', alignItems: 'baseline',
          padding: 'var(--sp-3) 0', borderBottom: '1px solid ' + (light ? 'rgba(255,255,255,.18)' : 'var(--line)'),
        }}>
          <span className="jbm" style={{ fontSize: 12.5, letterSpacing: '.06em', textTransform: 'uppercase', color: light ? 'rgba(255,255,255,.6)' : 'var(--gray-2)' }}>{label}</span>
          <span style={{ fontSize: 16.5, fontWeight: 500, textAlign: 'right', color: light ? '#fff' : 'var(--ink)' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

/* Центрированный каркас (паттерн Wall.jsx) для авторизованных состояний */
const CenterShell = ({ onLogout, title, children }) => (
  <div style={{ minHeight: '100vh', background: 'var(--w)', padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column' }}>
    <div className="auth-top">
      <Logo />
      {onLogout && <button type="button" className="mlink" onClick={onLogout}>Выйти</button>}
    </div>
    <div style={{ maxWidth: 560, width: '100%', margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ textAlign: 'center', marginTop: 'var(--sp-7)' }}>
        <span className="kick">Приглашение в команду</span>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1.05, margin: 0, marginTop: 'var(--sp-3)' }}>{title}</h1>
      </div>
      {children}
    </div>
  </div>
)

export default function JoinInvite() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const { id } = useParams()
  const app = state.apps.find(a => a.id === id && a.mode === 'team')

  /* ── приглашение не найдено ── */
  if (!app) {
    return (
      <CenterShell title="Приглашение недействительно">
        <div className="wall-card" style={{ marginTop: 'var(--sp-8)', textAlign: 'center' }}>
          <p className="ff-hint" style={{ margin: 0 }}>
            Ссылка устарела или заявка была удалена. Попроси капитана прислать новую ссылку.
          </p>
          <button type="button" className="fbtn sm line" style={{ marginTop: 'var(--sp-5)' }} onClick={() => nav('/')}>
            {state.stage === 'active' ? 'В кабинет' : 'Ко входу'}
          </button>
        </div>
      </CenterShell>
    )
  }

  const captain = app.members.find(m => m.role === 'captain')
  const me = app.members.find(m => m.email === state.email && m.role !== 'captain')

  /* ── гость / незавершённая стадия: сначала авторизация ── */
  if (state.stage !== 'active') {
    const isMinorWall = state.stage === 'minor-wall'
    const go = (to) => {
      dispatch({ type: 'set-pending-invite', id })
      nav(to)
    }
    return (
      <AuthSplit
        header={<span className="cluster">Приглашение · бессрочно</span>}
        kicker="Команда зовёт · 2026"
        title={'Тебя зовут в команду'}
        titleSize="clamp(44px, 6.5vw, 84px)"
        lede={captain ? `${shortName(captain.name)} приглашает присоединиться к заявке на фестиваль «Творцы РФ 2026».` : 'Тебя приглашают присоединиться к заявке на фестиваль «Творцы РФ 2026».'}
        posterBottom={<InviteRows app={app} light />}
      >
        <PanelHead
          kicker="Шаг 1 из 2"
          title={isMinorWall ? 'Сначала — согласие родителя' : 'Войдите, чтобы ответить'}
          hint={isMinorWall
            ? 'Тебе 14–17 лет: до решения по приглашению нужно согласие родителя или опекуна. Приглашение никуда не денется — вернём к нему после проверки документов.'
            : 'Принять или отклонить приглашение можно только из своего аккаунта — участие подтверждается с твоего email.'}
          kickerColor="var(--ink)"
          titleColor="var(--ink)"
        />
        {isMinorWall ? (
          <button type="button" className="fbtn submit" onClick={() => go('/wall')}>К согласию родителя</button>
        ) : (
          <>
            <button type="button" className="fbtn submit" onClick={() => go('/login')}>Войти и ответить</button>
            <button type="button" className="fbtn sm line" onClick={() => go('/register')}>Зарегистрироваться</button>
          </>
        )}
        <div className="cluster" style={{ color: 'var(--gray-2)', textAlign: 'center' }}>
          после {isMinorWall ? 'согласия родителя' : 'входа'} вернём к этому приглашению
        </div>
      </AuthSplit>
    )
  }

  const logout = () => { dispatch({ type: 'logout' }); nav('/login') }

  /* ── уже в команде ── */
  if (me && me.tag === 'confirmed') {
    return (
      <CenterShell title={`Ты уже в команде «${app.teamName}»`} onLogout={logout}>
        <div className="wall-card" style={{ marginTop: 'var(--sp-8)' }}>
          <InviteRows app={app} />
          <button type="button" className="fbtn submit" style={{ marginTop: 'var(--sp-6)' }} onClick={() => nav('/cabinet')}>В кабинет</button>
        </div>
      </CenterShell>
    )
  }

  const accept = () => {
    dispatch({ type: 'respond-invite', id, tag: 'confirmed' })
    toast(`Готово! Ты в команде «${app.teamName}»`)
    nav('/cabinet')
  }
  const decline = () => {
    dispatch({ type: 'respond-invite', id, tag: 'declined' })
  }

  /* ── отклонил ── */
  if (me && me.tag === 'declined') {
    return (
      <CenterShell title="Приглашение отклонено" onLogout={logout}>
        <div className="wall-card" style={{ marginTop: 'var(--sp-8)' }}>
          <p className="ff-hint" style={{ margin: 0 }}>
            Капитан увидит отказ в составе команды. Если передумаешь — приглашение бессрочное, примешь в любой момент.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-6)', flexWrap: 'wrap' }}>
            <button type="button" className="fbtn sm" onClick={accept}>Передумать и принять</button>
            <button type="button" className="fbtn sm line" onClick={() => nav('/cabinet')}>В кабинет</button>
          </div>
        </div>
      </CenterShell>
    )
  }

  /* ── ещё не ответил: принять / отклонить ── */
  return (
    <CenterShell title={`Команда «${app.teamName || 'Без названия'}»`} onLogout={logout}>
      <div className="wall-card" style={{ marginTop: 'var(--sp-8)' }}>
        <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-.015em' }}>
          {captain ? shortName(captain.name) : 'Капитан'} зовёт тебя в команду
        </div>
        <p className="ff-hint" style={{ margin: 'var(--sp-2) 0 var(--sp-4)' }}>
          Участие подтверждается с твоего email — {state.email}. Приглашение бессрочное.
        </p>
        <InviteRows app={app} />
        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-6)', flexWrap: 'wrap' }}>
          <button type="button" className="fbtn submit" style={{ flex: 1, minWidth: 180 }} onClick={accept}>Принять приглашение</button>
          <button type="button" className="fbtn sm line" style={{ alignSelf: 'center' }} onClick={decline}>Отклонить</button>
        </div>
      </div>
      <div className="ff-hint" style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
        После принятия заявка появится в твоём кабинете — её редактирует капитан.
      </div>
    </CenterShell>
  )
}
