# OEE System — Wireframe Review Plan

**Version:** 1.0  
**Date:** 21 May 2026  
**Status:** Ready for Team Review  

---

## Project Overview

This wireframe represents the initial design of an **OEE (Overall Equipment Effectiveness)** system.
Its purpose is to align the team on page structure, data flows, and user interactions before development begins.

> "Overall Equipment Effectiveness" measures how effectively a manufacturing operation is utilized.
> `OEE = Availability × Performance × Quality`

---

## Reference: OEE Framework

Based on the **Recommended Six Big Losses** methodology:

| OEE Component   | Loss Type          | Description                              |
|-----------------|--------------------|------------------------------------------|
| **Availability** | Unplanned Stops   | Equipment failure, process failure       |
| **Availability** | Planned Stops     | Changeover, preventive maintenance       |
| **Performance**  | Small Stops       | Short stoppages < 5 min (jams, sensors)  |
| **Performance**  | Slow Cycles       | Machine running below ideal speed        |
| **Quality**      | Production Rejects| Out-of-spec parts during production run  |
| **Quality**      | Startup Rejects   | Scrap during startup/changeover          |
| **OEE Result**  | Fully Productive Time | Time producing good parts at full speed |

---

## System Pages (Wireframe)

### 1. Dashboard (`index.html`)
**Purpose:** Command center — immediate OEE visibility for supervisors and operators.

**Key elements:**
- Date/Shift filter bar
- 4 KPI cards: OEE %, Availability %, Performance %, Quality %
- Machine status grid (Running/Down/Idle with color coding)
- Six Big Losses summary table
- Recent downtime events list
- 7-day OEE trend bar chart

**Questions for team:**
- [ ] What is the target OEE % for your facility?
- [ ] Should the dashboard be per-line or total facility view by default?
- [ ] Do you need a real-time auto-refresh indicator?

---

### 2. Line Monitoring (`monitoring.html`)
**Purpose:** Operators and supervisors monitor live machine status and open active downtime.

**Key elements:**
- Line summary cards with utilization bars
- Individual machine cards (status, current batch, OEE)
- "Report Downtime" quick button per machine
- Active downtime events table

**Questions for team:**
- [ ] How many lines and machines are in scope?
- [ ] Should operators be able to start/stop batch from here?
- [ ] Is a floor-plan layout (Gantt or visual map) needed?

---

### 3. Downtime Entry (`downtime.html`)
**Purpose:** Operators manually log downtime events against the official reason list.

**Key elements:**
- Form: Machine, Line (auto), Batch, Date, Time Start, Duration, Loss Category, Reason Code, Notes
- Downtime Reason Reference table (Daftar Alasan Downtime) with EN/ID bilingual
- Recent entries table with verification status

**Questions for team:**
- [ ] Is the current list of downtime reason codes (U-001 to Q-002) complete?
- [ ] Who verifies submitted downtime entries — supervisor only?
- [ ] Should duration be entered manually or auto-calculated from start/end time?
- [ ] Do you need to track quantity of rejected units in downtime records?

---

### 4. OEE Reports (`report.html`)
**Purpose:** Analysts and managers review OEE performance over a period with loss breakdown.

**Key elements:**
- Date range filter (From/To), Line, Machine, Shift
- 4 KPI summary cards (period averages)
- Six Big Losses table with `rowspan` grouping (matching standard OEE tables)
- 7-day OEE trend bar chart
- Loss breakdown by category (horizontal bars)
- Shift-by-shift detail table

**Questions for team:**
- [ ] Should reports support weekly/monthly roll-up views?
- [ ] Is a waterfall chart (losses stacked) needed in addition to the bar chart?
- [ ] What export formats are needed? (Excel, PDF, CSV)
- [ ] Should the system support comparison: actual vs. target by shift?

---

### 5. Production Schedule (`schedule.html`)
**Purpose:** Planners create and manage batch schedules; supervisors track actual vs. planned.

**Key elements:**
- Batch schedule table (13 columns: Batch ID → Status)
- Output % progress bar per batch
- Add/Edit batch form (Product → Recipe auto-fill, Line → Machine auto-fill)
- Schedule revision history log

**Questions for team:**
- [ ] Is the schedule created here, or imported from an ERP/MES?
- [ ] Should the system show a Gantt-style timeline view?
- [ ] How far ahead is the schedule planned (1 day / 1 week)?
- [ ] Who has permission to revise a schedule (planner only, or supervisor too)?

---

### 6. Master Data (`master.html`)
**Purpose:** Admin configures all reference data that drives the rest of the system.

**5 tabs:**
1. **Products** — Product code, name, unit, linked supplier & raw material
2. **Recipes** — Cycle time, ideal run rate, setup time, version history
3. **Machines & Lines** — Machine ID, type, capacity, line assignment
4. **Operators** — Shift, role (operator/supervisor/planner), line assignment
5. **Downtime Reasons** — The canonical Daftar Alasan Downtime with EN/ID labels

**Questions for team:**
- [ ] Is the supplier/raw material relationship managed here or in a separate system?
- [ ] Should recipe versioning trigger a notification when assigned to a batch?
- [ ] How many distinct downtime reason codes are expected in the full system?

---

## Data Flow Summary

```
[Suppliers] → Raw Material → [Recipe] → Product
[Operator]  → [Schedule]  → Schedule Revision
                 ↓
              [Batch]
                 ↓
              [Line]
                 ↓
            [Machine] → [Manual Input] → [Daftar Alasan Downtime]
                                              ↓
                                    OEE Calculation Engine
                                    (Availability × Performance × Quality)
                                              ↓
                                    [Dashboard] + [Reports]
```

---

## What Is NOT In This Wireframe

The following are out of scope for this wireframe and may need to be discussed:

- **User authentication / login page** — not designed yet
- **Notification system** — alerts for machines down > X minutes
- **Supplier management** — purchasing/procurement side not covered
- **ERP/MES integration** — how batch data flows in from external systems
- **Mobile / tablet view** — all pages are desktop-first
- **Historical data migration** — importing existing OEE records
- **Multi-plant / multi-site** — current design is single facility
- **Role-based access control** — who can see/edit each page

---

## Review Checklist

Use this checklist during the team review session:

**Navigation & Layout**
- [ ] Is the sidebar navigation intuitive?
- [ ] Are all necessary pages represented?
- [ ] Are there any missing pages?

**Dashboard**
- [ ] Do the KPI cards show the right metrics?
- [ ] Is the machine grid useful as a status overview?

**Monitoring**
- [ ] Is the machine card layout sufficient for floor operators?
- [ ] Is the downtime report flow clear?

**Downtime Entry**
- [ ] Is the form simple enough for shop-floor use?
- [ ] Is the Daftar Alasan Downtime complete?

**Reports**
- [ ] Does the Six Big Losses table match your reporting standard?
- [ ] Are the chart/visualization types appropriate?

**Schedule**
- [ ] Is the batch schedule table complete?
- [ ] Is the revision history useful?

**Master Data**
- [ ] Are all 5 tabs necessary?
- [ ] Is any master data missing?

---

## Technology Stack (Planned for Real System)

| Layer       | Decision Needed | Options |
|-------------|----------------|---------|
| Frontend    | TBD | React, Vue, plain HTML |
| Backend     | TBD | Node.js, Django, Laravel |
| Database    | TBD | PostgreSQL, MySQL |
| Realtime    | TBD | WebSocket, polling |
| Hosting     | TBD | On-premise, cloud |

---

*This document is a living artifact. Update it as the team discusses and decisions are made.*
