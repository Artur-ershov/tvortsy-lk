// Сплит-каркас авторизации: тёмное полотно-питч слева + paper-форма справа
// (стиль: lk3/screens-reg.jsx v3 / screens-auth.jsx)
import React from 'react'
import { Logo } from './Nav.jsx'

/**
 * header — правый слот пред-авторизационной шапки
 * kicker — mono-кикер слева сверху («Путь участника · 2026»)
 * title — гигантский заголовок (mega)
 * lede — абзац под заголовком
 * art — центр полотна (Group 559 и т.п.)
 * stats — [[число, подпись], …] нижняя полоса статов
 * posterBottom — произвольный низ полотна (вместо stats)
 */
export const AuthSplit = ({ header, kicker, title, titleSize = 92, lede, art, stats, posterBottom, children }) => (
  <div className="auth-shell">
    <div className="auth-top">
      <Logo />
      {header}
    </div>
    <div className="auth-grid">
      <div className="auth-poster">
        <span className="cluster"><span className="lab" style={{ color: 'var(--sky-2)' }}>{kicker}</span></span>
        <h1 className="mega" style={{ fontSize: titleSize, color: '#fff', marginTop: 'var(--sp-5)' }}>{title}</h1>
        {lede && (
          <p style={{ fontSize: 19, lineHeight: 1.4, maxWidth: 520, marginTop: 'var(--sp-5)', color: 'rgba(255,255,255,.8)' }}>{lede}</p>
        )}
        {art ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'var(--sp-9) 0' }}>{art}</div>
        ) : <div style={{ flex: 1 }}></div>}
        {stats && (
          <div className="poster-stats" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
            {stats.map(([n, t]) => (
              <div key={n}>
                <div className="n">{n}</div>
                <div className="t">{t}</div>
              </div>
            ))}
          </div>
        )}
        {posterBottom}
      </div>
      <div className="auth-panel">{children}</div>
    </div>
  </div>
)

/* Шапка панели: кикер + заголовок (+ подпись) */
export const PanelHead = ({ kicker, title, hint, kickerColor = 'var(--ink-blue)', titleColor = 'var(--ink-blue-2)' }) => (
  <div>
    <span className="kick" style={{ color: kickerColor }}>{kicker}</span>
    {title && <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-.02em', marginTop: 'var(--sp-3)', color: titleColor }}>{title}</div>}
    {hint && <div className="ff-hint" style={{ marginTop: 'var(--sp-2)' }}>{hint}</div>}
  </div>
)
