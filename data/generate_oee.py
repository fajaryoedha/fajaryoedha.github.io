#!/usr/bin/env python3
"""Generate data/oee.json (Task 0.3) deterministically from master.json.

Produces consistent transactional data:
  - batches[]         : one per active machine per day
  - oeeRecords[]      : per machine, per hour (06:00-22:00), 15-21 May 2026
  - downtimeEvents[]  : discrete loss events; sums reconcile with oeeRecords decomposition
  - machineStatus[]   : current snapshot for 21 May 2026

Deterministic: a fixed seed per (machine, day, hour) so re-running yields identical output.
All numbers obey the OEE time decomposition so every page derives the same figures.
"""
import json, hashlib, os

HERE = os.path.dirname(os.path.abspath(__file__))
master = json.load(open(os.path.join(HERE, "master.json")))

DAYS = [f"2026-05-{d:02d}" for d in range(1, 32)]           # full month: 1..31 May 2026
SNAP_DAY = "2026-05-21"                                      # "current" day for live machine status
HOURS = list(range(6, 22))                                   # 06:00 .. 21:00 (morning+afternoon)
ACTIVE_MACHINES = [m for m in master["machines"] if m["status"] == "active"]
LINE_OF = {m["id"]: m["lineId"] for m in master["machines"]}
RATE_OF = {m["id"]: m["maxCapacity"] for m in master["machines"]}

# operator per (lineId, shiftId)
OP = {
    ("L-01", "morning"): "EMP-001", ("L-01", "afternoon"): "EMP-003",
    ("L-02", "morning"): "EMP-002", ("L-02", "afternoon"): "EMP-004",
}
def shift_of(hour): return "morning" if hour < 14 else "afternoon"

# product/recipe per line
LINE_PRODUCT = {"L-01": [("PRD-A", "RCP-001"), ("PRD-B", "RCP-002")], "L-02": [("PRD-C", "RCP-003")]}

# reason pools per loss role
U_REASONS = ["U-001", "U-002", "U-003", "U-004"]
P_REASONS = ["P-001", "P-002", "P-003"]
S_REASONS = ["S-001", "S-002"]
SC_REASON = "SC-001"
Q_DEFECT = "Q-001"   # process defects
Q_YIELD  = "Q-002"   # reduced yield


