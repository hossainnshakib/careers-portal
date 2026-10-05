import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

/** Raw HTML is never parsed. The sanitizer also limits elements and URL protocols. */
export function SafeMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-3 [&_a]:underline [&_h1]:text-2xl [&_h2]:text-xl [&_li]:ml-5 [&_ul]:list-disc [&_ol]:list-decimal">
      <Markdown skipHtml rehypePlugins={[rehypeSanitize]}>
        {text}
      </Markdown>
    </div>
  );
}
