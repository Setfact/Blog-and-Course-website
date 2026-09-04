# Panduan CMS Phinisi Learn

Panduan ini menjelaskan alur kerja lengkap Keystatic untuk mengelola Course, Module, Lesson, Blog, dan Learning Path di Phinisi Learn.

## 1. Membuka CMS

Jalankan development server dari folder project:

```sh
npm run dev:background
```

Buka:

```text
http://127.0.0.1:4321/keystatic
```

Pada development lokal CMS dapat dibuka tanpa login. Deployment production wajib memakai `ADMIN_USERNAME` dan `ADMIN_PASSWORD`.

Untuk mengelola server:

```sh
npx astro dev status
npx astro dev logs
npx astro dev stop
```

## 2. Memahami struktur konten

```text
Learning Path
└── Course
    └── Module
        └── Lesson
```

- **Course** adalah kelas yang dapat dipelajari secara mandiri.
- **Module** adalah kelompok topik dalam satu course.
- **Lesson** adalah unit materi terkecil yang dibaca atau diselesaikan siswa.
- **Learning Path** mengurutkan beberapa course menjadi roadmap profesi atau sertifikasi.
- **Blog Post** adalah artikel publik dan tidak menjadi bagian progress course.

Urutan pembuatan yang disarankan adalah **Course → Module → Lesson → Learning Path**.

## 3. Dashboard dan daftar collection

Menu kiri CMS berisi:

- **Courses** untuk katalog course.
- **Modules** untuk struktur bab course.
- **Lessons** untuk materi, latihan, dan quiz.
- **Blog Posts** untuk artikel.
- **Learning Paths** untuk roadmap berisi beberapa course.

Klik collection untuk melihat seluruh entry. Gunakan tombol pembuatan entry untuk menambahkan konten dan buka entry yang sudah ada untuk mengeditnya.

## 4. Membuat Course

Buka **Courses**, lalu buat entry baru.

### Field Course

| Field | Kegunaan |
| --- | --- |
| Course title | Nama course yang tampil kepada siswa. |
| Slug | ID URL dan nama file. Gunakan huruf kecil serta tanda hubung, misalnya `linux-fundamentals`. Jangan mengubah slug setelah course dipakai oleh lesson. |
| English title | Judul versi Inggris jika tersedia. |
| Short description | Ringkasan singkat untuk homepage dan katalog. |
| English description | Ringkasan versi Inggris. |
| Field | Networking, Linux, Automation, atau Internet of Things. |
| Level | Beginner, Intermediate, atau Advanced. |
| Publishing status | Status publikasi course. |
| Course cover | Gambar kartu course. Gunakan WebP rasio 16:9, idealnya 1600×900 dan ukurannya tidak berlebihan. |
| Published at | Tanggal pertama dipublikasikan. |
| Last updated | Perbarui tanggal ini ketika isi course berubah secara berarti. |
| Estimated duration | Estimasi total course dalam jam. |
| Tools used | Perangkat atau software, misalnya Cisco Packet Tracer, Linux, Python, ESP32. |
| Learning outcomes | Kompetensi yang diperoleh siswa. Isi Indonesia dan English jika tersedia. |
| Final project | Nama dan deskripsi project akhir. |
| Course overview | Pengantar tambahan yang muncul di halaman course. |

### Status Course

- **Draft**: belum ditampilkan kepada siswa.
- **Coming soon**: muncul di katalog sebagai course yang akan datang, tetapi belum dapat dipelajari.
- **Published**: course tersedia untuk siswa.
- **Archived**: disembunyikan tanpa menghapus file.

Gunakan **Coming soon** jika cover dan deskripsi sudah siap tetapi lesson belum lengkap.

## 5. Membuat Module

Buat module setelah course induknya tersedia.

| Field | Kegunaan |
| --- | --- |
| Module title | Nama kelompok materi. |
| Slug | ID module. Gunakan pola yang mudah dibaca, misalnya `linux-fundamentals-01-introduction`. |
| Course | Pilih course induk. Field ini wajib. |
| Order in course | Posisi module dalam course: 1, 2, 3, dan seterusnya. |
| Description | Ringkasan module. |
| Draft | Menyembunyikan module sementara. |
| Module introduction | Pengantar opsional untuk module. |

Nomor urutan harus unik dalam course yang sama agar learning player tersusun konsisten.

## 6. Membuat Lesson

Buka **Lessons**, lalu buat entry setelah course dan module induknya tersedia.

