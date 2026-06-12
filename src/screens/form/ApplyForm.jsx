// Форма заявки «один лист» — структура/копирайт: lk3/it3-form.jsx (+ it3-mobile),
// визуальный стиль: lk3/screens-form.jsx + screens-form-extra.jsx.
// 01 Номинация и работа → 02 Материалы → 03 Команда → 04 Согласия и подача.
// Анкеты в форме нет — участник-бар над формой; 2 согласия; приглашения бессрочны.
import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  useStore, NOMINATIONS, NOMINATION_KEYS, SYNTH_DIR_KEYS,
  computeTodos, sectionState, filledCount, firstNameCity,
  classifyFile, nextId, countSubmitted, APP_LIMIT,
} from '../../state/store.jsx'
import { Nav } from '../../components/Nav.jsx'
import { Field, Chips, Check, FileRow, MemberRow } from '../../components/ui.jsx'

const SECTIONS = [
  ['01', 'Номинация и работа'],
  ['02', 'Материалы'],
  ['03', 'Команда'],
  ['04', 'Согласия и подача'],
]

const nowHM = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

const goTo = (sid) => document.getElementById(sid)?.scrollIntoView({ behavior: 'smooth' })

/* Индикатор готовности секции под кикером */
const SectionTag = ({ st }) => {
  if (!st) return null
  if (st === 'done') return <div className="fst ok" style={{ marginTop: 16, fontSize: 12.5 }}>готово</div>
  const cls = st === 'согласие на проверке' ? 'warn' : 'wait'
  return <div className={'fst ' + cls} style={{ marginTop: 16, fontSize: 12.5 }}>{st}</div>
}

/* Секция «один лист»: kick слева, контент справа */
const FSection = ({ num, title, st, children }) => (
  <div id={'s' + num} className="fsection" style={{ scrollMarginTop: 70 }}>
    <div>
      <div className="kick">{num} / {title}</div>
      <SectionTag st={st} />
    </div>
    <div>{children}</div>
  </div>
)

