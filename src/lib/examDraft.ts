import AsyncStorage from "@react-native-async-storage/async-storage";

const DRAFT_PREFIX = "exam_draft:";
const PENDING_KEY = "exam_pending";

export type ExamObjective = {
  number: number;
  text: string;
  options: string[];
  correct: string;
};

export type ExamEssay = {
  number: number;
  text: string;
  marks: number;
};

export type ExamFillBlank = {
  number: number;
  text: string;
  answer: string;
};

export type ExamData = {
  title?: string;
  class: string;
  subject: string;
  term: string;
  session: string;
  duration: string;
  totalMarks: number;
  instructions: string;
  objectives: ExamObjective[];
  essays: ExamEssay[];
  fillBlanks: ExamFillBlank[];
};

function draftKey(
  className: string,
  subject: string,
  term: string,
  session: string,
) {
  return `${DRAFT_PREFIX}${className}:${subject}:${term}:${session}`;
}

export async function saveDraft(data: ExamData) {
  await AsyncStorage.setItem(
    draftKey(data.class, data.subject, data.term, data.session),
    JSON.stringify({ data, savedAt: Date.now() }),
  );
}

export async function loadDraft(
  className: string,
  subject: string,
  term: string,
  session: string,
): Promise<ExamData | null> {
  const raw = await AsyncStorage.getItem(
    draftKey(className, subject, term, session),
  );
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.data || null;
  } catch {
    return null;
  }
}

export async function clearDraft(
  className: string,
  subject: string,
  term: string,
  session: string,
) {
  await AsyncStorage.removeItem(draftKey(className, subject, term, session));
}

export type PendingExam = {
  id: string;
  data: ExamData;
  submit: boolean;
  createdAt: number;
};

export async function getPending(): Promise<PendingExam[]> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function savePending(list: PendingExam[]) {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

export async function addPending(entry: PendingExam) {
  const list = await getPending();
  const filtered = list.filter(
    (p) =>
      !(
        p.data.class === entry.data.class &&
        p.data.subject === entry.data.subject &&
        p.data.term === entry.data.term &&
        p.data.session === entry.data.session
      ),
  );
  filtered.push(entry);
  await savePending(filtered);
}

export async function removePending(id: string) {
  const list = await getPending();
  await savePending(list.filter((p) => p.id !== id));
}
