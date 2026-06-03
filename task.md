# Dashboard
- buat lebih simple, tidak perlu banyak tampilan, dan tidak perlu ada filter, hanya selector aggregate saja dalam bentuk button group
- OEE harus lebih menonjol, jangan samakan dengan card availability, performance, quality
- summary machine status
- di dashboard ngga perlu hoper

# line monitoring
- di status mesin tidak perlu ada OEE
- hapus line monitoring filter shift. cuma tampilkan filter status dan line saja
- popup machine detail di line monitoring

# Report
- buat filternya 2 baris. baris pertama untuk date range dan aggregate, baris kedua untuk filter batch, line, machine, shift, operator, di baris kedua ini cuma dipilih salah satu, jadi kalo satu dipilih, sisanya reset ke all
- pareto chart di report
- machine value rank
- loss distribution by machine

# downtime entry
- donwtime entry date range filter, dan tambah paginasi


buat data bergerak saat filter dipilih, mungkin kamu butuh dummy data menggunakan static json, buat semuanya satic json saja mulai dari master sampai hasil
pastikan semua data konsisten accross all pages