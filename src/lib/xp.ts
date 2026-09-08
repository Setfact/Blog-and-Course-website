import type { SupabaseClient } from '@supabase/supabase-js';
import { getRankTier, type RankTier } from './rank';

export type XpSource =
  | 'lesson_complete'
  | 'quiz_pass'
  | 'knowledge_check'
  | 'command_order'
  | 'course_completion'
  | 'community_solution'
  | 'community_post'
  | 'streak_bonus'
  | 'admin_adjustment';

export interface XpLedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  source: XpSource;
  title: string;
  reference_id?: string;
  created_at: string;
}

export interface AwardXpResult {
  success: boolean;
  awardedAmount: number;
  newXp: number;
  previousTier: RankTier;
  currentTier: RankTier;
  leveledUp: boolean;
  entry?: XpLedgerEntry;
  error?: string;
}

// In-memory fallback ledger jika database Supabase belum menjalankan skrip migrasi
const inMemoryXpLedger: Record<string, XpLedgerEntry[]> = {
  'admin-1': [
    {
      id: 'xp-1',
      user_id: 'admin-1',
      amount: 50,
      source: 'community_solution',
      title: 'Jawaban Terbaik: Solusi OSPF Router ID',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'xp-2',
      user_id: 'admin-1',
      amount: 100,
      source: 'course_completion',
      title: 'Menyelesaikan Kursus: Network Security Fundamentals',
      created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    },
    {
      id: 'xp-3',
      user_id: 'admin-1',
      amount: 25,
      source: 'lesson_complete',
      title: 'Menyelesaikan Modul: Konfigurasi Standard IPv4 ACL',
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    },
  ],
  'student-1': [
    {
      id: 'xp-4',
      user_id: 'student-1',
      amount: 30,
      source: 'quiz_pass',
      title: 'Lulus Kuis: OSPF Multi-Area Fundamentals (Nilai 100%)',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'xp-5',
      user_id: 'student-1',
      amount: 25,
      source: 'lesson_complete',
      title: 'Menyelesaikan Modul: Verifikasi Single-Area OSPFv2',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: 'xp-6',
      user_id: 'student-1',
      amount: 25,
      source: 'lesson_complete',
      title: 'Menyelesaikan Modul: OSPF Features and Characteristics',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ],
};

export const awardXp = async (
  supabase: SupabaseClient | null,
  options: {
    userId: string;
    amount: number;
    source: XpSource;
    title: string;
    referenceId?: string;
  }
): Promise<AwardXpResult> => {
  const { userId, amount, source, title, referenceId = '' } = options;
  if (!userId || amount <= 0) {
    const dummyTier = getRankTier(0);
    return {
      success: false,
      awardedAmount: 0,
      newXp: 0,
      previousTier: dummyTier,
      currentTier: dummyTier,
      leveledUp: false,
      error: 'ID pengguna dan jumlah XP valid diperlukan',
    };
  }

  let currentXp = 0;

  if (supabase) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .maybeSingle();

      if (profile && typeof profile.xp === 'number') {
        currentXp = profile.xp;
      }
    } catch (err) {
      console.error('Gagal mengambil profil untuk awardXp:', err);
    }
  }

  const previousTier = getRankTier(currentXp);
  const newXp = currentXp + amount;
  const currentTier = getRankTier(newXp);
  const leveledUp = currentTier.name !== previousTier.name;

  const ledgerEntry: XpLedgerEntry = {
    id: `xp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    amount,
    source,
    title,
    reference_id: referenceId,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      // 1. Update profil XP
      await supabase
        .from('profiles')
        .update({
          xp: newXp,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // 2. Insert ke user_xp_ledger
      await supabase.from('user_xp_ledger').insert({
        user_id: userId,
        amount,
        source,
        title,
        reference_id: referenceId,
      });
    } catch (err) {
      console.warn('Fallback: Menyimpan transaksi XP secara lokal memori:', err);
    }
  }

  // Simpan ke in-memory ledger
  if (!inMemoryXpLedger[userId]) {
    inMemoryXpLedger[userId] = [];
  }
  inMemoryXpLedger[userId].unshift(ledgerEntry);

  return {
    success: true,
    awardedAmount: amount,
    newXp,
    previousTier,
    currentTier,
    leveledUp,
    entry: ledgerEntry,
  };
};

export const getXpHistory = async (
  supabase: SupabaseClient | null,
  userId: string,
  limit = 8
): Promise<XpLedgerEntry[]> => {
  if (supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('user_xp_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as XpLedgerEntry[];
      }
    } catch {
      // Fallback ke in-memory jika tabel belum tersedia
    }
  }

  // Fallback in-memory jika belum ada rekaman database
  if (userId && inMemoryXpLedger[userId]) {
    return inMemoryXpLedger[userId].slice(0, limit);
  }

  // Generate fallback default aktivitas
  return [
    {
      id: 'default-1',
      user_id: userId,
      amount: 25,
      source: 'lesson_complete',
      title: 'Modul Pelatihan Jaringan Diselesaikan',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'default-2',
      user_id: userId,
      amount: 30,
      source: 'quiz_pass',
      title: 'Kuis Evaluasi Lab Berhasil Diselesaikan',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];
};
