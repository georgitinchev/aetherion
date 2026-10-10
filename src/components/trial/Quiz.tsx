"use client";

import { useCallback, useEffect, useState } from "react";
import type { Question } from "@/lib/domain/types";
import { BottomBar } from "@/components/ui/BottomBar";

const KEYS = ["1", "2", "3", "4"];

export function Quiz({
  questions,
  onProgress,
  onComplete,
}: {
  questions: Question[];
  onProgress: (fraction: number) => void;
  onComplete: (answers: number[]) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const question = questions[current];
  const correct = selected === question.answerIndex;

  const advance = useCallback(() => {
    if (selected === null) return;
    if (!checked) return setChecked(true);
    const next = [...answers, selected];
    if (current + 1 === questions.length) return onComplete(next);
    setAnswers(next);
    setCurrent(current + 1);
    setSelected(null);
    setChecked(false);
    onProgress((current + 1) / questions.length);
  }, [answers, checked, current, onComplete, onProgress, questions.length, selected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = KEYS.indexOf(e.key);
      if (n >= 0 && !checked) setSelected(n);
      if (e.key === "Enter") advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, checked]);

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-10 pb-56 sm:px-6">
        <p className="eyebrow">
          Question {current + 1} of {questions.length}
        </p>
        <h2 className="mt-3 text-2xl leading-snug font-semibold text-balance">{question.prompt}</h2>
        <ul className="mt-8 grid gap-3">
          {question.options.map((option, i) => {
            const state = !checked
              ? selected === i
                ? "border-holo bg-holo/10 text-text [--lip:var(--holo-deep)]"
                : "border-border bg-surface hover:bg-surface-2 [--lip:var(--border)]"
              : i === question.answerIndex
                ? "border-success bg-success/10 [--lip:var(--success-deep)]"
                : i === selected
                  ? "border-danger bg-danger/10 [--lip:var(--danger-deep)]"
                  : "border-border bg-surface opacity-50 [--lip:var(--border)]";
            return (
              <li key={i}>
                <button
                  onClick={() => setSelected(i)}
                  disabled={checked}
                  className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left shadow-[0_4px_0_var(--lip)] transition-all active:translate-y-1 active:shadow-none disabled:active:translate-y-0 ${state}`}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border-2 border-current/30 font-mono text-xs text-muted">
                    {i + 1}
                  </span>
                  <span>{option}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>

      <BottomBar tone={!checked ? "neutral" : correct ? "success" : "danger"}>
        <div className="min-w-0 flex-1" aria-live="polite">
          {checked && (
            <>
              <p className={`text-lg font-bold ${correct ? "text-success" : "text-danger"}`}>
                {correct ? "Strong with the Force, you are." : "Not quite, young learner."}
              </p>
              <p className="mt-1 text-sm text-muted">
                {!correct && (
                  <>
                    Correct answer: <span className="text-text">{question.options[question.answerIndex]}</span>.{" "}
                  </>
                )}
                {question.explanation}
              </p>
            </>
          )}
        </div>
        <button
          onClick={advance}
          disabled={selected === null}
          className={`btn min-w-36 ${!checked ? "btn-primary" : correct ? "btn-success" : "btn-danger"}`}
        >
          {checked ? "Continue" : "Check"}
        </button>
      </BottomBar>
    </>
  );
}
