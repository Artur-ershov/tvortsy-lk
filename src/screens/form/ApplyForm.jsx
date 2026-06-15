// Форма заявки «один лист» — структура/копирайт: lk3/it3-form.jsx (+ it3-mobile),
// визуальный стиль: lk3/screens-form.jsx + screens-form-extra.jsx.
// 01 Номинация → 02 Работа → 03 Команда → 04 Согласия и подача.
// Анкеты в форме нет — личные данные живут в профиле; 2 согласия; приглашения бессрочны.
import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  useStore, NOMINATIONS, SYNTH_DIR_KEYS,
  computeTodos, sectionState, filledCount, fullName, initialsOf,
  classifyFile, nextId, countUsed, canSubmit, APP_LIMIT, takenNominations,
  isSenior, teamSeniorStat, fileMisfit,
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
  if (st === 'done') return <div className="fst ok" style={{ marginTop: 'var(--sp-4)', fontSize: 'var(--fs-xs)' }}>готово</div>
  const cls = st === 'согласие на проверке' ? 'warn' : 'wait'
  return <div className={'fst ' + cls} style={{ marginTop: 'var(--sp-4)', fontSize: 'var(--fs-xs)' }}>{st}</div>
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
  const [saving, setSaving] = useState(false) // короткая «вспышка» автосохранения после правки
  const fileInput = useRef(null)
  const replaceInput = useRef(null)
  const replaceFor = useRef(null)
  const saveTimer = useRef(null)
  useEffect(() => () => clearTimeout(saveTimer.current), [])

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
  // форма доступна только для черновика — после подачи заявка не редактируется (временно)
  if (app.status !== 'draft') return <Navigate to="/cabinet" replace />
  // старше 35 не может вести собственную заявку — только участвовать в чужой команде
  if (isSenior(state.profile.dob)) return <Navigate to="/cabinet" replace />

  // любая правка сразу пишется в стор (автосейв в localStorage, дебаунс 400 мс) —
  // markSaving даёт видимую обратную связь: «Сохраняем…» → «Черновик сохранён · HH:MM»
  const markSaving = () => {
    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setSaving(false), 600)
  }
  const patch = (p) => { markSaving(); dispatch({ type: 'patch-app', id, patch: { ...p, updatedAt: nowHM() } }) }
  const touch = () => { markSaving(); dispatch({ type: 'patch-app', id, patch: { updatedAt: nowHM() } }) }

  const todos = computeTodos(app)
  const nomDef = NOMINATIONS[app.nomination] || NOMINATIONS.media
  const filled = filledCount(app)
  const limitReached = countUsed(state, state.email, app.id) >= APP_LIMIT
  // одна заявка на номинацию: номинации, занятые другими поданными заявками участника
  const taken = takenNominations(state.apps, state.email, app.id)
  const nomTaken = app.nomination && taken.includes(app.nomination)
  // возрастное правило: в команде старше 35 — не более доли состава
  const teamSenior = app.mode === 'team' ? teamSeniorStat(app.members) : { count: 0, max: 0, over: false }
  const seniorOver = teamSenior.over

  /* ── файлы ── */
  const addFiles = (list) => {
    Array.from(list).forEach(file => {
      const sizeMB = Math.max(0.1, file.size / 1048576)
      const cls = classifyFile(file.name, sizeMB, app.nomination || 'media', app.files)
      dispatch({ type: 'add-file', id, file: { id: crypto.randomUUID(), name: file.name, sizeMB, pct: 0, ...cls } })
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
      navigator.clipboard?.writeText(location.origin + '/join/' + app.id)?.catch?.(() => {})
    } catch { /* clipboard недоступен — демо */ }
    toast('Ссылка скопирована')
  }

  const submit = () => {
    // подаём только если подача валидна — иначе остаёмся в форме (видно, что осталось заполнить)
    if (!canSubmit(app, state)) return
    // дату/время фиксируем здесь и передаём в payload (позже их даст ответ сервера)
    const now = new Date()
    dispatch({
      type: 'submit-app',
      id,
      submittedAt: now.toLocaleDateString('ru-RU'),
      submittedTime: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    })
    // единственный переход на «Заявка подана» — позже сюда встанет момент успешного ответа сервера
    nav('/success/' + id)
  }

  const statusHint = limitReached ? (
    <span className="cluster" style={{ color: 'var(--gray-2)' }}>у тебя уже 2 заявки — это максимум (считаются и команды по приглашению). Чтобы освободить место, <button type="button" onClick={() => nav('/cabinet')}>отзови заявку или выйди из команды</button>.</span>
  ) : nomTaken ? (
    <span className="cluster" style={{ color: 'var(--gray-2)' }}>в номинации «{nomDef.label}» у тебя уже есть поданная заявка — выбери другую номинацию или <button type="button" onClick={() => nav('/cabinet')}>отзови ту в кабинете</button>.</span>
  ) : seniorOver ? (
    <span className="cluster" style={{ color: 'var(--gray-2)' }}>старше 35 в команде — {teamSenior.count} из {teamSenior.max} допустимых: оставь не более 20% состава, чтобы подать заявку.</span>
  ) : canSubmit(app, state) ? (
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
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 'var(--fs-2xs)', color: 'var(--gray-2)', alignSelf: 'center' }}>{filled} из 4</span>
      </div>

      <div className="sheet" style={{ flex: '1 0 auto' }}>
        {/* Шапка */}
        <div className="rule-strong" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--sp-6)', paddingTop: 'var(--sp-6)' }}>
          <div>
            <span className="kick">Новая заявка · черновик</span>
            <h1 style={{ fontSize: 'clamp(40px, 6.5vw, 76px)', fontWeight: 500, letterSpacing: '-.04em', lineHeight: .9, marginTop: 'var(--sp-3)' }}>Подать заявку</h1>
          </div>
          <div className="cluster" style={{ paddingBottom: 'var(--sp-2)', textAlign: 'right' }}>
            <span className={'savemark' + (saving ? ' saving' : '')}>
              {saving ? 'Сохраняем…' : `Черновик сохранён · ${app.updatedAt}`}
            </span>
            <br />{app.num}
          </div>
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
                    disabled={taken.includes(k)}
                    onClick={kk => patch({ nomination: kk, synthDirs: [] })}
                  />
                ))}
              </div>
              <SynthCard
                selected={app.nomination === 'synth'}
                disabled={taken.includes('synth')}
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
                  {app.files.map(f => {
                    // после смены номинации загруженный файл может перестать подходить —
                    // показываем его ошибкой (формат) / превышением (размер), а не галочкой
                    const mis = fileMisfit(app, f)
                    return (
                      <FileRow
                        key={f.id}
                        file={mis ? { ...f, ...mis } : f}
                        onResume={() => { dispatch({ type: 'patch-file', id, fileId: f.id, patch: { state: 'progress' } }); touch() }}
                        onRemove={() => { dispatch({ type: 'remove-file', id, fileId: f.id }); touch() }}
                        onReplace={() => openReplace(f.id)}
                      />
                    )
                  })}
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
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--ink)' }}>Перетащи файлы или нажми для выбора</div>
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
                  onChange={m => { patch({ mode: m }); if (m === 'team') dispatch({ type: 'ensure-captain', id, captainId: crypto.randomUUID() }) }}
                />
                <span className="ff-hint">
                  {app.mode === 'solo'
                    ? 'данные участника берутся из профиля'
                    : 'приглашённые подтверждают участие со своего email'}
                </span>
              </div>

              {app.mode === 'solo' && (
                <div style={{ marginTop: 'var(--sp-4)' }}>
                  <div className="member-row" style={{ gap: 'var(--sp-3)' }}>
                    <span className="init">{initialsOf(fullName(state.profile)) || '··'}</span>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 500 }}>{fullName(state.profile) || 'Участник'}</div>
                      <div className="cluster" style={{ color: 'var(--gray-2)', marginTop: 2 }}>
                        {[state.profile.city, state.email].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <button type="button" className="mlink" onClick={() => nav('/profile')}>изменить в профиле</button>
                  </div>
                  <div className="solo-facts" style={{ marginTop: 'var(--sp-4)' }}>
                    {[
                      ['Дата рождения', state.profile.dob],
                      ['Телефон', state.profile.phone],
                      ['Национальность', state.profile.nationality],
                      ['Место работы / учёбы', state.profile.work],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-3)', borderBottom: '1px solid var(--line)', padding: 'var(--sp-2) 0' }}>
                        <span className="cluster" style={{ color: 'var(--gray-2)' }}>{label}</span>
                        <span style={{ fontSize: 'var(--fs-sm)', textAlign: 'right', overflowWrap: 'anywhere' }}>{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ff-hint" style={{ marginTop: 'var(--sp-3)' }}>
                    Эти данные подставятся в заявку из профиля — менять их можно там.
                  </div>
                </div>
              )}

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
                    <span className="mono" style={{ fontSize: 'var(--fs-xs)', letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--gray-2)' }}>Участники</span>
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

                  {/* Доля старше 35 — появляется, только когда такой участник в команде есть */}
                  {teamSenior.count > 0 && (
                    <div className={'fst ' + (teamSenior.over ? 'err' : 'warn')} style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}>
                      старше 35 — {teamSenior.count} из {teamSenior.max} допустимых
                      {teamSenior.over && ' · убери лишних: старше 35 можно не более 20% состава'}
                    </div>
                  )}

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
                  С правилами фестиваля ознакомлен и согласен — <a href="/docs/polozheniye.html" target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>Положение</a>
                </Check>
                <Check on={app.consents[1]} onChange={v => patch({ consents: [app.consents[0], v] })}>
                  Предоставляю неисключительную лицензию на использование материалов — <a href="/docs/polozheniye.html#s11" target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>Положение, раздел 11</a>
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
          {canSubmit(app, state) ? (
            <button type="button" className="fbtn" onClick={submit}>Подать заявку</button>
          ) : (
            <span className="fbtn dark" style={{ color: '#fff', fontWeight: 400, opacity: .45, cursor: 'default' }}>Подать заявку</span>
          )}
          <span className="todo">{statusHint}</span>
          <span className={'ff-save savemark' + (saving ? ' saving' : '')}>
            {saving ? 'Сохраняем…' : `Сохранено · ${app.updatedAt}`}
          </span>
        </div>
      </div>

    </div>
  )
}
