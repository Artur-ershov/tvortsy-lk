// Карточки номинаций — общие для витрины ЛК и секции 01 формы.
// Тёмные фото с лендинга tvortsy.online; мета (номер/EN/бейдж/описание) — из NOMINATIONS.
// В ЛК клик ведёт в форму (cta «Заявка →»), в форме клик выбирает номинацию (selected → «✓ Выбрано»).
import React from 'react'
import { NOMINATIONS } from '../state/store.jsx'
import imgAudio from '../assets/noms/audio.png'
import imgVisual from '../assets/noms/visual.png'
import imgDance from '../assets/noms/dance.jpg'
import imgMedia from '../assets/noms/media.jpg'
import imgSynth from '../assets/noms/synth.png'

export const NOM_IMG = { audio: imgAudio, visual: imgVisual, dance: imgDance, media: imgMedia }
export const NOM_CARD_KEYS = ['audio', 'visual', 'dance', 'media'] // порядок как на лендинге; синтез — отдельной плитой

export const NomCard = ({ k, selected = false, disabled = false, onClick, cta = 'Выбрать →' }) => {
  const n = NOMINATIONS[k]
  return (
    <button
      type="button"
      className={'nom-card' + (selected ? ' sel' : '') + (disabled ? ' disabled' : '')}
      onClick={() => { if (!disabled) onClick(k) }}
      disabled={disabled}
      aria-disabled={disabled}
      style={{ backgroundImage: `url(${NOM_IMG[k]})` }}
    >
      <div className="nom-top">
        <span className="nom-kick jbm">{n.num} / {n.en}</span>
        <span className="nom-badge">{disabled ? 'уже подана' : n.badge}</span>
      </div>
      <div>
        <div className="nom-title">{n.label}</div>
        <div className="nom-desc">{n.blurb}</div>
        <div className="nom-foot">
          <span className="nom-mode">соло или коллаб</span>
          <span className="nom-cta">{disabled ? 'уже подана' : selected ? '✓ Выбрано' : cta}</span>
        </div>
      </div>
    </button>
  )
}

// div, а не button: при selected внутрь раскрывается подвыбор направлений (children с кнопками)
export const SynthCard = ({ selected = false, disabled = false, onClick, cta = 'Выбрать →', children }) => {
  const n = NOMINATIONS.synth
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={'nom-synth' + (selected ? ' sel' : '') + (disabled ? ' disabled' : '')}
      onClick={() => { if (!disabled) onClick('synth') }}
      onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick('synth') } }}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="nom-top">
        <span className="nom-kick jbm" style={{ color: 'var(--accent-2)' }}>{n.num} / {n.en}</span>
        <span className="nom-badge" style={{ borderColor: 'var(--accent)', color: 'var(--sky-2)' }}>{disabled ? 'уже подана' : n.badge}</span>
      </div>
      <img src={imgSynth} alt="" aria-hidden="true" className="nom-synth-art" />
      <div>
        <div className="nom-title">
          {n.label} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--accent-2)', letterSpacing: 0 }}>— главная номинация</span>
        </div>
        <div className="nom-desc" style={{ color: 'var(--accent-3)' }}>{n.blurb}</div>
        <div className="nom-foot">
          <span className="nom-mode">соло или коллаб</span>
          <span className="nom-cta" style={{ background: disabled ? 'var(--plate-2)' : selected ? 'var(--ok)' : 'var(--sky-2)', color: disabled ? 'rgba(255,255,255,.7)' : selected ? '#fff' : 'var(--ink-soft)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-2) var(--sp-4)' }}>
            {disabled ? 'уже подана' : selected ? '✓ Выбрано' : cta}
          </span>
        </div>
      </div>
      {children && (
        <div
          className={'nom-synth-dirs' + (selected ? ' open' : '')}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  )
}
