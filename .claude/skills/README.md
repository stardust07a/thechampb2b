# Kurulu skill'ler

Brief §0'daki 44 skill `/plugin` olmadan, depolar doğrudan klonlanarak kuruldu.
Kaynak depolar:

- vercel-labs/agent-skills
- jakubkrehel/skills
- Owl-Listener/designer-skills
- codeswithroh/tastemaker
- emilkowalski/skills
- nextlevelbuilder/ui-ux-pro-max-skill
- MengTo/Skills

`prisma-*` klasörleri `prisma init` tarafından eklendi, brief listesinde yoktur.

## Bu projede uygulananlar

| Skill | Nerede |
|---|---|
| `better-colors` | Token katmanı ölçüldü; `--text-faint` AA'nın altındaydı (2.87:1) → `#7F828C` / `#75767B` ile 4.5:1 üstüne çıkarıldı |
| `better-typography` | `font-variant-numeric: tabular-nums`, tek aile + Arapça eşi, `text-wrap: balance/pretty` |
| `better-accessibility` | Görünür odak halkası, `aria-current`, `<details>` tabanlı erişilebilir akordiyon filtreler |
| `localization-design` | Logical property'ler (`ms-`, `pe-`, `start-`), RTL aynalama, Latin wordmark'ta `dir="ltr"` |
| `dark-mode-design` | Varsayılan dark, `data-theme` + no-flash script, light tam palet |
| `no-ai-design-slop` | Mor/mavi gradyan yok, emoji ikon yok, stok illüstrasyon yok; her bölüm gerçek veriye bağlı |
| `search-ux` | 250ms debounce, URL'e yazılan filtre durumu, boş sonuç ekranı |
| `image-first-grid-layout` | Katalog kartları görsel öncelikli, eşit yükseklik |
| `container-lines` | `/what-we-do` ve `/manufacturing` adım zinciri |
