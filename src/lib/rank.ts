export interface DownloadableAsset {
  name: string;
  type: string;
  description: string;
  href?: string;
}

export interface RankTier {
  id: string;
  name: string;
  title: string;
  minXp: number;
  maxXp: number;
  icon: string;
  badgeColor: string;
  nextTierName: string | null;
  progressPercent: number;
  remainingXp: number;
  perks: string[];
  downloadableAssets?: DownloadableAsset[];
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'ikan-badut',
    name: 'Ikan Badut (Clownfish)',
    description: 'Menyelesaikan modul materi atau aktivitas lab pertama di terumbu karang Phinisi.',
    icon: 'flag',
  },
  {
    id: 'ikan-buntal',
    name: 'Ikan Buntal (Pufferfish)',
    description: 'Menyelesaikan modul dasar Network Security & pertahanan sistem.',
    icon: 'security',
  },
  {
    id: 'benteng-karang',
    name: 'Benteng Karang Buntal',
    description: 'Menyelesaikan minimal 5 materi keamanan dan hardening jaringan.',
    icon: 'shield',
  },
  {
    id: 'pari-manta',
    name: 'Pari Manta (Manta Ray)',
    description: 'Belajar berturut-turut selama minimal 3 hari tanpa terputus.',
    icon: 'local_fire_department',
  },
  {
    id: 'ikan-pedang',
    name: 'Ikan Pedang (Swordfish)',
    description: 'Menguasai konsep routing dinamis dan switching fundamental.',
    icon: 'hub',
  },
  {
    id: 'lumba-lumba',
    name: 'Lumba-Lumba (Dolphin)',
    description: 'Memberikan jawaban yang ditandai sebagai Solusi Terbaik di komunitas (+50 XP).',
    icon: 'verified',
  },
  {
    id: 'kuda-laut',
    name: 'Kuda Laut (Seahorse)',
    description: 'Lulus evaluasi kuis modul interaktif dengan nilai sempurna 100%.',
    icon: 'psychology',
  },
  {
    id: 'mutiara-kraken',
    name: 'Mutiara Kraken (Kraken\'s Pearl)',
    description: 'Menyelesaikan seluruh materi dalam 1 kursus penuh (+100 XP Milestone).',
    icon: 'workspace_premium',
  },
  {
    id: 'taring-megalodon',
    name: 'Taring Megalodon (Apex Predator)',
    description: 'Mencapai pangkat kehormatan Ikan Hiu Megalodon (900+ XP).',
    icon: 'military_tech',
  },
];

