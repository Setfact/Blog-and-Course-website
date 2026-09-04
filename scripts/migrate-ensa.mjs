import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// One-time importer. Menjalankan ulang script ini akan menimpa file ENSA yang
// sudah diedit melalui CMS. Gunakan hanya ketika sengaja melakukan re-import.

const sourceDirectory = '/home/ngonfigdeks/Documents/Obsidian/01-Network/CCNA/ENSA';
const projectRoot = process.cwd();
const courseSlug = 'enterprise-network-ensa';
const courseDirectory = path.join(projectRoot, 'src/content/courses');
const moduleDirectory = path.join(projectRoot, 'src/content/modules');
const lessonDirectory = path.join(projectRoot, 'src/content/docs', courseSlug);

const slugify = (value) => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 72);

const yamlString = (value) => JSON.stringify(value);

const stripMarkdown = (value) => value
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/[*_`>#]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const getDescription = (lines, fallback) => {
  for (const line of lines.slice(1)) {
    const text = line.trim();
    if (!text || text.startsWith('#') || text.startsWith('![') || text.startsWith('>') || text.startsWith('- ') || text.startsWith('```') || text === '---') continue;
    const description = stripMarkdown(text);
    if (description.length >= 30) return description.slice(0, 180);
  }
  return `Pelajari ${fallback} dalam konteks enterprise network berbasis Cisco.`;
};

const transformContent = (lines, title, sourceUrl, moduleNumber) => {
  const output = [`# ${title}`, ''];
  let inFence = false;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    const callout = line.match(/^> \[!(info|warning|success|video)\](?:\s+(.*))?$/i);

    if (callout) {
      const typeMap = { info: 'remember', warning: 'warning', success: 'success', video: 'info' };
      const titleMap = { info: 'Catatan', warning: 'Perhatian', success: 'Ringkasan', video: 'Video referensi' };
      const sourceType = callout[1].toLowerCase();
      const calloutTitle = callout[2]?.trim() || titleMap[sourceType];
      const body = [];

      while (index + 1 < lines.length && /^>/.test(lines[index + 1])) {
        index += 1;
        body.push(lines[index].replace(/^> ?/, ''));
      }

      output.push(`<Callout type="${typeMap[sourceType]}" title={${yamlString(calloutTitle)}}>`, ...body, '</Callout>', '');
      continue;
    }

    if (/^```/.test(line)) {
      if (!inFence) {
        const language = line.slice(3).trim().toLowerCase();
        output.push(`\`\`\`${language === 'cmd' || language === 'out' || language === '' ? 'text' : language}`);
        inFence = true;
      } else {
        output.push('```');
        inFence = false;
      }
      continue;
    }

    // MDX membaca simbol kurang-dari diikuti angka sebagai awal JSX.
    output.push(line.replace(/<(?=\d)/g, '&lt;'));
  }

  if (inFence) output.push('```');
  output.push('', '## Sumber materi', '', `Materi awal diadaptasi dari catatan ENSA Modul ${moduleNumber}: [referensi sumber](${sourceUrl}).`, '');
  return output.join('\n').replace(/\n{4,}/g, '\n\n\n');
};

const parseSource = async (filename) => {
  const raw = await readFile(path.join(sourceDirectory, filename), 'utf8');
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) throw new Error(`Frontmatter tidak ditemukan: ${filename}`);

  const frontmatter = frontmatterMatch[1];
  const moduleNumber = Number(frontmatter.match(/^module:\s*(\d+)$/m)?.[1]);
  const moduleTitle = frontmatter.match(/^module_title:\s*(.+)$/m)?.[1]?.trim();
  const sourceUrl = frontmatter.match(/^source:\s*(.+)$/m)?.[1]?.trim();
  if (!moduleNumber || !moduleTitle || !sourceUrl) throw new Error(`Metadata ENSA tidak lengkap: ${filename}`);

  const body = raw.slice(frontmatterMatch[0].length);
  const lines = body.split(/\r?\n/);
  const starts = [];
  lines.forEach((line, index) => {
    const match = line.match(/^# (\d+)\.(\d+)\s+(.+)$/);
    if (match) starts.push({ index, section: Number(match[2]), title: match[3].trim() });
  });
  if (starts.length === 0) throw new Error(`Bagian lesson tidak ditemukan: ${filename}`);

  const sections = starts.map((start, index) => {
    const end = starts[index + 1]?.index ?? lines.length;
    const sectionLines = lines.slice(start.index, end);
    return {
      section: start.section,
      title: start.title,
      lines: sectionLines,
      description: getDescription(sectionLines, start.title),
      wordCount: sectionLines.join(' ').split(/\s+/).filter(Boolean).length,
    };
  });

  return { moduleNumber, moduleTitle, sourceUrl, sections };
};

await mkdir(courseDirectory, { recursive: true });
await mkdir(moduleDirectory, { recursive: true });
await mkdir(lessonDirectory, { recursive: true });

const sourceFiles = (await readdir(sourceDirectory)).filter((filename) => filename.endsWith('.md'));
const modules = (await Promise.all(sourceFiles.map(parseSource))).sort((a, b) => a.moduleNumber - b.moduleNumber);

const totalWords = modules.flatMap((module) => module.sections).reduce((total, section) => total + section.wordCount, 0);
const totalLessons = modules.reduce((total, module) => total + module.sections.length, 0);
let lessonOrder = 1;

