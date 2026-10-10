"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import type { TrialContext } from "@/lib/domain/types";
import { Markdown } from "./Markdown";

type ChatContext = TrialContext & { lesson: string };

/** "Ask the holocron": a tutor chat scoped to the current trial. */
export function OracleChat({
  open,
  onClose,
  chatId,
  context,
}: {
  open: boolean;
  onClose: () => void;
  chatId: string;
  context: ChatContext;
}) {
  const [transport] = useState(() => new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status, error, stop } = useChat({ id: chatId, transport });
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="Ask the holocron"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="eyebrow">Ask the holocron</p>
            <p className="mt-0.5 text-sm font-semibold">{context.trials[context.trialIndex].title}</p>
          </div>
          <button onClick={onClose} className="text-xl text-faint hover:text-text" aria-label="Close chat">
            ✕
          </button>
        </header>

        <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <p className="text-sm text-muted">
              Confused by something in the lesson? Ask for an analogy, another example, or a deeper dive.
            </p>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return m.role === "user" ? (
              <div key={m.id} className="ml-10 rounded-2xl rounded-br-md bg-holo/15 px-4 py-2.5 text-sm">
                {text}
              </div>
            ) : (
              <div key={m.id} className="mr-6 text-sm">
                <Markdown>{text}</Markdown>
              </div>
            );
          })}
          {status === "submitted" && (
            <span className="text-holo">
              <Spinner />
            </span>
          )}
          {error && <p className="text-sm text-danger">The connection to the holocron was lost. Try again.</p>}
        </div>

        <form
          className="border-t border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || busy) return;
            sendMessage({ text: input.trim() }, { body: { context } });
            setInput("");
          }}
        >
          <div className="flex gap-2 rounded-2xl border-2 border-border bg-bg p-1.5 pl-4 focus-within:border-holo/60">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              maxLength={1000}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
            />
            {busy ? (
              <button type="button" onClick={stop} className="btn btn-ghost px-3 py-2 text-xs">
                Stop
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()} className="btn btn-primary px-3 py-2 text-xs">
                Send
              </button>
            )}
          </div>
        </form>
      </aside>
    </>
  );
}
