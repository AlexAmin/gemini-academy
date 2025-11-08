
export interface LecturePlan {
  unit_title: string;
  grade: number;
  overview: string;
  guiding_questions: string[];
  content_and_themes: ContentAndTheme[];
}

export interface ContentAndTheme {
  theme: string;
  details: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface GeneratedAssets {
  videoUrl: string;
  audioUrls: string[];
  quiz: Quiz;
}

export interface GenerationStatus {
  stage: string;
  message: string;
}

// Add a declaration for the aistudio object on the window
declare global {
  // Fix: Moved AIStudio interface into `declare global` to prevent module scope conflicts.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
