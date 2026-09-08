export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'yaml';
import { createSupabaseServerClient } from '../../../../lib/supabase';

const VALID_STATUSES = ['draft', 'planned', 'published', 'archived'] as const;
type CourseStatus = typeof VALID_STATUSES[number];

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const user = locals.user;
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Hanya administrator yang diizinkan mengubah status kursus.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { slug, status } = body;

    if (!slug || typeof slug !== 'string') {
      return new Response(JSON.stringify({ error: 'Parameter slug kursus wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!status || !VALID_STATUSES.includes(status as CourseStatus)) {
      return new Response(
        JSON.stringify({ error: `Status tidak valid. Pilihan yang diizinkan: ${VALID_STATUSES.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const coursesDir = path.join(process.cwd(), 'src', 'content', 'courses');
    let filePath = path.join(coursesDir, `${slug}.mdx`);

    try {
      await fs.access(filePath);
    } catch {
      filePath = path.join(coursesDir, `${slug}.md`);
      try {
        await fs.access(filePath);
      } catch {
        return new Response(JSON.stringify({ error: `Berkas kursus dengan slug '${slug}' tidak ditemukan.` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const frontmatterMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---([\s\S]*)$/);

    if (!frontmatterMatch) {
      return new Response(JSON.stringify({ error: 'Format frontmatter kursus tidak valid.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const frontmatterRaw = frontmatterMatch[1];
    const markdownBody = frontmatterMatch[2];

    const data = yaml.parse(frontmatterRaw) || {};
    const oldStatus = data.status;
    data.status = status;
    data.updatedAt = new Date().toISOString().split('T')[0];

    const newFrontmatter = yaml.stringify(data).trim();
    const newContent = `---\n${newFrontmatter}\n---${markdownBody}`;

    await fs.writeFile(filePath, newContent, 'utf-8');

    // Catat ke log audit Supabase
    const supabase = createSupabaseServerClient({ request, cookies });
    if (supabase) {
      try {
        await supabase.from('admin_audit_logs').insert({
          admin_id: user.id,
          action: 'UPDATE_COURSE_STATUS',
          target_type: 'course',
          target_id: slug,
          details: {
            title: data.title,
            old_status: oldStatus,
            new_status: status,
          },
        });
      } catch (err) {
        console.error('Gagal mencatat audit log status kursus:', err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        slug,
        status,
        message: `Status kursus '${data.title || slug}' berhasil diubah menjadi ${status}.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error updating course status:', err);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan pada server saat memperbarui status.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
