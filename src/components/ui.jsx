// Общие примитивы — стиль из «Основные экраны» (lk3/fig-shared.jsx, screens-*.jsx)
import React, { useState } from 'react'
import { STATUS, CYCLE, CYCLE_DATES, fmtMB, initialsOf, isSenior } from '../state/store.jsx'

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
  const N = CYCLE.length
  const fill = dark ? '#fff' : 'var(--ink)'                      // активный шаг (как на лендинге)
  const ring = dark ? 'rgba(255,255,255,.40)' : 'rgba(0,0,0,.28)' // кольцо будущего шага
  const hollowBg = dark ? 'transparent' : '#fff'                 // фон полого кружка перекрывает трек
  const halo = dark ? 'rgba(127,169,201,.45)' : 'rgba(91,155,201,.30)' // ореол активного шага (accent)
  return (
    <div className="stl">
      {/* серый трек по всей длине + чёрный прогресс до текущего шага (на узком экране трек скрыт) */}
      <div className="stl-track" style={{ position: 'absolute', left: 0, right: 0, top: 7.5, height: 1, background: dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.18)' }}></div>
      <div className="stl-track" style={{ position: 'absolute', left: 0, top: 7.5, height: 1, width: `calc(${(idx / N) * 100}% + 7px)`, background: fill }}></div>
      {CYCLE.map((key, i) => {
        // «Подана» — событие в прошлом: раз заявка отправлена, шаг всегда пройден (кольцо с точкой внутри).
        const passed = i < idx || i === 0
        const cur = i === idx && i !== 0          // активная фаза (на рассмотрении и т.д.) — крупнее, с ореолом
        const filled = passed || cur               // пройденный и активный залиты; будущие — полые
        return (
          <div key={key} style={{ position: 'relative', paddingRight: 'var(--sp-3)' }}>
            <div style={{ height: 16, display: 'flex', alignItems: 'center' }}>
              <span style={{
                display: 'block', boxSizing: 'border-box', borderRadius: '50%',
                // неактивные (пройденный + будущие) — одного размера и чуть меньше активного
                width: cur ? 16 : 12, height: cur ? 16 : 12,
                background: filled ? fill : hollowBg,
                border: filled ? 'none' : `1.5px solid ${ring}`,
                boxShadow: cur ? `0 0 0 4px ${halo}` : 'none',
              }}></span>
            </div>
            <div className="jbm" style={{ fontSize: 'var(--fs-2xs)', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 'var(--sp-2)', opacity: cur ? 1 : .6, color: cur ? (dark ? 'var(--accent-3)' : 'var(--accent)') : undefined }}>
              {i === 0 && submittedAt ? submittedAt : CYCLE_DATES[key]}
            </div>
            <div style={{ fontSize: 'var(--fs-base)', fontWeight: cur ? 600 : 400, marginTop: 'var(--sp-1)', lineHeight: 1.25 }}>{STATUS[key].label}</div>
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

/* ── Иконка статуса валидации (галочка / «!») ── */
export const StatusIcon = ({ kind, size = 18 }) => kind === 'ok' ? (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5l4.4 4.4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
) : (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 7.5v5.2M12 16.2v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

/* ── Поле пароля с глазиком ── */
export const PasswordInput = ({ value, onChange, onBlur, placeholder = '••••••••••', error, ok, autoComplete = 'new-password' }) => {
  const [show, setShow] = useState(false)
  return (
    <div className="ff-wrap">
      <input
        className={'ff-input' + (error ? ' err' : ok ? ' ok' : '')}
        type={show ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {ok && !error && <span className="ff-status ok pw"><StatusIcon kind="ok" /></span>}
      <button type="button" className="ff-eye" onClick={() => setShow(s => !s)} aria-label="Показать пароль">
        <EyeIcon />
      </button>
    </div>
  )
}

/* ── Текстовое поле с лейблом/хинтом/счётчиком/ошибкой ── */
export const Field = ({ label, value, onChange, onBlur, placeholder, hint, count, max, error, warn, ok, area, disabled, type = 'text', optional, autoComplete }) => {
  const kind = error ? 'err' : warn ? 'warn' : ok ? 'ok' : null
  return (
    <div>
      <span className="ff-label" style={optional ? { display: 'flex', justifyContent: 'space-between' } : undefined}>
        {label}
        {optional && <span style={{ textTransform: 'none', letterSpacing: 0 }}>необязательно</span>}
      </span>
      <div className={'ff-ctrl' + (area ? ' area' : '') + (kind ? ' has-status' : '')}>
        {area ? (
          <textarea
            className={'ff-input area' + (kind ? ' ' + kind : '')}
            value={value}
            placeholder={placeholder}
            maxLength={max}
            disabled={disabled}
            onChange={e => onChange?.(e.target.value)}
            onBlur={onBlur}
          />
        ) : (
          <input
            className={'ff-input' + (kind ? ' ' + kind : '')}
            type={type}
            value={value}
            placeholder={placeholder}
            maxLength={max}
            disabled={disabled}
            autoComplete={autoComplete}
            onChange={e => onChange?.(e.target.value)}
            onBlur={onBlur}
          />
        )}
        {kind && <span className={'ff-status ' + kind}><StatusIcon kind={kind === 'ok' ? 'ok' : 'alert'} /></span>}
      </div>
      {error && <span className="ff-err">{error}</span>}
      {!error && warn && <span className="ff-warn">{warn}</span>}
      {(hint || count) && !error && !warn && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-4)', marginTop: 'var(--sp-2)' }}>
          {hint ? <span className="ff-hint">{hint}</span> : <span></span>}
          {count && <span className="ff-hint" style={{ whiteSpace: 'nowrap' }}>{count}</span>}
        </div>
      )}
    </div>
  )
}

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
const VK_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009Z" fill="#0077FF"/>
    <path d="M6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z" fill="#fff"/>
  </svg>
)
const YA_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10z" fill="#FC3F1D"/>
    <path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.959l1.045.704-3.003 4.487H7.49l2.695-4.014c-1.55-1.111-2.42-2.19-2.42-4.015 0-2.288 1.595-3.85 4.62-3.85h3.003v11.868H13.32V7.666z" fill="#fff"/>
  </svg>
)

export const SocialRow = ({ onClick }) => (
  <div className="ff-social">
    <button type="button" className="s" onClick={() => onClick?.('VK ID')}>{VK_SVG}VK ID</button>
    <button type="button" className="s" onClick={() => onClick?.('Яндекс')}>{YA_SVG}Яндекс</button>
  </div>
)

/* ── Строка файла со всеми состояниями (FileRow из screens-form-extra) ── */
export const FileRow = ({ file, onResume, onRemove, onReplace }) => {
  const { name, sizeMB, state, pct, errText, note } = file
  const cls = state === 'done' ? ' done' : state === 'over' ? ' warn' : (state === 'error' || state === 'broken') ? ' err' : ''
  return (
    <div className={'ff-file' + cls}>
      <span className="ic">
        {state === 'done'
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : (state === 'error' || state === 'broken')
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="9" strokeWidth="1.5" /></svg>
            : state === 'over'
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="9" strokeWidth="1.5" /></svg>
              : (name.split('.').pop() || '').toUpperCase().slice(0, 4)}
      </span>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 500, overflowWrap: 'anywhere' }}>{name}</div>
        <div className="ff-hint" style={{ marginTop: 'var(--sp-1)' }}>
          {state === 'done' && `${fmtMB(sizeMB)} · загружено`}
          {state === 'queue' && (note || 'в очереди — начнётся после текущего файла')}
          {state === 'progress' && `загружается · ${pct || 0}% · можно заполнять анкету дальше`}
          {state === 'broken' && `соединение прервалось на ${pct || 0}% — продолжим с этого места`}
          {(state === 'error' || state === 'over') && fmtMB(sizeMB)}
        </div>
        {(state === 'progress' || state === 'broken') && (
          <div className={'ff-bar' + (state === 'broken' ? ' err' : '')}><i style={{ width: (pct || 0) + '%' }}></i></div>
        )}
        {errText && <div style={{ fontSize: 'var(--fs-sm)', color: state === 'over' ? 'var(--warn)' : 'var(--err)', marginTop: 'var(--sp-1)', lineHeight: 1.35 }}>{errText}</div>}
      </div>
      {state === 'broken' && <button className="fbtn sm line" type="button" onClick={onResume}>Докачать</button>}
      {(state === 'error' || state === 'over') && onReplace && <button className="mlink" type="button" onClick={onReplace}>заменить файл</button>}
      {state === 'done' && onReplace && <button className="ff-act" type="button" onClick={onReplace}>заменить файл</button>}
      {onRemove && <button className="mlink" type="button" onClick={onRemove} aria-label="Убрать файл">убрать</button>}
    </div>
  )
}

/* ── Участник команды (MemberRow) ── */
const MEMBER_TAGS = {
  in:        { label: 'в команде', cls: 'ok' },
  confirmed: { label: 'подтвердил', cls: 'ok' },
  invited:   { label: 'не ответил', cls: 'wait' },
  declined:  { label: 'отклонил', cls: '' },
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
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 500 }}>{member.name || member.email}</div>
        <div className="cluster" style={{ color: 'var(--gray-2)', marginTop: 2 }}>
          {member.role === 'captain' ? `капитан${you ? ' · ты' : ''}` : member.name ? member.email : 'имя появится, когда участник примет приглашение'}
        </div>
      </div>
      {member.tag === 'invited' && onRemind && <button className="mlink" type="button" onClick={onRemind}>напомнить</button>}
      {onRemove && member.role !== 'captain' && <button className="mlink" type="button" onClick={onRemove}>убрать</button>}
      {isSenior(member.dob) && <span className="mtag">35+</span>}
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