### Metadata Lesson

| Field | Kegunaan |
| --- | --- |
| Lesson title | Judul materi. |
| Slug | Lokasi lesson. Untuk lesson sebuah course, gunakan folder course, misalnya `linux/01-pengenalan-linux`. |
| Language | `Indonesia` atau `English`. |
| Draft | Centang ketika lesson belum siap tampil. |
| Course | Pilih course induk. |
| Module | Pilih module tempat lesson berada. Boleh kosong hanya untuk halaman overview course. |
| Description | Ringkasan lesson. |
| Order | Urutan lesson dalam keseluruhan course. Gunakan angka unik dan berurutan. |
| Estimated duration | Estimasi waktu belajar dalam menit. |
| Icon | Nama Material Symbol opsional. |
| Content | Isi utama lesson. |

### Menulis isi Lesson

Editor mendukung:

- Heading 2–4 untuk struktur materi.
- Bold, italic, inline code, dan link.
- Ordered list dan unordered list.
- Blockquote.
- Tabel.
- Code block untuk konfigurasi atau program multi-baris.
- Gambar dan komponen interaktif dari menu insert.

Gunakan satu topik kecil per lesson. Target yang nyaman adalah sekitar 5–15 menit membaca ditambah latihan.

## 7. Komponen khusus di editor Lesson

Komponen berikut tersedia melalui menu insert pada editor MDX.

### Callout

Kotak penekanan yang membungkus teks.

- **Info**: informasi tambahan.
- **Warning**: hal yang perlu diperhatikan.
- **Ingat Ini**: konsep penting untuk diingat.
- **Kesalahan Umum**: miskonsepsi atau kesalahan yang sering terjadi.
- **Success**: hasil atau kondisi yang benar.
- **Danger**: risiko keamanan atau tindakan berbahaya.

Isi `Title` jika callout membutuhkan judul. Tulis isi callout di area teks di dalam komponen.

### Advanced Image

Digunakan untuk ilustrasi di dalam materi.

- Pilih file gambar.
- Isi alt text untuk aksesibilitas.
- Atur posisi left, center, atau right.
- Atur ukuran 25%, 50%, 75%, atau 100%.
- Isi caption jika gambar memerlukan penjelasan.

### Command block

Gunakan untuk satu command yang memiliki prompt dan tombol salin.

- **Command**: command utama, misalnya `show ip interface brief`.
- **Prompt**: misalnya `R1#` atau `$`.
- **Window title**: misalnya `Cisco IOS` atau `Linux Shell`.
- **Show copy button**: menampilkan tombol salin.
- **Example output**: output opsional setelah command.

Untuk konfigurasi panjang tanpa UI tambahan, gunakan code block biasa.

### Network topology

Membuat diagram tiga node: kiri → tengah → kanan.

- Isi judul dan caption.
- Isi label serta deskripsi ketiga node.
- Icon memakai nama dari Google Material Symbols, misalnya `devices`, `router`, `dns`, `sensors`, `hub`, atau `monitoring`.

Gunakan diagram ini hanya untuk topologi sederhana. Topologi yang kompleks lebih baik dibuat sebagai gambar khusus.

### Practice CTA

Kotak ajakan melakukan praktik.

- **Title**: nama latihan.
- **Description**: instruksi singkat.
- **Destination URL or anchor**: URL halaman atau anchor, misalnya `#latihan`.
- **Button label**: teks tombol.

Pastikan anchor tujuan benar-benar tersedia sebagai heading pada lesson yang sama.

### Single knowledge check

Pertanyaan pilihan ganda tunggal.

- `activityId` harus unik di seluruh course, misalnya `linux-lesson-1-check-1`.
- Pilih course dan isi slug lesson.
- Tambahkan minimal dua answer option.
- `correctIndex` dimulai dari **0**. Jawaban pertama = 0, kedua = 1, ketiga = 2.
- Isi explanation dan XP.

### Lesson quiz

Quiz final untuk menyelesaikan satu lesson.

- `activityId` harus unik.
- Pilih course dan isi slug lesson.
- Tambahkan beberapa questions.
- Setiap question berisi soal, pilihan, `correctIndex`, dan penjelasan.
- `passingScore` adalah nilai minimal dalam persen.
- XP hanya diberikan sekali untuk penyelesaian pertama.

Gunakan satu Lesson Quiz di bagian akhir lesson jika quiz tersebut menandai lesson selesai.

### Command ordering activity

Aktivitas menyusun command dalam urutan benar.

