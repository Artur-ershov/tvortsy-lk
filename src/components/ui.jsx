// Общие примитивы — стиль из «Основные экраны» (lk3/fig-shared.jsx, screens-*.jsx)
import React, { useState } from 'react'
import { STATUS, CYCLE, CYCLE_DATES, fmtMB, initialsOf } from '../state/store.jsx'

/* ── Пиксельная мозаика по битовой карте (FgPix) ── */
export const PIX_A = ['0110', '1100', '0111', '0010']
export const PIX_B = ['00110', '01100', '11000', '01110', '00010']

export const Pix = ({ map = PIX_A, cell = 22, gap = 6, dark = false, style }) => (
  <div className={'pix' + (dark ? ' on-dark' : '')}
    style={{ gridTemplateColumns: `repeat(${map[0].length}, ${cell}px)`, gap, ...style }}>
    {map.flatMap((row, y) => row.split('').map((c, x) => (
      <i key={y + '-' + x} className={c === '1' ? '' : 'x'}
        style={{ width: cell, height: cell, borderRadius: Math.round(cell * .27) }}></i>
    )))}
  </div>
)

/* ── «Крыло» из мелких тайлов (FgWing) ── */
const wingMap = (cols, rows, thickness, waves) => {
  const map = Array.from({ length: rows }, () => new Array(cols).fill(0))
  for (let c = 0; c < cols; c++) {
    const t = cols === 1 ? 0 : c / (cols - 1)
    const p = (1 + Math.cos(t * 2 * Math.PI * waves)) / 2
    const yTop = Math.round((1 - p) * (rows - thickness))
    for (let k = 0; k < thickness; k++) {
      const y = yTop + k
      if (y >= 0 && y < rows) map[y][c] = 1
    }
  }
  return map
}

