// Успех подачи — визуал ScrSuccess, флоу it3 (лимит, «Подать ещё одну»)
import React from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useStore, NOMINATIONS, APP_LIMIT, newDraft, countUsed } from '../../state/store.jsx'
import { Nav } from '../../components/Nav.jsx'
import { Pix, PIX_B, StatusTimeline } from '../../components/ui.jsx'

export default function Success() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const nav = useNavigate()

  const app = state.apps.find(a => a.id === id)
  if (!app) return <Navigate to="/cabinet" replace />
  // экран «Заявка подана» — только для реально поданных: черновик сюда не пускаем
  // (по аналогии с тем, как ApplyForm отсекает не-черновики)
  if (app.status === 'draft') return <Navigate to="/cabinet" replace />

  const limitReached = countUsed(state, state.email) >= APP_LIMIT
  const nomLabel = app.nomination ? NOMINATIONS[app.nomination].label.toLowerCase() : ''

  const createDraft = () => {
    const d = newDraft('ТВ-2026-0' + state.appSeq)
    dispatch({ type: 'create-draft', draft: d })
    nav('/apply/' + d.id)
  }

  return (
    <div className="app-root">
      <style>{`
        .success-center{flex:1 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 48px}
        @media(max-width:720px){.success-center{padding:60px 24px}}
      `}</style>
      <Nav tab="apps" />
      <div className="success-center">
        <Pix map={PIX_B} cell={30} gap={8} />
        <div className="cluster" style={{ marginTop: 'var(--sp-7)', color: 'var(--gray-2)', textAlign: 'center' }}>
          Заявка №&nbsp;{app.num} · {nomLabel} · {app.submittedAt}{app.submittedTime ? ', ' + app.submittedTime : ''}
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(44px, 7vw, 72px)', fontWeight: 500, letterSpacing: '-.04em', marginTop: 'var(--sp-4)', lineHeight: 1, textAlign: 'center' }}>
          Заявка подана
        </h1>
        <p style={{ margin: 'var(--sp-4) auto 0', fontSize: 'var(--fs-base)', lineHeight: 1.45, color: 'var(--gray-2)', maxWidth: 480, textAlign: 'center' }}>
          Сначала её проверят организаторы, а затем допущенные работы оценит жюри. Следить за статусом можно в кабинете — как только что-то изменится, напишем тебе на почту.
        </p>
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.12)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-7) var(--sp-8)', marginTop: 'var(--sp-8)', width: '100%', maxWidth: 640 }}>
          <StatusTimeline status="submitted" submittedAt={app.submittedAt} />
        </div>
        <div className="ff-hint" style={{ marginTop: 'var(--sp-3)', textAlign: 'center' }}>
          Заявку можно посмотреть или отозвать — пока она в статусе «Подана».
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-7)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="fbtn" style={{ height: 54, fontSize: 'var(--fs-base)', fontWeight: 500 }} onClick={() => nav('/cabinet')}>
            К моим заявкам
          </button>
          {limitReached ? (
            <span className="fbtn line disabled" style={{ height: 54, fontSize: 'var(--fs-base)', fontWeight: 500 }}>Подать ещё одну</span>
          ) : (
            <button className="fbtn line" style={{ height: 54, fontSize: 'var(--fs-base)', fontWeight: 500 }} onClick={createDraft}>
              Подать ещё одну
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
