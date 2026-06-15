# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`tvortsy-lk` — a **design prototype / demo** of the participant personal account (личный кабинет, "ЛК") for the festival **«Творцы РФ 2026»**. React 18 + Vite, no backend: every flow runs client-side and persists to `localStorage`. The UI, code comments, and commit messages are all in **Russian** — match that language when editing.

A real production twin of this product lives separately at `applications.tvortsy.online` (same stack, but BrowserRouter + a real `/api`). This repo is the prototype, not that app.

## Commands

```bash
npm run dev       # Vite dev server (DemoPanel is mounted only here, via import.meta.env.DEV)
npm run build     # production build → dist/
npm run preview   # serve the built dist/
```

There are **no tests and no linter** configured. Verification is manual via the dev server and the DemoPanel.

## Architecture

### Single global store (the heart of the app)
`src/state/store.jsx` holds nearly all logic: a `useReducer` + React Context store exposing `{ state, dispatch, toast }` through `useStore()`. It contains the reducer (all `action.type`s), the domain reference data, seed/persona data, the file-upload simulator, and `localStorage` persistence (debounced, key `LS_KEY` — **bump that key when the persisted shape changes**, as was done for `v2`). When adding behavior, add an action to the reducer here rather than holding business state in component-local `useState`.

### Account "stage" state machine
The whole app is gated on `state.stage`:
```
guest → registered (email+password+DOB, awaiting code) → confirmed (fill profile) → active
                                              ↘ minor-wall (ages 14–17: guardian consent) ↗
```
- `App.jsx` `HOME` maps each stage to its landing route; `Index` redirects `/` accordingly.
- `RequireActive` guards `/cabinet`, `/profile`, `/apply/:id`, `/success/:id` — non-active stages bounce back to their stage's home.
- Age branching happens in the `confirm-email` action via `dobVerdict(profile.dob)`. DOB is collected at **registration**, not in the onboarding form (under-18 can't register without consent, so it's asked first).

### Routing
`BrowserRouter` (clean paths, matching the prod twin; switched from HashRouter). All routes are declared in `src/App.jsx`. Prod needs an SPA fallback (any path → `index.html`) — `vercel.json` rewrite in the repo root; Vite dev handles it automatically. `/join/:id` is intentionally reachable by guests (auth happens inside the screen).

### Validation layer
`src/state/validation.js` sits on top of the `<Field>` primitive. Validators return `null | {error} | {warn} | {warn, block}` (warn blocks submit only when `block` is set — e.g. age outside 14–35). Use the `useField(initial, validate, opts)` hook and spread `f.bind` into `<Field>`; call `revealInvalid(fields, container)` on submit. Input masks (`maskPhone`, `maskDob`) live here too.

### Components & screens
- `src/components/ui.jsx` — shared primitives (`Field`, `Chips`, `Check`, `PasswordInput`, `FileRow`, `MemberRow`, `Modal`, `StatusTimeline`, `StatusTag`, decorative `Pix`/`Wing`). Reach for these before writing new markup.
- `src/components/` also has `Nav` (cabinet header + profile menu), `AuthSplit` (dark-poster + form split for auth screens), `NominationCards`, `DemoPanel`.
- `src/screens/` is grouped by domain: `auth/`, `cabinet/`, `form/`, `team/`.

### DemoPanel
`src/components/DemoPanel.jsx` (DEV-only floating "demo" button, bottom-right) is the intended way to reach every designed state. It dispatches `scenario` actions (personas: new user, Мария, Кирилл the invitee, Тимур the minor) and exposes "moderator" actions (advance status, break an upload, confirm invites). When you add a new state worth demoing, wire it in here.

### Styling
Plain CSS, imported once in `src/main.jsx`: `tokens.css` (CSS-variable design tokens — colors, radius scale `--r-*`, fonts) → `base.css` → `forms.css` → `app.css`. No CSS framework; expect a mix of `className` conventions and inline `style` for one-offs. Use the token variables (`var(--accent)`, `var(--r-md)`, …) rather than hardcoding values.

## Domain concepts (defined in store.jsx)

- **Nominations** (`NOMINATIONS`, `NOMINATION_KEYS`): audio / media / dance / visual / synth. Each carries allowed formats and a size cap; `synth` requires ≥2 directions and caps the **total** size across all files.
- **Application** (`newDraft`): status flows `draft → submitted → review → admitted → results`, plus `rework`. `CYCLE` is the visible timeline (draft sits outside it). `APP_LIMIT = 2` submitted apps (drafts don't count); checked in `submit-app`.
- **Completion logic**: `computeTodos`, `sectionState`, `filledCount` derive "what's left before submit" — the form and cabinet both read from these, so keep them as the single source of truth.
- **Teams / invites**: an application has `members` with `tag` of `in | confirmed | invited | declined`. An invitee's name is unknown until they accept (only email is shown). `team-shum` is a fixed id so the demo link `/join/team-shum` works out of the box.
- **File upload** is simulated by an interval in `StoreProvider` that advances `pct` on `progress` files; `classifyFile` validates format/size on add.

## Conventions & gotchas

- **Design provenance** (recorded in memory): structure/flow comes from "Итерация 3" (`it3-*`), visual style from "Основные экраны" (`fig-*` / `screens-*`). **Explicit client edits override the mockups.** File-header comments cite their source — preserve that style.
- **Names**: full name order is "Фамилия Имя Отчество" (`fullName`), but **initials are Имя+Фамилия** (`initialsOf` → "Соколова Мария" = "МС"). Russian pluralization helpers (`ageWord`, `memberWord`, `draftWord`) exist — use them rather than naive `+ ' лет'`.
- **Demo credentials**: log in as `m.sokolova@mail.ru` with any password; the email confirmation code is any 4 digits.
- **Screen-header principle**: each screen shows only its own content — identity (name/avatar) lives in `Nav`, profile data (email/city/age) lives in `Profile`; don't duplicate them as headers elsewhere. Cabinet and form titles share one scale (`clamp(40px, 6.5vw, 76px)`).
- This is a prototype: some production-readiness items (hardcoded dates, demo strings on real screens, mock auth/upload) are **known and tracked**, not bugs to fix unprompted.