export const Wing = ({ tile = 22, gap, cols = 16, rows = 7, thickness = 2, waves = 1, glass = false, style }) => {
  const g = gap != null ? gap : Math.max(2, Math.round(tile * 0.16))
  const map = wingMap(cols, rows, thickness, waves)
  const v = glass
    ? { fill: 'rgba(217,236,249,.12)', line: 'rgba(217,236,249,.5)' }
    : { fill: 'rgba(197,228,249,.5)', line: 'rgba(91,155,201,.3)' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${tile}px)`, gridTemplateRows: `repeat(${rows}, ${tile}px)`, gap: g, pointerEvents: 'none', ...style }}>
      {map.flatMap((row, y) => row.map((on, x) => on
        ? <div key={x + '-' + y} style={{ gridColumn: x + 1, gridRow: y + 1, borderRadius: Math.round(tile * 0.26), background: v.fill, boxShadow: `inset 0 0 0 1.5px ${v.line}` }}></div>
        : null))}
    </div>
  )
}

/* ── Статус-таймлайн заявки: визуал FgTimeline, шаги I3Cycle ── */
export const StatusTimeline = ({ status = 'submitted', dark = false, submittedAt }) => {
  const idx = Math.max(0, CYCLE.indexOf(status === 'rework' ? 'review' : status))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${CYCLE.length}, 1fr)`, position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 5, height: 1, background: dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.18)' }}></div>
      {CYCLE.map((key, i) => {
        const done = i < idx, cur = i === idx
        return (
          <div key={key} style={{ position: 'relative', paddingRight: 12 }}>
            <span style={{
              display: 'block', width: 11, height: 11, borderRadius: 3,
              background: done || cur ? (dark ? 'var(--sky-2)' : 'var(--ink)') : (dark ? '#3A3A42' : '#D6DCE1'),
              outline: cur ? `2px solid ${dark ? 'var(--sky-2)' : 'var(--ink)'}` : 'none', outlineOffset: 2,
            }}></span>
            <div className="jbm" style={{ fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 14, opacity: .6 }}>
              {i === 0 && submittedAt ? submittedAt : CYCLE_DATES[key]}
            </div>
            <div style={{ fontSize: 16.5, fontWeight: cur ? 600 : 400, marginTop: 6, lineHeight: 1.25 }}>{STATUS[key].label}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Статус-тег с точкой (fst) ── */
export const StatusTag = ({ status, style }) => (
  <span className={'fst ' + (STATUS[status]?.cls || '')} style={style}>{STATUS[status]?.label || status}</span>
)

/* ── Иконка-глазик пароля ── */
export const EyeIcon = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

/* ── Поле пароля с глазиком ── */
export const PasswordInput = ({ value, onChange, placeholder = '••••••••••', error, autoComplete = 'new-password' }) => {
  const [show, setShow] = useState(false)
  return (
    <div className="ff-wrap">
      <input
        className={'ff-input' + (error ? ' err' : '')}
        type={show ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
      />
      <button type="button" className="ff-eye" onClick={() => setShow(s => !s)} aria-label="Показать пароль">
        <EyeIcon />
      </button>
    </div>
  )
}

/* ── Текстовое поле с лейблом/хинтом/счётчиком/ошибкой ── */
export const Field = ({ label, value, onChange, placeholder, hint, count, max, error, area, disabled, type = 'text', optional, autoComplete }) => (
  <div>
    <span className="ff-label" style={optional ? { display: 'flex', justifyContent: 'space-between' } : undefined}>
      {label}
      {optional && <span style={{ textTransform: 'none', letterSpacing: 0 }}>необязательно</span>}
    </span>
    {area ? (
      <textarea
        className={'ff-input area' + (error ? ' err' : '')}
        value={value}
        placeholder={placeholder}
        maxLength={max}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
      />
    ) : (
      <input
        className={'ff-input' + (error ? ' err' : '')}
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={max}
        disabled={disabled}
        autoComplete={autoComplete}
        onChange={e => onChange?.(e.target.value)}
      />
    )}
    {error && <span className="ff-err">{error}</span>}
    {(hint || count) && !error && (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 8 }}>
        {hint ? <span className="ff-hint">{hint}</span> : <span></span>}
        {count && <span className="ff-hint" style={{ whiteSpace: 'nowrap' }}>{count}</span>}
      </div>
    )}
  </div>
)

/* ── Чип-группа ── */
export const Chips = ({ options, value, onChange, multi = false }) => (
  <div className="ff-seg">
    {options.map(o => {
      const on = multi ? (value || []).includes(o.key) : value === o.key
      return (
        <button
          key={o.key}
          type="button"
          className={'ff-chip' + (on ? (multi ? ' sky' : ' on') : '')}
          onClick={() => {
            if (multi) {
              const set = new Set(value || [])
              set.has(o.key) ? set.delete(o.key) : set.add(o.key)
              onChange([...set])
            } else onChange(o.key)
          }}
        >{o.label}{multi && on ? ' ✓' : ''}</button>
      )
    })}
  </div>
)

/* ── Чекбокс ── */
export const Check = ({ on, onChange, children, style }) => (
  <button type="button" className={'ff-check' + (on ? ' on' : '')} style={style} onClick={() => onChange?.(!on)}>
    <span className="box"></span>
    <span>{children}</span>
  </button>
)

/* ── Быстрые входы ── */
export const SocialRow = ({ onClick }) => (
  <div className="ff-social">
    {[['VK ID', '#0077FF'], ['Яндекс', '#FC3F1D'], ['Telegram', '#29B6F6']].map(([n, c]) => (
      <button key={n} type="button" className="s" style={{ background: '#fff' }} onClick={() => onClick?.(n)}>
        <span className="d" style={{ background: c }}></span>{n}
      </button>
    ))}
  </div>
)

/* ── Строка файла со всеми состояниями (FileRow из screens-form-extra) ── */
export const FileRow = ({ file, onResume, onRemove, onReplace }) => {
  const { name, sizeMB, state, pct, errText, note } = file
  const cls = state === 'done' ? ' done' : (state === 'error' || state === 'broken' || state === 'over') ? ' err' : ''
  return (
    <div className={'ff-file' + cls}>
      <span className="ic">
        {state === 'done'
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#23425A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : (state === 'error' || state === 'over' || state === 'broken')
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01" stroke="#B3402E" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="9" stroke="#B3402E" strokeWidth="1.5" /></svg>
            : (name.split('.').pop() || '').toUpperCase().slice(0, 4)}
      </span>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 15.5, fontWeight: 500, overflowWrap: 'anywhere' }}>{name}</div>
        <div className="ff-hint" style={{ marginTop: 3 }}>
          {state === 'done' && `${fmtMB(sizeMB)} · загружено`}
          {state === 'queue' && (note || 'в очереди — начнётся после текущего файла')}
          {state === 'progress' && `загружается · ${pct || 0}% · заполняй дальше`}
          {state === 'broken' && `соединение прервалось на ${pct || 0}% — продолжим с этого места`}
          {(state === 'error' || state === 'over') && fmtMB(sizeMB)}
        </div>
        {(state === 'progress' || state === 'broken') && (
          <div className={'ff-bar' + (state === 'broken' ? ' err' : '')}><i style={{ width: (pct || 0) + '%' }}></i></div>
        )}
        {errText && <div style={{ fontSize: 13.5, color: 'var(--err)', marginTop: 4, lineHeight: 1.35 }}>{errText}</div>}
      </div>
      {state === 'broken' && <button className="fbtn sm line" type="button" onClick={onResume}>Докачать</button>}
      {(state === 'error' || state === 'over') && onReplace && <button className="mlink" type="button" onClick={onReplace}>Заменить файл</button>}
      {state === 'done' && onReplace && <button className="ff-act" type="button" onClick={onReplace}>заменить</button>}
      {onRemove && <button className="mlink" type="button" onClick={onRemove} aria-label="Убрать файл">убрать</button>}
    </div>
  )
}

/* ── Участник команды (MemberRow) ── */
const MEMBER_TAGS = {
  in:        { label: 'в команде', cls: 'ok' },
  confirmed: { label: 'подтвердил', cls: 'ok' },
  invited:   { label: 'не ответил', cls: 'wait' },
  declined:  { label: 'отклонил', cls: 'err' },
}

export const MemberRow = ({ member, you = false, onRemove, onRemind, invitedLabel, children }) => {
  const t = MEMBER_TAGS[member.tag] || MEMBER_TAGS.invited
  // в форме приглашённый — «не ответил» (it3-form), в кабинете — «приглашён» (it3-cabinet)
  const tagLabel = member.tag === 'invited' && invitedLabel ? invitedLabel : t.label
  const init = member.name ? initialsOf(member.name) : '··'
  return (
    <div className={'member-row' + (member.tag === 'invited' ? ' pending' : '')}>
      <span className="init">{init}</span>
      <div style={{ flex: 1, minWidth: 160 }}>
        {/* имя приглашённого неизвестно до принятия — показываем email */}
        <div style={{ fontSize: 15.5, fontWeight: 500 }}>{member.name || member.email}</div>
        <div className="cluster" style={{ color: 'var(--gray-2)', marginTop: 2 }}>
          {member.role === 'captain' ? `капитан${you ? ' · вы' : ''}` : member.name ? member.email : 'имя появится после принятия'}
        </div>
      </div>
      {member.tag === 'invited' && onRemind && <button className="mlink" type="button" onClick={onRemind}>напомнить</button>}
      {onRemove && member.role !== 'captain' && <button className="mlink" type="button" onClick={onRemove}>убрать</button>}
      <span className={'mtag ' + t.cls}>{tagLabel}</span>
      {children}
    </div>
  )
}

/* ── Модалка ── */
export const Modal = ({ onClose, children, width = 480 }) => (
  <div className="scrim" onClick={e => { if (e.target === e.currentTarget) onClose?.() }}>
    <div className="modal-card" style={{ width }}>{children}</div>
  </div>
)

/* ── Разделитель «или» ── */
export const OrRow = ({ children = 'или', color = 'var(--gray-2)' }) => (
  <div className="or-row">
    <i></i><span className="cluster" style={{ color }}>{children}</span><i></i>
  </div>
)
