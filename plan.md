# Plan Revisi Klien — OEE Wireframe

> **Sumber revisi:** [task.md](task.md)
> **Status proyek:** wireframe statis → sekarang klien minta **data bergerak saat filter dipilih** (pakai static JSON sebagai sumber data).

## Cara Kerja (ATURAN PENTING)

1. **Kerjakan SATU checklist `[ ]` per session.** Jangan lompat atau borong banyak task sekaligus.
2. Setelah satu task selesai dan terverifikasi (buka di browser, data berubah saat filter dipilih), **centang `[x]`** task itu di file ini.
3. Tulis catatan singkat di kolom "Catatan" bila ada keputusan penting.
4. Kerjakan **berurutan dari atas** — Fase 0 (data layer) wajib selesai duluan karena semua fase lain bergantung padanya.
5. Jaga **konsistensi data antar halaman**: semua angka harus berasal dari `data/*.json` yang sama.

---

## Fase 0 — Fondasi Data (WAJIB DULUAN)

Klien minta: *"buat data bergerak saat filter dipilih … buat semuanya static json mulai dari master sampai hasil, pastikan semua data konsisten across all pages."*

- [x] **0.1 — Desain skema data JSON.** Tentukan struktur entitas mengikuti `material/image copy.png`: Supplier, Raw Material, Recipe, Product, Operator, Schedule, Batch, Line, Machine, Downtime Reason. Dokumentasikan field tiap entitas. → **Selesai:** [data/SCHEMA.md](data/SCHEMA.md)
- [x] **0.2 — Buat master data JSON.** `data/master.json` berisi semua entitas master (products, recipes, machines, operators, lines, reasons) dengan ID yang saling konsisten/relasional. → **Selesai:** [data/master.json](data/master.json), FK tervalidasi 0 error.
- [x] **0.3 — Buat data hasil/transaksi JSON.** `data/oee.json` (atau beberapa file): time-series OEE per machine/line/shift/tanggal, downtime events, batch records. Angka harus bisa di-agregasi (hourly/daily/weekly/monthly) dan tetap konsisten dengan master. → **Selesai:** [data/oee.json](data/oee.json) via [data/generate_oee.py](data/generate_oee.py). 672 oeeRecords, 1145 downtimeEvents, 42 batches. FK 0 error, decomposition rekonsiliasi exact, plant OEE=83.3%.
- [x] **0.4 — Buat shared data loader JS.** `js/data.js`: fetch JSON, helper filter & agregasi (by date range, line, machine, shift, operator), helper format angka/persen. Dipakai ulang semua halaman. → **Selesai:** [js/data.js](js/data.js). API: `OEE.load/kpis/sixBigLosses/pareto/trend/machineRank/lossByMachine/reportRows/machineStatusList/statusSummary/downtimeList/options`. Diuji di Node (stub fetch): semua helper benar, filter narrowing OK.
- [x] **0.5 — Verifikasi load.** Pastikan JSON ter-load via `fetch` saat dibuka di browser (cek soal `file://` CORS — bila perlu, dokumentasikan cara serve lokal, mis. `python -m http.server`). → **Selesai:** diuji via headless Chrome di atas `python -m http.server` → `RESULT=PASS` (OEE 83.3%, status 3/1/2, 1145 events). **Fase 0 fondasi data lengkap.**

---

## Fase 1 — Dashboard (`index.html`)

