import { config, fields, collection } from '@keystatic/core';
import { block, wrapper } from '@keystatic/core/content-components';
import React from 'react';

const { createElement: h, useState, useEffect } = React;

const sizeLabels: Record<string, string> = { small: '25%', medium: '50%', large: '75%', full: '100%' };

const customImageComponent = block({
  label: 'Advanced Image',
  schema: {
    src: fields.image({
      label: 'Image',
      directory: 'src/assets',
      publicPath: '../../assets/',
    }),
    alt: fields.text({ label: 'Alt Text (Optional)' }),
    align: fields.select({
      label: 'Alignment',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
      defaultValue: 'center',
    }),
    size: fields.select({
      label: 'Size',
      options: [
        { label: 'Small (25%)', value: 'small' },
        { label: 'Medium (50%)', value: 'medium' },
        { label: 'Large (75%)', value: 'large' },
        { label: 'Full Width (100%)', value: 'full' },
      ],
      defaultValue: 'medium',
    }),
    caption: fields.text({ label: 'Caption (Optional)' }),
  },
  ContentView: function (props) {
    const align = props.value.align ?? 'center';
    const size = props.value.size ?? 'medium';
    const width = sizeLabels[size] ?? '50%';
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
    const source: unknown = props.value.src;

    const [objectUrl, setObjectUrl] = useState('');

    useEffect(() => {
      // If the image is not saved yet, Keystatic stores it as a Uint8Array object in props.value.src.data
      if (typeof source === 'object' && source !== null && 'data' in source) {
        const imageSource = source as { data: Uint8Array | Record<string, number>; extension?: string };
        let arrayData: Uint8Array;
        if (imageSource.data instanceof Uint8Array) {
          arrayData = imageSource.data;
        } else {
          // In case it's a plain object representation of a Uint8Array
          arrayData = new Uint8Array(Object.values(imageSource.data));
        }

        const extension = imageSource.extension || 'png';
        const buffer = new ArrayBuffer(arrayData.byteLength);
        new Uint8Array(buffer).set(arrayData);
        const blob = new Blob([buffer], { type: `image/${extension}` });
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);

        return () => URL.revokeObjectURL(url);
      }
    }, [source]);

    let imgSrc = '';
    if (typeof source === 'string') {
      // If already saved, it's just a string filename
      imgSrc = source.startsWith('http') || source.startsWith('blob:')
               ? source
               : `/src/assets/${source}`;
    } else if (objectUrl) {
      // Use the object URL for unsaved images
      imgSrc = objectUrl;
    }

    const imageNode = imgSrc ? h('img', {
      src: imgSrc,
      alt: props.value.alt || 'Advanced Image',
      style: {
        width: '100%',
        height: 'auto',
        borderRadius: '8px',
        display: 'block'
      }
    }) : h('div', {
      style: {
        width: '100%',
        padding: '24px',
        background: '#f1f5f9',
        border: '2px dashed #cbd5e1',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '13px',
      }
    }, 'Klik "Edit" untuk memilih gambar');

    return h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: flexAlign, padding: '8px 0', width: '100%' } },
      h('div', { style: { width } }, imageNode),
      props.value.caption ? h('p', { style: { fontSize: '12px', color: '#64748b', marginTop: '8px', fontStyle: 'italic', textAlign: 'center' } }, props.value.caption) : null
    );
  },
});

const commandBlockComponent = block({
  label: 'Terminal Perintah (Cisco IOS / Linux)',
  schema: {
    command: fields.text({ label: 'Baris Perintah', multiline: true, description: 'Perintah CLI yang dijalankan' }),
    prompt: fields.text({ label: 'Prompt Terminal', defaultValue: 'Router>' }),
    title: fields.text({ label: 'Judul Jendela', defaultValue: 'Cisco IOS' }),
    showCopy: fields.checkbox({ label: 'Tampilkan tombol Salin', defaultValue: true }),
    output: fields.text({ label: 'Contoh Output Respons (Opsional)', multiline: true }),
  },
});

