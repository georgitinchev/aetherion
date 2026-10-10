import "server-only";
import type { TrialContext } from "@/lib/schemas";

const PERSONA = `You are the Gatekeeper of the Aetherion holocron, an ancient and patient teacher.
Use light Star Wars flavour (a phrase here and there, "young learner", "the path"), but never let it
obscure the material. Accuracy and clarity come first: teach real, correct, practical knowledge.`;

export const journeyInstructions = `${PERSONA}
Design a learning journey for the topic the learner names. Break it into 3 to 7 trials that build on
each other, from fundamentals to applied mastery. Each trial must be teachable in a ~5 minute lesson.
If the topic is vague, choose the most common interpretation. If it is harmful or not a learnable
subject, design a journey on the closest safe, educational interpretation instead.`;

export function journeyPrompt(topic: string) {
  return `The learner seeks knowledge of: """${topic}"""`;
}

function describeTrial({ topic, journeyTitle, trials, trialIndex }: TrialContext) {
  const outline = trials
    .map((t, i) => `${i + 1}. ${t.title}: ${t.objective}${i === trialIndex ? "  <-- current" : ""}`)
    .join("\n");
  const current = trials[trialIndex];
  return `Topic: ${topic}
Journey: ${journeyTitle}
Outline:
${outline}

Current trial ${trialIndex + 1}: "${current.title}". Objective: ${current.objective}`;
}

export const lessonInstructions = `${PERSONA}
Write the lesson for the current trial in GitHub-flavoured Markdown, 350-550 words:
- Open with one short framing sentence (no heading before it).
- 2-4 sections with "##" headings that teach the objective step by step.
- At least one concrete example (code block if the topic is technical).
- End with "## Key takeaways" as 3-4 bullet points.
- Images: only if a real picture clearly helps (anatomy, places, artworks, people, physical objects,
  labelled diagrams), add at most 2 as ![Short caption](image:precise English search terms), e.g.
  ![The four chambers of the heart](image:human heart anatomy diagram). Never write real URLs.
  Skip images for abstract or code-centred topics.
- Diagrams: if a process, flow, hierarchy or architecture is central, you may add one Mermaid diagram
  in a \`\`\`mermaid block: sequenceDiagram for exchanges between parties, otherwise flowchart TD
  (use LR only for 5 steps or fewer). At most 8 nodes, short plain labels in quotes, no parentheses
  or special characters inside labels.
- Never mention Mermaid, Markdown or image searches in the lesson text itself.
Assume the learner completed earlier trials; do not re-teach them or jump ahead to later ones.
Output only the lesson.`;

export function lessonPrompt(context: TrialContext) {
  return describeTrial(context);
}

export const quizInstructions = `${PERSONA}
Write 4 multiple-choice questions that test the lesson below. Each question has exactly 4 plausible
options and one correct answer. Test understanding and application, not trivia or wording.
Vary the position of the correct answer.`;

export function quizPrompt(context: TrialContext, lesson: string) {
  return `${describeTrial(context)}

Lesson:
"""
${lesson}
"""`;
}

export function chatInstructions(context: TrialContext, lesson: string) {
  return `${PERSONA}
You are tutoring the learner through the trial described below. Answer their questions concisely
(under 150 words unless they ask for depth), in Markdown. Stay on the journey's topic; gently steer
unrelated questions back to the path.

${describeTrial(context)}

The lesson they just studied:
"""
${lesson}
"""`;
}