- [x] **1.1 — Sederhanakan layout.** Buang tampilan berlebih, **hapus semua filter kecuali selector aggregate** dalam bentuk **button group** (Hourly / Daily / Weekly / Monthly). → Filter bar lama (date from/to, line, shift, apply) dihapus; diganti `.seg-group` button group. Panel "Recent Downtime Events" + grid mesin penuh dibuang (jadi summary), sesuai "tidak perlu banyak tampilan".
- [x] **1.2 — Tonjolkan OEE.** Card OEE dibedakan jelas (ukuran/posisi/visual) dari card Availability, Performance, Quality — jangan disamakan. → `.oee-hero` (gradient hijau, value 64px) vs `.kpi-card` A/P/Q kecil.
- [x] **1.3 — Summary machine status.** Tambah ringkasan status mesin (running/idle/down + jumlah). → `.status-summary` 4 tile dari `OEE.statusSummary()` (3 running / 1 idle / 2 down / 6 total).
- [~] **1.4 — Hapus hopper.** Buang elemen "hopper" dari dashboard. → **BLOCKED:** tidak ada elemen "hopper/hoper" di index.html (dulu/sekarang). Perlu klarifikasi klien elemen mana yang dimaksud. Dashboard sudah disederhanakan signifikan di 1.1.
- [x] **1.5 — Hubungkan ke data.** Angka KPI, grid mesin, dan loss summary bergerak saat button aggregate dipilih (ambil dari Fase 0). → Semua dari `js/data.js`. Diverifikasi headless: OEE 83.3%, A/P/Q 91.8/93.0/97.5, six-big-losses + donut terisi; toggle Hourly→83.9% (96 rec) vs week 83.3% (672 rec) = data bergerak.

---

## Fase 2 — Line Monitoring (`monitoring.html`)

- [x] **2.1 — Hapus OEE di status mesin.** Status mesin tidak menampilkan OEE. → Row OEE dibuang dari machine card (diverifikasi: 0 `machine-card__key">OEE`). OEE masih muncul di popup detail (boleh, bukan "status card").
- [x] **2.2 — Rapikan filter.** Hapus filter shift; sisakan **filter Status dan Line saja**. → Filter shift + tombol Apply dihapus; filter on-change. Line dropdown hanya line aktif (L-01, L-02; L-03 commissioning dikecualikan).
- [x] **2.3 — Popup machine detail.** Tambah popup/modal detail mesin saat mesin diklik. → `.modal` reusable di style.css; klik card / Details / Esc / klik overlay. Isi: status, batch, product, recipe, operator, OEE, dan detail downtime bila down.
- [x] **2.4 — Hubungkan ke data.** Daftar/grid mesin bergerak saat filter Status & Line dipilih. → Render dari `OEE.machineStatusList(filter)`. Diverifikasi: 6 machine card, 2 line summary (81.9% / 85.9%), active downtime = M-02 & M-06 (mesin down).

---

## Fase 3 — Report (`report.html`)

- [x] **3.1 — Filter 2 baris.** Baris 1: date range + aggregate. Baris 2: batch, line, machine, shift, operator — **hanya boleh satu yang dipilih**; saat satu dipilih, sisanya reset ke "All". → `.filter-rows`/`.filter-row`. Mutual-exclusion: handler `change` pada tiap `.js-dim` reset sibling ke `all` lalu `renderAll()`. Dropdown terisi: 42 batch, 3 line, 6 machine, 3 shift, 6 operator.
- [x] **3.2 — Pareto chart.** Tambah pareto chart loss. → Combo bar+line dari `OEE.pareto(f)` (bar menit per kategori + garis kumulatif %).
- [x] **3.3 — Machine value rank.** Tabel/chart ranking nilai per mesin. → Tabel rank dari `OEE.machineRank(f)`, urut OEE desc, podium 1/2/3 berwarna. Verifikasi: M-04→M-06→M-05→M-01→M-03→M-02.
- [x] **3.4 — Loss distribution by machine.** Visual distribusi loss per mesin. → Stacked bar `OEE.lossByMachine(f)` (6 kategori loss per mesin).
- [x] **3.5 — Hubungkan ke data.** Semua tabel/chart bergerak sesuai filter (termasuk logika reset baris kedua). → KPI, trend, six-big-losses, loss-by-category, rank, pareto, loss-by-machine, detail table (84 baris) semua dari `js/data.js`. Diverifikasi headless: KPI 83.3/91.8/93.0/97.5, 4 chart init.

---

## Fase 4 — Downtime Entry (`downtime.html`)

