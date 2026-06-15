// Единый слой валидации полей — удобный UX поверх примитива <Field>.
// Валидатор: (value) => null | { error } | { warn } | { warn, block }
//   error        — жёсткая ошибка (красный, блокирует отправку)
//   warn         — мягкое предупреждение (янтарный, по умолчанию НЕ блокирует)
//   warn + block — предупреждение, которое всё же блокирует (например возраст вне 14–35)
import { useState } from 'react'
import { dobVerdict } from './store.jsx'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const err = (m) => ({ error: m })
const warn = (m, block = false) => ({ warn: m, block })

/* ───────── Готовые валидаторы ───────── */

export function vEmail(v) {
  const s = (v || '').trim()
  if (!s) return err('Укажи почту')
  if (!s.includes('@')) return err('В адресе не хватает «@»')
  if (/\s/.test(s)) return err('В адресе есть пробел')
  if (!EMAIL_RE.test(s)) return err('Проверь адрес — например, ivan@mail.ru')
  return null
}

export function vPhone(v) {
  const s = (v || '').trim()
  if (!s) return err('Укажи телефон')
  const d = s.replace(/\D/g, '')
  if (d.length < 11) return err('В номере не хватает цифр')
  if (d.length > 11) return err('В номере лишние цифры')
  if (!/^[78]/.test(d)) return err('Начни с +7 или 8')
  return null
}

// Одно имя-слово (фамилия / имя / отчество): только буквы, допускаются дефис и апостроф
const NAME_RE = /^[A-Za-zА-Яа-яЁё]+(['-][A-Za-zА-Яа-яЁё]+)*$/
function nameError(s) {
  if (/\d/.test(s)) return err('Только буквы — без цифр')
  if (/\s/.test(s)) return err('Одно слово — без пробелов')
  if (!NAME_RE.test(s)) return err('Проверь написание — буквы, дефис или апостроф')
  return null
}

// Обязательное имя-поле
export const vName = (msg = 'Заполни поле') => (v) => {
  const s = (v || '').trim()
  if (!s) return err(msg)
  return nameError(s)
}

// Необязательное имя-поле (например отчество): пусто — ок, но если введено — проверяем
export function vNameOpt(v) {
  const s = (v || '').trim()
  if (!s) return null
  return nameError(s)
}

export function vDob(v) {
  const s = (v || '').trim()
  if (!s) return err('Укажи дату рождения')
  const verdict = dobVerdict(s)
  if (verdict === 'invalid') return err('Формат: ДД.ММ.ГГГГ')
  if (verdict === 'young') return warn('Участвовать можно с 14 лет', true)
  if (verdict === 'old') return warn('Участвовать можно до 35 лет включительно', true)
  return null // ok | minor
}

// Возрастной гейт регистрации. Старше 35 нельзя участвовать самостоятельно,
// но можно в составе команды по приглашению — тогда не блокируем, а предупреждаем.
export const vDobRegister = (hasInvite = false) => (v) => {
  const s = (v || '').trim()
  if (!s) return err('Укажи дату рождения')
  const verdict = dobVerdict(s)
  if (verdict === 'invalid') return err('Формат: ДД.ММ.ГГГГ')
  if (verdict === 'young') return warn('Участвовать можно с 14 лет', true)
  if (verdict === 'old') {
    return hasInvite
      ? warn('Старше 35 — участвовать можно только в составе команды по приглашению')
      : warn('Самостоятельно участвовать можно до 35 лет — старше только по приглашению в команду', true)
  }
  return null // ok | minor
}

export function vPassword(v) {
  const s = v || ''
  if (!s) return err('Придумай пароль')
  if (s.length < 8) return err(`Добавь ещё ${8 - s.length} — пароль от 8 символов`)
  if (!/[A-Za-zА-Яа-яЁё]/.test(s)) return err('Добавь хотя бы одну букву')
  if (!/\d/.test(s)) return err('Добавь хотя бы одну цифру')
  return null
}

// Фабрики для параметризованных правил
export const vRequired = (msg = 'Заполни поле') => (v) => ((v || '').trim() ? null : err(msg))

export const vMinLen = (n, msg) => (v) => {
  const s = (v || '').trim()
  if (!s) return err(msg || 'Заполни поле')
  if (s.length < n) return err(`Слишком коротко — нужно не меньше ${n} символов`)
  return null
}

export const vMatch = (other, msg = 'Пароли не совпадают') => (v) => {
  if (!v) return err('Повтори пароль')
  if (v !== other) return err(msg)
  return null
}

/* ───────── Маски ввода ───────── */
// Форматируют значение по мере набора. Разделители ставятся только ПЕРЕД
// следующей цифрой — поэтому Backspace работает естественно (точка/дефис не «залипают»).

// Телефон РФ → «+7 917 240-18-66»
export function maskPhone(raw) {
  let d = (raw || '').replace(/\D/g, '')
  if (!d) return ''
  if (d[0] === '8') d = '7' + d.slice(1)      // 8 → 7
  else if (d[0] !== '7') d = '7' + d          // сразу с кода оператора → подставляем 7
  d = d.slice(0, 11)
  let out = '+7'
  const a = d.slice(1, 4), b = d.slice(4, 7), c = d.slice(7, 9), e = d.slice(9, 11)
  if (a) out += ' ' + a
  if (b) out += ' ' + b
  if (c) out += '-' + c
  if (e) out += '-' + e
  return out
}

// Дата → «ДД.ММ.ГГГГ»
export function maskDob(raw) {
  const d = (raw || '').replace(/\D/g, '').slice(0, 8)
  let out = d.slice(0, 2)
  if (d.length > 2) out += '.' + d.slice(2, 4)
  if (d.length > 4) out += '.' + d.slice(4, 8)
  return out
}

/* ───────── Хук поля ───────── */
// Возвращает { value, setValue, error, warn, ok, valid, show, reset, bind }.
// bind можно разложить прямо в <Field {...f.bind} /> — это value/onChange/onBlur/error/warn/ok.
export function useField(initial = '', validate, opts = {}) {
  const [value, setValue] = useState(initial)
  const [touched, setTouched] = useState(false)

  const res = (validate ? validate(value) : null) || {}
  const show = touched || opts.eager
  const error = show ? res.error || null : null
  const warnMsg = show ? res.warn || null : null
  // успех показываем «живо» — зелёная галочка по мере ввода ободряет
  const ok = !res.error && !res.warn && (value || '').trim() !== ''
  const blocked = !!res.error || (!!res.warn && !!res.block)

  return {
    value, setValue, touched,
    error, warn: warnMsg, ok,
    valid: !blocked,
    show: () => setTouched(true),
    reset: () => { setValue(initial); setTouched(false) },
    bind: {
      value,
      onChange: opts.mask ? (v) => setValue(opts.mask(v)) : setValue,
      onBlur: () => setTouched(true),
      error, warn: warnMsg, ok,
    },
  }
}

// Раскрыть ошибки всех полей и сфокусировать первое невалидное (для сабмита).
// fields — массив объектов из useField; container — DOM-узел формы.
export function revealInvalid(fields, container) {
  fields.forEach(f => f.show())
  if (container) {
    requestAnimationFrame(() => {
      const el = container.querySelector('.ff-input.err, .ff-input.warn')
      if (el) el.focus()
    })
  }
}