export default function ApplyForm() {
  const { id } = useParams()
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const app = state.apps.find(a => a.id === id)

  const [cur, setCur] = useState('s01')
  const [over, setOver] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const fileInput = useRef(null)
  const replaceInput = useRef(null)
  const replaceFor = useRef(null)

  // скролл-спай по offsetTop секций s01–s04
  useEffect(() => {
    const ids = ['s01', 's02', 's03', 's04']
    const onScroll = () => {
      const probe = window.scrollY + 170
      let active = 's01'
      ids.forEach(sid => {
        const el = document.getElementById(sid)
        if (el && el.getBoundingClientRect().top + window.scrollY <= probe) active = sid
      })
      setCur(active)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!app) return <Navigate to="/cabinet" replace />
  // форма доступна только для draft / submitted; остальные статусы — в кабинет
  if (['review', 'admitted', 'results'].includes(app.status)) return <Navigate to="/cabinet" replace />

  const patch = (p) => dispatch({ type: 'patch-app', id, patch: { ...p, updatedAt: nowHM() } })
  const touch = () => dispatch({ type: 'patch-app', id, patch: { updatedAt: nowHM() } })

  const todos = computeTodos(app)
  const nomDef = NOMINATIONS[app.nomination] || NOMINATIONS.media
  const filled = filledCount(app)
  const editingSubmitted = app.status === 'submitted'
  const limitReached = !editingSubmitted && countSubmitted(state.apps) >= APP_LIMIT

  /* ── файлы ── */
  const addFiles = (list) => {
    Array.from(list).forEach(file => {
      const sizeMB = Math.max(0.1, file.size / 1048576)
      const cls = classifyFile(file.name, sizeMB, app.nomination || 'media', app.files)
      dispatch({ type: 'add-file', id, file: { id: nextId(), name: file.name, sizeMB, pct: 0, ...cls } })
    })
    touch()
  }
  const openReplace = (fileId) => {
    replaceFor.current = fileId
    replaceInput.current?.click()
  }
  const onReplacePicked = (e) => {
    const file = e.target.files?.[0]
    if (file && replaceFor.current) {
      dispatch({ type: 'remove-file', id, fileId: replaceFor.current })
      addFiles([file])
    }
    replaceFor.current = null
    e.target.value = ''
  }

  /* ── команда ── */
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())
  const sendInvite = () => {
    if (!emailOk) return
    dispatch({ type: 'add-member', id, member: { id: nextId(), name: '', email: inviteEmail.trim(), role: 'member', tag: 'invited' } })
    toast('Приглашение отправлено')
    setInviteEmail('')
    setInviteOpen(false)
    touch()
  }
  const copyInviteLink = () => {
    try {
      navigator.clipboard?.writeText(location.origin + location.pathname + '#/join/' + app.id)?.catch?.(() => {})
    } catch { /* clipboard недоступен — демо */ }
    toast('Ссылка скопирована')
  }

  const submit = () => {
    dispatch({ type: 'submit-app', id })
    nav('/success/' + id)
  }

  return (
    <div className="app-root" style={{ background: 'var(--w)' }}>
      <Nav tab="apps" />

      {/* Участник-бар (it3): анкета живёт в профиле */}
      <div className="pbar">
        Участник: {firstNameCity(state.profile)}
        <button type="button" onClick={() => nav('/profile')}>· изменить в профиле</button>
      </div>

      {/* Мобильные прогресс-чипы (видны < 720px) */}
      <div className="mchips">
        {SECTIONS.map(([num], i) => {
          const sid = 's' + num
          const done = sectionState(app, i + 1) === 'done'
          const isCur = cur === sid
          return (
            <button
              key={num}
              type="button"
              className={'mc' + (isCur ? ' cur' : done ? ' done' : '')}
              onClick={() => goTo(sid)}
            >{num}{done ? ' ✓' : ''}</button>
          )
        })}
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--gray-2)', alignSelf: 'center' }}>{filled} из 4</span>
      </div>

      <div className="sheet" style={{ flex: '1 0 auto' }}>
        {/* Шапка */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, paddingTop: 26 }}>
          <div>
            <span className="kick">{editingSubmitted ? 'Заявка · Подана' : 'Новая заявка · черновик'}</span>
            <h1 className="mega" style={{ fontSize: 'clamp(48px, 8vw, 96px)', marginTop: 14 }}>Подать заявку</h1>
          </div>
          <span className="cluster" style={{ paddingBottom: 8, textAlign: 'right' }}>
            {editingSubmitted ? 'изменения сохраняются' : 'черновик сохранён'} · {app.updatedAt}<br />{app.num}
          </span>
        </div>

        <div className="form-cols" style={{ marginTop: 28 }}>
          {/* Левая якорная навигация (sticky, только десктоп) */}
          <div className="anchor-sticky anchor-desktop">
            <div className="ff-anchor">
              {SECTIONS.map(([num, label], i) => {
                const sid = 's' + num
                const done = sectionState(app, i + 1) === 'done'
                return (
                  <button
                    key={num}
                    type="button"
                    className={'a' + (done ? ' done' : '') + (cur === sid ? ' cur' : '')}
                    onClick={() => goTo(sid)}
                  ><span className="n">{num}</span> {label}</button>
                )
              })}
            </div>
            <div className="cluster" style={{ marginTop: 20 }}>
              <span className="lab">Готовность</span><br />
              заполнено {filled} из 4{todos.length === 0 ? ' · можно подавать' : ''}
            </div>
            <div className="ff-hint" style={{ marginTop: 10 }}>Черновик сохраняется автоматически.</div>
          </div>

          {/* Правая колонка — секции */}
          <div>
            {/* 01 ── Номинация и работа */}
            <FSection num="01" title="Номинация и работа" st={sectionState(app, 1)}>
              <Chips
                options={NOMINATION_KEYS.map(k => ({ key: k, label: NOMINATIONS[k].label }))}
                value={app.nomination}
                onChange={k => patch({ nomination: k, synthDirs: [] })}
              />
              {app.nomination && <div className="ff-hint" style={{ marginTop: 12 }}>{NOMINATIONS[app.nomination].req}</div>}
              {app.nomination === 'synth' && (
                <div>
                  <span className="ff-label" style={{ marginTop: 18 }}>Направления внутри синтеза · минимум 2</span>
                  <Chips
                    multi
                    options={SYNTH_DIR_KEYS.map(k => ({ key: k, label: NOMINATIONS[k].label }))}
                    value={app.synthDirs}
                    onChange={dirs => patch({ synthDirs: dirs })}
                  />
                </div>
              )}
              <div style={{ display: 'grid', gap: 18, marginTop: 22 }}>
                <Field
                  label="Название работы"
                  value={app.title}
                  placeholder="«Название»"
                  onChange={v => patch({ title: v })}
                />
                <Field
                  area
                  label="Описание работы"
                  value={app.description}
                  hint="Публичное — видно в каталоге работ фестиваля."
                  count={`${app.description.length} / 1000`}
                  max={1000}
                  onChange={v => patch({ description: v })}
                />
              </div>
            </FSection>

            {/* 02 ── Материалы */}
            <FSection num="02" title="Материалы" st={sectionState(app, 2)}>
              <div className="ff-hint">
                {nomDef.fmt}. Файлов может быть несколько. Загрузка идёт в фоне — заполняй дальше.
              </div>
              {app.files.length > 0 && (
                <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
                  {app.files.map(f => (
                    <FileRow
                      key={f.id}
                      file={f}
                      onResume={() => { dispatch({ type: 'patch-file', id, fileId: f.id, patch: { state: 'progress' } }); touch() }}
                      onRemove={() => { dispatch({ type: 'remove-file', id, fileId: f.id }); touch() }}
                      onReplace={() => openReplace(f.id)}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                className={'ff-drop' + (over ? ' over' : '')}
                style={{ marginTop: 12 }}
                onClick={() => fileInput.current?.click()}
                onDragOver={e => { e.preventDefault(); setOver(true) }}
                onDragLeave={() => setOver(false)}
                onDrop={e => { e.preventDefault(); setOver(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files) }}
              >
                <div style={{ fontSize: 15.5, color: 'var(--ink)' }}>Перетащи файлы или нажми для выбора</div>
                <div className="ff-hint" style={{ marginTop: 4 }}>{nomDef.fmt}</div>
              </button>
              <input
                ref={fileInput} type="file" multiple style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }}
              />
              <input ref={replaceInput} type="file" style={{ display: 'none' }} onChange={onReplacePicked} />
              {app.files.some(f => f.state === 'over') && (
                <div style={{ marginTop: 14 }}>
                  <Field
                    label="Ссылка на файлы"
                    value={app.link}
                    placeholder="https://…"
                    hint="Открытый доступ по ссылке. Фонд сохраняет копию при подаче — замена файла по ссылке после этого равнозначна отзыву заявки."
                    onChange={v => patch({ link: v })}
                  />
                </div>
              )}
            </FSection>

            {/* 03 ── Команда */}
            <FSection num="03" title="Команда" st={sectionState(app, 3)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <Chips
                  options={[{ key: 'solo', label: 'Одному' }, { key: 'team', label: 'С командой' }]}
                  value={app.mode}
                  onChange={m => { patch({ mode: m }); if (m === 'team') dispatch({ type: 'ensure-captain', id }) }}
                />
                <span className="ff-hint">
                  {app.mode === 'solo'
                    ? `участвуешь как ${state.profile.fio}`
                    : 'приглашённые подтверждают участие со своего email'}
                </span>
              </div>

              {app.mode === 'team' && (
                <>
                  <div style={{ marginTop: 16 }}>
                    <Field
                      label="Название команды"
                      value={app.teamName}
                      placeholder="«Название»"
                      onChange={v => patch({ teamName: v })}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 12.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--gray-2)' }}>Участники</span>
                    <span className="ff-hint">подать заявку можно, когда все приглашённые ответили</span>
                  </div>
                  <div style={{ display: 'grid', gap: 9, marginTop: 10 }}>
                    {app.members.map(m => (
                      <MemberRow
                        key={m.id}
                        member={m}
                        you={m.role === 'captain'}
                        onRemove={m.role !== 'captain' ? () => { dispatch({ type: 'remove-member', id, memberId: m.id }); touch() } : undefined}
                        onRemind={m.tag === 'invited' ? () => toast('Напомнили ' + m.email) : undefined}
                      />
                    ))}
                  </div>

                  <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" className="fbtn sm line" onClick={() => setInviteOpen(o => !o)}>+ Пригласить по email</button>
                    <button type="button" className="fbtn sm line" onClick={copyInviteLink}>Скопировать ссылку-приглашение</button>
                  </div>
                  {inviteOpen && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <input
                        className="ff-input"
                        style={{ minHeight: 44, padding: '10px 14px', flex: 1 }}
                        placeholder="email участника"
                        type="email"
                        value={inviteEmail}
                        autoFocus
                        onChange={e => setInviteEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') sendInvite() }}
                      />
                      <button type="button" className={'fbtn sm' + (emailOk ? '' : ' disabled')} onClick={sendInvite}>Пригласить</button>
                    </div>
                  )}
                  <div className="ff-hint" style={{ marginTop: 12 }}>
                    Приглашение бессрочно. Участник может пересылать ссылку другим, но каждый должен подтвердить участие со своего email.
                  </div>
                </>
              )}
            </FSection>

            {/* 04 ── Согласия и подача */}
            <FSection num="04" title="Согласия и подача" st={sectionState(app, 4)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Check on={app.consents[0]} onChange={v => patch({ consents: [v, app.consents[1]] })}>
                  С правилами фестиваля ознакомлен и согласен — <a onClick={e => e.stopPropagation()}>Положение</a>
                </Check>
                <Check on={app.consents[1]} onChange={v => patch({ consents: [app.consents[0], v] })}>
                  Предоставляю неисключительную лицензию на использование материалов — <a onClick={e => e.stopPropagation()}>Положение, раздел 11</a>
                </Check>
              </div>
            </FSection>
          </div>
        </div>

        {/* Sticky-футер подачи */}
        <div className="ff-foot">
          {editingSubmitted ? (
            <button type="button" className="mlink" onClick={() => nav('/cabinet')}>← в кабинет</button>
          ) : (
            <button type="button" className="fbtn sm line" onClick={() => { touch(); toast('Черновик сохранён') }}>Сохранить черновик</button>
          )}
          <span className="todo" style={{ marginLeft: 'auto' }}>
            {limitReached ? (
              <span className="cluster" style={{ color: 'var(--gray-2)' }}>достигнут лимит — 2 заявки на участника</span>
            ) : todos.length === 0 ? (
              <span className="cluster" style={{ color: 'var(--ink)' }}>всё заполнено · заявку можно подать</span>
            ) : (
              <span className="cluster" style={{ color: 'var(--gray-2)' }}>
                Осталось:{' '}
                {todos.map((t, i) => (
                  <React.Fragment key={t.label + i}>
                    {i > 0 && ' · '}
                    <button type="button" onClick={() => goTo(t.anchor)}>{t.label}</button>
                  </React.Fragment>
                ))}
              </span>
            )}
          </span>
          {editingSubmitted ? (
            todos.length === 0 ? (
              <button type="button" className="fbtn" onClick={() => { toast('Изменения сохранены'); nav('/cabinet') }}>Сохранить изменения</button>
            ) : (
              <span className="fbtn dark" style={{ color: '#fff', fontWeight: 400, opacity: .45, cursor: 'default' }}>Сохранить изменения</span>
            )
          ) : todos.length === 0 && !limitReached ? (
            <button type="button" className="fbtn" onClick={submit}>Подать заявку</button>
          ) : (
            <span className="fbtn dark" style={{ color: '#fff', fontWeight: 400, opacity: .45, cursor: 'default' }}>Подать заявку</span>
          )}
        </div>
      </div>

    </div>
  )
}
