import AsyncStorage from "@react-native-async-storage/async-storage";

const DRAFT_PREFIX = "results_draft:";
const PENDING_KEY = "results_pending";

export type SubjectScores = {
  [subject: string]: { ca: number; exam: number };
};

export type DraftScores = Record<string, SubjectScores>;

function draftKey(className: string, term: string, session: string) {
  return `${DRAFT_PREFIX}${className}:${term}:${session}`;
}

// ─── Draft (local editing state) ─────────────────────────
export async function saveDraft(
  className: string,
  term: string,
  session: string,
  scores: DraftScores,
) {
  await AsyncStorage.setItem(
    draftKey(className, term, session),
    JSON.stringify({ scores, savedAt: Date.now() }),
  );
}

export async function loadDraft(
  className: string,
  term: string,
  session: string,
): Promise<DraftScores | null> {
  const raw = await AsyncStorage.getItem(draftKey(className, term, session));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.scores || null;
  } catch {
    return null;
  }
}

export async function clearDraft(
  className: string,
  term: string,
  session: string,
) {
  await AsyncStorage.removeItem(draftKey(className, term, session));
}

// ─── Pending uploads queue ───────────────────────────────
export type PendingResult = {
  id: string;
  className: string;
  term: string;
  session: string;
  results: {
    studentId: string;
    subjects: { subject: string; ca: number; exam: number }[];
  }[];
  createdAt: number;
};

export async function getPending(): Promise<PendingResult[]> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function savePending(list: PendingResult[]) {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

export async function addPending(entry: PendingResult) {
  const list = await getPending();
  // Remove any pending with same class/term/session to avoid duplicates
  const filtered = list.filter(
    (p) =>
      !(
        p.className === entry.className &&
        p.term === entry.term &&
        p.session === entry.session
      ),
  );
  filtered.push(entry);
  await savePending(filtered);
}

export async function removePending(id: string) {
  const list = await getPending();
  await savePending(list.filter((p) => p.id !== id));
}

export async function clearAllPending() {
  await AsyncStorage.removeItem(PENDING_KEY);
}
