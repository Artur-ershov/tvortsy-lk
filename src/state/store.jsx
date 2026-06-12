// Состояние приложения — флоу и бизнес-правила из «Творцы ЛК — Итерация 3»
// (lk3/it3-*.jsx + handoff-лист). Демо-логика: всё работает на клиенте.

import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'

/* ───────── Справочники ───────── */

export const NOMINATIONS = {
  audio:  { label: 'Аудио',  req: 'Аудио — запись MP3 или WAV · до 300 МБ',  formats: ['mp3', 'wav'], maxMB: 300, fmt: 'MP3 или WAV · до 300 МБ' },
  media:  { label: 'Медиа',  req: 'Медиа — видеоролик MP4 · до 500 МБ',      formats: ['mp4'],        maxMB: 500, fmt: 'MP4 · до 500 МБ' },
  dance:  { label: 'Танец',  req: 'Танец — видеозапись MP4 · до 500 МБ',     formats: ['mp4'],        maxMB: 500, fmt: 'MP4 · до 500 МБ' },
  visual: { label: 'Визуал', req: 'Визуал — файл PDF или PNG · до 100 МБ',   formats: ['pdf', 'png'], maxMB: 100, fmt: 'PDF или PNG · до 100 МБ' },
  synth:  { label: 'Синтез', req: 'Синтез — материалы по выбранным направлениям · суммарно до 800 МБ', formats: null, maxMB: 800, fmt: 'несколько форматов · до 800 МБ суммарно', minDirs: 2 },
}
export const NOMINATION_KEYS = ['audio', 'media', 'dance', 'visual', 'synth']
export const SYNTH_DIR_KEYS = ['audio', 'media', 'dance', 'visual']

export const APP_LIMIT = 2 // не более 2 поданных заявок; черновики в лимит не входят

export const STATUS = {
  draft:     { label: 'Черновик',     cls: 'wait' },
  submitted: { label: 'Подана',       cls: '' },
  review:    { label: 'На проверке',  cls: 'wait' },
  rework:    { label: 'На доработку', cls: 'err' },
  admitted:  { label: 'Допущена',     cls: 'ok' },
  results:   { label: 'Итоги',        cls: 'ok' },
}
// Статус-цикл заявки (it3: 4 шага, черновик вне цикла)
export const CYCLE = ['submitted', 'review', 'admitted', 'results']
export const CYCLE_DATES = { submitted: 'июнь', review: 'июнь', admitted: 'июль — сент', results: 'ноябрь' }

/* ───────── Утилиты ───────── */

let uid = 1
export const nextId = () => 'id' + Date.now().toString(36) + (uid++)

export function parseDob(s) {
  // «ДД.ММ.ГГГГ» → Date | null
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((s || '').trim())
  if (!m) return null
  const d = new Date(+m[3], +m[2] - 1, +m[1])
  if (d.getDate() !== +m[1] || d.getMonth() !== +m[2] - 1) return null
  return d
}

export function ageFrom(dobStr) {
  const d = parseDob(dobStr)
  if (!d) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const beforeBd = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  if (beforeBd) age--
  return age
}

// it3: < 14 → young, > 35 → old, 14–17 → minor
export function dobVerdict(dobStr) {
  const age = ageFrom(dobStr)
  if (age == null) return 'invalid'
  if (age < 14) return 'young'
  if (age > 35) return 'old'
  if (age < 18) return 'minor'
  return 'ok'
}

export function fmtMB(mb) {
  if (mb >= 1000) return (mb / 1000).toFixed(1).replace('.', ',') + ' ГБ'
  return Math.round(mb) + ' МБ'
}

// Инициалы: Имя + Фамилия («Соколова Мария Андреевна» → «МС»)
export function initialsOf(fio) {
  const p = (fio || '').trim().split(/\s+/)
  if (!p[0]) return '··'
  return ((p[1]?.[0] || '') + (p[0][0] || '')).toUpperCase()
}

export function firstNameCity(profile) {
  // «Соколова Мария, 22 года, Казань»
  const p = (profile.fio || '').trim().split(/\s+/)
  const short = p.slice(0, 2).join(' ')
  const age = ageFrom(profile.dob)
  const years = age == null ? '' : `, ${age} ${ageWord(age)}`
  return `${short}${years}${profile.city ? ', ' + profile.city : ''}`
}

