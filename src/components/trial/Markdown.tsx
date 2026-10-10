import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders model output. react-markdown never injects raw HTML, so this is XSS-safe. */
export function Markdown({ children, streaming = false }: { children: string; streaming?: boolean }) {
  return (
    <div className={`prose-holo ${streaming ? "streaming-caret" : ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
