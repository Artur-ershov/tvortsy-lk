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

export const NomCard = ({ k, selected = false, onClick, cta = 'Заявка →' }) => {
  const n = NOMINATIONS[k]
  return (
    <button
      type="button"
      className={'nom-card' + (selected ? ' sel' : '')}
      onClick={() => onClick(k)}
      style={{ backgroundImage: `url(${NOM_IMG[k]})` }}
    >
      <div className="nom-top">
        <span className="nom-kick jbm">{n.num} / {n.en}</span>
        <span className="nom-badge">{n.badge}</span>
      </div>
      <div>
        <div className="nom-title">{n.label}</div>
        <div className="nom-desc">{n.blurb}</div>
        <div className="nom-foot">
          <span className="nom-mode">соло или коллаб</span>
          <span className="nom-cta">{selected ? '✓ Выбрано' : cta}</span>
        </div>
      </div>
    </button>
  )
}

// div, а не button: при selected внутрь раскрывается подвыбор направлений (children с кнопками)
export const SynthCard = ({ selected = false, onClick, cta = 'Подать →', children }) => {
  const n = NOMINATIONS.synth
  return (
    <div
      role="button"
      tabIndex={0}
      className={'nom-synth' + (selected ? ' sel' : '')}
      onClick={() => onClick('synth')}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick('synth') } }}
      style={{ cursor: 'pointer' }}
    >
      <div className="nom-top">
        <span className="nom-kick jbm" style={{ color: '#7FA9C9' }}>{n.num} / {n.en}</span>
        <span className="nom-badge" style={{ borderColor: '#5B9BC9', color: '#C5E4F9' }}>{n.badge}</span>
      </div>
      <img src={imgSynth} alt="" aria-hidden="true" className="nom-synth-art" />
      <div>
        <div className="nom-title">
          {n.label} <span style={{ fontSize: 13, fontWeight: 400, color: '#7FA9C9', letterSpacing: 0 }}>— главная номинация</span>
        </div>
        <div className="nom-desc" style={{ color: '#A9C2D4' }}>{n.blurb}</div>
        <div className="nom-foot">
          <span className="nom-mode">соло или коллаб</span>
          <span className="nom-cta" style={{ background: selected ? '#1F8A5B' : '#C5E4F9', color: selected ? '#fff' : '#0C0C0D', borderRadius: 11, padding: '10px 16px' }}>
            {selected ? '✓ Выбрано' : cta}
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
