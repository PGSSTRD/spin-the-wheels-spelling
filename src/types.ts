export interface Spinner {
  id: string;
  letter_list: string[];
}

export interface Level {
  level_id: string;
  spinners: [Spinner, Spinner, Spinner];
  word_list: string[];
}

export type GameStatus = "loading" | "ready" | "awaiting-change" | "spelling" | "correct" | "data-error";
