export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'yaml';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function sanitizeMdxContent(content: string): string {
  if (!content) return '';
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part) => {
      if (part.startsWith('```')) return part;
      return part
        .replace(/<br\s*(?!\/|\w)>|<br>/gi, '<br />')
        .replace(/<hr\s*(?!\/|\w)>|<hr>/gi, '<hr />')
        .replace(/<img\s+([^>]*?)(?<!\/)>/gi, '<img $1 />')
        .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '');
    })
    .join('');
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Akses ditolak: Hanya administrator yang diizinkan mengedit kursus.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const {
      courseSlug,
      title,
      category = 'networking',
      level = 'beginner',
      durationHours = 6,
      description = '',
      cover = '/images/courses/security-fundamentals.webp',
      tools = ['Cisco IOS', 'Cisco Packet Tracer'],
      outcomes = [],
      status = 'draft',
      overviewContent = '',
      modules = [],
    } = body;

    if (!courseSlug || typeof courseSlug !== 'string') {
      return new Response(JSON.stringify({ error: 'Slug kursus tidak valid.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Judul kursus wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const projectRoot = process.cwd();
    const coursesDir = path.join(projectRoot, 'src', 'content', 'courses');
    const modulesDir = path.join(projectRoot, 'src', 'content', 'modules');
    const docsCourseDir = path.join(projectRoot, 'src', 'content', 'docs', courseSlug);

    await fs.mkdir(coursesDir, { recursive: true });
    await fs.mkdir(modulesDir, { recursive: true });
    await fs.mkdir(docsCourseDir, { recursive: true });

    const courseFilePath = path.join(coursesDir, `${courseSlug}.mdx`);

    // Baca tanggal publishedAt yang sudah ada jika ada
    let existingPublishedAt = new Date().toISOString().split('T')[0];
    try {
      const existingRaw = await fs.readFile(courseFilePath, 'utf-8');
      const match = existingRaw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (match) {
        const parsed = yaml.parse(match[1]);
        if (parsed?.publishedAt) {
          existingPublishedAt = String(parsed.publishedAt);
        }
      }
    } catch {
      // File baru atau belum ada
    }

    const today = new Date().toISOString().split('T')[0];

    // Format outcomes array
    const outcomeItems: string[] = Array.isArray(outcomes) && outcomes.length > 0
      ? outcomes.map((o: any) => (typeof o === 'object' && o.id ? o.id : String(o))).filter(Boolean)
      : [`Memahami konsep dan konfigurasi dasar ${title}`, `Mampu mengoperasikan topologi pada Cisco Packet Tracer`];

    const outcomesYaml = outcomeItems
      .map((item) => `  - id: ${JSON.stringify(item)}\n    en: ${JSON.stringify(item)}`)
      .join('\n');

    const toolsYaml = Array.isArray(tools) && tools.length > 0
      ? tools.map((t: string) => `  - ${JSON.stringify(t)}`).join('\n')
      : `  - Cisco IOS\n  - Cisco Packet Tracer`;

    // 1. Tulis Berkas Kursus (src/content/courses/{courseSlug}.mdx)
    const courseContent = `---
title: ${JSON.stringify(title)}
titleEn: ${JSON.stringify(title)}
description: >-
  ${description || `Kursus komprehensif untuk mempelajari ${title} dari tingkat dasar hingga praktik laboratorium terapan.`}
descriptionEn: >-
  ${description || `Comprehensive course to learn ${title} from fundamentals to hands-on laboratory practice.`}
category: ${category}
level: ${level}
status: ${status}
cover: ${JSON.stringify(cover)}
publishedAt: ${existingPublishedAt}
updatedAt: ${today}
durationHours: ${Number(durationHours) || 6}
tools:
${toolsYaml}
outcomes:
${outcomesYaml}
---
Selamat datang di kursus **${title}**. Selesaikan seluruh modul materi dan praktik lab di bawah untuk menguasai kompetensi ini secara menyeluruh.
`;
    await fs.writeFile(courseFilePath, courseContent, 'utf-8');

    // 2. Tulis Berkas Overview (src/content/docs/{courseSlug}/index.mdx)
    const overviewFilePath = path.join(docsCourseDir, 'index.mdx');
    const defaultOverviewBody = `<Callout type="info" title="Selamat Datang di Kursus Ini!">
  Selamat datang di kursus **${title}**. Pelajari setiap bab materi secara bertahap, kerjakan kuis evaluasi, dan unduh berkas praktik Cisco Packet Tracer untuk mendapatkan poin XP serta menaikkan jenjang pangkat maritim Anda.
</Callout>

## Ringkasan Silabus
Kursus ini dirancang dengan kurikulum berbasis praktik teknis nyata. Setiap modul dilengkapi dengan teori terarah, contoh perintah terminal Cisco, serta evaluasi interaktif.

## Prasyarat Belajar
Pastikan Anda telah memasang aplikasi **Cisco Packet Tracer** di komputer Anda untuk menjalankan berkas-berkas praktik laboratorium yang disediakan di modul-modul berikutnya.
`;

    const cleanOverviewBody = overviewContent && overviewContent.trim()
      ? sanitizeMdxContent(overviewContent.trim())
      : defaultOverviewBody;

    const overviewFileContent = `---
title: ${JSON.stringify(`Pengantar: ${title}`)}
course: ${JSON.stringify(courseSlug)}
language: id
order: 0
durationMinutes: 5
description: ${JSON.stringify(`Pengantar dan silabus lengkap kursus ${title}.`)}
---
${cleanOverviewBody}
`;
    await fs.writeFile(overviewFilePath, overviewFileContent, 'utf-8');

    // 3. Kelola Modul
    const existingModuleFiles: string[] = [];
    try {
      const allModFiles = await fs.readdir(modulesDir);
      for (const mf of allModFiles) {
        if (!mf.endsWith('.md') && !mf.endsWith('.mdx')) continue;
        try {
          const raw = await fs.readFile(path.join(modulesDir, mf), 'utf-8');
          const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          if (m) {
            const p = yaml.parse(m[1]);
            if (p?.course === courseSlug) {
              existingModuleFiles.push(mf);
            }
          }
        } catch {}
      }
    } catch {}

    const keptModuleSlugs = new Set<string>();
    const moduleMapToSlug = new Map<string, string>();

    if (Array.isArray(modules) && modules.length > 0) {
      let modOrder = 1;
      for (const mod of modules) {
        const modTitle = String(mod.title || `Modul ${modOrder}`).trim();
        const modSlugPart = slugify(mod.slug || modTitle);
        let moduleFileSlug = mod.slug && mod.slug.startsWith(`${courseSlug}-`)
          ? mod.slug
          : `${courseSlug}-${String(modOrder).padStart(2, '0')}-${modSlugPart}`;

        moduleMapToSlug.set(String(mod.id || mod.slug), moduleFileSlug);
        keptModuleSlugs.add(`${moduleFileSlug}.mdx`);

        const moduleFilePath = path.join(modulesDir, `${moduleFileSlug}.mdx`);
        const moduleFileContent = `---
title: ${JSON.stringify(modTitle)}
titleEn: ${JSON.stringify(modTitle)}
course: ${JSON.stringify(courseSlug)}
order: ${modOrder}
description: ${JSON.stringify(`Pembahasan mengenai ${modTitle}.`)}
draft: false
---
Pendahuluan materi untuk ${modTitle}.
`;
        await fs.writeFile(moduleFilePath, moduleFileContent, 'utf-8');
        modOrder++;
      }
    }

    // Hapus berkas modul lama yang tidak lagi ada di daftar modul baru
    for (const oldMf of existingModuleFiles) {
      if (!keptModuleSlugs.has(oldMf) && !keptModuleSlugs.has(oldMf.replace(/\.md$/, '.mdx'))) {
        try {
          await fs.unlink(path.join(modulesDir, oldMf));
        } catch {}
      }
    }

    // 4. Kelola Berkas Materi / Lessons
    const existingLessonFiles: string[] = [];
    try {
      const allLesFiles = await fs.readdir(docsCourseDir);
      for (const lf of allLesFiles) {
        if (lf === 'index.mdx' || lf === 'index.md') continue;
        if (lf.endsWith('.md') || lf.endsWith('.mdx')) {
          existingLessonFiles.push(lf);
        }
      }
    } catch {}

    const keptLessonFiles = new Set<string>();

    if (Array.isArray(modules) && modules.length > 0) {
      let modOrder = 1;

      for (const mod of modules) {
        const modSlugKey = moduleMapToSlug.get(String(mod.id || mod.slug)) || `${courseSlug}-${String(modOrder).padStart(2, '0')}`;
        const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];

        let lesOrder = 1;
        for (const les of lessons) {
          const lesTitle = String(les.title || `Pelajaran ${lesOrder}`).trim();
          const lesSlugPart = slugify(les.slug || lesTitle);

          let targetFileName = les.fileName || '';
          if (!targetFileName || targetFileName === 'index.mdx' || (!targetFileName.endsWith('.mdx') && !targetFileName.endsWith('.md'))) {
            targetFileName = `${String(modOrder).padStart(2, '0')}-${String(lesOrder).padStart(2, '0')}-${lesSlugPart}.mdx`;
          }

          keptLessonFiles.add(targetFileName);
          const lessonFilePath = path.join(docsCourseDir, targetFileName);
          const lessonSlugNoExt = targetFileName.replace(/\.mdx$/, '').replace(/\.md$/, '');

          const lesType = les.type || 'theory';
          const lesXp = Number(les.xp) || (lesType === 'pkt_lab' ? 40 : lesType === 'quiz' ? 25 : 15);
          const lesDuration = Number(les.durationMinutes) || (lesType === 'pkt_lab' ? 30 : lesType === 'quiz' ? 15 : 10);

          let lessonBody = '';

          if (lesType === 'pkt_lab') {
            const pktUrl = String(les.pktUrl || les.driveUrl || '').trim();
            let fileName = String(les.fileName || `${courseSlug}-${lesSlugPart}.pkt`).trim();
            if (!fileName.toLowerCase().endsWith('.pkt') && !fileName.toLowerCase().endsWith('.pka')) {
              fileName += '.pkt';
            }

            const pdfUrl = String(les.pdfUrl || '').trim();
            let pdfFileName = String(les.pdfFileName || `${courseSlug}-${lesSlugPart}-panduan.pdf`).trim();
            if (!pdfFileName.toLowerCase().endsWith('.pdf')) {
              pdfFileName += '.pdf';
            }

            const customInstructions = les.content && les.content.trim() ? `${sanitizeMdxContent(les.content.trim())}\n\n` : '';
            const tasks = Array.isArray(les.tasks) && les.tasks.length > 0 ? les.tasks : [];
            const tasksAttr = tasks.length > 0 ? `\n  tasks={${JSON.stringify(tasks)}}` : '';
            const pdfAttr = pdfUrl ? `\n  pdfUrl=${JSON.stringify(pdfUrl)}\n  pdfFileName=${JSON.stringify(pdfFileName)}` : '';

            lessonBody = `${customInstructions}<PacketTracerLab
  activityId=${JSON.stringify(`lab-${courseSlug}-${lessonSlugNoExt}`)}
  courseSlug=${JSON.stringify(courseSlug)}
  lessonId=${JSON.stringify(lessonSlugNoExt)}
  title=${JSON.stringify(lesTitle)}
  pktUrl=${JSON.stringify(pktUrl)}
  fileName=${JSON.stringify(fileName)}${pdfAttr}${tasksAttr}
  durationMinutes={${lesDuration}}
  xp={${lesXp}}
/>
`;
          } else if (lesType === 'quiz') {
            const questionsList = Array.isArray(les.quizQuestions) && les.quizQuestions.length > 0
              ? les.quizQuestions
              : [
                  {
                    question: les.question || `Pertanyaan evaluasi pemahaman untuk materi ${lesTitle}?`,
                    options: Array.isArray(les.options) && les.options.length >= 2 ? les.options : [
                      'Jawaban A (Kunci Benar)',
                      'Jawaban B (Pilihan Pengecoh)',
                      'Jawaban C (Pilihan Pengecoh)',
                      'Jawaban D (Pilihan Pengecoh)'
                    ],
                    correctIndex: Number(les.correctIndex) || 0,
                    explanation: les.explanation || 'Pembahasan teknis jawaban yang benar.'
                  }
                ];

            const questionsJson = JSON.stringify(questionsList, null, 2);
            const introQuiz = les.content && les.content.trim() ? `${les.content.trim()}\n\n` : 'Uji pemahaman Anda mengenai materi pada bab ini dengan menjawab kuis evaluasi di bawah.\n\n';

            lessonBody = `${introQuiz}<LessonQuiz
  activityId=${JSON.stringify(`quiz-${courseSlug}-${lessonSlugNoExt}`)}
  courseSlug=${JSON.stringify(courseSlug)}
  lessonId=${JSON.stringify(lessonSlugNoExt)}
  passingScore={${Number(les.passingScore) || 67}}
  xp={${lesXp}}
  questions={${questionsJson}}
/>
`;
          } else {
            lessonBody = les.content && les.content.trim() ? les.content.trim() : `
<Callout type="info" title="Tujuan Pembelajaran">
  Materi ini membahas konsep dan konfigurasi dasar mengenai ${lesTitle}.
</Callout>

## Ringkasan Materi
Dokumentasi teknis untuk materi ${lesTitle}.
`;
          }

          const sanitizedBody = sanitizeMdxContent(lessonBody);
          const lessonContent = `---
title: ${JSON.stringify(lesTitle)}
course: ${JSON.stringify(courseSlug)}
module: ${JSON.stringify(modSlugKey)}
order: ${lesOrder}
durationMinutes: ${lesDuration}
language: id
description: ${JSON.stringify(`Materi pelajaran mengenai ${lesTitle}.`)}
---
${sanitizedBody}
`;
          await fs.writeFile(lessonFilePath, lessonContent, 'utf-8');
          lesOrder++;
        }
        modOrder++;
      }
    }

    // Hapus materi lama yang dibuang admin
    for (const oldLf of existingLessonFiles) {
      if (!keptLessonFiles.has(oldLf)) {
        try {
          await fs.unlink(path.join(docsCourseDir, oldLf));
        } catch {}
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Kursus '${title}' dan seluruh materinya berhasil diperbarui.`,
        courseSlug,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Error saat memperbarui kursus:', err);
    return new Response(
      JSON.stringify({ error: `Gagal memperbarui kursus: ${err.message || 'Terjadi kesalahan sistem'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
