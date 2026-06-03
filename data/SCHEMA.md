# Skema Data JSON — OEE Wireframe (Task 0.1)

Dokumen ini mendefinisikan **struktur data** yang jadi sumber tunggal untuk semua halaman.
Mengikuti alur entitas pada `material/image copy.png`:

```
Supplier → Raw Material ↔ Recipe → Product
Operator → Schedule → Schedule Revision
              ↓
            Batch → Line → Machine → Manual Input → Downtime Reason
```

Semua angka di halaman (KPI, chart, tabel) **diturunkan** dari data di sini supaya konsisten antar halaman.

## Pembagian File

| File                  | Isi                                                            | Dipakai (task) |
|-----------------------|---------------------------------------------------------------|----------------|
| `data/master.json`    | Entitas master statis (jarang berubah)                        | 0.2            |
| `data/oee.json`       | Data transaksi/hasil: time-series OEE, downtime events, batch | 0.3            |

Loader (`js/data.js`, task 0.4) menggabungkan keduanya & menyediakan helper filter/agregasi.

---

## A. master.json

### `suppliers[]`
| Field   | Tipe   | Contoh    | Catatan          |
|---------|--------|-----------|------------------|
| id      | string | `SUP-001` | PK               |
| name    | string | `PT Bahan Jaya` |            |
| active  | bool   | `true`    |                  |

### `rawMaterials[]`
| Field      | Tipe   | Contoh   | Catatan                 |
|------------|--------|----------|-------------------------|
| id         | string | `RM-001` | PK                      |
| name       | string | `Resin A`|                         |
| unit       | string | `kg`     |                         |
| supplierId | string | `SUP-001`| FK → suppliers.id       |

### `products[]`
| Field        | Tipe     | Contoh   | Catatan                        |
|--------------|----------|----------|--------------------------------|
| id           | string   | `PRD-A`  | PK                             |
| name         | string   | `Produk A`|                               |
| unit         | string   | `pcs`    |                                |
| description  | string   |          | Deskripsi                      |
| supplierId   | string   | `SUP-001`| FK → suppliers.id              |
| rawMaterialId| string   | `RM-001` | FK → rawMaterials.id           |
| active       | bool     | `true`   |                                |

### `recipes[]`
| Field          | Tipe   | Contoh    | Catatan                          |
|----------------|--------|-----------|----------------------------------|
| id             | string | `RCP-001` | PK (bisa multi-version)          |
| version        | string | `v2`      |                                  |
| productId      | string | `PRD-A`   | FK → products.id                 |
| cycleTimeMin   | number | `0.5`     | menit/unit                       |
| idealRunRate   | number | `120`     | units/jam (untuk hitung Performance) |
| setupTimeMin   | number | `15`      |                                  |
| validFrom      | date   | `2026-01-01` |                               |
| validTo        | date\|null | `null` |                                  |
| active         | bool   | `true`    |                                  |

### `lines[]`
| Field       | Tipe   | Contoh    | Catatan                |
|-------------|--------|-----------|------------------------|
| id          | string | `LINE-01` | PK                     |
| name        | string | `Line 1`  | label tampil           |
| area        | string | `Plant A` |                        |
| description | string |           |                        |
| status      | string | `active`  | active \| inactive     |

### `machines[]`
| Field        | Tipe   | Contoh    | Catatan                 |
|--------------|--------|-----------|-------------------------|
| id           | string | `M-01`    | PK                      |
| name         | string | `Filler 1`|                         |
| lineId       | string | `LINE-01` | FK → lines.id           |
| type         | string | `Filling` |                         |
| maxCapacity  | number | `150`     | units/jam               |
| installDate  | date   | `2024-03-01` |                      |
| status       | string | `active`  | active \| maintenance \| inactive |

### `operators[]`
| Field        | Tipe   | Contoh    | Catatan                       |
|--------------|--------|-----------|-------------------------------|
| id           | string | `EMP-001` | PK                            |
| name         | string | `John Doe`|                               |
| defaultShift | string | `morning` | FK → shifts.id                |
| lineId       | string | `LINE-01` | FK → lines.id (assignment)    |
| role         | string | `Operator`|                               |
| contact      | string |           |                               |
| active       | bool   | `true`    |                               |

### `shifts[]`
| Field | Tipe   | Contoh      | Catatan            |
|-------|--------|-------------|--------------------|
| id    | string | `morning`   | PK                 |
| name  | string | `Morning`   |                    |
| start | string | `06:00`     |                    |
| end   | string | `14:00`     |                    |

Nilai: `morning` (06:00–14:00), `afternoon` (14:00–22:00), `night` (22:00–06:00).

### `reasons[]` (Daftar Alasan Downtime)
| Field        | Tipe   | Contoh             | Catatan                                   |
|--------------|--------|--------------------|-------------------------------------------|
| code         | string | `U-001`            | PK. Prefix → komponen OEE                  |
| lossCategory | string | `equipment_failure`| lihat tabel loss di bawah                 |
| planned      | bool   | `false`            | planned / unplanned                       |
| reasonEn     | string | `Mechanical breakdown` |                                       |
| reasonId     | string | `Kerusakan mekanik`| Bahasa Indonesia                          |
| oeeComponent | string | `availability`     | availability \| performance \| quality    |
| active       | bool   | `true`             |                                           |

**Mapping prefix code → loss (acuan `material/image.png`, terminologi Traditional Six Big Losses):**

