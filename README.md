# OpenStoryflow

Plně **lokální macOS aplikace** — nekonečné vizuální plátno kombinující whiteboard, kanban, mindmapu a storyboard, s dvouúrovňovým AI asistentem poháněným **Google Gemini (free API)**. Žádné účty, žádné platby, žádný cloud — všechna data leží v jednom JSON souboru na disku.

## Spuštění (vývoj)

```bash
npm install
npm start
```

## Build macOS aplikace (.dmg)

```bash
npm run dist
# výstup v dist/OpenStoryflow-*.dmg
```

## Nastavení AI

1. Získej zdarma API klíč na [aistudio.google.com](https://aistudio.google.com) → **Get API key**.
2. V aplikaci otevři **⚙ Settings** a klíč vlož.
3. Výchozí modely: `gemini-2.5-flash` (text) a `gemini-2.5-flash-image` (obrázky) — lze změnit v nastavení.

## Co umí

- **Nekonečné plátno** — pan (tažení prázdné plochy / mezerník), zoom (kolečko/pinch), zoom-to-fit (⌘0 nebo dvojklik do prázdna), rubber-band výběr (Shift+tažení), multi-select (Shift+klik), duplikace ⌥+tažením, zarovnávací lišta (řada/sloupec/mřížka/rozprostření) při výběru 2+ karet, kapátko (I, EyeDropper API).
- **Objekty** (klávesové zkratky): `N` note, `L` link (s automatickým náhledem URL), `T` to-do checklist, `W` wall/sekce, `F` folder = vnořené neomezené plátno (dvojklik pro vstup, breadcrumb pro návrat), `C` komentář s vláknem a resolve, `G` AI obrázek, `S` sketch/pero, `A` spojovací šipka, drag & drop libovolných souborů (obrázky, PDF s náhledem, video s 📸 zachycením snímku, audio), paste textu/obrázků/URL přímo na plátno.
- **Tactics (blueprints)** — 30+ expertních rámců (Hero's Journey, Save the Cat, AIDA, StoryBrand, Documentary Outline…) v kategoriích Filmmaking / Content Creation / Business / Personal / Writing, s náhledem struktury, vyhledáváním a vložením na plátno. Každá karta zná svůj účel → **card-level AI** (✨ na kartě). Výběr karet lze uložit jako **vlastní Tactic**.
- **Templates** — hotová rozvržení (Kanban, Mind Map, Storyboard, Moodboard, Second Brain, Film Plan…), plně editovatelná.
- **Board-level AI chat** (dole) — vygeneruje celý board z jednoho promptu, iterativně ho přeskládá ("udělej z toho mindmapu"), kritizuje/sumarizuje; `@` zmínky (1 Tactic + až 3 Docs + konkrétní karty), styly odpovědi (Default/Creative/Concise/Detailed), **perzistentní paměť projektu** napříč sezeními (editovatelná v Settings).
- **Docs** — dlouhé textové dokumenty vedle boardů, s formátováním a exportem do PDF; AI je čte přes @zmínky.
- **Export/Import** — board nebo výběr jako PNG, board jako PDF shrnutí pro stakeholdery, projekt jako JSON (záloha/přenos) + import.
- **Usage dashboard** v Settings (počty AI volání, obrázků, uploadů).

## Kde jsou data

Jeden soubor `openstoryflow-data.json` v adresáři uživatelských dat aplikace (`~/Library/Application Support/OpenStoryflow/` na macOS). Zálohu/přenos řeší Export → Project JSON.

## Záměrně mimo rozsah

Podle zadání: platby/plány/feature-gating (vše je odemčené), účty a registrace, real-time týmová kolaborace a sdílené odkazy (aplikace je single-user lokální; „sdílení" = export PNG/PDF/JSON). Zachycení snímku funguje pro nahraná lokální videa (YouTube/Vimeo embed nedovoluje cross-origin capture).