- [x] **4.1 — Date range filter.** Tambah filter rentang tanggal pada daftar downtime. → Input Date tunggal diganti Date From / Date To (+ filter Line & Shift fungsional).
- [x] **4.2 — Paginasi.** Tambah paginasi pada daftar. → Pager windowed (Prev / 1 2 3 … N / Next) + page-size 10/20/50. CSS `.pagination`. Diverifikasi: 412 entri stop → 42 halaman, "Showing 1–10 of 412".
- [x] **4.3 — Hubungkan ke data.** Daftar downtime bergerak sesuai date range + paginasi (dari `data/*.json`). → Tabel "Completed Downtime Entries" dari `OEE.downtimeList(filter,page,size)`, difilter ke kategori stop nyata (equipment_failure/setup/idling) newest-first. Tabel "Pending Reason Entry" + 3 modal `:target` dibiarkan statik (demo workflow input operator, bukan data historis).

---

## Fase 5 — Finalisasi

- [x] **5.1 — Audit konsistensi.** Cek angka OEE/loss/mesin sama di dashboard, monitoring, dan report untuk periode yang sama. → Audit lolos: Dashboard week OEE == Report week OEE (83.3% exact); per-line L-01 81.9%/L-02 85.9% sama di monitoring & report; status 3/1/2/6 di semua halaman; rekonsiliasi availability exact (3309=3309). Konsisten by-construction (satu sumber `js/data.js`).
- [x] **5.2 — Update CLAUDE.md.** Catat bahwa wireframe kini pakai JS + static JSON (sebelumnya "no JavaScript"), dan cara menjalankannya secara lokal. → [CLAUDE.md](CLAUDE.md) diperbarui: Purpose, Pages (+data/js), Technology (+data layer API), How to View (wajib `python3 -m http.server`).

---

### Status Akhir

