import { db } from './firebase';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, onSnapshot } from 'firebase/firestore';

const DAILY_CAP = 300;
const GP_FIRST_OF_DAY = 10;
const STREAK_DAILY_BONUS = 50;
const STREAK_WEEKLY_BONUS = 120;

interface GhostPointsData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  freeHoursAvailable: number;
  freeDaysAvailable: number;
  currentStreak: number;
  lastActiveDate: string;
  gpEarnedToday: number;
  lastDailyBonusDate: string;
  lastWeeklyBonusStreak: number;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: monday.toISOString(),
    end: sunday.toISOString(),
  };
}

function getDefaultGPData(): GhostPointsData {
  return {
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    freeHoursAvailable: 0,
    freeDaysAvailable: 0,
    currentStreak: 0,
    lastActiveDate: '',
    gpEarnedToday: 0,
    lastDailyBonusDate: '',
    lastWeeklyBonusStreak: 0,
  };
}

export async function getBalance(uid: string): Promise<GhostPointsData> {
  if (!db) return getDefaultGPData();
  try {
    const ref = doc(db, 'users', uid, 'ghostpoints', 'main');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as GhostPointsData;
    }
    return getDefaultGPData();
  } catch {
    return getDefaultGPData();
  }
}

export function subscribeBalance(uid: string, cb: (data: GhostPointsData) => void): () => void {
  if (!db) return () => {};
  const ref = doc(db, 'users', uid, 'ghostpoints', 'main');
  const unsub = onSnapshot(ref, (snap: any) => {
    if (snap.exists()) {
      cb(snap.data() as GhostPointsData);
    } else {
      cb(getDefaultGPData());
    }
  });
  return unsub;
}

export async function earnGP(
  uid: string,
  amount: number,
  reason: string,
  auditId: string,
  question: string,
  qualityLevel: string
): Promise<{ awarded: number; bonusAwarded: number; totalAwarded: number; newBalance: number }> {
  if (!db) return { awarded: 0, bonusAwarded: 0, totalAwarded: 0, newBalance: 0 };

  const ref = doc(db, 'users', uid, 'ghostpoints', 'main');
  const today = getToday();
  let gpData = getDefaultGPData();

  const snap = await getDoc(ref);
  if (snap.exists()) {
    gpData = snap.data() as GhostPointsData;
  }

  let streak = gpData.currentStreak;
  let lastDate = gpData.lastActiveDate;
  const isNewDay = lastDate !== today;

  if (!lastDate) {
    streak = 1;
  } else if (lastDate === today) {
    // same day, streak unchanged
  } else if (lastDate === getYesterday()) {
    streak += 1;
  } else {
    streak = 1;
  }
  lastDate = today;

  let totalGpAwarded = 0;
  let bonusAwarded = 0;

  const cappedAmount = Math.min(amount, Math.max(0, DAILY_CAP - gpData.gpEarnedToday));
  if (cappedAmount > 0) {
    totalGpAwarded += cappedAmount;
  }

  if (cappedAmount > 0) {
    const firstBonusToday = gpData.lastDailyBonusDate !== today;
    if (firstBonusToday) {
      totalGpAwarded += GP_FIRST_OF_DAY;
      bonusAwarded += GP_FIRST_OF_DAY;
    }
  }

  if (isNewDay && streak >= 3) {
    totalGpAwarded += STREAK_DAILY_BONUS;
    bonusAwarded += STREAK_DAILY_BONUS;
  }

  if (isNewDay && streak >= 7 && (streak % 7 === 0)) {
    const nextWeeklyDue = gpData.lastWeeklyBonusStreak + 7;
    if (streak >= nextWeeklyDue) {
      totalGpAwarded += STREAK_WEEKLY_BONUS;
      bonusAwarded += STREAK_WEEKLY_BONUS;
    }
  }

  const gpFromAnswers = cappedAmount;
  const newGpEarnedToday = Math.min(gpData.gpEarnedToday + gpFromAnswers, DAILY_CAP);

  const newData: GhostPointsData = {
    balance: gpData.balance + totalGpAwarded,
    totalEarned: gpData.totalEarned + totalGpAwarded,
    totalSpent: gpData.totalSpent,
    freeHoursAvailable: gpData.freeHoursAvailable,
    freeDaysAvailable: gpData.freeDaysAvailable,
    currentStreak: streak,
    lastActiveDate: lastDate,
    gpEarnedToday: isNewDay ? gpFromAnswers : Math.min(gpData.gpEarnedToday + gpFromAnswers, DAILY_CAP),
    lastDailyBonusDate: gpData.lastDailyBonusDate !== today && cappedAmount > 0 ? today : gpData.lastDailyBonusDate,
    lastWeeklyBonusStreak: (isNewDay && streak >= 7 && streak % 7 === 0 && streak > gpData.lastWeeklyBonusStreak)
      ? streak : gpData.lastWeeklyBonusStreak,
  };

  await setDoc(ref, newData);

  const txData = {
    type: 'earn',
    amount: cappedAmount,
    bonusAmount: bonusAwarded,
    totalAwarded: totalGpAwarded,
    reason,
    qualityLevel,
    auditId,
    question,
    timestamp: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, 'users', uid, 'gp_transactions'), txData);
  } catch (e) {
    console.error('Failed to save GP transaction', e);
  }

  return {
    awarded: cappedAmount,
    bonusAwarded,
    totalAwarded: totalGpAwarded,
    newBalance: newData.balance,
  };
}