| Prefix | lossCategory (key)   | Label              | oeeComponent | Warna     |
|--------|----------------------|--------------------|--------------|-----------|
| U-xxx  | `equipment_failure`  | Equipment Failure  | availability | `#E8452B` |
| P-xxx  | `setup_adjustment`   | Setup & Adjustments| availability | `#F4821E` |
| S-xxx  | `idling_minor_stops` | Idling & Minor Stoppages | performance | `#4DA6E8` |
| SC-xxx | `reduced_speed`      | Reduced Speed      | performance  | `#6EA8C8` |
| Q-xxx  | `process_defects`    | Process Defects    | quality      | `#8B5BB4` |
| Q-xxx  | `reduced_yield`      | Reduced Yield      | quality      | `#B08FCC` |

---

## B. oee.json

### `batches[]`
| Field        | Tipe   | Contoh        | Catatan                       |
|--------------|--------|---------------|-------------------------------|
| id           | string | `B-2605-001`  | PK                            |
| productId    | string | `PRD-A`       | FK → products.id              |
| recipeId     | string | `RCP-001`     | FK → recipes.id               |
| lineId       | string | `LINE-01`     | FK → lines.id                 |
| machineId    | string | `M-01`        | FK → machines.id              |
| operatorId   | string | `EMP-001`     | FK → operators.id             |
| shiftId      | string | `morning`     | FK → shifts.id                |
| plannedStart | datetime | `2026-05-21T06:00` |                          |
| plannedEnd   | datetime | `2026-05-21T10:00` |                          |
| actualStart  | datetime\|null |          |                               |
| actualEnd    | datetime\|null |          |                               |
| targetUnits  | number | `480`         |                               |
| goodUnits    | number | `455`         | untuk Quality                 |
| status       | string | `completed`   | scheduled \| running \| completed \| paused |

### `oeeRecords[]` — **time-series, sumber semua angka OEE**
Satu record = 1 mesin pada 1 slot waktu (granularitas paling halus = per jam).
Agregasi daily/weekly/monthly dihitung di loader dari record-record ini.

| Field          | Tipe   | Contoh             | Catatan                                  |
|----------------|--------|--------------------|------------------------------------------|
| machineId      | string | `M-01`             | FK → machines.id                         |
| lineId         | string | `LINE-01`          | FK → lines.id (denormalisasi utk filter) |
| shiftId        | string | `morning`          | FK → shifts.id                           |
| operatorId     | string | `EMP-001`          | FK → operators.id                        |
| batchId        | string | `B-2605-001`       | FK → batches.id                          |
| timestamp      | datetime | `2026-05-21T07:00` | awal slot (per jam)                    |
| plannedTimeMin | number | `60`               | waktu produksi terjadwal di slot         |
| runTimeMin     | number | `52`               | → Availability = runTime / plannedTime   |
| idealUnits     | number | `120`              | output ideal bila full speed             |
| totalUnits     | number | `108`              | → Performance = total / ideal            |
| goodUnits      | number | `104`              | → Quality = good / total                 |
| oee            | number | `0.78`             | precomputed = A×P×Q (boleh dihitung ulang) |

> **Rumus turunan (dihitung di loader, jangan disimpan ganda kalau bisa):**
> - Availability = Σ runTimeMin / Σ plannedTimeMin
> - Performance  = Σ totalUnits / Σ idealUnits
> - Quality      = Σ goodUnits  / Σ totalUnits
> - OEE          = Availability × Performance × Quality

### `downtimeEvents[]` — **sumber Six Big Losses & Downtime Entry**
| Field        | Tipe   | Contoh             | Catatan                          |
|--------------|--------|--------------------|----------------------------------|
| id           | string | `DT-0001`          | PK                               |
| machineId    | string | `M-02`             | FK → machines.id                 |
| lineId       | string | `LINE-01`          | FK → lines.id                    |
| shiftId      | string | `morning`          | FK → shifts.id                   |
| operatorId   | string | `EMP-001`          | FK → operators.id                |
| batchId      | string\|null | `B-2605-002`  | FK → batches.id                  |
| reasonCode   | string | `U-001`            | FK → reasons.code                |
| startTime    | datetime | `2026-05-21T08:42` |                                |
| durationMin  | number | `34`               | dipakai utk OEE impact & ranking |
| note         | string |                    | catatan manual input             |

### `machineStatus[]` — **status real-time utk Line Monitoring & Dashboard**
| Field        | Tipe   | Contoh        | Catatan                              |
|--------------|--------|---------------|--------------------------------------|
| machineId    | string | `M-01`        | FK → machines.id                     |
| status       | string | `running`     | running \| idle \| down              |
| batchId      | string\|null | `B-2605-001` | batch berjalan                    |
| productId    | string\|null | `PRD-A`  |                                       |
| operatorId   | string\|null | `EMP-001`|                                       |
| currentOee   | number | `0.88`        | hanya utk dashboard (di monitoring disembunyikan, task 2.1) |
| reasonCode   | string\|null | `U-001`  | bila status=down                     |
| since        | string\|null | `08:42`  | bila status=down                     |

---

## Konvensi Konsistensi (WAJIB)

1. **Setiap FK harus menunjuk ID yang ada** di master.json. Tidak boleh ada `machineId` yang tidak terdaftar di `machines[]`.
2. **ID label vs key:** simpan ID kanonik (`LINE-01`, `morning`), label tampil (`Line 1`, `Morning`) diambil dari master saat render. Hindari menyimpan label mentah di data transaksi.
3. **Rentang tanggal dummy:** sediakan data minimal **15–21 Mei 2026** (1 minggu, granular per jam) agar filter date range + agregasi hourly/daily/weekly punya cukup data. (UI existing memakai tanggal ini.)
4. **Angka harus saling cocok:** machineStatus, oeeRecords, downtimeEvents untuk mesin/periode yang sama harus menceritakan hal yang konsisten (mis. mesin `down` harus punya downtimeEvent yang sesuai).

---

_Selesai task 0.1. Lanjut: 0.2 (isi master.json), 0.3 (isi oee.json) sesuai skema ini._
