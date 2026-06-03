# OEE Wireframe

Static HTML/CSS wireframe for an **Overall Equipment Effectiveness (OEE)** manufacturing system.
For team review before full development begins.

## Purpose

Interactive wireframe for team review before full development. Originally static HTML/CSS;
now **data-driven** — pages read a static JSON dataset and recompute KPIs/charts/tables live
as filters change. No backend; the only external dependency is ECharts (CDN).

> **Run it over http**, not `file://` — pages `fetch()` the JSON, which browsers block on
> `file://`. See *How to View* below.

## Pages

| File              | Purpose                                               |
|-------------------|-------------------------------------------------------|
| `index.html`      | OEE Dashboard — OEE hero, A/P/Q, machine-status summary, trend, losses (aggregate button-group) |
| `monitoring.html` | Line & Machine monitoring (Status/Line filter, machine-detail popup) |
| `downtime.html`   | Downtime entry / Daftar Alasan Downtime (date-range filter + pagination) |
| `report.html`     | OEE Reports — 2-row filter, pareto, machine value rank, loss-by-machine |
| `schedule.html`   | Production schedule & batch management                |
| `master.html`     | Master data (Products, Recipes, Machines, Operators, Reasons) |
| `style.css`       | All shared styles (single CSS file)                   |
| `js/data.js`      | Shared data layer — loads JSON, filters/aggregates (`window.OEE`) |
| `data/master.json`| Master entities (suppliers, products, recipes, lines, machines, operators, shifts, reasons) |
| `data/oee.json`   | Transactional data (batches, per-hour OEE records, downtime events, machine status) |
| `data/SCHEMA.md`  | Data schema + consistency conventions                 |
| `data/generate_oee.py` | Deterministic generator for `oee.json`           |

## OEE Framework

```
OEE = Availability × Performance × Quality
```

| OEE Component    | Loss Type          | Color    | Code Prefix |
|------------------|--------------------|----------|-------------|
| Availability     | Equipment Failure    | Red      | U-xxx       |
| Availability     | Setup & Adjustments      | Orange   | P-xxx       |
| Performance      | Idling & Minor Stoppages        | Blue     | S-xxx       |
| Performance      | Reduced Speed        | Slate    | SC-xxx      |
| Quality          | Process Defects | Purple   | Q-xxx       |
| Quality          | Reduced Yield    | Lt Purple| Q-xxx       |
| **OEE Result**   | Fully Productive Time | **Green** | —       |

## Color Conventions

| Color       | Hex       | Used For                              |
|-------------|-----------|---------------------------------------|
| Green       | `#5BB85D` | OEE, Running status, Fully Productive |
| Red         | `#E8452B` | Equipment Failure, Down status          |
| Orange      | `#F4821E` | Setup & Adjustments                         |
| Blue        | `#4DA6E8` | Idling & Minor Stoppages, Performance KPI          |
| Slate Blue  | `#6EA8C8` | Reduced Speed                           |
| Purple      | `#8B5BB4` | Process Defects, Quality KPI       |
| Lt Purple   | `#B08FCC` | Reduced Yield                       |
| Amber       | `#F4C542` | Idle status, OEE warning range        |
| Dark Navy   | `#1E2A38` | Sidebar background                    |

## Data Entities (from material/image copy.png)

```
Supplier → Raw Material ↔ Recipe → Product
Operator → Schedule → Schedule Revision
              ↓
            Batch → Line → Machine
                             ↓
                        Manual Input → Daftar Alasan Downtime
```

## Technology

- HTML5 + CSS3 + vanilla JavaScript (no framework, no build step)
- **ECharts** via CDN for charts (dashboard & report)
- Static JSON dataset in `data/`; `js/data.js` (`window.OEE`) is the single source of truth —
  every page's numbers are derived from it, so figures stay consistent across pages
- CSS `:target` pseudo-class for tab navigation in `master.html` and downtime reason modals
- All styles in a single `style.css` with CSS custom properties

### Data layer (`window.OEE`)

`await OEE.load()` once per page, then call helpers with a filter
`{ dateFrom, dateTo, lineId, machineId, shiftId, operatorId, batchId }` (any key omitted /
`'all'` = no constraint): `kpis`, `sixBigLosses`, `pareto`, `trend(filter, granularity)`,
`machineRank`, `lossByMachine`, `reportRows`, `machineStatusList`, `statusSummary`,
`downtimeList(filter, page, pageSize)`, `options`. To regenerate the dataset:
`python3 data/generate_oee.py`.

## Reference Materials

- `material/image.png` — OEE Six Big Losses framework table (color reference)
- `material/image copy.png` — Manufacturing flow diagram with entity relationships

## How to View

**Just open `index.html`** in a browser — works on `file://` (double-click) because the
dataset is embedded as `data/master.js` + `data/oee.js` (loaded via `<script>` tags, no
`fetch`). The data layer falls back to fetching `data/*.json` when those globals are absent.

> Charts use ECharts from a **CDN**, so they need internet. KPIs, tables, and cards render
> offline; only the charts go blank without a connection. (To go fully offline, vendor
> `echarts.min.js` locally and point the `<script>` tags at it.)

Optionally serve over http (uses the JSON files via fetch):

```bash
python3 -m http.server 8000      # then open http://localhost:8000/index.html
```

After editing `data/master.json` or regenerating, rebuild the embedded JS with
`python3 data/generate_oee.py` (emits `oee.json`, `oee.js`, and `master.js`).