export async function redeemGP(uid: string, type: 'free_hour' | 'free_5hours' | 'free_day', userName?: string, userCedula?: string): Promise<{
  success: boolean; newBalance: number; pdfData?: { name: string; cedula: string; reward: string; cost: number; date: string }
}> {
  if (!db) return { success: false, newBalance: 0 };

  const ref = doc(db, 'users', uid, 'ghostpoints', 'main');
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, newBalance: 0 };

  const data = snap.data() as GhostPointsData;
  const cost = type === 'free_hour' ? 250 : type === 'free_5hours' ? 1100 : 5200;

  if (data.balance < cost) return { success: false, newBalance: data.balance };

  const newBalance = data.balance - cost;
  const newData: GhostPointsData = {
    ...data,
    balance: newBalance,
    totalSpent: data.totalSpent + cost,
    freeHoursAvailable: data.freeHoursAvailable + (type === 'free_hour' ? 1 : type === 'free_5hours' ? 5 : 0),
    freeDaysAvailable: data.freeDaysAvailable + (type === 'free_day' ? 1 : 0),
  };

  await setDoc(ref, newData);

  const txnData: any = {
    type: 'redeem',
    amount: -cost,
    reason: type === 'free_hour' ? 'Canje: 1 Hora Libre' : type === 'free_5hours' ? 'Canje: 5 Horas Libres' : 'Canje: 1 Día Libre',
    item: type,
    timestamp: serverTimestamp(),
  };

  if (userName) txnData.userName = userName;
  if (userCedula) txnData.userCedula = userCedula;

  try {
    await addDoc(collection(db, 'users', uid, 'gp_transactions'), txnData);
    // Guardar también en una colección global para el panel del admin
    await addDoc(collection(db, 'redeems'), {
      uid,
      userName: userName || 'Sin nombre',
      userCedula: userCedula || 'Sin cédula',
      item: type,
      cost,
      reason: txnData.reason,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error('Failed to save redeem transaction', e);
  }

  const pdfData = {
    name: userName || 'Sin nombre',
    cedula: userCedula || 'Sin cédula',
    reward: type === 'free_hour' ? '1 Hora Libre' : type === 'free_5hours' ? 'Paquete 5 Horas Libres' : '1 Día Libre (8h)',
    cost,
    date: new Date().toISOString(),
  };

  return { success: true, newBalance, pdfData };
}

export async function getGPHistory(uid: string): Promise<any[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'users', uid, 'gp_transactions'), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

export async function getLeaderboard(): Promise<any[]> {
  if (!db) return [];
  try {
    const week = getWeekRange();
    const usersSnap = await getDocs(collection(db, 'users'));
    const results: { uid: string; name: string; totalGP: number }[] = [];

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      const name = userData.name || uid;

      const txnsQuery = query(
        collection(db, 'users', uid, 'gp_transactions'),
        where('type', '==', 'earn'),
        where('timestamp', '>=', new Date(week.start)),
        where('timestamp', '<=', new Date(week.end))
      );
      const txnsSnap = await getDocs(txnsQuery);
      let totalGP = 0;
      txnsSnap.docs.forEach(d => {
        const d2 = d.data();
        totalGP += (d2 as any).totalAwarded || (d2 as any).amount || 0;
      });

      if (totalGP > 0) {
        results.push({ uid, name, totalGP });
      }
    }

    results.sort((a, b) => b.totalGP - a.totalGP);
    return results.slice(0, 10);
  } catch (e) {
    console.error('Leaderboard error', e);
    return [];
  }
}

export async function awardLeaderboardBonuses(): Promise<any> {
  if (!db) return { error: 'No DB' };
  try {
    const leaderboard = await getLeaderboard();
    const rewards: Record<number, number> = { 0: 200, 1: 100, 2: 60 };

    for (let i = 0; i < Math.min(3, leaderboard.length); i++) {
      const entry = leaderboard[i];
      const gpReward = rewards[i] || 0;
      if (gpReward === 0) continue;

      const ref = doc(db, 'users', entry.uid, 'ghostpoints', 'main');
      const snap = await getDoc(ref);
      const data = (snap.exists() ? snap.data() : getDefaultGPData()) as GhostPointsData;

      const newData: GhostPointsData = {
        ...data,
        balance: data.balance + gpReward,
        totalEarned: data.totalEarned + gpReward,
      };
      await setDoc(ref, newData);

      await addDoc(collection(db, 'users', entry.uid, 'gp_transactions'), {
        type: 'earn',
        amount: gpReward,
        bonusAmount: 0,
        totalAwarded: gpReward,
        reason: `leaderboard_week_#${i + 1}`,
        qualityLevel: 'excelente',
        auditId: 'leaderboard',
        question: `Top ${i + 1} del leaderboard semanal`,
        timestamp: serverTimestamp(),
      });
    }
    return { success: true, awarded: leaderboard.slice(0, 3) };
  } catch (e) {
    console.error('awardLeaderboardBonuses error', e);
    return { error: String(e) };
  }
}