export function ageWord(n) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'год'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'года'
  return 'лет'
}

/* ───────── Модель заявки ───────── */

export function newDraft(num) {
  return {
    id: nextId(),
    num,                      // «ТВ-2026-0848»
    status: 'draft',
    nomination: null,         // ключ NOMINATIONS
    synthDirs: [],            // для синтеза, минимум 2
    title: '',
    description: '',
    mode: 'solo',             // solo | team
    teamName: '',
    members: [],              // {id, name, email, role:'captain'|'member', tag:'in'|'confirmed'|'invited'|'declined'}; имя пустое до принятия приглашения
    files: [],                // {id, name, sizeMB, state:'queue'|'progress'|'broken'|'done'|'error'|'over', pct, errText, note}
    link: '',                 // ссылка при превышении лимита
    consents: [false, false], // 2 согласия (Положение + лицензия); ПДн — только на регистрации
    reworkNote: '',
    submittedAt: null,
    updatedAt: '12:40',
  }
}

// Что осталось до подачи — строки «Осталось: …» (it3), кликабельные якоря
export function computeTodos(app) {
  const todos = []
  const nom = app.nomination && NOMINATIONS[app.nomination]
  if (!nom) todos.push({ label: 'номинация', anchor: 's01' })
  if (app.nomination === 'synth' && app.synthDirs.length < 2) todos.push({ label: 'направления синтеза — минимум 2', anchor: 's01' })
  if (!app.title.trim()) todos.push({ label: 'название работы', anchor: 's01' })
  if (!app.description.trim()) todos.push({ label: 'описание работы', anchor: 's01' })

  const done = app.files.filter(f => f.state === 'done')
  const loading = app.files.find(f => f.state === 'progress' || f.state === 'queue')
  const broken = app.files.find(f => f.state === 'broken')
  const over = app.files.find(f => f.state === 'over')
  if (loading) todos.push({ label: `файл загружается — ${loading.pct || 0}%`, anchor: 's02' })
  else if (broken) todos.push({ label: 'докачать файл', anchor: 's02' })
  else if (over && !app.link.trim()) todos.push({ label: 'файл больше лимита — приложи ссылку', anchor: 's02' })
  else if (!done.length && !(over && app.link.trim())) todos.push({ label: 'файлы работы', anchor: 's02' })
  else if (misfitFiles(app).length) todos.push({ label: 'файлы не подходят под номинацию — замени', anchor: 's02' })

  if (app.mode === 'team') {
    if (!app.teamName.trim()) todos.push({ label: 'название команды', anchor: 's03' })
    if (app.members.filter(m => m.role !== 'captain').length === 0) todos.push({ label: 'участники команды', anchor: 's03' })
    const waiting = app.members.filter(m => m.tag === 'invited')
    if (waiting.length) todos.push({ label: waiting.length === 1 ? 'приглашение без ответа' : `приглашения без ответа — ${waiting.length}`, anchor: 's03' })
  }

  const unchecked = app.consents.filter(c => !c).length
  if (unchecked) todos.push({ label: unchecked === 1 ? '1 согласие' : `${unchecked} согласия`, anchor: 's04' })
  return todos
}

export function shortName(fio) {
  const p = (fio || '').trim().split(/\s+/)
  if (p.length < 2) return fio
  return `${p[0]} ${p[1][0]}.${p[2] ? p[2][0] + '.' : ''}`
}

export function sectionState(app, n) {
  // 'done' | 'todo' | строка-статус для секции
  const t = computeTodos(app)
  const has = a => t.some(x => x.anchor === a)
  if (n === 1) return has('s01') ? '' : 'done'
  if (n === 2) {
    const loading = app.files.find(f => f.state === 'progress')
    if (loading) return `загрузка · ${loading.pct || 0}%`
    return has('s02') ? '' : 'done'
  }
  if (n === 3) {
    if (app.mode === 'solo') return 'done'
    const waiting = app.members.filter(m => m.tag === 'invited').length
    if (waiting) return waiting === 1 ? '1 приглашение' : `${waiting} приглашения`
    return has('s03') ? '' : 'done'
  }
  if (n === 4) return has('s04') ? '' : 'done'
  return ''
}