export const TIERS = [
  {
    id: 'teri',
    name: 'Ikan Teri',
    title: 'Penyelam Pemula Pesisir',
    minXp: 0,
    maxXp: 150,
    icon: 'phishing',
    badgeColor: '#64748b',
    perks: [
      'Akses seluruh katalog materi teori dasar & dokumentasi',
      'Hak bertanya dan membuat topik diskusi di Komunitas Siswa',
      'Pencatatan statistik belajar harian & streak personal',
    ],
    downloadableAssets: [],
  },
  {
    id: 'tenggiri',
    name: 'Ikan Tenggiri',
    title: 'Perenang Cepat Samudra',
    minXp: 150,
    maxXp: 400,
    icon: 'sailing',
    badgeColor: '#0284c7',
    perks: [
      'Lencana Pangkat Ikan Tenggiri di profil dan forum komunitas',
      'Akses kuis interaktif berhadiah XP di setiap akhir materi',
      'Akses unduh Cheat Sheet Subnetting IPv4/IPv6 & Wildcard Mask PDF',
      '1x Token Streak Freeze untuk proteksi konsistensi belajar',
    ],
    downloadableAssets: [
      {
        name: 'Cheat Sheet Subnetting IPv4/IPv6 & Wildcard Mask',
        type: 'PDF',
        description: 'Tabel cepat perhitungan CIDR, subnet mask, usable host, dan wildcard mask.',
        href: '#',
      },
    ],
  },
  {
    id: 'barakuda',
    name: 'Ikan Barakuda',
    title: 'Pengintai Tangkas Karang',
    minXp: 400,
    maxXp: 900,
    icon: 'radar',
    badgeColor: '#d97706',
    perks: [
      'Lencana Pangkat Emas Barakuda di samping nama komunitas',
      'Membuka akses modul Lab Studi Kasus Menengah (VLAN & OSPF Single-Area)',
      'Akses unduh paket file topologi Cisco Packet Tracer (.pkt)',
      'Kelayakan masuk jajaran Top 5 Papan Peringkat Mingguan',
    ],
    downloadableAssets: [
      {
        name: 'Starter Topology Bundle (.pkt & YAML)',
        type: 'ZIP',
        description: 'Topologi lab Packet Tracer untuk lab switching dan OSPF dinamis.',
        href: '#',
      },
    ],
  },
  {
    id: 'megalodon',
    name: 'Ikan Hiu Megalodon',
    title: 'Predator Puncak Jaringan',
    minXp: 900,
    maxXp: 1800,
    icon: 'shield',
    badgeColor: '#1d4ed8',
    perks: [
      'Gelar kehormatan Hiu Megalodon di seluruh forum komunitas',
      'Membuka modul Lab Troubleshooting Enterprise & Skenario ACL Hardening',
      'Akses unduh Automation Python Starter Kit (Netmiko & RESTCONF script)',
      'Hak mengklaim Sertifikat Kelulusan Resmi Terverifikasi dengan QR Code',
      'Hak memberikan rekomendasi solusi teknis di komunitas',
    ],
    downloadableAssets: [
      {
        name: 'NetDevOps Python Automation Scripts',
        type: 'PY/ZIP',
        description: 'Kumpulan skrip Python otomatisasi backup config & audit interface Cisco IOS.',
        href: '#',
      },
    ],
  },
  {
    id: 'paus-biru',
    name: 'Paus Biru',
    title: 'Raksasa Penjaga Samudra',
    minXp: 1800,
    maxXp: 3000,
    icon: 'tsunami',
    badgeColor: '#059669',
    perks: [
      'Bingkai avatar kehormatan Samudra Emas di feed komunitas',
      'Membuka Skenario Insiden Darurat (Black Box Enterprise Simulation)',
      'Hak menyandang status resmi Mentor Komunitas',
      'Tautan Portofolio Publik Terverifikasi (/u/[id]) untuk resume & LinkedIn',
      'Prioritas peninjauan submission lab dan konsultasi teknis',
    ],
    downloadableAssets: [
      {
        name: 'Enterprise Multi-Area Lab Architecture Guide',
        type: 'PDF',
        description: 'Panduan desain arsitektur jaringan enterprise redundan berstandar industri.',
        href: '#',
      },
    ],
  },
  {
    id: 'kraken',
    name: 'Sang Kraken',
    title: 'Penguasa Palung Terdalam',
    minXp: 3000,
    maxXp: Infinity,
    icon: 'cyclone',
    badgeColor: '#7c3aed',
    perks: [
      'Pangkat kehormatan tertinggi seumur hidup Penguasa Palung Samudra',
      'Lencana Mahkota Kraken pada seluruh forum & papan peringkat',
      'Akses tak terbatas ke seluruh modul masterclass dan materi masa depan',
      'Spotlight profil khusus pada Hall of Fame Phinisi Learn',
    ],
    downloadableAssets: [],
  },
];

export const getRankTier = (xp: number): RankTier => {
  const safeXp = Math.max(0, xp || 0);

  for (let i = 0; i < TIERS.length; i++) {
    const tier = TIERS[i];
    const isHighest = i === TIERS.length - 1;

    if (safeXp < tier.maxXp || isHighest) {
      const nextTier = isHighest ? null : TIERS[i + 1];
      const tierRange = isHighest ? 1 : tier.maxXp - tier.minXp;
      const progressInTier = safeXp - tier.minXp;
      const progressPercent = isHighest
        ? 100
        : Math.min(100, Math.max(0, Math.round((progressInTier / tierRange) * 100)));
      const remainingXp = isHighest ? 0 : tier.maxXp - safeXp;

      return {
        id: tier.id,
        name: tier.name,
        title: tier.title,
        minXp: tier.minXp,
        maxXp: tier.maxXp,
        icon: tier.icon,
        badgeColor: tier.badgeColor,
        nextTierName: nextTier ? nextTier.name : null,
        progressPercent,
        remainingXp,
        perks: tier.perks,
        downloadableAssets: tier.downloadableAssets,
      };
    }
  }

  return {
    id: TIERS[0].id,
    name: TIERS[0].name,
    title: TIERS[0].title,
    minXp: 0,
    maxXp: 150,
    icon: TIERS[0].icon,
    badgeColor: TIERS[0].badgeColor,
    nextTierName: TIERS[1].name,
    progressPercent: 0,
    remainingXp: 150,
    perks: TIERS[0].perks,
    downloadableAssets: [],
  };
};