const topologyDiagramComponent = block({
  label: 'Diagram Topologi Jaringan',
  schema: {
    title: fields.text({ label: 'Judul Diagram', defaultValue: 'Topologi latihan' }),
    caption: fields.text({ label: 'Keterangan Tambahan (Opsional)', multiline: true }),
    leftLabel: fields.text({ label: 'Label Node Kiri', defaultValue: 'Jaringan Sumber' }),
    leftMeta: fields.text({ label: 'Deskripsi Node Kiri', defaultValue: 'LAN pengguna' }),
    leftIcon: fields.text({ label: 'Icon Material Symbol Kiri', defaultValue: 'devices' }),
    centerLabel: fields.text({ label: 'Label Node Tengah', defaultValue: 'Router' }),
    centerMeta: fields.text({ label: 'Deskripsi Node Tengah', defaultValue: 'Perangkat transit' }),
    centerIcon: fields.text({ label: 'Icon Material Symbol Tengah', defaultValue: 'router' }),
    rightLabel: fields.text({ label: 'Label Node Kanan', defaultValue: 'Jaringan Tujuan' }),
    rightMeta: fields.text({ label: 'Deskripsi Node Kanan', defaultValue: 'Server tujuan' }),
    rightIcon: fields.text({ label: 'Icon Material Symbol Kanan', defaultValue: 'dns' }),
  },
});

const practiceCTAComponent = block({
  label: 'Ajakan Latihan / Praktik (Practice CTA)',
  schema: {
    title: fields.text({ label: 'Judul Ajakan', defaultValue: 'Siap menguji pemahamanmu?' }),
    description: fields.text({
      label: 'Deskripsi Ajakan',
      multiline: true,
      defaultValue: 'Pakai konsep di atas pada latihan singkat sebelum melanjutkan ke materi berikutnya.',
    }),
    href: fields.text({ label: 'URL Tujuan atau Anchor', defaultValue: '#latihan' }),
    label: fields.text({ label: 'Teks Tombol', defaultValue: 'Coba Latihan' }),
  },
});

const commandOrderComponent = block({
  label: 'Latihan Urutkan Perintah CLI',
  schema: {
    activityId: fields.text({ label: 'ID Unik Aktivitas' }),
    courseSlug: fields.relationship({ label: 'Pilih Kursus', collection: 'courses' }),
    lessonId: fields.text({ label: 'Slug Materi Terkait' }),
    title: fields.text({ label: 'Judul Latihan', defaultValue: 'Susun Urutan Perintah Konfigurasi' }),
    description: fields.text({ label: 'Instruksi Pengerjaan', multiline: true }),
    steps: fields.array(fields.text({ label: 'Perintah Benar' }), {
      label: 'Urutan Perintah yang Benar (Atas ke Bawah)',
      itemLabel: (props) => props.value || 'Perintah baru',
    }),
    scrambledOrder: fields.array(fields.integer({ label: 'Indeks Acak' }), {
      label: 'Urutan Tampilan Acak Awal',
      itemLabel: (props) => `Indeks ${props.value}`,
    }),
    xp: fields.integer({ label: 'Hadiah Poin XP', defaultValue: 30 }),
  },
});

const lessonQuizComponent = block({
  label: 'Kuis Pilihan Ganda (Lesson Quiz)',
  schema: {
    activityId: fields.text({
      label: 'ID Unik Aktivitas (Wajib)',
      description: 'ID unik tanpa spasi untuk pencatatan kelulusan kuis, contoh: kuis-vlan-01',
    }),
    courseSlug: fields.relationship({ label: 'Pilih Kursus Terkait', collection: 'courses' }),
    lessonId: fields.text({ label: 'Slug Materi Terkait' }),
    questions: fields.array(
      fields.object({
        question: fields.text({ label: 'Butir Pertanyaan', multiline: true }),
        options: fields.array(fields.text({ label: 'Pilihan Jawaban' }), {
          label: 'Daftar Pilihan Jawaban',
          itemLabel: (props) => props.value || 'Pilihan baru',
        }),
        correctIndex: fields.integer({
          label: 'Indeks Kunci Jawaban Benar (Mulai dari 0 untuk opsi pertama)',
          defaultValue: 0,
        }),
        explanation: fields.text({ label: 'Pembahasan Jawaban', multiline: true }),
      }),
      {
        label: 'Daftar Soal Pertanyaan',
        itemLabel: (props) => props.fields.question.value || 'Pertanyaan Baru',
      }
    ),
    passingScore: fields.integer({
      label: 'Nilai Minimum Kelulusan (%)',
      defaultValue: 67,
      description: 'Persentase minimal untuk membuka prasyarat modul selesai',
    }),
    xp: fields.integer({ label: 'Hadiah Poin XP Kuis', defaultValue: 25 }),
  },
});