export const countSubmitted = apps => apps.filter(a => a.status !== 'draft').length
export const filledCount = app => [1, 2, 3, 4].filter(n => sectionState(app, n) === 'done').length

/* ───────── Сиды (данные из FgV9 / it3) ───────── */

const PROFILE_MARIA = {
  fio: 'Соколова Мария Андреевна',
  dob: '14.03.2004',
  phone: '+7 917 240-18-66',
  nationality: 'русская',
  city: 'Казань',
  work: 'МГУ им. Ломоносова',
}

const seedApps = () => {
  const a1 = {
    ...newDraft('ТВ-2026-0847'),
    status: 'review',
    nomination: 'audio',
    title: 'Голос внутри',
    description: 'Аудиоспектакль о внутреннем голосе: три монолога, записанных в одном дубле, и звуковая среда города между ними.',
    files: [
      { id: nextId(), name: 'rabota_final.wav', sizeMB: 412, state: 'done', pct: 100 },
      { id: nextId(), name: 'oblozhka.png', sizeMB: 2.4, state: 'done', pct: 100 },
    ],
    consents: [true, true],
    submittedAt: '02.06.2026',
  }
  const a2 = {
    ...newDraft('ТВ-2026-0633'),
    status: 'rework',
    nomination: 'media',
    title: 'Стекло',
    description: 'Видеоэссе о хрупкости городской среды.',
    files: [{ id: nextId(), name: 'steklo_v2.mp4', sizeMB: 498, state: 'done', pct: 100 }],
    consents: [true, true],
    submittedAt: '30.05.2026',
    reworkNote: 'Видео превышает 3 минуты. Загрузите версию до 3:00 и подайте снова — дедлайн не сгорает.',
  }
  const draft = {
    ...newDraft('ТВ-2026-0848'),
    nomination: 'media',
    title: 'Город говорит',
    description: 'Документальный мини-фильм об уличных музыкантах Казани: три героя, один день, общий язык — звук города.',
    consents: [false, false],
  }
  return [draft, a1, a2]
}

const TEAM_SEED = () => ([
  { id: nextId(), name: 'Соколова Мария Андреевна', email: 'm.sokolova@mail.ru', role: 'captain', tag: 'in' },
  { id: nextId(), name: 'Беляев Артём Игоревич', email: 'a.belyaev@ya.ru', role: 'member', tag: 'confirmed' },
  // до принятия приглашения известен только email — имени нет
  { id: nextId(), name: '', email: 'k.dmitriev@inbox.ru', role: 'member', tag: 'invited' },
  // несовершеннолетний попадает в команду только после Стены согласий — статус согласия капитану не нужен
  { id: nextId(), name: 'Гарипов Тимур Маратович', email: 't.garipov@mail.ru', role: 'member', tag: 'confirmed' },
])

// Командная заявка «Шум» — фиксированный id, чтобы демо-ссылка /join/team-shum работала из коробки
const teamShumApp = (members = TEAM_SEED()) => ({
  ...newDraft('ТВ-2026-0847'),
  id: 'team-shum',
  nomination: 'synth',
  synthDirs: ['audio', 'dance'],
  title: 'Шёпот города',
  description: 'Перформанс на стыке звука и движения: полевые записи города становятся партитурой для четырёх танцовщиков.',
  mode: 'team',
  teamName: 'Шум',
  members,
  files: [
    { id: nextId(), name: 'shepot_zvuk.wav', sizeMB: 212, state: 'done', pct: 100 },
    { id: nextId(), name: 'shepot_goroda_v3.mp4', sizeMB: 486, state: 'progress', pct: 64 },
  ],
})

const PROFILE_KIRILL = {
  fio: 'Дмитриев Кирилл Олегович',
  dob: '21.07.2001',
  phone: '+7 903 118-42-90',
  nationality: 'русский',
  city: 'Казань',
  work: 'КФУ',
}

const PROFILE_TIMUR = {
  fio: 'Гарипов Тимур Маратович',
  dob: '02.11.2011',
  phone: '+7 917 555-31-07',
  nationality: 'татарин',
  city: 'Казань',
  work: 'Лицей № 7',
}

/* ───────── Начальное состояние ───────── */

