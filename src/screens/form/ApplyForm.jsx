// Форма заявки «один лист» — структура/копирайт: lk3/it3-form.jsx (+ it3-mobile),
// визуальный стиль: lk3/screens-form.jsx + screens-form-extra.jsx.
// 01 Номинация → 02 Работа → 03 Команда → 04 Согласия и подача.
// Анкеты в форме нет — участник-бар над формой; 2 согласия; приглашения бессрочны.
import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  useStore, NOMINATIONS, SYNTH_DIR_KEYS,
  computeTodos, sectionState, filledCount, firstNameCity, fullName,
  classifyFile, nextId, countSubmitted, APP_LIMIT,
} from '../../state/store.jsx'
import { NomCard, SynthCard, NOM_CARD_KEYS } from '../../components/NominationCards.jsx'
import { Nav } from '../../components/Nav.jsx'
import { Field, Chips, Check, FileRow, MemberRow } from '../../components/ui.jsx'
import { vEmail } from '../../state/validation.js'

const SECTIONS = [
  ['01', 'Номинация'],
  ['02', 'Работа'],
  ['03', 'Команда'],
  ['04', 'Согласия и подача'],
]

const nowHM = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

const goTo = (sid) => document.getElementById(sid)?.scrollIntoView({ behavior: 'smooth' })

