// Демо-панель (аналог tweaks-кнопки прототипа): «где я», сценарии, экраны,
// контекстные действия и сброс — чтобы все задизайненные состояния были
// достижимы и понятны в один-два клика.
import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  useStore, CYCLE, LS_KEY, newDraft,
  fullName, initialsOf, countSubmitted,
} from '../state/store.jsx'

/* Подпись текущей стадии аккаунта (statusная модель из store) */
const STAGE_LABEL = {
  guest: 'Гость',
  registered: 'Почта не подтверждена',
  confirmed: 'Анкета не заполнена',
  'minor-wall': 'Стена 14–17',
  active: 'В кабинете',
}

/* Сценарии-персоны: кто → что тестируем. name → reducer scenario, to → куда вести */
const PERSONAS = [
  {
    who: 'Новый пользователь', sub: 'с чистого листа',
    items: [{ label: 'Регистрация', name: 'fresh', to: '/register' }],
  },
  {
    who: 'Мария', sub: 'автор · 22 года',
    items: [
      { label: 'Пустой кабинет', name: 'maria-empty', to: '/cabinet' },
      { label: 'Черновик + 2 заявки', name: 'maria-full', to: '/cabinet' },
      { label: 'Команда: черновик', name: 'maria-team', to: '/cabinet' },
      { label: 'Команда: все приняли', name: 'team-shum-ready', to: '/apply/team-shum' },
      { label: 'Команда: на проверке', name: 'team-shum-review', to: '/cabinet' },
    ],
  },
  {
    who: 'Кирилл', sub: '18+ · приглашён в команду',
    items: [
      { label: 'Ссылка-приглашение', name: 'invitee', to: '/join/team-shum' },
      { label: 'Приглашение в кабинете', name: 'invitee', to: '/cabinet' },
      { label: 'После принятия', name: 'invitee-accepted', to: '/cabinet' },
    ],
  },
  {
    who: 'Тимур', sub: '14–17 лет',
    items: [
      { label: 'Стена согласий', name: 'minor', to: '/wall' },
      { label: 'Приглашение', name: 'invitee-minor', to: '/join/team-shum' },
    ],
  },
  {
    who: 'Олег', sub: '43 года · только в команде',
    items: [
      { label: 'Регистрация по приглашению', name: 'senior-reg', to: '/register' },
      { label: 'В кабинете (35+)', name: 'invitee-senior', to: '/cabinet' },
      { label: 'Капитан: в пределах доли', name: 'captain-senior-ok', to: '/apply/team-kontur-ok' },
      { label: 'Капитан: превышение доли', name: 'captain-senior', to: '/apply/team-kontur' },
    ],
  },
]

/* Экраны входа — без гардов, открываются из любой стадии */
const AUTH_SCREENS = [
  ['Вход', '/login'],
  ['Регистрация', '/register'],
  ['Подтв. почты', '/confirm'],
  ['Анкета', '/onboarding'],
  ['Восстановление', '/recovery'],
]

