// Стена 14–17 — согласие представителя (структура: lk3/it3-auth I3Minor14Wall / I3Minor14Gosuslugi, стиль: fig)
import React, { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store.jsx'
import { Logo } from '../../components/Nav.jsx'

const DOC_LABELS = {
  participation: 'Согласие на участие',
  pdn: 'Согласие на обработку персональных данных',
}
const DOC_STATUS = { none: 'не загружено', review: 'на проверке', ok: 'принято', replace: 'нужна замена' }

const DocRow = ({ doc, status, fileName, onUpload }) => {
  const fileRef = useRef(null)
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 18px',
    }}>
      <div style={{ fontSize: 15, fontWeight: 500, flex: 1, minWidth: 180 }}>{DOC_LABELS[doc]}</div>
      <span className={'doc-status ' + status}>{DOC_STATUS[status]}</span>
      {(status === 'review' || status === 'ok') && (
        <div style={{ flexBasis: '100%', display: 'flex', alignItems: 'baseline', gap: 10 }}>
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
        <span className="ff-hint" style={{ flexBasis: '100%' }}>PDF или JPG · до 10 МБ</span>
      )}
    </div>
  )
}

export default function Wall() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const [variant, setVariant] = useState('a')

  // документы приняты — кабинет открыт; отложенное приглашение важнее кабинета
  if (state.stage === 'active') return <Navigate to={state.pendingInvite ? '/join/' + state.pendingInvite : '/cabinet'} replace />

  const upload = (doc, name) => {
    dispatch({ type: 'upload-minor-doc', doc, name })
    toast('Документ загружен — на проверке')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--w)', padding: 16, display: 'flex', flexDirection: 'column' }}>
      <div className="auth-top">
        <Logo />
        <button type="button" className="mlink" onClick={() => { dispatch({ type: 'logout' }); nav('/login') }}>Выйти</button>
      </div>

      <div style={{ maxWidth: 620, width: '100%', margin: '0 auto', paddingBottom: 60 }}>
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <span className="kick">Кабинет участника</span>
          <h1 style={{ fontSize: 48, fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1.05, margin: 0, marginTop: 12 }}>Согласие представителя</h1>
        </div>

        {variant === 'a' ? (
          <div className="wall-card" style={{ marginTop: 32 }}>
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-.015em' }}>
              По закону для участников младше 18 нужно согласие родителя или опекуна
            </div>
            <p className="ff-hint" style={{ margin: '10px 0 24px' }}>
              Скачай шаблоны, подпиши у родителя или опекуна и загрузи сканы ниже.
              До получения статуса «принято» подача заявок недоступна.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
              <button type="button" className="fbtn sm line" onClick={() => toast('Демо: шаблон скачается в проде')}>Скачать шаблон — согласие на участие</button>
              <button type="button" className="fbtn sm line" onClick={() => toast('Демо: шаблон скачается в проде')}>Скачать шаблон — согласие на обработку ПДн</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DocRow doc="participation" status={state.minorDocs.participation} fileName={state.minorDocNames?.participation} onUpload={name => upload('participation', name)} />
              <DocRow doc="pdn" status={state.minorDocs.pdn} fileName={state.minorDocNames?.pdn} onUpload={name => upload('pdn', name)} />
            </div>
          </div>
        ) : (
          <div className="wall-card" style={{ marginTop: 32 }}>
            <span className="mtag warn">способ выбирают юристы</span>
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-.015em', marginTop: 14 }}>
              Подтверждение через Госуслуги
            </div>
            <p className="ff-hint" style={{ margin: '10px 0 24px', maxWidth: 500 }}>
              Законный представитель подтверждает согласие через учётную запись на Госуслугах.
              Перенаправим на портал — войди как родитель или опекун.
            </p>
            <button
              type="button"
              className="fbtn submit"
              style={{ width: 'auto', padding: '0 28px' }}
              onClick={() => toast('Демо: переход на Госуслуги')}
            >Подтвердить через Госуслуги</button>
            <div className="ff-hint" style={{ marginTop: 14 }}>Требуется подтверждённая учётная запись уровня «Стандартная» или выше.</div>
            <div style={{ height: 1, background: 'var(--line)', margin: '24px 0' }}></div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="mtag">ожидаем подтверждения</span>
              <span className="ff-hint">представитель ещё не проходил проверку</span>
            </div>
          </div>
        )}

        <div className="locked-banner" style={{ marginTop: 20 }}>
          <span style={{ fontSize: 15, color: 'var(--warn)', fontWeight: 500 }}>Кабинет в режиме ожидания</span>
          <p className="ff-hint" style={{ margin: '6px 0 0' }}>{variant === 'a'
            ? 'Подача заявок станет доступна после того, как проверим документы. Обычно это занимает 1–2 рабочих дня.'
            : 'Подача заявок откроется после успешного подтверждения.'}</p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          {variant === 'a' ? (
            <button type="button" className="mlink" onClick={() => setVariant('b')}>Вариант Б: подтверждение через Госуслуги (способ выбирают юристы)</button>
          ) : (
            <button type="button" className="mlink" onClick={() => setVariant('a')}>Вариант А: загрузка сканов</button>
          )}
        </div>
      </div>
    </div>
  )
}
