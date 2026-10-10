import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { decodeImageQuery, encodeImageRefs, IMAGE_SCHEME } from "@/lib/images/commons";
import { LessonImage } from "./LessonImage";
import { MermaidDiagram } from "./MermaidDiagram";

/** Keep `image:` references for LessonImage; everything else gets react-markdown's safe default. */
const urlTransform = (url: string) => (url.startsWith(IMAGE_SCHEME) ? url : defaultUrlTransform(url));

function components(streaming: boolean): Components {
  return {
    img: ({ src, alt }) =>
      typeof src === "string" && src.startsWith(IMAGE_SCHEME) ? (
        <LessonImage query={decodeImageQuery(src)} caption={alt ?? ""} />
      ) : null,
    code: ({ className, children }) => {
      const source = String(children ?? "");
      if (className === "language-mermaid") {
        // Half-written diagram code would just fail to parse; wait for the stream to finish.
        if (streaming) return <span className="text-muted">Drawing diagram…</span>;
        return <MermaidDiagram chart={source.trim()} />;
      }
      return <code className={className}>{children}</code>;
    },
    // A <figure> may not sit inside <p>, so paragraphs holding an image become a <div>.
    p: ({ children, node }) =>
      node?.children.some((c) => c.type === "element" && c.tagName === "img") ? (
        <div>{children}</div>
      ) : (
        <p>{children}</p>
      ),
    // Diagrams render their own container instead of sitting inside <pre>.
    pre: ({ children, node }) => {
      const code = node?.children[0];
      const isMermaid =
        code?.type === "element" &&
        Array.isArray(code.properties?.className) &&
        code.properties.className.includes("language-mermaid");
      return isMermaid ? <>{children}</> : <pre>{children}</pre>;
    },
  };
}

/**
 * Renders model output. react-markdown never injects raw HTML, so this is
 * XSS-safe; images come from Wikimedia Commons and diagrams from Mermaid.
 */
export function Markdown({ children, streaming = false }: { children: string; streaming?: boolean }) {
  return (
    <div className={`prose-holo ${streaming ? "streaming-caret" : ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform} components={components(streaming)}>
        {encodeImageRefs(children)}
      </ReactMarkdown>
    </div>
  );
}
