---
title: "Implementasi Auto Refresh pada Alarm Database Viewer AVEVA InTouch"
date: "2024-07-18"
slug: "aveva-intouch-alarm-auto-refresh"
description: "Pelajari cara mengimplementasikan fitur refresh otomatis untuk Alarm Database Viewer di sistem SCADA AVEVA InTouch untuk meningkatkan efisiensi monitoring."
tags: ["SCADA", "AVEVA", "InTouch", "Automation", "Alarm Management"]
author: "Fajar Yuda Pratama"
published: true
featured: false
---

# Implementasi Auto Refresh pada Alarm Database Viewer AVEVA InTouch

Dalam sistem SCADA AVEVA InTouch, pengelolaan tampilan alarm history menjadi salah satu aspek penting untuk memastikan operator dapat memantau kondisi sistem secara efektif. Kebutuhan untuk menampilkan alarm terbaru beserta riwayat alarm dari database menjadi tantangan tersendiri dalam implementasi sistem monitoring.

## Pemahaman Komponen Alarm Viewer

AVEVA InTouch menyediakan dua komponen utama untuk menampilkan alarm: Alarm Viewer dan Alarm DB Viewer. Kedua komponen ini memiliki karakteristik yang berbeda dalam menampilkan data alarm. Alarm Viewer dirancang untuk menampilkan alarm yang terjadi secara realtime, sehingga setiap kali ada alarm baru, informasi tersebut akan langsung muncul di layar tanpa perlu intervensi manual. Namun, komponen ini tidak menyimpan riwayat alarm yang telah lewat.

Di sisi lain, Alarm DB Viewer berfungsi menampilkan alarm yang telah tersimpan dalam database. Kelemahan dari komponen ini adalah tidak adanya fitur auto-refresh, sehingga operator harus melakukan refresh secara manual untuk melihat data terbaru. Hal ini tentu kurang efisien dalam operasional yang membutuhkan monitoring berkelanjutan.

## Pendekatan Solusi

Untuk mengoptimalkan penggunaan kedua komponen tersebut, pendekatan yang diterapkan adalah menempatkan Alarm Viewer pada footer di setiap screen. Dengan cara ini, operator dapat selalu melihat daftar alarm realtime di bagian bawah layar, terlepas dari halaman mana yang sedang dibuka. Untuk halaman khusus yang didedikasikan untuk monitoring alarm, digunakan Alarm DB Viewer agar operator dapat melihat seluruh riwayat alarm, baik yang lampau maupun yang terbaru.

## Implementasi Auto Refresh

Tantangan utama adalah bagaimana membuat Alarm DB Viewer menampilkan data terbaru secara otomatis tanpa harus di-refresh manual oleh operator. Solusinya adalah dengan membuat script yang melakukan reload data secara periodik dengan interval waktu tertentu. Script yang digunakan cukup sederhana:

```
#AlarmDBViewCtrl1.Refresh();
```

Untuk mengimplementasikan script ini, ikuti langkah-langkah berikut:

Pertama, buka editor script dengan cara klik kanan pada menu Script, kemudian pilih New Script dan pilih Application Script.

![[Pasted image 20240718152402.png]]

Setelah jendela editor script terbuka, masukkan script di atas dan atur interval eksekusinya dalam satuan miliseconds sesuai dengan kebutuhan sistem. Interval yang tepat akan memastikan data alarm selalu ter-update tanpa membebani performa sistem.

![[Pasted image 20240718152610.png]]

Dengan implementasi ini, operator tidak perlu lagi melakukan refresh manual pada Alarm DB Viewer. Data alarm akan diperbarui secara otomatis sesuai dengan interval yang telah ditentukan, sehingga meningkatkan efisiensi monitoring dan memastikan tidak ada alarm penting yang terlewatkan.