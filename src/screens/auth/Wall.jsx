// Стена 14–17 — согласие представителя (структура: lk3/it3-auth I3Minor14Wall / I3Minor14Gosuslugi, стиль: fig)
import React, { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { Logo } from '../../components/Nav.jsx'

const DOC_LABELS = {
  participation: 'Согласие на участие',
  pdn: 'Согласие на обработку персональных данных',
}
const DOC_STATUS = { none: 'Не загружено', review: 'На проверке', ok: 'Принято', replace: 'Нужна замена' }

const DocRow = ({ doc, status, fileName, onUpload }) => {
  const fileRef = useRef(null)
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap',
      background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-3) var(--sp-4)',
    }}>
      <div style={{ fontSize: 15, fontWeight: 500, flex: 1, minWidth: 180 }}>{DOC_LABELS[doc]}</div>
      <span className={'doc-status ' + status}>{DOC_STATUS[status]}</span>
      {(status === 'review' || status === 'ok') && (
        <div style={{ flexBasis: '100%', display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)' }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{fileName || 'soglasie.pdf'}</span>
          <span className="ff-hint">загружено</span>
        </div>
      )}
      {(status === 'none' || status === 'replace') && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.length) { onUpload(e.target.files[0].name); e.target.value = '' } }}
          />
          <button type="button" className="fbtn sm line" onClick={() => fileRef.current?.click()}>Загрузить</button>
        </>
      )}
      {status === 'none' && (
        <span className="ff-hint" style={{ flexBasis: '100%' }}>PDF, JPG или PNG · до 10 МБ</span>
      )}
    </div>
  )
}

export default function Wall() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const [variant, setVariant] = useState('a')

  // согласие принято → минор дозаполняет анкету; дальше кабинет/приглашение
  if (state.stage === 'confirmed') return <Navigate to="/onboarding" replace />
  if (state.stage === 'active') return <Navigate to={state.pendingInvite ? '/join/' + state.pendingInvite : '/cabinet'} replace />

  const upload = (doc, name) => {
    dispatch({ type: 'upload-minor-doc', doc, name })
    toast('Документ загружен — на проверке')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--w)', padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column' }}>
      <div className="auth-top">
        <Logo />
        <button type="button" className="mlink" onClick={() => { dispatch({ type: 'logout' }); nav('/login') }}>Выйти</button>
      </div>

      <div style={{ maxWidth: 620, width: '100%', margin: '0 auto', paddingBottom: 60 }}>
        <div style={{ textAlign: 'center', marginTop: 'var(--sp-7)' }}>
          <span className="kick">Кабинет участника</span>
          <h1 style={{ fontSize: 48, fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1.05, margin: 0, marginTop: 'var(--sp-3)' }}>Согласие представителя</h1>
        </div>

        {variant === 'a' ? (
          <div className="wall-card" style={{ marginTop: 'var(--sp-8)' }}>
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-.015em' }}>
              По закону для участников младше 18 нужно согласие родителя или опекуна
            </div>
            <p className="ff-hint" style={{ margin: 'var(--sp-2) 0 var(--sp-6)' }}>
              Скачай шаблоны и передай их родителю или опекуну на подпись. Подписанные сканы загрузи ниже.
              Пока документы не получат статус «Принято», подавать заявки нельзя.
            </p>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 'var(--sp-6)' }}>
              <button type="button" className="fbtn sm line" onClick={() => toast('Демо: шаблон скачается в проде')}>Скачать шаблон — согласие на участие</button>
              <button type="button" className="fbtn sm line" onClick={() => toast('Демо: шаблон скачается в проде')}>Скачать шаблон — согласие на обработку ПДн</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <DocRow doc="participation" status={state.minorDocs.participation} fileName={state.minorDocNames?.participation} onUpload={name => upload('participation', name)} />
              <DocRow doc="pdn" status={state.minorDocs.pdn} fileName={state.minorDocNames?.pdn} onUpload={name => upload('pdn', name)} />
            </div>
          </div>
        ) : (
          <div className="wall-card" style={{ marginTop: 'var(--sp-8)' }}>
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-.015em' }}>
              Подтверждение через Госуслуги
            </div>
            <p className="ff-hint" style={{ margin: 'var(--sp-2) 0 var(--sp-6)', maxWidth: 500 }}>
              Согласие подтверждает законный представитель через свою учётную запись на Госуслугах.
              Передай это устройство родителю или опекуну — после перехода на портал вход выполняется под их аккаунтом.
            </p>
            <button
              type="button"
              className="fbtn submit"
              style={{ width: 'auto', padding: '0 var(--sp-7)' }}
              onClick={() => toast('Демо: переход на Госуслуги')}
            >Подтвердить через Госуслуги</button>
            <div className="ff-hint" style={{ marginTop: 'var(--sp-3)' }}>Нужна подтверждённая учётная запись Госуслуг. Если её нет, согласие можно загрузить сканами — переключись на вариант с документами.</div>
            <div style={{ height: 1, background: 'var(--line)', margin: 'var(--sp-6) 0' }}></div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="mtag wait">Ждём подтверждения</span>
              <span className="ff-hint">Родитель или опекун ещё не подтвердил согласие через Госуслуги</span>
            </div>
          </div>
        )}

        <div className="locked-banner" style={{ marginTop: 'var(--sp-5)' }}>
          <span style={{ fontSize: 15, color: 'var(--ink-blue)', fontWeight: 500 }}>Кабинет в режиме ожидания</span>
          <p className="ff-hint" style={{ margin: 'var(--sp-1) 0 0' }}>{variant === 'a'
            ? 'Подача заявок станет доступна после того, как проверим документы. Обычно это занимает 1–2 рабочих дня.'
            : 'Подача заявок откроется сразу после подтверждения через Госуслуги — обычно за несколько минут.'}</p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--sp-5)' }}>
          {variant === 'a' ? (
            <button type="button" className="mlink" onClick={() => setVariant('b')}>Вариант Б: подтверждение через Госуслуги</button>
          ) : (
            <button type="button" className="mlink" onClick={() => setVariant('a')}>Вариант А: загрузка сканов</button>
          )}
        </div>
      </div>
    </div>
  )
}
