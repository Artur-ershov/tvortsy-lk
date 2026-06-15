// Кабинет «один лист» — визуал FgV9/ScrCabEmpty, флоу it3-cabinet
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useStore, NOMINATIONS, APP_LIMIT, newDraft, countUsed, filledCount, shortName, isSenior,
} from '../../state/store.jsx'
import { Nav } from '../../components/Nav.jsx'
import { Pix, PIX_A, StatusTag, StatusTimeline, Modal } from '../../components/ui.jsx'

/* Склонения */
const memberWord = (n) => {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'участник'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'участника'
  return 'участников'
}
const draftWord = (n) => {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'черновик'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'черновика'
  return 'черновиков'
}

/* Пояснение статуса в правой колонке */
const SIDE_NOTE = {
  submitted: 'Заявка принята. До результата проверки её можно отозвать.',
  review: 'Заявка на проверке. До результата её можно отозвать.',
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
    // правило «2 на всё»: членство тоже занимает слот — без свободного места приглашение не принять
    if (countUsed(state, state.email, app.id) >= APP_LIMIT) {
      toast('У тебя уже 2 заявки — освободи место, чтобы вступить в команду')
      return
    }
    dispatch({ type: 'respond-invite', id: app.id, tag: 'confirmed', memberId: crypto.randomUUID() })
    toast(`Готово — ты в команде «${app.teamName}»`)
  }
  const declineInvite = (app) => {
    dispatch({ type: 'respond-invite', id: app.id, tag: 'declined' })
    toast('Приглашение отклонено')
  }

  const submitted = own.filter(a => a.status !== 'draft')
  const drafts = own.filter(a => a.status === 'draft')
  // «2 на всё»: слот занимают и свои поданные, и принятые приглашения в команды
  const subCount = countUsed(state, state.email)
  const limitReached = subCount >= APP_LIMIT
  // старше 35: самостоятельную заявку подать нельзя — только участие в команде по приглашению
  const senior = isSenior(state.profile.dob)

  const [withdrawApp, setWithdrawApp] = useState(null) // заявка для модалки «Отозвать»
  const [deleteDraft, setDeleteDraft] = useState(null) // черновик для модалки удаления
  const [leaveApp, setLeaveApp] = useState(null)       // команда для модалки «Покинуть»

  // «Подать заявку» → сразу форма; номинация выбирается уже внутри формы (необязательна тут).
  // С карточки витрины можно прийти с предвыбранной номинацией.
  const startApply = (nom = null) => {
    if (senior) { toast('Старше 35 — участвовать можно только в команде по приглашению'); return }
    const d = { ...newDraft('ТВ-2026-0' + state.appSeq), nomination: nom }
    dispatch({ type: 'create-draft', draft: d })
    nav('/apply/' + d.id)
  }
  const reopen = (id) => {
    dispatch({ type: 'reopen-app', id })
    nav('/apply/' + id)
  }

  const meta = [
    `${subCount} из ${APP_LIMIT} заявок`,
    drafts.length ? `${drafts.length} ${draftWord(drafts.length)}` : null,
  ].filter(Boolean).join(' · ')

  let sectionIdx = 0 // для marginTop: первая секция 52, дальше 10 (паддинг 30 даёт зазор 40 как в FgV9)
  const secTop = () => (sectionIdx++ === 0 ? 52 : 10)

  return (
    <div className="app-root">
      <Nav tab="apps" />
      <div className="sheet" style={{ flex: '1 0 auto' }}>

        {/* Шапка листа: кикер → заголовок → мета слева, действие справа (как в шапке формы) */}
        <div className="rule-strong cab-head">
          <div className="cab-head-row">
            <div className="cab-head-title">
              <h1 style={{ margin: 0, fontSize: 'clamp(40px, 6.5vw, 76px)', fontWeight: 500, letterSpacing: '-.04em', lineHeight: .9 }}>
                Заявки
              </h1>
            </div>
            {senior ? (
              <div className="cab-head-limit">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)', background: 'var(--sky)', color: 'var(--ink-blue)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-2) var(--sp-4)', fontWeight: 500, fontSize: 'var(--fs-base)' }}>Только в команде</span>
                <span className="ff-hint">тебе больше 35 — самостоятельную заявку подать нельзя, но можно участвовать в команде по приглашению капитана</span>
              </div>
            ) : limitReached ? (
              <div className="cab-head-limit">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)', background: 'var(--sky)', color: 'var(--ink-blue)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-2) var(--sp-4)', fontWeight: 500, fontSize: 'var(--fs-base)' }}>Все места заняты · 2 из 2</span>
                <span className="ff-hint">оба места заняты — чтобы подать новую, освободи одно: отзови заявку или выйди из команды</span>
              </div>
            ) : (
              <button className="fbtn" onClick={() => startApply()}>+ Подать заявку</button>
            )}
          </div>
          {meta && <div className="meta" style={{ marginTop: 'var(--sp-4)' }}>{meta}</div>}
        </div>

        {/* Приглашение в команду — карточкой над своими заявками: единственный пункт списка,
           инициированный не тобой, на том конце ждут ответа → выше черновиков и поданных работ.
           Видно даже если письмо со ссылкой /join потерялось; полная витрина — по «о приглашении». */}
        {invites.map(app => {
          const captain = app.members.find(m => m.role === 'captain')
          return (
            <div key={'inv' + app.id} className="rule-soft cab-section" style={{ marginTop: secTop() }}>
              <div>
                <span className="kick">Приглашение</span>
                <div className="jbm" style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-2)', marginTop: 'var(--sp-3)', lineHeight: 1.7 }}>
                  {app.num}<br />
                  капитан {captain ? shortName(captain.name) : '—'}<br />
                  {app.nomination ? NOMINATIONS[app.nomination].label.toLowerCase() : ''} · {app.members.length} {memberWord(app.members.length)}
                </div>
              </div>
              <div>
                <button
                  type="button"
                  className="cab-title-link"
                  style={{ fontSize: 'var(--fs-3xl)', fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1, textAlign: 'left' }}
                  onClick={() => nav('/view/' + app.id)}
                  title="Посмотреть заявку команды"
                >
                  «{app.teamName}» · {app.title || 'Без названия'}
                </button>
                <div className="ff-hint" style={{ marginTop: 'var(--sp-2)' }}>
                  {captain ? shortName(captain.name) : 'Капитан'} зовёт тебя в команду. Открой заявку, чтобы посмотреть работу и состав. Примешь — участие закрепится за твоей почтой, а дальше её ведёт и подаёт капитан.
                </div>
                <div className="cluster" style={{ color: 'var(--gray-2)', marginTop: 'var(--sp-2)' }}>
                  Приглашение бессрочно — ответить можно позже.
                </div>
              </div>
              <div className="cab-side">
                <span className="fst wait">Ждёт ответа</span>
                <button className="fbtn sm" onClick={() => acceptInvite(app)}>Принять</button>
                <button className="fbtn sm line" onClick={() => declineInvite(app)}>Отклонить</button>
                <button className="mlink" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/join/' + app.id)}>о приглашении</button>
              </div>
            </div>
          )
        })}

        {/* Пустое состояние — спокойный экран: одна задача (подать заявку) + подсказка про приглашения */}
        {own.length === 0 && invites.length === 0 && memberships.length === 0 && !senior && (
          <div className="rule-soft" style={{ marginTop: 'var(--sp-10)', paddingTop: 'var(--sp-10)', paddingBottom: 'var(--sp-12)' }}>
            <div style={{ border: '1.5px dashed rgba(0,0,0,.18)', borderRadius: 'var(--r-lg)', padding: '56px var(--sp-10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-4)', textAlign: 'center' }}>
              <Pix map={PIX_A} cell={20} gap={5} />
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 500, letterSpacing: '-.02em' }}>Заявок пока нет</div>
              <p style={{ margin: 0, fontSize: 'var(--fs-base)', lineHeight: 1.5, color: 'var(--gray-2)', maxWidth: 460 }}>
                Подать работу — минут на десять: выбираешь номинацию, описываешь идею, прикладываешь файлы. Черновик сохраняется сам, заполнять можно в несколько подходов.
              </p>
              <button className="fbtn" style={{ marginTop: 'var(--sp-2)' }} onClick={() => startApply()}>Подать заявку</button>
              <span className="cluster" style={{ color: 'var(--gray-2)' }}>одному или с командой · 14–35 лет · до 2 заявок · бесплатно</span>
            </div>
            <p style={{ margin: 'var(--sp-5) auto 0', textAlign: 'center', maxWidth: 460, fontSize: 'var(--fs-sm)', lineHeight: 1.45, color: 'var(--gray-2)' }}>
              Тебя позвали в команду? Приглашение появится здесь — даже если письмо потерялось.
            </p>
          </div>
        )}

        {/* Пустое состояние для 35+: самостоятельная заявка недоступна — только участие в команде */}
        {own.length === 0 && invites.length === 0 && memberships.length === 0 && senior && (
          <div className="rule-soft" style={{ marginTop: 'var(--sp-10)', paddingTop: 'var(--sp-10)', paddingBottom: 'var(--sp-12)' }}>
            <div style={{ border: '1.5px dashed rgba(0,0,0,.18)', borderRadius: 'var(--r-lg)', padding: '56px var(--sp-10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-4)', textAlign: 'center' }}>
              <Pix map={PIX_A} cell={20} gap={5} />
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 500, letterSpacing: '-.02em' }}>Участвовать можно только в команде</div>
              <p style={{ margin: 0, fontSize: 'var(--fs-base)', lineHeight: 1.5, color: 'var(--gray-2)', maxWidth: 460 }}>
                Тебе больше 35 — самостоятельную заявку подать нельзя. Но капитан может позвать тебя в команду: старше 35 разрешено участвовать в составе, до 20% команды.
              </p>
              <span className="cluster" style={{ color: 'var(--gray-2)', marginTop: 'var(--sp-2)' }}>участие в команде · по приглашению капитана</span>
            </div>
            <p style={{ margin: 'var(--sp-5) auto 0', textAlign: 'center', maxWidth: 460, fontSize: 'var(--fs-sm)', lineHeight: 1.45, color: 'var(--gray-2)' }}>
              Когда тебя позовут — приглашение появится здесь, даже если письмо потерялось.
            </p>
          </div>
        )}

        {/* Черновики — компактная секция */}
        {drafts.map(app => (
          <div key={app.id} className="rule-soft cab-section" style={{ marginTop: secTop() }}>
            <div>
              <span className="kick">Черновик</span>
              <div className="jbm" style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-2)', marginTop: 'var(--sp-3)', lineHeight: 1.7 }}>
                {app.num}<br />изменён {app.updatedAt}
                {app.nomination ? <><br />{NOMINATIONS[app.nomination].label.toLowerCase()}</> : null}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-3xl)', fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1, color: app.title.trim() ? 'var(--ink)' : 'var(--gray-2)' }}>
                {app.title.trim() || 'Без названия'}
              </div>
              <div className="ff-hint" style={{ marginTop: 'var(--sp-2)' }}>заполнено {filledCount(app)} из 4 разделов</div>
            </div>
            <div className="cab-side">
              <StatusTag status="draft" />
              <button className="fbtn sm" onClick={() => nav('/apply/' + app.id)}>Продолжить</button>
              <button className="mlink" style={{ alignSelf: 'flex-start' }} onClick={() => setDeleteDraft(app)}>удалить черновик</button>
            </div>
          </div>
        ))}

        {/* Команды, где я участник (не капитан) — компактная карточка как у своих заявок:
           заголовок ведёт на read-only витрину /view/:id (описание, состав, материалы). Редактирует капитан. */}
        {memberships.map(app => {
          const captain = app.members.find(m => m.role === 'captain')
          return (
            <div key={app.id} className="rule-soft cab-section" style={{ marginTop: secTop() }}>
              <div>
                <span className="kick">Команда</span>
                <div className="jbm" style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-2)', marginTop: 'var(--sp-3)', lineHeight: 1.7 }}>
                  {app.num}<br />
                  капитан {captain ? shortName(captain.name) : '—'}<br />
                  {app.nomination ? NOMINATIONS[app.nomination].label.toLowerCase() : ''} · {app.members.length} {memberWord(app.members.length)}
                </div>
              </div>
              <div>
                <button
                  type="button"
                  className="cab-title-link"
                  style={{ fontSize: 'var(--fs-3xl)', fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1, textAlign: 'left' }}
                  onClick={() => nav('/view/' + app.id)}
                  title="Открыть заявку команды"
                >
                  «{app.teamName}» · {app.title || 'Без названия'}
                </button>
                <div className="ff-hint" style={{ marginTop: 'var(--sp-2)' }}>
                  ты участник команды — заявку заполняет и подаёт капитан
                </div>
                {app.status === 'draft' ? (
                  <div className="ff-hint" style={{ marginTop: 'var(--sp-6)' }}>
                    Капитан ещё заполняет заявку — она пока не подана.
                  </div>
                ) : (
                  <div style={{ marginTop: 'var(--sp-7)', maxWidth: 720 }}>
                    <StatusTimeline status={app.status} submittedAt={app.submittedAt} />
                  </div>
                )}
              </div>
              <div className="cab-side">
                <StatusTag status={app.status} />
                <button className="fbtn sm" onClick={() => nav('/view/' + app.id)}>Смотреть</button>
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
            <div key={app.id} className="rule-soft cab-section" style={{ marginTop: secTop() }}>
              {/* Левая колонка */}
              <div>
                <span className="kick">{nn} / Заявка</span>
                <div className="jbm" style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-2)', marginTop: 'var(--sp-3)', lineHeight: 1.7 }}>
                  {app.num}<br />
                  подана {app.submittedAt}<br />
                  {nomLabel.toLowerCase()} · {app.mode === 'solo' ? 'соло' : 'команда ' + app.members.length}
                </div>
              </div>

              {/* Центр */}
              <div>
                <button
                  type="button"
                  className="cab-title-link"
                  style={{ fontSize: 'var(--fs-3xl)', fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1, textAlign: 'left' }}
                  onClick={() => nav('/view/' + app.id)}
                  title="Открыть заявку"
                >
                  {app.title}
                </button>
                {app.status === 'rework' && (
                  <div style={{ fontSize: 'var(--fs-base)', color: 'var(--err)', background: 'rgba(179, 64, 46, .08)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-2) var(--sp-3)', marginTop: 'var(--sp-3)', lineHeight: 1.4 }}>{app.reworkNote}</div>
                )}
                <div style={{ marginTop: 'var(--sp-7)', maxWidth: 720 }}>
                  <StatusTimeline status={app.status} submittedAt={app.submittedAt} />
                </div>
              </div>

              {/* Правая колонка */}
              <div className="cab-side">
                <StatusTag status={app.status} />
                <div style={{ fontSize: 'var(--fs-base)', lineHeight: 1.4, color: 'var(--gray-2)' }}>{SIDE_NOTE[app.status]}</div>
                {app.status === 'rework' ? (
                  <>
                    <button className="fbtn sm" onClick={() => reopen(app.id)}>Исправить</button>
                    <button className="fbtn sm line" onClick={() => nav('/view/' + app.id)}>Смотреть</button>
                  </>
                ) : (
                  <button className="fbtn sm" onClick={() => nav('/view/' + app.id)}>Смотреть</button>
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
          <span className="jbm" style={{ fontSize: 'var(--fs-xs)', letterSpacing: '.05em', textTransform: 'uppercase' }}>приём заявок открыт</span>
          <span className="jbm" style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-2)' }}>вопросы → help@liderybuduschego.ru</span>
        </div>
      </div>

      {/* Модалка «Отозвать заявку?» */}
      {withdrawApp && (
        <Modal onClose={() => setWithdrawApp(null)}>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, letterSpacing: '-.015em', marginBottom: 'var(--sp-3)' }}>Отозвать заявку?</div>
          <p style={{ margin: 0, fontSize: 'var(--fs-base)', lineHeight: 1.45, color: 'var(--gray-2)' }}>
            «{withdrawApp.title}» · {withdrawApp.nomination ? NOMINATIONS[withdrawApp.nomination].label : ''} · от {withdrawApp.submittedAt}. Заявку удалим, а освободившееся место сможешь занять новой работой.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-6)' }}>
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
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, letterSpacing: '-.015em', marginBottom: 'var(--sp-3)' }}>Покинуть команду?</div>
          <p style={{ margin: 0, fontSize: 'var(--fs-base)', lineHeight: 1.45, color: 'var(--gray-2)' }}>
            «{leaveApp.teamName}» · {leaveApp.title || 'Без названия'}. Капитан увидит, что ты вышел. Вернуться можно по новому приглашению.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-6)' }}>
            <button className="fbtn sm line" style={{ flex: 1 }} onClick={() => setLeaveApp(null)}>Отмена</button>
            <button
              className="fbtn sm"
              style={{ flex: 1, background: 'var(--err)', color: '#fff' }}
              onClick={() => {
                dispatch({ type: 'leave-team', id: leaveApp.id })
                toast('Ты вышел из команды')
                setLeaveApp(null)
              }}
            >Покинуть</button>
          </div>
        </Modal>
      )}

      {/* Модалка «Удалить черновик?» */}
      {deleteDraft && (
        <Modal onClose={() => setDeleteDraft(null)}>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, letterSpacing: '-.015em', marginBottom: 'var(--sp-3)' }}>Удалить черновик?</div>
          <p style={{ margin: 0, fontSize: 'var(--fs-base)', lineHeight: 1.45, color: 'var(--gray-2)' }}>
            «{deleteDraft.title.trim() || 'Без названия'}». Удалим черновик навсегда — восстановить не получится.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-6)' }}>
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