const initialState = {
  // guest → registered (ждёт код) → confirmed (онбординг) → active | minor-wall
  stage: 'guest',
  email: '',
  profile: { fio: '', dob: '', phone: '', nationality: '', city: '', work: '' },
  minorDocs: { participation: 'none', pdn: 'none' }, // none | review | ok | replace
  socials: { vk: true, yandex: false, telegram: true },
  apps: [],
  appSeq: 849, // следующий номер ТВ-2026-XXXX
  pendingInvite: null, // id заявки, на чьё приглашение нужно ответить после авторизации
}

/* ───────── Редьюсер ───────── */

function patchApp(state, id, patch) {
  return { ...state, apps: state.apps.map(a => (a.id === id ? { ...a, ...((typeof patch === 'function') ? patch(a) : patch) } : a)) }
}

function reducer(state, action) {
  switch (action.type) {
    case 'register':
      // новый аккаунт начинает с чистого кабинета — демо-данные только через демо-панель
      return { ...initialState, appSeq: state.appSeq, stage: 'registered', email: action.email }
    case 'confirm-email':
      return { ...state, stage: 'confirmed' }
    case 'change-email':
      return { ...state, stage: 'guest' }
    case 'onboarding': {
      const verdict = dobVerdict(action.profile.dob)
      return {
        ...state,
        profile: action.profile,
        stage: verdict === 'minor' ? 'minor-wall' : 'active',
      }
    }
    case 'upload-minor-doc':
      return {
        ...state,
        minorDocs: { ...state.minorDocs, [action.doc]: 'review' },
        minorDocNames: { ...(state.minorDocNames || {}), [action.doc]: action.name || 'soglasie.pdf' },
      }
    case 'replace-minor-doc': // модератор: «нужна замена документов» (handoff)
      return { ...state, minorDocs: { ...state.minorDocs, [action.doc]: 'replace' } }
    case 'accept-docs':
      return { ...state, minorDocs: { participation: 'ok', pdn: 'ok' }, stage: 'active' }
    case 'login': {
      // статусная модель handoff: незавершённые стадии сохраняются —
      // вход не перепрыгивает подтверждение email и онбординг
      const keep = ['registered', 'confirmed', 'minor-wall']
      const stage = keep.includes(state.stage) ? state.stage : 'active'
      return { ...state, stage, email: action.email || state.email }
    }
    case 'logout':
      return { ...state, stage: 'guest' }
    case 'profile-patch':
      return { ...state, profile: { ...state.profile, ...action.patch } }
    case 'social-toggle':
      return { ...state, socials: { ...state.socials, [action.key]: !state.socials[action.key] } }

    case 'create-draft': {
      // экран может создать черновик сам (newDraft) и передать его, чтобы сразу знать id
      const draft = action.draft || newDraft(`ТВ-2026-0${state.appSeq}`)
      return { ...state, apps: [draft, ...state.apps], appSeq: state.appSeq + 1, lastDraftId: draft.id }
    }
    case 'patch-app':
      return patchApp(state, action.id, action.patch)
    case 'submit-app': {
      // handoff: «Проверяется на сервере при submit» — лимит 2 поданных, черновики не в счёт
      if (countSubmitted(state.apps) >= APP_LIMIT) return state
      const now = new Date()
      return patchApp(state, action.id, {
        status: 'submitted',
        submittedAt: now.toLocaleDateString('ru-RU'),
        submittedTime: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        reworkNote: '',
      })
    }
    case 'withdraw-app':
      return { ...state, apps: state.apps.filter(a => a.id !== action.id) }
    case 'reopen-app': // «Исправить» из «На доработку» — снова черновик
      return patchApp(state, action.id, { status: 'draft' })
    case 'advance-status': // демо: продвинуть по циклу
      return patchApp(state, action.id, a => {
        const i = CYCLE.indexOf(a.status)
        if (i === -1 || i === CYCLE.length - 1) return {}
        return { status: CYCLE[i + 1] }
      })
    case 'rework-app': // демо: вернуть на доработку
      return patchApp(state, action.id, { status: 'rework', reworkNote: action.note || 'Работа требует доработки — подробности на email.' })

    /* файлы */
    case 'add-file':
      return patchApp(state, action.id, a => ({ files: [...a.files, action.file] }))
    case 'patch-file':
      return patchApp(state, action.id, a => ({
        files: a.files.map(f => (f.id === action.fileId ? { ...f, ...action.patch } : f)),
      }))
    case 'remove-file':
      return patchApp(state, action.id, a => ({ files: a.files.filter(f => f.id !== action.fileId) }))

    /* команда */
    case 'add-member':
      return patchApp(state, action.id, a => ({ members: [...a.members, action.member] }))
    case 'remove-member':
      return patchApp(state, action.id, a => ({ members: a.members.filter(m => m.id !== action.memberId) }))
    case 'member-tag': // демо: подтвердить/отклонить приглашение
      return patchApp(state, action.id, a => ({
        members: a.members.map(m => (m.id === action.memberId ? { ...m, tag: action.tag } : m)),
      }))
    case 'set-pending-invite': // ссылка-приглашение открыта до авторизации — ответим после входа
      return { ...state, pendingInvite: action.id }
    case 'respond-invite': {
      // приглашённый отвечает со своего email; при принятии имя подтягивается из профиля
      const email = state.email
      const next = patchApp(state, action.id, a => {
        const known = a.members.some(m => m.email === email)
        if (!known && action.tag === 'confirmed') {
          // пришёл по пересланной ссылке — добавляем себя в состав
          return { members: [...a.members, { id: nextId(), name: state.profile.fio, email, role: 'member', tag: 'confirmed' }] }
        }
        return {
          members: a.members.map(m => (m.email === email
            ? { ...m, tag: action.tag, ...(action.tag === 'confirmed' ? { name: state.profile.fio } : {}) }
            : m)),
        }
      })
      return { ...next, pendingInvite: null }
    }
    case 'leave-team': // участник выходит из команды в своём кабинете
      return patchApp(state, action.id, a => ({ members: a.members.filter(m => m.email !== state.email) }))
    case 'ensure-captain':
      return patchApp(state, action.id, a => {
        if (a.members.some(m => m.role === 'captain')) return {}
        return {
          members: [
            { id: nextId(), name: state.profile.fio, email: state.email, role: 'captain', tag: 'in' },
            ...a.members,
          ],
        }
      })

    /* демо-сценарии */
    case 'scenario': {
      const base = { ...initialState, appSeq: state.appSeq }
      switch (action.name) {
        case 'fresh':
          return { ...base }
        case 'maria-empty':
          return { ...base, stage: 'active', email: 'm.sokolova@mail.ru', profile: PROFILE_MARIA, apps: [] }
        case 'maria-full': {
          const apps = seedApps()
          return { ...base, stage: 'active', email: 'm.sokolova@mail.ru', profile: PROFILE_MARIA, apps }
        }
        case 'maria-team': {
          const apps = seedApps()
          apps[0] = { ...teamShumApp(), num: apps[0].num }
          return { ...base, stage: 'active', email: 'm.sokolova@mail.ru', profile: PROFILE_MARIA, apps }
        }
        case 'invitee':
          // Кирилл (18+) получил ссылку-приглашение в «Шум» — ещё не ответил
          return {
            ...base,
            stage: 'active',
            email: 'k.dmitriev@inbox.ru',
            profile: PROFILE_KIRILL,
            apps: [teamShumApp()],
            pendingInvite: 'team-shum',
          }
        case 'invitee-minor':
          // Тимур (14–17) получил приглашение, но сначала — Стена согласий
          return {
            ...base,
            stage: 'minor-wall',
            email: 't.garipov@mail.ru',
            profile: PROFILE_TIMUR,
            minorDocs: { participation: 'none', pdn: 'none' },
            apps: [teamShumApp(TEAM_SEED().map(m => (m.email === 't.garipov@mail.ru' ? { ...m, tag: 'invited', name: '' } : m)))],
            pendingInvite: 'team-shum',
          }
        case 'minor':
          return {
            ...base,
            stage: 'minor-wall',
            email: 't.garipov@mail.ru',
            profile: PROFILE_TIMUR,
            minorDocs: { participation: 'none', pdn: 'review' },
          }
        default:
          return state
      }
    }
    case 'hydrate':
      return { ...state, ...action.state }
    default:
      return state
  }
}

