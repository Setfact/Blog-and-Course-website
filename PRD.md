# Product Requirements Document (PRD)

**Project Name:** Phinisi Network (E-Learning & Technical Blog)

## Tech Stack
- Astro
- Fumadocs
- Tailwind CSS v4
- TypeScript

## Target UI/UX
Clean, modern technical documentation & learning platform ala Network Academy (tanpa emotikon).

## Core Architecture & Navigation

### Global Header Navbar
- Logo 'Phinisi Network'
- Link menu (Courses, Documentation, Blog)
- Search Bar
- Tombol Sign In & Sign Up

### Home (/)
- Hero section dengan ilustrasi diagram jaringan, headline 'Learn Networking for Free', tombol CTA ('All courses', 'All learning paths')
- 3 grid fitur pendukung ('We stay human', 'Learning by example', 'Structured paths')

### Courses Catalog (/courses)
- Grid 4-kolom berisi kartu kursus (Subnetting, IPv6, OSPF, Linux, Automation)
- Lengkap dengan thumbnail, badge kategori (CCNA/LINUX/AUTOMATION), judul, dan jumlah pelajaran

### Technical Blog (/blog)
- Header dengan filter tag ('All', 'Sysadmin', 'Automation', 'Networking')
- Bento-style Featured Post Card paling atas
- 3-column Grid untuk artikel biasa

### Documentation (/docs)
- Fumadocs MDX engine
- Sidebar modul di kiri
- Table of Contents (ToC) di kanan
