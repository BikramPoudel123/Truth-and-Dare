import { create } from "zustand";
import { QUESTIONS, QCategory, QTag, Question } from "@/data/questions";

interface QuestionBankState {
  questions: Question[];
  loaded: boolean;
  load: () => void;
}

const useQuestionBankStore = create<QuestionBankState>((set, get) => ({
  questions: [],
  loaded: false,
  load: () => {
    if (get().loaded) return;
    set({ questions: QUESTIONS, loaded: true });
  },
}));

export function useQuestions(typeFilter: QCategory | "all", tagFilter: QTag | "all") {
  const { questions, loaded, load } = useQuestionBankStore();
  if (!loaded) load();
  return questions.filter(q =>
    (typeFilter === "all" || q.type === typeFilter) &&
    (tagFilter === "all" || q.tags.includes(tagFilter as QTag))
  );
}

export function useQuestionCount() {
  const { questions, loaded, load } = useQuestionBankStore();
  if (!loaded) load();
  return questions.length;
}