- Isi ID aktivitas, course, lesson, judul, dan instruksi.
- **Correct command order** adalah daftar command dalam urutan jawaban yang benar.
- **Initial shuffled indexes** menentukan urutan awal dengan indeks mulai dari 0.

Contoh lima command dapat diacak dengan `3, 1, 4, 0, 2`. Jika urutan acak dikosongkan, sistem otomatis membalik urutan command.

### Tabs Group dan Tab Item

Gunakan Tabs Group untuk membandingkan beberapa variasi konten, misalnya Cisco IOS dan Linux. Masukkan beberapa Tab Item di dalamnya dan isi label setiap tab. Jangan memakai Tab Item di luar Tabs Group.

## 8. Membuat Blog Post

Buka **Blog Posts** dan isi:

- judul serta slug
- bahasa
- status draft
- deskripsi singkat
- nama author
- tanggal publikasi
- kategori
- cover image
- isi artikel

Blog tidak memerlukan hubungan Course atau Module. Gunakan Draft sampai artikel, link, dan cover sudah diperiksa.

## 9. Membuat Learning Path

Learning Path dibuat setelah course yang diperlukan sudah tersedia.

| Field | Kegunaan |
| --- | --- |
| Title dan Slug | Nama dan URL roadmap. |
| English fields | Terjemahan opsional. |
| Draft | Menyembunyikan roadmap. |
| Description | Ringkasan roadmap. |
| Field | Networking, Linux, Automation, atau IoT. |
| Target | Profesi atau sertifikasi tujuan, misalnya CCNA 200-301. |
| Cover | Gambar learning path. |
| Courses | Pilih course yang sudah ada dan beri nomor urut. |
| Content | Penjelasan tambahan roadmap. |

Learning Path tidak menyalin lesson. Jika isi Course diperbarui, roadmap otomatis menggunakan versi Course yang sama.

## 10. Workflow publikasi yang aman

Gunakan alur berikut untuk course baru:

1. Buat Course dengan status **Draft** atau **Coming soon**.
2. Buat seluruh Module dan isi urutannya.
3. Buat Lesson sebagai **Draft**.
4. Isi materi, command, ilustrasi, latihan, dan quiz.
5. Periksa halaman `/docs/...` dan `/learn/...`.
6. Hilangkan Draft pada lesson yang sudah siap.
7. Ubah Course menjadi **Published**.
8. Perbarui `Last updated`.
9. Tambahkan Course ke Learning Path jika diperlukan.
10. Jalankan `npm run build` sebelum deployment.

## 11. Aturan penting

- Jangan mengubah slug Course setelah Module, Lesson, atau Learning Path menggunakannya.
- `activityId` quiz dan aktivitas harus unik.
- `correctIndex` selalu dimulai dari 0.
- Course biasa harus memiliki Module sebelum Lesson.
- Overview course boleh tidak mempunyai Module.
- Jangan menghapus entry yang masih direferensikan entry lain. Gunakan Draft atau Archived terlebih dahulu.
- Gunakan gambar yang sudah dikompres.
- Klik Save setelah mengubah entry. Keystatic local mode menulis perubahan langsung ke file project.

## 12. Troubleshooting CMS

### Halaman putih

Restart server:

```sh
npx astro dev stop
npx astro dev --background
```

Kemudian lakukan hard refresh dengan `Ctrl + Shift + R`.

### Missing component definition

Error ini berarti MDX memakai komponen yang belum terdaftar di `keystatic.config.ts`. Komponen resmi Phinisi Learn yang sudah didukung adalah:

```text
Callout
CustomImage
CommandBlock
TopologyDiagram
PracticeCTA
KnowledgeCheck
LessonQuiz
CommandOrder
Tabs
TabItem
```

Jika komponen baru ditambahkan ke website, definisinya juga harus ditambahkan ke CMS sebelum dipakai dalam lesson.

### Entry tidak tampil di website

Periksa:

1. Draft tidak dicentang.
2. Course berstatus Published atau Coming soon sesuai kebutuhan.
3. Language sesuai halaman yang dibuka.
4. Course dan Module relationship sudah benar.
5. Urutan berupa angka yang valid.
6. Slug dan URL sesuai.

### Build gagal setelah mengedit konten

Jalankan:

```sh
npm run build
```

Baca nama file dan pesan validation error. Biasanya penyebabnya adalah relationship kosong, nilai select tidak valid, atau properti komponen interaktif belum lengkap.