const courseOverview = `---
title: Enterprise Networking, Security, and Automation (ENSA)
titleEn: Enterprise Networking, Security, and Automation (ENSA)
description: Bangun kemampuan enterprise networking melalui OSPF, ACL, NAT, WAN, VPN, QoS, network management, troubleshooting, virtualization, dan automation.
descriptionEn: Build enterprise networking skills across OSPF, ACLs, NAT, WAN, VPN, QoS, network management, troubleshooting, virtualization, and automation.
category: networking
level: intermediate
status: published
publishedAt: 2026-09-02
updatedAt: 2026-09-02
durationHours: 35
tools: [Cisco IOS, Cisco Packet Tracer, Wireshark, REST API]
outcomes:
  - { id: Mengonfigurasi dan memverifikasi single-area OSPFv2, en: Configure and verify single-area OSPFv2 }
  - { id: Merancang dan menerapkan IPv4 ACL serta NAT, en: Design and implement IPv4 ACLs and NAT }
  - { id: Menjelaskan pilihan WAN VPN IPsec dan QoS, en: Explain WAN VPN IPsec and QoS options }
  - { id: Mengelola dan melakukan troubleshooting enterprise network, en: Manage and troubleshoot an enterprise network }
  - { id: Memahami virtualization SDN API dan network automation, en: Understand virtualization SDN APIs and network automation }
projectTitle: Enterprise Branch Network Capstone
projectDescription: Rancang, amankan, operasikan, dan dokumentasikan jaringan kantor pusat serta cabang dengan routing dinamis, policy, monitoring, dan automation dasar.
---

Course ENSA membawa kamu dari routing enterprise sampai automation melalui ${modules.length} modul dan ${totalLessons} lesson terstruktur.

Materi membahas OSPF, security, ACL, NAT, WAN, VPN, QoS, network management, design, troubleshooting, virtualization, dan automation. Gunakan Cisco Packet Tracer atau lab IOS yang setara untuk mempraktikkan bagian konfigurasi.
`;

await writeFile(path.join(courseDirectory, `${courseSlug}.mdx`), courseOverview, 'utf8');

const overviewFrontmatter = `---
title: Enterprise Networking, Security, and Automation
language: id
draft: false
description: Course ENSA terstruktur dari OSPF hingga network automation untuk membangun kemampuan enterprise network yang siap dipraktikkan.
order: 0
course: ${courseSlug}
durationMinutes: 8
---

# Enterprise Networking, Security, and Automation

Course ini memuat ${modules.length} modul dan ${totalLessons} lesson yang diadaptasi dari catatan belajar CCNA ENSA v7 milikmu.

## Kompetensi utama

- membangun routing single-area OSPFv2
- menerapkan ACL dan NAT pada router edge
- memahami WAN, VPN, IPsec, dan QoS
- mengoperasikan serta melakukan troubleshooting enterprise network
- memahami network virtualization dan automation

## Cara belajar

Ikuti lesson secara berurutan. Praktikkan command pada Cisco Packet Tracer atau lab IOS, simpan evidence verifikasi, dan tulis temuan troubleshooting pada setiap modul.

<PracticeCTA
  title="Mulai dari konsep OSPF"
  description="Pelajari cara kerja link-state routing sebelum masuk ke konfigurasi single-area OSPFv2."
  href="/learn/${courseSlug}/01-00-introduction"
  label="Mulai Lesson Pertama"
/>
`;

await writeFile(path.join(lessonDirectory, 'index.mdx'), overviewFrontmatter, 'utf8');

for (const module of modules) {
  const modulePrefix = String(module.moduleNumber).padStart(2, '0');
  const moduleSlug = `ensa-${modulePrefix}-${slugify(module.moduleTitle)}`;
  const moduleDescription = module.sections.find((section) => section.section === 0)?.description
    ?? `Pelajari ${module.moduleTitle} dalam konteks enterprise network.`;
  const moduleFile = `---
title: ${yamlString(module.moduleTitle)}
titleEn: ${yamlString(module.moduleTitle)}
course: ${courseSlug}
order: ${module.moduleNumber}
description: ${yamlString(moduleDescription)}
draft: false
---

Modul ${module.moduleNumber} ENSA membahas ${module.moduleTitle}.
`;
  await writeFile(path.join(moduleDirectory, `${moduleSlug}.mdx`), moduleFile, 'utf8');

  for (const section of module.sections) {
    const sectionPrefix = String(section.section).padStart(2, '0');
    const lessonSlug = `${modulePrefix}-${sectionPrefix}-${slugify(section.title)}`;
    const durationMinutes = Math.max(6, Math.ceil(section.wordCount / 170) + 4);
    const lessonContent = transformContent(section.lines, section.title, module.sourceUrl, module.moduleNumber);
    const frontmatter = `---
title: ${yamlString(section.title)}
language: id
draft: false
description: ${yamlString(section.description)}
order: ${lessonOrder}
course: ${courseSlug}
module: ${moduleSlug}
durationMinutes: ${durationMinutes}
---

`;
    await writeFile(path.join(lessonDirectory, `${lessonSlug}.mdx`), frontmatter + lessonContent, 'utf8');
    lessonOrder += 1;
  }
}

console.log(`Migrasi ENSA selesai: ${modules.length} module, ${totalLessons} lesson, ${totalWords} kata.`);