export const DemoPanel = () => {
  const [open, setOpen] = useState(false)
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const { pathname } = useLocation()

  const close = () => setOpen(false)

  const scenario = (name, to) => {
    dispatch({ type: 'scenario', name })
    nav(to)
    close()
  }

  // Экраны входа доступны всегда
  const goAuth = (to) => { nav(to); close() }

  // Кабинетные экраны требуют active — поднимаем «живого» пользователя, если нужно
  const goActive = (to) => {
    if (state.stage !== 'active') dispatch({ type: 'scenario', name: 'maria-full' })
    nav(to)
    close()
  }

  // Стена 14–17 редиректит из active/confirmed — открываем вместе со сценарием Тимура
  const goWall = () => {
    if (state.stage !== 'minor-wall') dispatch({ type: 'scenario', name: 'minor' })
    nav('/wall')
    close()
  }

  // Форма заявки: открываем существующий черновик или заводим новый
  const goForm = () => {
    let draft = state.stage === 'active' && state.apps.find(a => a.status === 'draft')
    if (state.stage !== 'active') { dispatch({ type: 'scenario', name: 'maria-empty' }); draft = null }
    if (!draft) {
      draft = newDraft(`ТВ-2026-0${state.appSeq}`)
      dispatch({ type: 'create-draft', draft })
    }
    nav(`/apply/${draft.id}`)
    close()
  }

  // Просмотр поданной заявки (read-only /view/:id): открываем первую не-черновик,
  // а если поданных нет — поднимаем Марию с двумя заявками и ведём в кабинет к «Смотреть»
  const goView = () => {
    const submitted = state.stage === 'active' && state.apps.find(a => a.status !== 'draft')
    if (submitted) { nav(`/view/${submitted.id}`); close(); return }
    dispatch({ type: 'scenario', name: 'maria-full' })
    nav('/cabinet')
    toast('Загрузил заявки Марии — открой «Смотреть» у поданной')
    close()
  }

  const reset = () => {
    try { localStorage.removeItem(LS_KEY) } catch { /* недоступно */ }
    dispatch({ type: 'scenario', name: 'fresh' })
    nav('/login')
    close()
    toast('Демо сброшено — чистый старт')
  }

  // ── контекст для блока «Действия здесь» ──
  const firstActive = state.apps.find(a => CYCLE.includes(a.status))
  const teamDraft = state.apps.find(a => a.mode === 'team' && a.status === 'draft')
  const uploading = state.apps.flatMap(a => a.files.filter(f => f.state === 'progress').map(f => ({ app: a, f })))
  const invited = state.apps.flatMap(a => a.members.filter(m => m.tag === 'invited').map(m => ({ app: a, m })))
  const canAcceptDocs = state.stage === 'minor-wall'
  const canReturnDoc = state.stage === 'minor-wall' && state.minorDocs.pdn === 'review'
  const hasActions = canAcceptDocs || canReturnDoc || firstActive || teamDraft || uploading.length > 0 || invited.length > 0

  // ── «где я сейчас» ──
  const name = fullName(state.profile)
  const drafts = state.apps.filter(a => a.status === 'draft').length
  const submitted = countSubmitted(state.apps)
  const advLabel = (a) => a.title || a.num

  return (
    <>
      {open && (
        <div className="demo-panel">
          {/* ── Где я сейчас ── */}
          <div className="dp-status">
            <span className="dp-ava">{name ? initialsOf(name) : '··'}</span>
            <div className="dp-who">
              <b>{name || 'Гость'}</b>
              <span className="dp-mail">{state.email || 'не авторизован'}</span>
            </div>
          </div>
          <div className="dp-tags">
            <span className="dp-tag accent">{STAGE_LABEL[state.stage] || state.stage}</span>
            {state.stage === 'active' && <span className="dp-tag">черновиков {drafts}</span>}
            {state.stage === 'active' && <span className="dp-tag">подано {submitted}/2</span>}
            <span className="dp-tag path">{pathname}</span>
          </div>

          {/* ── Сценарии ── */}
          <div className="dp-sec">
            <span className="dp-title">Сценарии</span>
            {PERSONAS.map((p, i) => (
              <div className="dp-persona" key={i}>
                <span className="dp-persona-head">{p.who} <i>· {p.sub}</i></span>
                <div className="dp-row">
                  {p.items.map((it, j) => (
                    <button className="dp-chip" key={j} onClick={() => scenario(it.name, it.to)}>{it.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Открыть экран ── */}
          <div className="dp-sec">
            <span className="dp-title">Открыть экран</span>
            <div className="dp-row">
              {AUTH_SCREENS.map(([label, to]) => (
                <button className="dp-chip" key={to} onClick={() => goAuth(to)}>{label}</button>
              ))}
              <button className="dp-chip" onClick={goWall}>Стена 14–17</button>
            </div>
            <div className="dp-row">
              <button className="dp-chip" onClick={() => goActive('/cabinet')}>Кабинет</button>
              <button className="dp-chip" onClick={() => goActive('/profile')}>Профиль</button>
              <button className="dp-chip" onClick={goForm}>Форма заявки</button>
              <button className="dp-chip" onClick={goView}>Просмотр заявки</button>
            </div>
          </div>

          {/* ── Действия на текущем экране ── */}
          <div className="dp-sec">
            <span className="dp-title">Действия здесь</span>
            {!hasActions && <span className="dp-empty">Зависят от экрана — откройте сценарий или заявку.</span>}

            {canAcceptDocs && (
              <button className="dp-btn" onClick={() => {
                dispatch({ type: 'accept-docs' })
                toast('Документы приняты — осталось заполнить анкету')
                nav('/onboarding')
                close()
              }}>
                ✓ Принять документы (модератор)
              </button>
            )}
            {canReturnDoc && (
              <button className="dp-btn" onClick={() => { dispatch({ type: 'replace-minor-doc', doc: 'pdn' }); toast('Документ возвращён — нужна замена') }}>
                ↩ Вернуть документ на замену (модератор)
              </button>
            )}
            {teamDraft && (
              <button className="dp-btn" onClick={() => {
                dispatch({ type: 'submit-app', id: teamDraft.id })
                toast(`Капитан подал «${teamDraft.teamName || teamDraft.title}» — статус «Подана»`)
              }}>
                → Капитан подал «{teamDraft.teamName || teamDraft.title}»
              </button>
            )}
            {firstActive && (
              <button className="dp-btn" onClick={() => { dispatch({ type: 'advance-status', id: firstActive.id }); toast('Статус продвинут') }}>
                → Продвинуть статус «{advLabel(firstActive)}»
              </button>
            )}
            {firstActive && (
              <button className="dp-btn" onClick={() => { dispatch({ type: 'rework-app', id: firstActive.id }); toast('Заявка возвращена на доработку') }}>
                ↩ Вернуть «{advLabel(firstActive)}» на доработку
              </button>
            )}
            {uploading.length > 0 && (
              <button className="dp-btn" onClick={() => {
                uploading.forEach(({ app, f }) => dispatch({ type: 'patch-file', id: app.id, fileId: f.id, patch: { state: 'broken' } }))
                toast('Соединение прервано — файл можно докачать')
              }}>⚡ Оборвать загрузку файла</button>
            )}
            {invited.map(({ app, m }) => (
              <div className="dp-invite-row" key={m.id}>
                <span className="dp-invite-who">{m.email}</span>
                <div className="dp-invite-acts">
                  <button className="dp-btn dp-btn-ok" onClick={() => {
                    dispatch({ type: 'member-tag', id: app.id, memberId: m.id, tag: 'confirmed' })
                    toast(`${m.email} → принял приглашение`)
                  }}>✓ принял</button>
                  <button className="dp-btn dp-btn-err" onClick={() => {
                    dispatch({ type: 'member-tag', id: app.id, memberId: m.id, tag: 'declined' })
                    toast(`${m.email} → отказался`)
                  }}>× отказал</button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Сброс ── */}
          <button className="dp-reset" onClick={reset}>⟲ Сбросить демо начисто</button>
        </div>
      )}
      <button className="demo-fab" onClick={() => setOpen(o => !o)} aria-label="Демо-панель">{open ? '×' : 'demo'}</button>
    </>
  )
}
