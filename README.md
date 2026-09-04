# Phinisi Learn

Platform belajar praktik untuk membangun kemampuan Networking, Linux, Automation, dan Internet of Things yang siap digunakan di dunia industri.

Phinisi Learn memakai Astro untuk website dan learning player, Fumadocs untuk referensi belajar, serta Keystatic sebagai CMS lokal berbasis Git. Blog tetap menjadi bagian dari platform dan dikelola melalui CMS yang sama.

## Struktur konten

Konten belajar memiliki susunan berikut:

```text
Learning Path
└── Course (diurutkan sesuai roadmap)
    └── Module (kelompok materi)
        └── Lesson (unit belajar terkecil)
```

- **Course** adalah produk belajar yang dapat berdiri sendiri.
- **Module** mengelompokkan beberapa lesson dalam satu topik.
- **Lesson** berisi materi, latihan, quiz, atau praktik.
- **Learning Path** hanya menyusun course yang sudah ada menjadi roadmap. Course baru dapat dimasukkan tanpa menduplikasi materinya.
- **Blog** tetap terpisah dari materi course dan digunakan untuk artikel, kabar, serta insight industri.

## Menjalankan project

Persyaratan: Node.js `22.12.0` atau lebih baru.

```sh
npm install
npm run dev:background
```

Website tersedia di `http://localhost:4321`. Gunakan perintah berikut untuk mengelola server background:

```sh
npx astro dev status
npx astro dev logs
npx astro dev stop
```

## Mengelola konten

Panduan lengkap seluruh collection, field, komponen editor, workflow publikasi, dan troubleshooting tersedia di [CMS-GUIDE.md](./CMS-GUIDE.md).

1. Buka `http://localhost:4321/keystatic`.
2. Buat atau perbarui **Course** terlebih dahulu.
3. Buat **Module**, pilih course induknya, lalu tentukan urutannya.
4. Buat **Lesson**, pilih course dan module induknya, lalu tentukan urutannya.
5. Jika course perlu menjadi bagian roadmap, buka **Learning Paths** dan tambahkan course sesuai urutan belajar.
6. Artikel tetap dibuat melalui collection **Blog**.

Homepage dan katalog membaca data collection yang sama. Perubahan metadata course akan ikut tersinkron ke homepage, katalog, halaman detail, learning player, dan learning path.

## Keamanan panel admin

Pada development lokal di `127.0.0.1` atau `localhost`, panel Keystatic dapat langsung dibuka tanpa login. Deployment production tetap melindungi route `/keystatic` dan `/api/keystatic` dengan Basic Authentication dan wajib menyediakan environment variable berikut:

```sh
ADMIN_USERNAME=username-admin
ADMIN_PASSWORD=password-yang-kuat
```

Salin `.env.example` menjadi `.env` untuk konfigurasi lokal pribadi. Jangan commit file `.env`.

## Validasi

```sh
npm run build
```

Perintah tersebut menjalankan pemeriksaan Astro/TypeScript kemudian membuat production build.

## Direktori utama

```text
src/content/courses/   metadata dan pengantar course
src/content/modules/   struktur module per course
src/content/docs/      lesson dan referensi belajar
src/content/paths/     susunan course pada learning path
src/content/blog/      artikel blog
src/data/learning.ts   pemetaan data CMS ke UI
```
