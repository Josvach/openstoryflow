# OpenStoryflow

Nekonečné vizuální plátno kombinující whiteboard, kanban, mindmapu a storyboard, s dvouúrovňovým AI asistentem poháněným **Google Gemini (free API)**. Běží jako **webová aplikace na Vercelu** — žádné účty, žádné platby, tvůj interní nástroj. Všechna data (boardy, dokumenty, obrázky i API klíč) zůstávají **v prohlížeči** (IndexedDB); ven jdou jen tvoje prompty přímo na Gemini.

## 🚀 První nasazení na Vercel (jednou, ~3 minuty)

1. Přihlas se na [vercel.com](https://vercel.com) (tlačítko **Continue with GitHub**).
2. **Add New… → Project** → vyber repozitář `openstoryflow` → **Import**.
3. Nic nenastavuj (žádný build — je to statická stránka + jedna API funkce) → **Deploy**.
4. Hotovo — dostaneš URL typu `openstoryflow.vercel.app`. Tu si ulož/připni.

## 🔁 Jak aktualizovat (pokaždé pak)

Jakýkoliv **push do větve `main` automaticky nasadí novou verzi** — nic dalšího není potřeba:

```bash
git add -A && git commit -m "úprava" && git push origin main
```

Za ~30 s je změna živá na stejné URL. Historii deployů a rollback najdeš na vercel.com v projektu (záložka Deployments → ⋯ → Promote/Rollback).

## 🔑 Zapnutí AI

1. Zdarma klíč: [aistudio.google.com](https://aistudio.google.com) → **Get API key**.
2. V aplikaci **⚙ Settings** → vlož klíč → Save. Klíč zůstává jen v tvém prohlížeči.
3. Výchozí modely: `gemini-2.5-flash` (text), `gemini-2.5-flash-image` (obrázky) — změnitelné v Settings.

## 💾 Kde jsou data a jak je zálohovat

- Vše je v **IndexedDB tvého prohlížeče** (per doména + prohlížeč). Žádný server nic neukládá.
- **Záloha / přenos do jiného prohlížeče:** Export → **Project JSON** (stáhne soubor) a jinde Export → **Import project JSON**.
- Soubory přetažené na plátno (obrázky, PDF, video…) se ukládají tamtéž jako součást projektu.
- Pozor: „Vymazat data prohlížeče" smaže i boardy — před čištěním prohlížeče exportuj JSON.

## 🧪 Lokální vývoj

```bash
npx serve .          # rychlý statický náhled (bez /api náhledů odkazů)
npx vercel dev       # plný běh včetně /api/link-meta (vyžaduje vercel login)
```

## Co aplikace umí

- **Nekonečné plátno** — pan (tažení prázdné plochy / mezerník), zoom (kolečko/pinch), zoom-to-fit (⌘0 / dvojklik do prázdna), rubber-band výběr (Shift+tažení), multi-select, duplikace ⌥+tažením, zarovnávací lišta, spojovací šipky, kapátko (I), sketch pero (S).
- **Objekty** (zkratky): `N` note, `L` link s auto-náhledem, `T` to-do, `W` wall/sekce, `F` folder = vnořené plátno, `C` komentář (vlákno + resolve), `G` AI obrázek, drag & drop souborů (obrázky, PDF s náhledem, video s 📸 capture snímku, audio), paste čehokoliv.
- **Tactics** — 30+ expertních blueprintů (Hero's Journey, Save the Cat, AIDA, StoryBrand…) v 5 kategoriích; každá karta zná svůj účel → **card-level AI** (✨). Výběr karet lze uložit jako vlastní Tactic.
- **Templates** — Kanban, Mind Map, Storyboard, Moodboard, Second Brain, Film Plan…
- **Board-level AI chat** (⌘K) — postaví/přeskládá board z promptu, @zmínky (1 Tactic + 3 Docs + karty), styly odpovědi, perzistentní paměť projektu.
- **Docs** — dlouhé texty vedle boardů, export do PDF (přes tiskový dialog).
- **Export/Import** — board/výběr → PNG, board → PDF shrnutí, projekt → JSON.

## Struktura repa

```
index.html, styles.css   UI
js/app.js                shell, panely, AI (Gemini)
js/canvas.js             engine nekonečného plátna
js/data.js               knihovna Tactics & Templates
js/platform.js           IndexedDB úložiště + exporty (web)
api/link-meta.js         Vercel funkce: náhledy URL
```
