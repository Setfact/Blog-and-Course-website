export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

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
    return new Response(JSON.stringify({ error: 'Hanya administrator yang diizinkan membuat kursus.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const {
      title,
      category = 'networking',
      level = 'beginner',
      durationHours = 6,
      description = '',
      cover = '/images/courses/security-fundamentals.webp',
      tools = ['Cisco IOS', 'Cisco Packet Tracer'],
      outcomes = [],
      status = 'draft',
      overviewTitle,
      overviewDuration = 5,
      overviewContent,
      modules = [],
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Judul kursus wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const courseSlug = slugify(body.slug || title);
    if (!courseSlug) {
      return new Response(JSON.stringify({ error: 'Slug kursus tidak valid.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const projectRoot = process.cwd();
    const coursesDir = path.join(projectRoot, 'src', 'content', 'courses');
    const modulesDir = path.join(projectRoot, 'src', 'content', 'modules');
    const docsCourseDir = path.join(projectRoot, 'src', 'content', 'docs', courseSlug);

    // Pastikan folder-folder penampung ada
    await fs.mkdir(coursesDir, { recursive: true });
    await fs.mkdir(modulesDir, { recursive: true });
    await fs.mkdir(docsCourseDir, { recursive: true });

    const courseFilePath = path.join(coursesDir, `${courseSlug}.mdx`);

    // Periksa apakah kursus dengan slug ini sudah ada
    try {
      await fs.access(courseFilePath);
      return new Response(
        JSON.stringify({ error: `Kursus dengan slug '${courseSlug}' sudah ada. Gunakan judul atau slug lain.` }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    } catch {
      // Belum ada, lanjutkan
    }

    const today = new Date().toISOString().split('T')[0];

    // Format outcomes array
    const outcomeItems: string[] = Array.isArray(outcomes) && outcomes.length > 0
      ? outcomes.filter((o: string) => Boolean(o && o.trim()))
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
publishedAt: ${today}
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

    // 2. Tulis Berkas Overview Lesson (src/content/docs/{courseSlug}/index.mdx)
    // PENTING: Jangan berikan properti module pada overview agar sistem mengenali sebagai root course player
    const overviewFilePath = path.join(docsCourseDir, 'index.mdx');
    const finalOverviewTitle = overviewTitle && String(overviewTitle).trim() ? String(overviewTitle).trim() : `Pengantar: ${title}`;
    const finalOverviewDuration = Number(overviewDuration) || 5;
    let finalOverviewBody = overviewContent && String(overviewContent).trim()
      ? sanitizeMdxContent(String(overviewContent).trim())
      : `<Callout type="info" title="Selamat Datang di Kursus Ini!">
  Selamat datang di kursus **${title}**. Pelajari setiap bab materi secara bertahap, kerjakan kuis evaluasi, dan unduh berkas praktik Cisco Packet Tracer untuk mendapatkan poin XP serta menaikkan jenjang pangkat maritim Anda.
</Callout>

## Ringkasan Silabus
Kursus ini dirancang dengan kurikulum berbasis praktik teknis nyata. Setiap modul dilengkapi dengan teori terarah, contoh perintah terminal Cisco, serta evaluasi interaktif.

## Prasyarat Belajar
Pastikan Anda telah memasang aplikasi **Cisco Packet Tracer** di komputer Anda untuk menjalankan berkas-berkas praktik laboratorium yang disediakan di modul-modul berikutnya.`;

    const finalOverviewFileContent = `---
title: ${JSON.stringify(finalOverviewTitle)}
course: ${JSON.stringify(courseSlug)}
language: id
order: 0
durationMinutes: ${finalOverviewDuration}
description: ${JSON.stringify(`Pengantar dan silabus lengkap kursus ${title}.`)}
---
${finalOverviewBody}
`;

    await fs.writeFile(overviewFilePath, finalOverviewFileContent, 'utf-8');

    let totalLessonsCreated = 1; // Termasuk overview

    // 3. Proses Modul dan Pelajaran jika diisi oleh Admin
    if (Array.isArray(modules) && modules.length > 0) {
      let moduleOrderCounter = 1;

      for (const mod of modules) {
        const modTitle = String(mod.title || `Modul ${moduleOrderCounter}`).trim();
        const modSlugPart = slugify(mod.slug || modTitle);
        const moduleFileSlug = `${courseSlug}-${String(moduleOrderCounter).padStart(2, '0')}-${modSlugPart}`;
        const moduleFilePath = path.join(modulesDir, `${moduleFileSlug}.mdx`);

        // Tulis Berkas Modul
        const moduleContent = `---
title: ${JSON.stringify(modTitle)}
titleEn: ${JSON.stringify(modTitle)}
course: ${JSON.stringify(courseSlug)}
order: ${moduleOrderCounter}
description: ${JSON.stringify(`Pembahasan mengenai ${modTitle}.`)}
draft: false
---
Pendahuluan materi untuk ${modTitle}.
`;
        await fs.writeFile(moduleFilePath, moduleContent, 'utf-8');

        // Tulis Pelajaran-Pelajaran di dalam Modul Ini
        if (Array.isArray(mod.lessons) && mod.lessons.length > 0) {
          let lessonOrderCounter = 1;

          for (const les of mod.lessons) {
            const lesTitle = String(les.title || `Pelajaran ${lessonOrderCounter}`).trim();
            const lesSlugPart = slugify(les.slug || lesTitle);
            const lessonFileName = `${String(moduleOrderCounter).padStart(2, '0')}-${String(lessonOrderCounter).padStart(2, '0')}-${lesSlugPart}.mdx`;
            const lessonFilePath = path.join(docsCourseDir, lessonFileName);
            const lessonSlugNoExt = lessonFileName.replace(/\.mdx$/, '');

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

              lessonBody = `
${customInstructions}<PacketTracerLab
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

              lessonBody = `
${introQuiz}<LessonQuiz
  activityId=${JSON.stringify(`quiz-${courseSlug}-${lessonSlugNoExt}`)}
  courseSlug=${JSON.stringify(courseSlug)}
  lessonId=${JSON.stringify(lessonSlugNoExt)}
  passingScore={${Number(les.passingScore) || 67}}
  xp={${lesXp}}
  questions={${questionsJson}}
/>
`;
            } else {
              // Materi Teori: Simpan langsung teks Markdown yang dipaste atau ditulis admin
              if (les.content && les.content.trim()) {
                lessonBody = les.content.trim();
              } else {
                lessonBody = `
<Callout type="info" title="Tujuan Pembelajaran">
  Materi ini membahas konsep dan konfigurasi dasar mengenai ${lesTitle}.
</Callout>

## Ringkasan Materi
Dokumentasi teknis untuk materi ${lesTitle}.
`;
              }
            }

            const sanitizedBody = sanitizeMdxContent(lessonBody);
            const lessonContent = `---
title: ${JSON.stringify(lesTitle)}
course: ${JSON.stringify(courseSlug)}
module: ${JSON.stringify(moduleFileSlug)}
order: ${lessonOrderCounter}
durationMinutes: ${lesDuration}
language: id
description: ${JSON.stringify(`Materi pelajaran mengenai ${lesTitle}.`)}
---
${sanitizedBody}
`;
            await fs.writeFile(lessonFilePath, lessonContent, 'utf-8');
            totalLessonsCreated++;
            lessonOrderCounter++;
          }
        }

        moduleOrderCounter++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        courseSlug,
        title,
        totalLessonsCreated,
        keystaticUrl: `/keystatic/collection/courses/item/${courseSlug}`,
        previewUrl: `/courses/${courseSlug}`,
        learnUrl: `/learn/${courseSlug}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Error saat membuat kursus:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan sistem saat menyusun berkas kursus.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
