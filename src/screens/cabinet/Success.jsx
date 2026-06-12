// Успех подачи — визуал ScrSuccess, флоу it3 (лимит, «Подать ещё одну»)
import React from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useStore, NOMINATIONS, APP_LIMIT, newDraft, countSubmitted } from '../../state/store.jsx'
import { Nav } from '../../components/Nav.jsx'
import { Pix, PIX_B, StatusTimeline } from '../../components/ui.jsx'

export default function Success() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const nav = useNavigate()

  const app = state.apps.find(a => a.id === id)
  if (!app) return <Navigate to="/cabinet" replace />

  const limitReached = countSubmitted(state.apps) >= APP_LIMIT
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
        <Pix map={PIX_B} cell={22} gap={6} />
        <div className="cluster" style={{ marginTop: 28, color: 'var(--gray-2)', textAlign: 'center' }}>
          заявка № {app.num} · {nomLabel} · {app.submittedAt}{app.submittedTime ? ', ' + app.submittedTime : ''}
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(44px, 7vw, 72px)', fontWeight: 500, letterSpacing: '-.04em', marginTop: 16, lineHeight: 1, textAlign: 'center' }}>
          Заявка подана
        </h1>
        <p style={{ margin: '18px auto 0', fontSize: 18, lineHeight: 1.45, color: 'var(--gray-2)', maxWidth: 480, textAlign: 'center' }}>
          Сначала её проверят организаторы, затем допущенные работы оценивает жюри. Статус виден в кабинете, об изменениях напишем на email.
        </p>
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.12)', borderRadius: 22, padding: '28px 32px', marginTop: 32, width: '100%', maxWidth: 640 }}>
          <StatusTimeline status="submitted" submittedAt={app.submittedAt} />
        </div>
        <div className="ff-hint" style={{ marginTop: 14, textAlign: 'center' }}>
          Пока заявка в статусе «Подана», её можно редактировать или отозвать.
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="fbtn" style={{ height: 54, fontSize: 16, fontWeight: 500 }} onClick={() => nav('/cabinet')}>
            К моим заявкам
          </button>
          {limitReached ? (
            <span className="fbtn line disabled" style={{ height: 54, fontSize: 16, fontWeight: 500 }}>Подать ещё одну</span>
          ) : (
            <button className="fbtn line" style={{ height: 54, fontSize: 16, fontWeight: 500 }} onClick={createDraft}>
              Подать ещё одну
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
