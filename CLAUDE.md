# OEE Wireframe

Static HTML/CSS wireframe for an **Overall Equipment Effectiveness (OEE)** manufacturing system.
For team review before full development begins.

## Purpose

Wireframe only — no JavaScript, no backend, no external dependencies.
Open any `.html` file in a browser to view. Navigate via the sidebar.

## Pages

| File              | Purpose                                               |
|-------------------|-------------------------------------------------------|
| `index.html`      | OEE Dashboard — KPI cards, machine grid, loss summary |
| `monitoring.html` | Line & Machine real-time monitoring                   |
| `downtime.html`   | Downtime entry form / Daftar Alasan Downtime          |
| `report.html`     | OEE Reports & Six Big Losses analysis table           |
| `schedule.html`   | Production schedule & batch management                |
| `master.html`     | Master data (Products, Recipes, Machines, Operators, Reasons) |
| `style.css`       | All shared styles (single CSS file)                   |

## OEE Framework

```
OEE = Availability × Performance × Quality
```

| OEE Component    | Loss Type          | Color    | Code Prefix |
|------------------|--------------------|----------|-------------|
| Availability     | Unplanned Stops    | Red      | U-xxx       |
| Availability     | Planned Stops      | Orange   | P-xxx       |
| Performance      | Small Stops        | Blue     | S-xxx       |
| Performance      | Slow Cycles        | Slate    | SC-xxx      |
| Quality          | Production Rejects | Purple   | Q-xxx       |
| Quality          | Startup Rejects    | Lt Purple| Q-xxx       |
| **OEE Result**   | Fully Productive Time | **Green** | —       |

## Color Conventions

| Color       | Hex       | Used For                              |
|-------------|-----------|---------------------------------------|
| Green       | `#5BB85D` | OEE, Running status, Fully Productive |
| Red         | `#E8452B` | Unplanned Stops, Down status          |
| Orange      | `#F4821E` | Planned Stops                         |
| Blue        | `#4DA6E8` | Small Stops, Performance KPI          |
| Slate Blue  | `#6EA8C8` | Slow Cycles                           |
| Purple      | `#8B5BB4` | Production Rejects, Quality KPI       |
| Lt Purple   | `#B08FCC` | Startup Rejects                       |
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

- HTML5 + CSS3 only
- No JavaScript, no frameworks, no CDN
- CSS `:target` pseudo-class for tab navigation in `master.html`
- All styles in a single `style.css` with CSS custom properties

## Reference Materials

- `material/image.png` — OEE Six Big Losses framework table (color reference)
- `material/image copy.png` — Manufacturing flow diagram with entity relationships

## How to View

```bash
# Open in default browser
xdg-open index.html       # Linux
open index.html           # macOS
start index.html          # Windows
```

Or open `index.html` directly in any modern browser.