const knowledgeCheckComponent = block({
  label: 'Cek Pemahaman Singkat (Single Question)',
  schema: {
    activityId: fields.text({ label: 'ID Unik Aktivitas' }),
    courseSlug: fields.relationship({ label: 'Pilih Kursus', collection: 'courses' }),
    lessonId: fields.text({ label: 'Slug Materi' }),
    question: fields.text({ label: 'Pertanyaan', multiline: true }),
    options: fields.array(fields.text({ label: 'Pilihan Jawaban' }), {
      label: 'Pilihan Jawaban',
      itemLabel: (props) => props.value || 'Pilihan baru',
    }),
    correctIndex: fields.integer({ label: 'Kunci Jawaban Benar (0 untuk opsi pertama)', defaultValue: 0 }),
    explanation: fields.text({ label: 'Pembahasan', multiline: true }),
    xp: fields.integer({ label: 'Hadiah Poin XP', defaultValue: 20 }),
  },
});

const packetTracerLabComponent = block({
  label: 'Praktik Lab Packet Tracer (.pkt via Drive)',
  schema: {
    activityId: fields.text({
      label: 'ID Unik Aktivitas (Wajib)',
      description: 'Gunakan ID tanpa spasi untuk pencatatan XP dan prasyarat kelulusan modul, contoh: lab-vlan-01',
    }),
    title: fields.text({
      label: 'Judul Praktik Lab',
      defaultValue: 'Lab Praktik: Cisco Packet Tracer',
      description: 'Nama latihan, contoh: Lab 2.1: Konfigurasi VLAN & Trunking',
    }),
    driveUrl: fields.text({
      label: 'Tautan Google Drive Berkas .pkt / .pka',
      description: 'Salin tautan berbagi Google Drive. Pastikan hak akses disetel ke "Siapa saja yang memiliki link" -> "Pelihat".',
    }),
    fileName: fields.text({
      label: 'Nama Berkas Saat Diunduh Siswa',
      defaultValue: 'lab-praktik.pkt',
      description: 'Contoh: Lab-01-VLAN-Trunking.pkt',
    }),
    fileSize: fields.text({
      label: 'Estimasi Ukuran Berkas',
      defaultValue: '1.8 MB',
    }),
    minVersion: fields.text({
      label: 'Versi Cisco Packet Tracer Minimum',
      defaultValue: 'Cisco Packet Tracer v8.2+',
    }),
    difficulty: fields.select({
      label: 'Tingkat Kesulitan Lab',
      options: [
        { label: 'Pemula (Beginner)', value: 'beginner' },
        { label: 'Menengah (Intermediate)', value: 'intermediate' },
        { label: 'Lanjutan (Advanced)', value: 'advanced' },
      ],
      defaultValue: 'intermediate',
    }),
    durationMinutes: fields.integer({
      label: 'Estimasi Pengerjaan (Menit)',
      defaultValue: 30,
    }),
    xp: fields.integer({
      label: 'Hadiah Poin XP Praktik',
      defaultValue: 40,
      description: 'Rekomendasi 40 - 50 XP untuk praktik konfigurasi Packet Tracer.',
    }),
    description: fields.text({
      label: 'Instruksi / Ringkasan Skenario Lab',
      multiline: true,
      defaultValue: 'Unduh berkas topologi di bawah, jalankan pada aplikasi Cisco Packet Tracer di komputer Anda, lalu ikuti panduan konfigurasi yang diberikan.',
    }),
    tasks: fields.array(fields.text({ label: 'Langkah Tugas' }), {
      label: 'Checklist Target Konfigurasi Siswa (Opsional)',
      itemLabel: (props) => props.value || 'Tugas Baru',
    }),
  },
});

