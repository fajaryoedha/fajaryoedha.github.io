/* ===========================================================================
 * OEE Wireframe — shared data layer (Task 0.4)
 * Loads data/master.json + data/oee.json and exposes filter/aggregate helpers.
 * Single source of truth so every page derives identical numbers.
 *
 * Usage:
 *   await OEE.load();                       // once per page, before rendering
 *   const k = OEE.kpis({ dateFrom, dateTo, lineId, machineId, shiftId });
 *
 * Filter object (all keys optional; null / 'all' / '' = no constraint):
 *   { dateFrom, dateTo, lineId, machineId, shiftId, operatorId, batchId }
 *
 * NOTE: pages must be served over http:// (e.g. `python -m http.server`),
 *       not opened as file:// — browsers block fetch() of local JSON otherwise.
 * ======================================================================== */
(function (global) {
  "use strict";

  var DB = null; // { master, oee, idx }

  function basePath() {
    // Resolve the repo root from this script's own URL (js/data.js) so the
    // loader works regardless of where the consuming page lives.
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || "";
      var m = src.match(/^(.*\/)js\/data\.js(?:\?.*)?$/);
      if (m) return m[1];
    }
    return ""; // fallback: assume page sits at repo root
  }

  function indexBy(arr, key) {
    var o = {};
    for (var i = 0; i < arr.length; i++) o[arr[i][key]] = arr[i];
    return o;
  }

  async function load() {
    if (DB) return DB;
    var master, oee;
    // Prefer embedded data (data/master.js + data/oee.js) so the wireframe works when
    // opened directly as file:// (no server). Fall back to fetching the JSON over http.
    if (global.__OEE_MASTER__ && global.__OEE_TX__) {
      master = global.__OEE_MASTER__;
      oee = global.__OEE_TX__;
    } else {
      var p = basePath();
      var res = await Promise.all([
        fetch(p + "data/master.json").then(function (r) { return r.json(); }),
        fetch(p + "data/oee.json").then(function (r) { return r.json(); }),
      ]);
      master = res[0]; oee = res[1];
    }
    DB = {
      master: master,
      oee: oee,
      idx: {
        line: indexBy(master.lines, "id"),
        machine: indexBy(master.machines, "id"),
        operator: indexBy(master.operators, "id"),
        product: indexBy(master.products, "id"),
        shift: indexBy(master.shifts, "id"),
        reason: indexBy(master.reasons, "code"),
        batch: indexBy(oee.batches, "id"),
      },
    };
    return DB;
  }

  // ---- lookups (id -> display) ---------------------------------------------
  function lineName(id) { return (DB.idx.line[id] || {}).name || id; }
  function machineName(id) { return (DB.idx.machine[id] || {}).name || id; }
  function operatorName(id) { return id ? ((DB.idx.operator[id] || {}).name || id) : "—"; }
  function productName(id) { return id ? ((DB.idx.product[id] || {}).name || id) : "—"; }
  function shiftName(id) { return (DB.idx.shift[id] || {}).name || id; }
  function reason(code) { return DB.idx.reason[code] || { code: code, reasonEn: code, lossCategory: "", color: "#999" }; }

  // ---- loss category meta (label + OEE component + color) ------------------
  var LOSS_META = {
    equipment_failure:  { label: "Equipment Failure",        component: "availability", color: "#E8452B", badge: "loss-badge--unplanned" },
    setup_adjustment:   { label: "Setup & Adjustments",      component: "availability", color: "#F4821E", badge: "loss-badge--planned" },
    idling_minor_stops: { label: "Idling & Minor Stoppages", component: "performance",  color: "#4DA6E8", badge: "loss-badge--small-stops" },
    reduced_speed:      { label: "Reduced Speed",            component: "performance",  color: "#6EA8C8", badge: "loss-badge--slow-cycles" },
    process_defects:    { label: "Process Defects",          component: "quality",      color: "#8B5BB4", badge: "loss-badge--prod-reject" },
    reduced_yield:      { label: "Reduced Yield",            component: "quality",      color: "#B08FCC", badge: "loss-badge--start-reject" },
  };
  var LOSS_ORDER = ["equipment_failure", "setup_adjustment", "idling_minor_stops",
    "reduced_speed", "process_defects", "reduced_yield"];

  // ---- filtering -----------------------------------------------------------
  function isAll(v) { return v == null || v === "all" || v === "" || v === "All"; }

  function dateOf(ts) { return ts.slice(0, 10); }

  function makePredicate(f) {
    f = f || {};
    return function (row) {
      var d = dateOf(row.timestamp || row.startTime || "");
      if (!isAll(f.dateFrom) && d < f.dateFrom) return false;
      if (!isAll(f.dateTo) && d > f.dateTo) return false;
      if (!isAll(f.lineId) && row.lineId !== f.lineId) return false;
      if (!isAll(f.machineId) && row.machineId !== f.machineId) return false;
      if (!isAll(f.shiftId) && row.shiftId !== f.shiftId) return false;
      if (!isAll(f.operatorId) && row.operatorId !== f.operatorId) return false;
      if (!isAll(f.batchId) && row.batchId !== f.batchId) return false;
      return true;
    };
  }

  function records(f) { return DB.oee.oeeRecords.filter(makePredicate(f)); }
  function events(f) { return DB.oee.downtimeEvents.filter(makePredicate(f)); }

  // ---- KPI aggregation (OEE = A x P x Q) -----------------------------------
  function aggregate(recs) {
    var sp = 0, sr = 0, si = 0, st = 0, sg = 0;
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      sp += r.plannedTimeMin; sr += r.runTimeMin; si += r.idealUnits;
      st += r.totalUnits; sg += r.goodUnits;
    }
    var A = sp ? sr / sp : 0, P = si ? st / si : 0, Q = st ? sg / st : 0;
    return {
      availability: A, performance: P, quality: Q, oee: A * P * Q,
      plannedMin: sp, runMin: sr, idealUnits: si, totalUnits: st, goodUnits: sg,
      downtimeMin: sp - sr, recordCount: recs.length,
    };
  }
  function kpis(f) { return aggregate(records(f)); }

  // ---- Six Big Losses (minutes by category, reconciles with decomposition) -
  function sixBigLosses(f) {
    var ev = events(f);
    var byCat = {};
    LOSS_ORDER.forEach(function (c) { byCat[c] = 0; });
    for (var i = 0; i < ev.length; i++) {
      var cat = reason(ev[i].reasonCode).lossCategory;
      if (byCat[cat] == null) byCat[cat] = 0;
      byCat[cat] += ev[i].durationMin;
    }
    var plannedMin = aggregate(records(f)).plannedMin || 1;
    return LOSS_ORDER.map(function (cat) {
      var meta = LOSS_META[cat];
      return {
        category: cat, label: meta.label, component: meta.component, color: meta.color,
        minutes: Math.round(byCat[cat]),
        impact: byCat[cat] / plannedMin, // share of scheduled time
      };
    });
  }

  // ---- Pareto (losses sorted desc + cumulative %) --------------------------
  function pareto(f) {
    var rows = sixBigLosses(f).filter(function (r) { return r.minutes > 0; })
      .sort(function (a, b) { return b.minutes - a.minutes; });
    var total = rows.reduce(function (s, r) { return s + r.minutes; }, 0) || 1;
    var cum = 0;
    rows.forEach(function (r) { cum += r.minutes; r.cumulativePct = cum / total; });
    return rows;
  }

  // ---- Trend / time-series by granularity ----------------------------------
  function bucketKey(ts, gran) {
    if (gran === "hourly") return ts.slice(0, 13).replace("T", " ") + ":00";
    if (gran === "weekly") {
      var d = new Date(ts.slice(0, 10) + "T00:00:00");
      var onejan = new Date(d.getFullYear(), 0, 1);
      var week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
      return d.getFullYear() + "-W" + week;
    }
    if (gran === "monthly") return ts.slice(0, 7);
    return ts.slice(0, 10); // daily (default)
  }

  function trend(f, gran) {
    gran = gran || "daily";
    var recs = records(f);
    var buckets = {}, order = [];
    recs.forEach(function (r) {
      var k = bucketKey(r.timestamp, gran);
      if (!buckets[k]) { buckets[k] = []; order.push(k); }
      buckets[k].push(r);
    });
    order.sort();
    return {
      labels: order,
      oee: order.map(function (k) { return +(aggregate(buckets[k]).oee * 100).toFixed(1); }),
      availability: order.map(function (k) { return +(aggregate(buckets[k]).availability * 100).toFixed(1); }),
      performance: order.map(function (k) { return +(aggregate(buckets[k]).performance * 100).toFixed(1); }),
      quality: order.map(function (k) { return +(aggregate(buckets[k]).quality * 100).toFixed(1); }),
    };
  }

  // ---- Per-machine aggregations (rank + loss distribution) -----------------
  function byMachine(f) {
    var recs = records(f), groups = {};
    recs.forEach(function (r) {
      (groups[r.machineId] = groups[r.machineId] || []).push(r);
    });
    return groups;
  }

  function machineRank(f) {
    var groups = byMachine(f);
    return Object.keys(groups).map(function (mid) {
      var a = aggregate(groups[mid]);
      return {
        machineId: mid, name: machineName(mid), lineId: DB.idx.machine[mid].lineId,
        lineName: lineName(DB.idx.machine[mid].lineId),
        oee: a.oee, availability: a.availability, performance: a.performance,
        quality: a.quality, downtimeMin: a.downtimeMin, output: a.goodUnits,
      };
    }).sort(function (a, b) { return b.oee - a.oee; });
  }

  function lossByMachine(f) {
    var ev = events(f), grid = {};
    ev.forEach(function (e) {
      var mid = e.machineId, cat = reason(e.reasonCode).lossCategory;
      grid[mid] = grid[mid] || {};
      grid[mid][cat] = (grid[mid][cat] || 0) + e.durationMin;
    });
    return Object.keys(grid).sort().map(function (mid) {
      var row = { machineId: mid, name: machineName(mid) };
      LOSS_ORDER.forEach(function (c) { row[c] = Math.round(grid[mid][c] || 0); });
      return row;
    });
  }

  // ---- Report row table (per date/shift/line/machine) ----------------------
  function reportRows(f, groupKeys) {
    groupKeys = groupKeys || ["date", "shiftId", "lineId", "machineId"];
    var recs = records(f), groups = {}, order = [];
    recs.forEach(function (r) {
      var keyObj = {
        date: dateOf(r.timestamp), shiftId: r.shiftId, lineId: r.lineId, machineId: r.machineId,
      };
      var k = groupKeys.map(function (g) { return keyObj[g]; }).join("|");
      if (!groups[k]) { groups[k] = { _k: keyObj, recs: [] }; order.push(k); }
      groups[k].recs.push(r);
    });
    order.sort();
    return order.map(function (k) {
      var g = groups[k], a = aggregate(g.recs);
      return {
        date: g._k.date, shiftId: g._k.shiftId, shift: shiftName(g._k.shiftId),
        lineId: g._k.lineId, line: lineName(g._k.lineId),
        machineId: g._k.machineId, machine: machineName(g._k.machineId),
        oee: a.oee, availability: a.availability, performance: a.performance,
        quality: a.quality, output: a.goodUnits, downtimeMin: a.downtimeMin,
      };
    });
  }

  // ---- Machine status snapshot (dashboard + monitoring) --------------------
  function machineStatusList(f) {
    f = f || {};
    return DB.oee.machineStatus.filter(function (s) {
      var m = DB.idx.machine[s.machineId];
      if (!isAll(f.lineId) && m.lineId !== f.lineId) return false;
      if (!isAll(f.status) && s.status !== f.status) return false;
      return true;
    }).map(function (s) {
      var m = DB.idx.machine[s.machineId];
      var b = s.batchId ? DB.idx.batch[s.batchId] : null;
      var rs = s.reasonCode ? reason(s.reasonCode) : null;
      return {
        machineId: s.machineId, name: machineName(s.machineId),
        lineId: m.lineId, line: lineName(m.lineId), type: m.type,
        status: s.status, batchId: s.batchId, productId: s.productId, product: productName(s.productId),
        operatorId: s.operatorId, operator: operatorName(s.operatorId), currentOee: s.currentOee,
        recipeId: b ? b.recipeId : null,
        batchStart: b && b.actualStart ? b.actualStart.slice(11) : null,
        reasonCode: s.reasonCode, reason: rs ? rs.reasonEn : null, reasonId: rs ? rs.reasonId : null,
        lossCategory: rs ? rs.lossCategory : null,
        lossLabel: rs ? (LOSS_META[rs.lossCategory] || {}).label : null,
        lossBadge: rs ? (LOSS_META[rs.lossCategory] || {}).badge : null,
        since: s.since,
      };
    });
  }

  function statusSummary(f) {
    var list = machineStatusList(f), sum = { running: 0, idle: 0, down: 0, total: list.length };
    list.forEach(function (s) { sum[s.status] = (sum[s.status] || 0) + 1; });
    return sum;
  }

  // ---- Downtime list with pagination (downtime entry page) -----------------
  function downtimeList(f, page, pageSize) {
    f = f || {};
    page = page || 1; pageSize = pageSize || 10;
    var ev = events(f);
    // optional: restrict to specific loss categories (e.g. real stops only)
    if (f.categories && f.categories.length) {
      ev = ev.filter(function (e) { return f.categories.indexOf(reason(e.reasonCode).lossCategory) !== -1; });
    }
    var rows = ev.slice().sort(function (a, b) {
      return a.startTime < b.startTime ? 1 : -1; // newest first
    }).map(function (e) {
      var rs = reason(e.reasonCode), m = DB.idx.machine[e.machineId];
      return {
        id: e.id, machineId: e.machineId, machine: machineName(e.machineId),
        lineId: m.lineId, line: lineName(m.lineId), batchId: e.batchId,
        reasonCode: e.reasonCode, reasonEn: rs.reasonEn, reasonId: rs.reasonId,
        lossCategory: rs.lossCategory, lossLabel: (LOSS_META[rs.lossCategory] || {}).label || rs.lossCategory,
        lossBadge: (LOSS_META[rs.lossCategory] || {}).badge || "", color: rs.color, component: rs.oeeComponent,
        startTime: e.startTime, durationMin: e.durationMin,
        operator: operatorName(e.operatorId), source: e.source, status: e.status,
      };
    });
    var total = rows.length, pages = Math.max(1, Math.ceil(total / pageSize));
    page = Math.min(Math.max(1, page), pages);
    return {
      rows: rows.slice((page - 1) * pageSize, page * pageSize),
      total: total, page: page, pages: pages, pageSize: pageSize,
    };
  }

  // ---- option lists for filter dropdowns -----------------------------------
  function options() {
    return {
      lines: DB.master.lines.map(function (l) { return { id: l.id, name: l.name }; }),
      machines: DB.master.machines.filter(function (m) { return m.status === "active"; })
        .map(function (m) { return { id: m.id, name: m.name, lineId: m.lineId }; }),
      shifts: DB.master.shifts.map(function (s) { return { id: s.id, name: s.name }; }),
      operators: DB.master.operators.map(function (o) { return { id: o.id, name: o.name }; }),
      batches: DB.oee.batches.map(function (b) { return { id: b.id, machineId: b.machineId }; }),
    };
  }

  // ---- formatting helpers --------------------------------------------------
  function pct(x, dp) { return (x * 100).toFixed(dp == null ? 1 : dp) + "%"; }
  function num(x) { return Math.round(x).toLocaleString("en-US"); }

  global.OEE = {
    load: load,
    get db() { return DB; },
    // lookups
    lineName: lineName, machineName: machineName, operatorName: operatorName,
    productName: productName, shiftName: shiftName, reason: reason,
    batch: function (id) { return DB.idx.batch[id]; },
    machine: function (id) { return DB.idx.machine[id]; },
    LOSS_META: LOSS_META, LOSS_ORDER: LOSS_ORDER,
    // queries
    records: records, events: events, kpis: kpis, aggregate: aggregate,
    sixBigLosses: sixBigLosses, pareto: pareto, trend: trend,
    machineRank: machineRank, lossByMachine: lossByMachine, reportRows: reportRows,
    machineStatusList: machineStatusList, statusSummary: statusSummary,
    downtimeList: downtimeList, options: options,
    // format
    pct: pct, num: num,
  };
})(window);