def rnd(*parts):
    """Deterministic float in [0,1) from a string key."""
    h = hashlib.md5("|".join(str(p) for p in parts).encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


# ---- batches: one per active machine per day -------------------------------
batches = []
bnum = 0
batch_of = {}  # (machineId, day) -> batchId
for day in DAYS:
    for m in ACTIVE_MACHINES:
        bnum += 1
        bid = f"B-2605-{bnum:03d}"
        line = m["lineId"]
        prod, recipe = LINE_PRODUCT[line][int(rnd("prod", m["id"], day) * len(LINE_PRODUCT[line]))]
        batch_of[(m["id"], day)] = bid
        target = RATE_OF[m["id"]] * 8  # 8 productive hours target
        batches.append({
            "id": bid, "productId": prod, "recipeId": recipe, "lineId": line,
            "machineId": m["id"], "operatorId": OP[(line, "morning")], "shiftId": "morning",
            "plannedStart": f"{day}T06:00", "plannedEnd": f"{day}T14:00",
            "actualStart": f"{day}T06:05", "actualEnd": f"{day}T14:10",
            "targetUnits": target, "goodUnits": 0, "status": "completed",
        })

# ---- oeeRecords + downtimeEvents -------------------------------------------
oee_records = []
downtime_events = []
dt_num = 0
batch_good = {}

for day in DAYS:
    for m in ACTIVE_MACHINES:
        mid = m["id"]; line = LINE_OF[mid]; rate = RATE_OF[mid]
        ict = 60.0 / rate                      # ideal cycle time, min/unit
        for hour in HOURS:
            shift = shift_of(hour)
            op = OP[(line, shift)]
            bid = batch_of[(mid, day)]
            planned = 60.0

            # --- availability losses (real stops -> reduce runtime) ---
            avail_down = 0.0
            r_stop = rnd("stop", mid, day, hour)
            if r_stop > 0.80:                  # ~20% of hours have a real stop
                avail_down = round(8 + rnd("dur", mid, day, hour) * 40, 0)   # 8..48 min
                planned_flag = rnd("plan", mid, day, hour) > 0.6
                code = (P_REASONS if planned_flag else U_REASONS)[
                    int(rnd("rc", mid, day, hour) * (len(P_REASONS) if planned_flag else len(U_REASONS)))]
                dt_num += 1
                downtime_events.append({
                    "id": f"DT-{dt_num:04d}", "machineId": mid, "lineId": line, "shiftId": shift,
                    "operatorId": op, "batchId": bid, "reasonCode": code,
                    "startTime": f"{day}T{hour:02d}:{int(rnd('mm',mid,day,hour)*50):02d}",
                    "durationMin": avail_down, "source": "Manual" if planned_flag else "Auto",
                    "status": "closed", "note": "",
                })
            run_time = max(planned - avail_down, 0.0)

            ideal_units = rate * run_time / 60.0
            # --- performance loss (speed) ---
            perf_factor = 0.86 + rnd("perf", mid, day, hour) * 0.14     # 0.86..1.00
            total_units = round(ideal_units * perf_factor)
            perf_loss = max(run_time - total_units * ict, 0.0)
            # --- quality loss ---
            qual_factor = 0.95 + rnd("qual", mid, day, hour) * 0.05     # 0.95..1.00
            good_units = round(total_units * qual_factor)
            qual_loss = max((total_units - good_units) * ict, 0.0)

            a = run_time / planned if planned else 0
            p = (total_units / ideal_units) if ideal_units else 0
            q = (good_units / total_units) if total_units else 0
            oee = a * p * q

            oee_records.append({
                "machineId": mid, "lineId": line, "shiftId": shift, "operatorId": op,
                "batchId": bid, "timestamp": f"{day}T{hour:02d}:00",
                "plannedTimeMin": round(planned, 1), "runTimeMin": round(run_time, 1),
                "idealUnits": round(ideal_units, 1), "totalUnits": total_units, "goodUnits": good_units,
                "oee": round(oee, 4),
            })
            batch_good[bid] = batch_good.get(bid, 0) + good_units

            # emit derived loss events so report pareto/distribution reconcile with decomposition
            if perf_loss >= 1:
                dt_num += 1
                code = SC_REASON if rnd("sc", mid, day, hour) > 0.5 else S_REASONS[
                    int(rnd("sr", mid, day, hour) * len(S_REASONS))]
                downtime_events.append({
                    "id": f"DT-{dt_num:04d}", "machineId": mid, "lineId": line, "shiftId": shift,
                    "operatorId": op, "batchId": bid, "reasonCode": code,
                    "startTime": f"{day}T{hour:02d}:30", "durationMin": round(perf_loss, 1),
                    "source": "Auto", "status": "closed", "note": "speed loss"})
            if qual_loss >= 1:
                dt_num += 1
                code = Q_DEFECT if rnd("qd", mid, day, hour) > 0.4 else Q_YIELD
                downtime_events.append({
                    "id": f"DT-{dt_num:04d}", "machineId": mid, "lineId": line, "shiftId": shift,
                    "operatorId": op, "batchId": bid, "reasonCode": code,
                    "startTime": f"{day}T{hour:02d}:45", "durationMin": round(qual_loss, 1),
                    "source": "Auto", "status": "closed", "note": "quality loss"})

# write back batch goodUnits totals
for b in batches:
    b["goodUnits"] = batch_good.get(b["id"], 0)

# ---- machineStatus snapshot for 21 May 2026 (latest) -----------------------
# Reflects the existing dashboard/monitoring picture: M-01 run, M-02 down, M-03 idle, M-04/05 run, M-06 down
SNAP = {
    "M-01": ("running", None, None), "M-02": ("down", "U-001", "08:42"),
    "M-03": ("idle", None, None),    "M-04": ("running", None, None),
    "M-05": ("running", None, None), "M-06": ("down", "P-001", "09:15"),
}
last_day = SNAP_DAY
machine_status = []
for m in ACTIVE_MACHINES:
    mid = m["id"]
    if mid not in SNAP:
        continue
    status, reason, since = SNAP[mid]
    line = LINE_OF[mid]
    bid = batch_of[(mid, last_day)]
    prod = next(b["productId"] for b in batches if b["id"] == bid)
    recs = [r for r in oee_records if r["machineId"] == mid and r["timestamp"].startswith(last_day)]
    day_oee = round(sum(r["oee"] for r in recs) / len(recs), 4) if recs else 0
    machine_status.append({
        "machineId": mid, "status": status, "batchId": bid, "productId": prod,
        "operatorId": OP[(line, "morning")], "currentOee": day_oee,
        "reasonCode": reason, "since": since,
    })

out = {
    "_meta": {
        "description": "OEE transactional/result data, generated from master.json. See data/SCHEMA.md.",
        "generatedBy": "data/generate_oee.py (Task 0.3)",
        "dateRange": [DAYS[0], DAYS[-1]], "hours": [HOURS[0], HOURS[-1]],
        "note": "Numbers obey OEE time decomposition; aggregate in loader (js/data.js).",
    },
    "batches": batches,
    "oeeRecords": oee_records,
    "downtimeEvents": downtime_events,
    "machineStatus": machine_status,
}
with open(os.path.join(HERE, "oee.json"), "w") as f:
    json.dump(out, f, indent=1)

# Also emit embedded JS wrappers so pages work when opened as file:// (no server).
with open(os.path.join(HERE, "oee.js"), "w") as f:
    f.write("window.__OEE_TX__ = ")
    json.dump(out, f, separators=(",", ":"))
    f.write(";\n")
with open(os.path.join(HERE, "master.js"), "w") as f:
    f.write("window.__OEE_MASTER__ = ")
    json.dump(master, f, separators=(",", ":"))
    f.write(";\n")

print(f"batches={len(batches)} oeeRecords={len(oee_records)} "
      f"downtimeEvents={len(downtime_events)} machineStatus={len(machine_status)}")
print("wrote: oee.json, oee.js, master.js")