**Semua fase selesai (0–5).** Data di-embed sebagai `data/master.js` + `data/oee.js` (script tag) supaya wireframe **jalan via `file://` (klik-ganda)** tanpa server; `js/data.js` fallback ke fetch JSON bila di-serve http. Grafik (ECharts) masih dari CDN → butuh internet; KPI/tabel/kartu jalan offline. 1 item open: **1.4 hapus "hopper"** — elemen tidak ditemukan di HTML, perlu klarifikasi klien soal elemen mana yang dimaksud. Halaman yang di-wire ke data layer & diverifikasi di browser: `index.html`, `monitoring.html`, `report.html`, `downtime.html`. Halaman lain (`master.html`, `schedule.html`, dst.) tetap statik — di luar scope revisi klien; `master.json` justru dibangun dari `master.html` jadi tetap selaras. **Jalankan via `python3 -m http.server` lalu buka `http://localhost:8000/`** (bukan file://).

### Revisi lanjutan (dashboard aggregate)
- Klien: hapus aggregate **Hourly & Daily**, sisakan **Weekly & Monthly**. Chart pakai granularitas **harian per item**: Weekly = jumlah hari dlm minggu (7 titik), Monthly = jumlah hari dlm bulan (31 titik untuk Mei). Hari tanpa data = `null` (gap). Diimplementasikan via `buildDailyTrend(scope)` + `eachDay()` di index.html. Verifikasi: Weekly 7 titik, Monthly 31 titik (7 berisi data 15–21 Mei, sisanya null). **Catatan:** Monthly tampak jarang karena dummy data hanya 1 minggu (15–21 Mei) — kalau mau Monthly penuh, perlu generate data lebih banyak hari di `generate_oee.py`.
- **Fix:** dataset diperluas ke **sebulan penuh (1–31 Mei)** di `generate_oee.py` (`DAYS = range(1,32)`), snapshot status mesin tetap di `SNAP_DAY='2026-05-21'` agar selaras topbar. Kini Monthly = 31 titik terisi penuh, Weekly = 7 titik (15–21). KPI weekly 83.3% vs monthly 82.6% (beda, benar). Date picker report & downtime diperluas ke 01–31 Mei. Data: 2976 oeeRecords, 5149 downtimeEvents, 186 batches.

### Catatan
- **0.1** — Skema didokumentasikan di [data/SCHEMA.md](data/SCHEMA.md). Keputusan penting:
  - Data dipecah 2 file: `master.json` (master statis) + `oee.json` (transaksi/hasil).
  - Sumber semua angka OEE = `oeeRecords[]` time-series **per jam** (granularitas terhalus); daily/weekly/monthly diagregasi di loader pakai rumus A=run/planned, P=total/ideal, Q=good/total, OEE=A×P×Q. Ini kunci konsistensi antar halaman.
  - ID kanonik (`LINE-01`, `morning`) disimpan di data; label tampil (`Line 1`, `Morning`) diambil dari master saat render.
  - Rentang dummy disepakati **15–21 Mei 2026** (cocok dgn tanggal di UI existing).
  - Catatan: literal "hopper/hoper" tidak ditemukan di HTML manapun — klarifikasi elemen mana yg dimaksud klien saat Fase 1.4.
- **Fase 1** — [index.html](index.html) ditulis ulang: head (+`js/data.js`), sidebar, topbar dipertahankan. Aggregate button-group mengubah **scope+granularity**: Hourly=hari terakhir(21 Mei) per-jam, Daily/Weekly/Monthly=full week dgn bucket beda. Loss-badge class dipetakan via `OEE.LOSS_META[cat].badge` (ditambahkan ke data.js, dipakai ulang semua halaman nanti). CSS baru di style.css: `.seg-group`, `.oee-hero`, `.status-summary/.status-tile`. **1.4 hopper masih blocked** — tanyakan klien.
- **0.5** — Diverifikasi di **browser sungguhan** (headless Chrome) di atas server lokal, bukan cuma Node. `file://` akan gagal (CORS) — **wajib serve lewat http**. Cara jalan lokal: `python3 -m http.server` lalu buka `http://localhost:8000/index.html`. Bug ketemu & diperbaiki saat verifikasi: `basePath()` semula return `""` (asumsi halaman di root) → diganti agar resolve root dari URL script `js/data.js`, jadi loader rob2 walau halaman ada di subfolder. Dokumentasi formal cara-jalan masuk ke task 5.2 (update CLAUDE.md). **→ Berikutnya: Fase 1 (Dashboard). Catatan: task 1.4 "hapus hopper" masih perlu klarifikasi klien (elemen tak ditemukan).**
- **0.4** — [js/data.js](js/data.js) sbg `window.OEE` global (no modules, agar jalan di static page). Six-big-losses & pareto dihitung dari `downtimeEvents` (reason-level), KPI dari `oeeRecords` — keduanya difilter sama jadi konsisten. Filter pakai konvensi `null/'all'/''` = no constraint. **Catatan utk Fase 4:** `downtimeList()` mengembalikan SEMUA event (termasuk loss perf/quality turunan brdurasi kecil); halaman Downtime Entry mungkin perlu filter `source==='Manual'` atau hanya kategori availability utk meniru "manual input log" — putuskan saat 4.x. Verifikasi browser (CORS) = task 0.5.
- **0.3** — [data/oee.json](data/oee.json) di-generate oleh [data/generate_oee.py](data/generate_oee.py) (deterministik via hash seed, bisa re-run). Granularitas per jam 06:00–21:00, 15–21 Mei 2026, 6 mesin aktif. Semua angka patuh dekomposisi waktu OEE (A=run/planned, P=total/ideal, Q=good/total) → downtime events availability **tepat** = (planned−run). Loss perf/quality juga di-emit sbg event (durasi=menit-loss-ekuivalen) supaya report pareto & loss-distribution punya data reason-level yg rekonsiliasi. Validasi: 0 FK error, plant week OEE 83.3% (mendekati angka dashboard existing).
- **0.2** — [data/master.json](data/master.json) dibuat dari nilai asli di master.html (bukan karangan). Penyesuaian skema: line ID pakai `L-01/L-02/L-03` (sesuai master.html), **bukan** `LINE-01` seperti draft awal SCHEMA.md. machines termasuk M-07 (inactive). Tiap reason diberi field `color` agar chart/badge ambil warna langsung dari data. Divalidasi: 0 FK error (machine→line, operator→line, product→supplier/rm, recipe→product).