const mdxComponents = {
  CustomImage: customImageComponent,
  Callout: wrapper({
    label: 'Kotak Catatan Penting (Callout)',
    schema: {
      type: fields.select({
        label: 'Tipe Kotak',
        options: [
          { label: 'Informasi (Biru)', value: 'info' },
          { label: 'Peringatan (Kuning)', value: 'warning' },
          { label: 'Ingat Ini (Ungu)', value: 'remember' },
          { label: 'Kesalahan Umum (Merah)', value: 'mistake' },
          { label: 'Sukses (Hijau)', value: 'success' },
          { label: 'Bahaya (Merah Tua)', value: 'danger' }
        ],
        defaultValue: 'info',
      }),
      title: fields.text({ label: 'Judul Kotak Catatan (Opsional)' })
    }
  }),
  Tabs: wrapper({
    label: 'Grup Tab Konten',
    schema: {}
  }),
  TabItem: wrapper({
    label: 'Item Tab',
    schema: {
      label: fields.text({ label: 'Label Judul Tab' })
    }
  }),
  CommandBlock: commandBlockComponent,
  TopologyDiagram: topologyDiagramComponent,
  PracticeCTA: practiceCTAComponent,
  KnowledgeCheck: knowledgeCheckComponent,
  LessonQuiz: lessonQuizComponent,
  CommandOrder: commandOrderComponent,
  PacketTracerLab: packetTracerLabComponent,
};