/* Индикатор готовности секции под кикером */
const SectionTag = ({ st }) => {
  if (!st) return null
  if (st === 'done') return <div className="fst ok" style={{ marginTop: 'var(--sp-4)', fontSize: 12.5 }}>готово</div>
  const cls = st === 'согласие на проверке' ? 'warn' : 'wait'
  return <div className={'fst ' + cls} style={{ marginTop: 'var(--sp-4)', fontSize: 12.5 }}>{st}</div>
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
  const inviteErr = (vEmail(inviteEmail) || {}).error || null
  const emailOk = !inviteErr
  const showInviteErr = inviteEmail.trim() && inviteErr
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

  const statusHint = limitReached ? (
    <span className="cluster" style={{ color: 'var(--gray-2)' }}>ты подал 2 заявки — это максимум. Чтобы освободить место, отзови одну в кабинете.</span>
  ) : todos.length === 0 ? (
    <span className="cluster" style={{ color: 'var(--ink)' }}>всё готово — можно подавать заявку</span>
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
  )

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
        <div className="rule-strong" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--sp-6)', paddingTop: 'var(--sp-6)' }}>
          <div>
            <span className="kick">{editingSubmitted ? 'Заявка · Подана' : 'Новая заявка · черновик'}</span>
            <h1 style={{ fontSize: 'clamp(40px, 6.5vw, 76px)', fontWeight: 500, letterSpacing: '-.04em', lineHeight: .9, marginTop: 'var(--sp-3)' }}>Подать заявку</h1>
          </div>
          <span className="cluster" style={{ paddingBottom: 'var(--sp-2)', textAlign: 'right' }}>
            {editingSubmitted ? 'изменения сохранены' : 'черновик сохранён'} · {app.updatedAt}<br />{app.num}
          </span>
        </div>

        <div className="form-cols" style={{ marginTop: 'var(--sp-7)' }}>
          {/* Левая колонка — секции */}
          <div>
            {/* 01 ── Номинация */}
            <FSection num="01" title="Номинация" st={sectionState(app, 1)}>
              <div className="nom-grid">
                {NOM_CARD_KEYS.map(k => (
                  <NomCard
                    key={k}
                    k={k}
                    selected={app.nomination === k}
                    onClick={kk => patch({ nomination: kk, synthDirs: [] })}
                  />
                ))}
              </div>
              <SynthCard
                selected={app.nomination === 'synth'}
                onClick={() => patch({ nomination: 'synth' })}
              >
                <span className="ff-label" style={{ color: 'var(--accent-2)', marginBottom: 'var(--sp-2)' }}>
                  Направления внутри синтеза · минимум 2
                  {app.synthDirs.length > 0 && app.synthDirs.length < 2 && ' · выбрано 1'}
                </span>
                <Chips
                  multi
                  options={SYNTH_DIR_KEYS.map(k => ({ key: k, label: NOMINATIONS[k].label }))}
                  value={app.synthDirs}
                  onChange={dirs => patch({ synthDirs: dirs })}
                />
              </SynthCard>
            </FSection>

            {/* 02 ── Работа */}
            <FSection num="02" title="Работа" st={sectionState(app, 2)}>
              <div style={{ display: 'grid', gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
                <Field
                  label="Название работы"
                  value={app.title}
                  placeholder="Например: Город, которого нет"
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
              <div className="ff-hint">
                {nomDef.fmt}. Можно загрузить несколько файлов. Загрузка идёт в фоне — заполняй заявку дальше.
              </div>
              {app.files.length > 0 && (
                <div style={{ display: 'grid', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
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
                style={{ marginTop: 'var(--sp-3)' }}
                onClick={() => fileInput.current?.click()}
                onDragOver={e => { e.preventDefault(); setOver(true) }}
                onDragLeave={() => setOver(false)}
                onDrop={e => { e.preventDefault(); setOver(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files) }}
              >
                <div style={{ fontSize: 15.5, color: 'var(--ink)' }}>Перетащи файлы или нажми для выбора</div>
                <div className="ff-hint" style={{ marginTop: 'var(--sp-1)' }}>{nomDef.fmt}</div>
              </button>
              <input
                ref={fileInput} type="file" multiple style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }}
              />
              <input ref={replaceInput} type="file" style={{ display: 'none' }} onChange={onReplacePicked} />
              {app.files.some(f => f.state === 'over') && (
                <div style={{ marginTop: 'var(--sp-3)' }}>
                  <Field
                    label="Ссылка на файлы"
                    value={app.link}
                    placeholder="https://…"
                    hint="Открой доступ к файлам по ссылке для всех. При подаче мы сохраним копию. Важно: если поменяешь файл по ссылке после подачи, заявка считается отозванной — оставь всё как есть."
                    onChange={v => patch({ link: v })}
                  />
                </div>
              )}
            </FSection>

            {/* 03 ── Команда */}
            <FSection num="03" title="Команда" st={sectionState(app, 3)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
                <Chips
                  options={[{ key: 'solo', label: 'Одному' }, { key: 'team', label: 'С командой' }]}
                  value={app.mode}
                  onChange={m => { patch({ mode: m }); if (m === 'team') dispatch({ type: 'ensure-captain', id }) }}
                />
                <span className="ff-hint">
                  {app.mode === 'solo'
                    ? `участвуешь как ${fullName(state.profile)}`
                    : 'приглашённые подтверждают участие со своего email'}
                </span>
              </div>

              {app.mode === 'team' && (
                <>
                  <div style={{ marginTop: 'var(--sp-4)' }}>
                    <Field
                      label="Название команды"
                      value={app.teamName}
                      placeholder="Например: Северный ветер"
                      onChange={v => patch({ teamName: v })}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 12.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--gray-2)' }}>Участники</span>
                    <span className="ff-hint">подать заявку можно, когда все приглашённые ответили</span>
                  </div>
                  <div style={{ display: 'grid', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
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

                  <div style={{ marginTop: 'var(--sp-3)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    <button type="button" className="fbtn sm line" onClick={() => setInviteOpen(o => !o)}>+ Пригласить по email</button>
                    <button type="button" className="fbtn sm line" onClick={copyInviteLink}>Скопировать ссылку-приглашение</button>
                  </div>
                  {inviteOpen && (
                    <div style={{ marginTop: 'var(--sp-3)' }}>
                      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                        <input
                          className={'ff-input' + (showInviteErr ? ' err' : '')}
                          style={{ minHeight: 44, padding: 'var(--sp-2) var(--sp-3)', flex: 1 }}
                          placeholder="name@mail.ru"
                          type="email"
                          value={inviteEmail}
                          autoFocus
                          onChange={e => setInviteEmail(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') sendInvite() }}
                        />
                        <button type="button" className={'fbtn sm' + (emailOk ? '' : ' disabled')} onClick={sendInvite}>Пригласить</button>
                      </div>
                      {showInviteErr && <div className="ff-err">{inviteErr}</div>}
                    </div>
                  )}
                  <div className="ff-hint" style={{ marginTop: 'var(--sp-3)' }}>
                    Приглашение бессрочно. Участник может пересылать ссылку другим, но каждый должен подтвердить участие со своего email.
                  </div>
                </>
              )}
            </FSection>

            {/* 04 ── Согласия и подача */}
            <FSection num="04" title="Согласия и подача" st={sectionState(app, 4)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <Check on={app.consents[0]} onChange={v => patch({ consents: [v, app.consents[1]] })}>
                  С правилами фестиваля ознакомлен и согласен — <a onClick={e => e.stopPropagation()}>Положение</a>
                </Check>
                <Check on={app.consents[1]} onChange={v => patch({ consents: [app.consents[0], v] })}>
                  Предоставляю неисключительную лицензию на использование материалов — <a onClick={e => e.stopPropagation()}>Положение, раздел 11</a>
                </Check>
              </div>
            </FSection>
          </div>

          {/* Правая якорная навигация (sticky, только десктоп) */}
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
            <div className="cluster" style={{ marginTop: 'var(--sp-5)' }}>
              <span className="lab">Готовность</span><br />
              заполнено {filled} из 4{todos.length === 0 ? ' · можно подавать' : ''}
            </div>
            <div className="ff-hint" style={{ marginTop: 'var(--sp-2)' }}>Черновик сохраняется автоматически.</div>
          </div>
        </div>

        {/* Sticky-футер подачи */}
        <div className="ff-foot">
          {editingSubmitted ? (
            <>
              <button type="button" className="mlink" onClick={() => nav('/cabinet')}>← в кабинет</button>
              <span className="todo" style={{ marginLeft: 'auto' }}>{statusHint}</span>
              {todos.length === 0 ? (
                <button type="button" className="fbtn" onClick={() => { toast('Изменения сохранены'); nav('/cabinet') }}>Сохранить изменения</button>
              ) : (
                <span className="fbtn dark" style={{ color: '#fff', fontWeight: 400, opacity: .45, cursor: 'default' }}>Сохранить изменения</span>
              )}
            </>
          ) : (
            <>
              {todos.length === 0 && !limitReached ? (
                <button type="button" className="fbtn" onClick={submit}>Подать заявку</button>
              ) : (
                <span className="fbtn dark" style={{ color: '#fff', fontWeight: 400, opacity: .45, cursor: 'default' }}>Подать заявку</span>
              )}
              <span className="todo">{statusHint}</span>
              <button type="button" className="fbtn sm line" style={{ marginLeft: 'auto' }} onClick={() => { touch(); toast('Черновик сохранён') }}>Сохранить черновик</button>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
