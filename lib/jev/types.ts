export type QuestionType = "choice" | "noul" | "score";

export interface ChoiceCriteriaMap {
  [option: string]: string | null;
}

export interface ChoiceQuestionDefinition {
  type: "choice";
  instructions: string;
  criteria?: ChoiceCriteriaMap | string[];
}

export interface NoulQuestionDefinition {
  type: "noul";
  instructions: string;
}

export interface ScoreQuestionDefinition {
  type: "score";
  instructions: string;
  criteria: string[];
}

export type QuestionDefinition =
  | ChoiceQuestionDefinition
  | NoulQuestionDefinition
  | ScoreQuestionDefinition;

export interface JevDecisionsRequest {
  model?: string;
  state: string | Record<string, unknown> | unknown[];
  questions: Record<string, QuestionDefinition>;
}

export interface RankedOption {
  option: string;
  probability: number;
  percentage: string;
  isWinner: boolean;
}

export interface ChoiceAnswer {
  type: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
  rankedOptions: RankedOption[];
}

export interface NoulAnswer {
  type: "noul";
  noul: number; // Probability of yes [0.0, 1.0]
  verdict: boolean;
  percentage: string;
}

export interface ScoreAnswer {
  type: "score";
  score: number; // Index of chosen level
  scoreLabel: string;
  confidence: number;
  probabilities: Record<string, number>;
  legend?: string[];
}

export type NormalizedAnswer = ChoiceAnswer | NoulAnswer | ScoreAnswer;

export interface NormalizedDecisionsResult {
  model?: string;
  answers: Record<string, NormalizedAnswer>;
  raw?: unknown;
  latencyMs?: number;
}
