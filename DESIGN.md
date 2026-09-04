# Phinisi Learn Design System

Dokumen ini adalah sumber utama keputusan visual Phinisi Learn. Implementasi token berada di `src/styles/global.css`, sementara komponen reusable berada di `src/components/ui/`.

## Arah visual

Phinisi Learn menggunakan gaya **friendly technical learning**: terasa seperti aplikasi belajar yang progresif, tetapi tetap kredibel untuk materi networking. Identitas maritim hadir melalui bahasa, bentuk jalur, layar phinisi, dan maskot Nisi—bukan dekorasi kapal berlebihan.

## Warna

| Peran | Token | Nilai utama |
| --- | --- | --- |
| Primary blue | `--color-phinisi-600` | `#145BD7` |
| Secondary sky | `--color-sky` | `#38BDF8` |
| Navy | `--color-navy` | `#081A3A` |
| Success | `--color-success` | `#20A957` |
| Error | `--color-danger` | `#E5484D` |
| XP / reward | `--color-gold` | `#F4B740` |
| Background | `--color-canvas` | `#FCFDFF` |
| Light section | `--color-section` | `#EEF7FF` |

Warna status tidak boleh digunakan hanya sebagai dekorasi. Selalu sertakan ikon, label, atau perubahan bentuk agar tetap terbaca oleh pengguna dengan gangguan persepsi warna.

## Tipografi

- **Heading:** Nunito 700–900 untuk judul yang bulat, tegas, dan ramah.
- **Body:** Nunito 400–700 untuk materi panjang dan UI yang konsisten.
- **Command:** JetBrains Mono untuk Cisco IOS, terminal, label teknis, dan metadata singkat.

## Bentuk dan elevasi

- Card: radius 20–24 px, border lembut, shadow biru-navy tipis.
- Button: radius 14–16 px, minimum tinggi 44 px, shadow bawah 4 px, bergerak turun saat ditekan.
- Badge: pill ringkas dengan kontras tinggi.
- Progress bar: bentuk penuh, warna sesuai konteks, selalu memiliki label aksesibel.

## Komponen inti

- `Button` — primary, secondary, outline, ghost, dan danger.
- `Card` — default, soft, navy, success, danger, dan gold.
- `Badge` — kategori, status, XP, dan reward.
- `ProgressBar` — progress course atau misi.
- `CourseCard` — katalog course dengan ilustrasi jaringan konsisten.
- `MissionNode` — status completed, current, dan locked.
- `MascotBubble` — pesan kontekstual dari Nisi.
- `QuizOption` — default, selected, correct, dan incorrect.
- `CommandBlock` — command Cisco dengan aksi salin.

## Prinsip penggunaan

1. Satu layar hanya memiliki satu aksi utama yang paling menonjol.
2. Gunakan gold hanya untuk XP, badge pencapaian, dan reward.
3. Gunakan red hanya untuk kesalahan atau tindakan berisiko.
4. Gunakan maskot untuk memberi arahan, feedback, dan semangat—bukan mengisi setiap ruang kosong.
5. Materi panjang mempertahankan lebar baca yang nyaman dan line-height minimal 1.6.
6. Semua state interaktif harus memiliki focus state dan target sentuh minimum 44 px.
