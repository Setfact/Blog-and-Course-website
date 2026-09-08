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
    id: 'langkah-pertama',
    name: 'First Step',
    description: 'Menyelesaikan modul materi atau aktivitas lab pertama.',
    icon: 'flag',
  },
  {
    id: 'security-starter',
    name: 'Security Starter',
    description: 'Menyelesaikan modul dasar Network Security.',
    icon: 'security',
  },
  {
    id: 'security-guardian',
    name: 'Fortress Guardian',
    description: 'Menyelesaikan 5 materi keamanan jaringan.',
    icon: 'shield',
  },
  {
    id: 'streak-3',
    name: 'Consistency Flame',
    description: 'Belajar berturut-turut selama minimal 3 hari.',
    icon: 'local_fire_department',
  },
  {
    id: 'ccna-explorer',
    name: 'CCNA Explorer',
    description: 'Mempelajari konsep routing dan switching fundamental.',
    icon: 'hub',
  },
  {
    id: 'community-solver',
    name: 'Community Solver',
    description: 'Memberikan jawaban yang ditandai sebagai Solusi Terbaik (+50 XP).',
    icon: 'verified',
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Lulus kuis modul interaktif dengan nilai sempurna 100%.',
    icon: 'psychology',
  },
  {
    id: 'course-finisher',
    name: 'Course Finisher',
    description: 'Menyelesaikan seluruh lesson dalam 1 kursus penuh (+100 XP Milestone).',
    icon: 'school',
  },
  {
    id: 'fleet-commander-badge',
    name: 'Fleet Commander Honor',
    description: 'Mencapai pangkat kehormatan Fleet Commander (900+ XP).',
    icon: 'military_tech',
  },
];

export const TIERS = [
  {
    id: 'deck-cadet',
    name: 'Deck Cadet',
    title: 'Novice Ocean Voyager',
    minXp: 0,
    maxXp: 150,
    icon: 'directions_boat',
    badgeColor: '#64748b',
    perks: [
      'Akses seluruh katalog materi teori dasar & dokumentasi',
      'Hak bertanya dan membuat topik diskusi di Komunitas',
      'Pencatatan statistik belajar harian & streak personal',
    ],
    downloadableAssets: [],
  },
  {
    id: 'network-helmsman',
    name: 'Network Helmsman',
    title: 'Topology Navigator',
    minXp: 150,
    maxXp: 400,
    icon: 'explore',
    badgeColor: '#0284c7',
    perks: [
      'Lencana Pangkat Network Helmsman di profil dan forum komunitas',
      'Akses kuis interaktif berhadiah XP di setiap akhir materi',
      'Akses download Cheat Sheet Subnetting IPv4/IPv6 & Wildcard Mask PDF',
      '1x Token Streak Freeze gratis untuk proteksi hari sibuk',
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
    id: 'beacon-officer',
    name: 'Beacon Officer',
    title: 'Signal & Routing Sentinel',
    minXp: 400,
    maxXp: 900,
    icon: 'radar',
    badgeColor: '#d97706',
    perks: [
      'Lencana Pangkat Emas terverifikasi di samping nama komunitas',
      'Membuka akses modul Lab Studi Kasus Menengah (VLAN & OSPF Single-Area)',
      'Akses download paket file topologi Cisco Packet Tracer (.pkt)',
      'Kelayakan masuk jajaran Top 5 Leaderboard Komunitas Mingguan',
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
    id: 'fleet-commander',
    name: 'Fleet Commander',
    title: 'Enterprise Outage Master',
    minXp: 900,
    maxXp: 1800,
    icon: 'military_tech',
    badgeColor: '#1d4ed8',
    perks: [
      'Gelar kehormatan Fleet Commander di seluruh forum komunitas',
      'Membuka modul Lab Troubleshooting Enterprise & Skenario ACL Hardening',
      'Akses download Automation Python Starter Kit (Netmiko & RESTCONF script)',
      'Hak mengklaim Sertifikat Kelulusan Resmi Terverifikasi dengan QR Code',
      'Hak memberikan rekomendasi jawaban teknis di komunitas',
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
    id: 'grand-admiral',
    name: 'Grand Admiral',
    title: 'High Infrastructure Architect',
    minXp: 1800,
    maxXp: 3000,
    icon: 'workspace_premium',
    badgeColor: '#059669',
    perks: [
      'Bingkai avatar kehormatan berkilau Nautical Gold di feed komunitas',
      'Membuka Skenario Insiden Darurat (Black Box Enterprise Simulation)',
      'Hak menyandang status resmi Community Mentor',
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
    id: 'cyber-legend',
    name: 'Cyber Legend',
    title: 'Maritime NetDevOps Elder',
    minXp: 3000,
    maxXp: Infinity,
    icon: 'diamond',
    badgeColor: '#7c3aed',
    perks: [
      'Pangkat kehormatan tertinggi seumur hidup di Phinisi Learn',
      'Lencana Bintang Legenda Platinum pada seluruh forum & leaderboard',
      'Akses tak terbatas ke seluruh modul masterclass dan materi eksklusif masa depan',
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