/* ───────── Контекст ───────── */

const StoreCtx = createContext(null)
const ToastCtx = createContext(() => {})

const LS_KEY = 'tvortsy-lk-state'

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) return { ...initialState, ...JSON.parse(raw) }
    } catch { /* пустой кэш */ }
    // стартовый сценарий — «Мария · 2 заявки» (как FgV9), чтобы открывался живой кабинет
    return reducer(initialState, { type: 'scenario', name: 'maria-full' })
  })

  // автосохранение (handoff: debounce 2 с — здесь компактнее)
  const saveT = useRef(null)
  useEffect(() => {
    clearTimeout(saveT.current)
    saveT.current = setTimeout(() => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch { /* квота */ }
    }, 400)
    return () => clearTimeout(saveT.current)
  }, [state])

  // симуляция фоновой загрузки файлов (presigned multipart в проде — см. handoff)
  useEffect(() => {
    const hasActive = state.apps.some(a => a.files.some(f => f.state === 'progress' || f.state === 'queue'))
    if (!hasActive) return
    const t = setInterval(() => {
      state.apps.forEach(a => {
        // очередь последовательная: один активный файл, остальные ждут (it3)
        let busy = a.files.some(f => f.state === 'progress')
        a.files.forEach(f => {
          if (f.state === 'progress') {
            const pct = Math.min(100, (f.pct || 0) + 3 + Math.round(8 * ((f.id.charCodeAt(2) || 5) % 3) / 3))
            dispatch(f.pct >= 100 || pct >= 100
              ? { type: 'patch-file', id: a.id, fileId: f.id, patch: { state: 'done', pct: 100 } }
              : { type: 'patch-file', id: a.id, fileId: f.id, patch: { pct } })
          } else if (f.state === 'queue' && !busy) {
            busy = true
            dispatch({ type: 'patch-file', id: a.id, fileId: f.id, patch: { state: 'progress', pct: 1 } })
          }
        })
      })
    }, 450)
    return () => clearInterval(t)
  }, [state.apps])

  const [toasts, setToasts] = useState([])
  const toast = (msg) => {
    const id = nextId()
    setToasts(t => [...t, { id, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600)
  }

  const value = useMemo(() => ({ state, dispatch, toast }), [state])
  return (
    <StoreCtx.Provider value={value}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </StoreCtx.Provider>
  )
}

export function useStore() {
  return useContext(StoreCtx)
}

// Все форматы направлений — допустимы в «Синтезе» («несколько форматов»)
export const SYNTH_FORMATS = ['mp3', 'wav', 'mp4', 'pdf', 'png']

// Валидация добавляемого файла под номинацию (it3: ошибка формата / превышение).
// Для «Синтеза» лимит 800 МБ — суммарный по всем материалам заявки.
export function classifyFile(name, sizeMB, nomination, files = []) {
  const nom = NOMINATIONS[nomination] || NOMINATIONS.media
  const ext = (name.split('.').pop() || '').toLowerCase()
  const formats = nom.formats || SYNTH_FORMATS
  if (!formats.includes(ext)) {
    return { state: 'error', errText: `Формат ${ext.toUpperCase()} не поддерживается — загрузи ${(nom.formats || ['MP3', 'WAV', 'MP4', 'PDF', 'PNG'].map(f => f.toLowerCase())).map(f => f.toUpperCase()).join(' или ')}` }
  }
  if (nomination === 'synth') {
    const total = files
      .filter(f => ['done', 'progress', 'queue', 'broken'].includes(f.state))
      .reduce((s, f) => s + (f.sizeMB || 0), 0) + sizeMB
    if (total > nom.maxMB) {
      return { state: 'over', errText: `Суммарный размер материалов превышает ${nom.maxMB} МБ — сожми файлы или приложи ссылку` }
    }
  } else if (sizeMB > nom.maxMB) {
    return { state: 'over', errText: `Файл превышает лимит ${nom.maxMB} МБ — сожми или приложи ссылку` }
  }
  return { state: 'queue', note: 'в очереди — начнётся после текущего файла' }
}

// Загруженные файлы, не подходящие под текущую номинацию (после смены номинации)
export function misfitFiles(app) {
  const nom = app.nomination && NOMINATIONS[app.nomination]
  if (!nom) return []
  const formats = nom.formats || SYNTH_FORMATS
  return app.files.filter(f => {
    if (f.state !== 'done') return false
    const ext = (f.name.split('.').pop() || '').toLowerCase()
    if (!formats.includes(ext)) return true
    if (app.nomination !== 'synth' && f.sizeMB > nom.maxMB) return true
    return false
  })
}