export default config({
  storage: {
    kind: 'local'
  },
  ui: {
    brand: {
      name: 'Phinisi Learn',
      mark: () => h('img', { src: '/logo.png', height: 32, style: { marginRight: 8 }, alt: 'Phinisi Logo' }),
    },
  },
  collections: {
    courses: collection({
      label: 'Kursus (Courses)',
      slugField: 'title',
      path: 'src/content/courses/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'category', 'status', 'updatedAt'],
      schema: {
        title: fields.slug({ name: { label: 'Judul Kursus', description: 'Nama resmi kursus, contoh: Dasar Keamanan Jaringan' } }),
        titleEn: fields.text({ label: 'Judul Bahasa Inggris (Opsional)' }),
        description: fields.text({ label: 'Deskripsi Singkat', multiline: true, description: 'Rangkuman kompetensi yang dipelajari siswa dalam kursus ini.' }),
        descriptionEn: fields.text({ label: 'Deskripsi Bahasa Inggris (Opsional)', multiline: true }),
        category: fields.select({
          label: 'Bidang Ilmu / Kategori',
          description: 'Pilih rumpun keahlian materi ini.',
          options: [
            { label: 'Jaringan Komputer (Networking)', value: 'networking' },
            { label: 'Linux & Server (Linux)', value: 'linux' },
            { label: 'Otomasi & Python (Automation)', value: 'automation' },
            { label: 'Internet of Things (IoT)', value: 'iot' },
          ],
          defaultValue: 'networking',
        }),
        level: fields.select({
          label: 'Tingkat Kemampuan',
          options: [
            { label: 'Pemula (Beginner)', value: 'beginner' },
            { label: 'Menengah (Intermediate)', value: 'intermediate' },
            { label: 'Lanjutan (Advanced)', value: 'advanced' },
          ],
          defaultValue: 'beginner',
        }),
        status: fields.select({
          label: 'Status Publikasi',
          description: 'Gunakan Draf jika materi masih dalam penulisan dan belum siap dilihat siswa.',
          options: [
            { label: 'Draf (Belum Tampil di Web)', value: 'draft' },
            { label: 'Segera Hadir (Coming soon)', value: 'planned' },
            { label: 'Terpublikasi (Aktif)', value: 'published' },
            { label: 'Diarsipkan (Archived)', value: 'archived' },
          ],
          defaultValue: 'draft',
        }),
        cover: fields.image({
          label: 'Gambar Sampul Kursus (Cover 16:9)',
          description: 'Pilih atau unggah gambar banner sampul kursus.',
          directory: 'public/images/courses',
          publicPath: '/images/courses/',
        }),
        publishedAt: fields.date({ label: 'Tanggal Terbit', defaultValue: { kind: 'today' } }),
        updatedAt: fields.date({ label: 'Pembaruan Terakhir', defaultValue: { kind: 'today' } }),
        durationHours: fields.integer({ label: 'Estimasi Durasi Belajar (Jam)', defaultValue: 6, description: 'Total jam perkiraan yang dibutuhkan siswa.' }),
        tools: fields.array(fields.text({ label: 'Nama Software / Alat' }), {
          label: 'Alat & Software yang Digunakan',
          itemLabel: (props) => props.value || 'Software Baru',
        }),
        outcomes: fields.array(
          fields.object({
            id: fields.text({ label: 'Capaian Pembelajaran (Indonesia)' }),
            en: fields.text({ label: 'Capaian Pembelajaran (Inggris, Opsional)' }),
          }),
          {
            label: 'Target Capaian Belajar (Learning Outcomes)',
            description: 'Kemampuan teknis yang dikuasai siswa setelah lulus kursus ini.',
            itemLabel: (props) => props.fields.id.value || 'Target Baru',
          }
        ),
        projectTitle: fields.text({ label: 'Judul Proyek Akhir (Opsional)' }),
        projectDescription: fields.text({ label: 'Deskripsi Proyek Akhir (Opsional)', multiline: true }),
        content: fields.mdx({ label: 'Halaman Gambaran Umum Kursus (Overview)', components: mdxComponents }),
      },
    }),
    modules: collection({
      label: 'Modul Bab (Modules)',
      slugField: 'title',
      path: 'src/content/modules/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'course', 'order'],
      schema: {
        title: fields.slug({ name: { label: 'Judul Bab Modul', description: 'Contoh: Modul 1: Konfigurasi Dasar Switch' } }),
        titleEn: fields.text({ label: 'Judul Bab Bahasa Inggris (Opsional)' }),
        course: fields.relationship({
          label: 'Pilih Kursus Terkait',
          description: 'Modul bab ini adalah bagian dari kursus mana.',
          collection: 'courses',
          validation: { isRequired: true },
        }),
        order: fields.integer({ label: 'Nomor Urutan Bab', defaultValue: 1, description: 'Urutan bab di dalam silabus kursus (1, 2, 3...)' }),
        description: fields.text({ label: 'Deskripsi Singkat Bab (Opsional)', multiline: true }),
        draft: fields.checkbox({ label: 'Simpan sebagai Draf', defaultValue: false }),
        content: fields.mdx({ label: 'Pendahuluan Bab (Opsional)', components: mdxComponents }),
      },
    }),
    lessons: collection({
      label: 'Materi Pelajaran (Lessons)',
      slugField: 'title',
      path: 'src/content/docs/**',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'course', 'module', 'order', 'draft'],
      schema: {
        title: fields.slug({ name: { label: 'Judul Materi Pelajaran', description: 'Contoh: 01. Konsep VLAN dan Port Access' } }),
        language: fields.select({
          label: 'Bahasa',
          options: [{ label: 'Indonesia', value: 'id' }, { label: 'English', value: 'en' }],
          defaultValue: 'id',
        }),
        draft: fields.checkbox({ label: 'Simpan sebagai Draf', description: 'Centang untuk menyembunyikan materi ini dari website siswa', defaultValue: false }),
        course: fields.relationship({ label: 'Pilih Kursus', collection: 'courses', description: 'Kursus tempat materi ini berada.' }),
        module: fields.relationship({ label: 'Pilih Bab Modul', collection: 'modules', description: 'Pilih bab modul tempat materi ini berada. Catatan: Kosongkan HANYA jika materi ini adalah Halaman Pembuka / Overview Kursus.' }),
        description: fields.text({ label: 'Deskripsi Singkat Materi', multiline: true }),
        order: fields.integer({ label: 'Nomor Urut Pelajaran', defaultValue: 1, description: 'Urutan materi di dalam modul bab (1, 2, 3...).' }),
        durationMinutes: fields.integer({ label: 'Estimasi Waktu Baca (Menit)', defaultValue: 10 }),
        icon: fields.text({ label: 'Icon Material Symbol (Opsional)' }),
        content: fields.mdx({
          label: 'Isi Konten Materi Pembelajaran',
          components: mdxComponents,
        }),
      },
    }),
    blog: collection({
      label: 'Artikel Blog (Blog Posts)',
      slugField: 'title',
      path: 'src/content/blog/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Judul Artikel' } }),
        language: fields.select({
          label: 'Bahasa',
          options: [{ label: 'Indonesia', value: 'id' }, { label: 'English', value: 'en' }],
          defaultValue: 'id',
        }),
        draft: fields.checkbox({ label: 'Simpan sebagai Draf', description: 'Centang untuk menyembunyikan post ini dari website', defaultValue: false }),
        description: fields.text({ label: 'Deskripsi Singkat', multiline: true }),
        author: fields.text({ label: 'Penulis', defaultValue: 'Calvin Umboh' }),
        date: fields.date({ label: 'Tanggal Terbit', defaultValue: { kind: 'today' } }),
        category: fields.select({
          label: 'Kategori',
          options: [
            { label: 'Teknologi (Technology)', value: 'Technology' },
            { label: 'Jaringan (Networking)', value: 'Networking' },
            { label: 'Cloud Computing', value: 'Cloud' },
            { label: 'Keamanan (Security)', value: 'Security' },
            { label: 'Linux & Server', value: 'Linux' },
          ],
          defaultValue: 'Technology',
        }),
        image: fields.image({
          label: 'Gambar Sampul Blog (Opsional)',
          directory: 'public/images/blog',
          publicPath: '/images/blog/',
        }),
        content: fields.mdx({
          label: 'Isi Konten Artikel',
          components: mdxComponents,
        }),
      },
    }),
    paths: collection({
      label: 'Alur Belajar (Learning Paths)',
      slugField: 'title',
      path: 'src/content/paths/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        titleEn: fields.text({ label: 'English title (Optional)' }),
        language: fields.select({
          label: 'Language',
          options: [{ label: 'Indonesia', value: 'id' }, { label: 'English', value: 'en' }],
          defaultValue: 'id',
        }),
        draft: fields.checkbox({ label: 'Draft', description: 'Centang untuk menyembunyikan learning path ini dari website', defaultValue: false }),
        description: fields.text({ label: 'Description', multiline: true }),
        descriptionEn: fields.text({ label: 'English description (Optional)', multiline: true }),
        category: fields.select({
          label: 'Field',
          options: [
            { label: 'Networking', value: 'networking' },
            { label: 'Linux', value: 'linux' },
            { label: 'Automation', value: 'automation' },
            { label: 'Internet of Things', value: 'iot' },
          ],
          defaultValue: 'networking',
        }),
        target: fields.text({ label: 'Target role or certification' }),
        targetEn: fields.text({ label: 'English target (Optional)' }),
        cover: fields.image({
          label: 'Learning path cover (Optional)',
          directory: 'public/images/learning-paths',
          publicPath: '/images/learning-paths/',
        }),
        courses: fields.array(
          fields.object({
            course: fields.relationship({ label: 'Course', collection: 'courses' }),
            order: fields.integer({ label: 'Order', defaultValue: 1 }),
          }),
          {
            label: 'Courses in this learning path',
            description: 'Choose existing courses and arrange their sequence.',
            itemLabel: (props) => `${props.fields.course.value ?? 'Choose course'} — #${props.fields.order.value ?? 1}`,
          }
        ),
        content: fields.mdx({
          label: 'Content',
          components: mdxComponents,
        }),
      },
    }),
  },
});
