import { z } from "zod";

/**
 * Shared zod schemas. Route handlers use them to validate request bodies and
 * model output; the client imports the inferred types.
 */

export const TOPIC_MAX = 200;
const LESSON_MAX = 20_000;

export const TrialPlanSchema = z.object({
  title: z.string().describe("Short, evocative trial title, max 6 words."),
  objective: z
    .string()
    .describe("One sentence: what the learner can do after this trial."),
});

export const JourneyPlanSchema = z.object({
  title: z.string().describe("Journey title, max 8 words."),
  summary: z.string().describe("Two sentences on what the learner will master."),
  trials: z
    .array(TrialPlanSchema)
    .min(3)
    .max(7)
    .describe("Ordered from fundamentals to mastery."),
});
export type JourneyPlan = z.infer<typeof JourneyPlanSchema>;

export const QuestionSchema = z.object({
  prompt: z.string(),
  options: z.array(z.string()).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z
    .string()
    .describe("One or two sentences explaining why the answer is correct."),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuizSchema = z.object({
  questions: z.array(QuestionSchema).min(3).max(5),
});
export type Quiz = z.infer<typeof QuizSchema>;

const TrialContextSchema = z.object({
  topic: z.string().trim().min(1).max(TOPIC_MAX),
  journeyTitle: z.string().max(200),
  trials: z.array(TrialPlanSchema).min(1).max(7),
  trialIndex: z.number().int().min(0).max(6),
});
export type TrialContext = z.infer<typeof TrialContextSchema>;

const hasTrial = (c: TrialContext) => c.trialIndex < c.trials.length;
const trialIndexError = { message: "trialIndex out of range", path: ["trialIndex"] };

export const JourneyRequestSchema = z.object({
  topic: z.string().trim().min(2).max(TOPIC_MAX),
});

export const LessonRequestSchema = TrialContextSchema.refine(hasTrial, trialIndexError);

export const QuizRequestSchema = TrialContextSchema.extend({
  lesson: z.string().min(1).max(LESSON_MAX),
}).refine(hasTrial, trialIndexError);

export const ChatRequestSchema = z.object({
  context: TrialContextSchema.extend({ lesson: z.string().max(LESSON_MAX) }).refine(
    hasTrial,
    trialIndexError,
  ),
  messages: z.array(z.unknown()).min(1).max(40),
});
