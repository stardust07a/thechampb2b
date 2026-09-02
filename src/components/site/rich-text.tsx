import { parseEmphasis } from "@/lib/utils";

/** `**kalın**` işaretli metni güvenli biçimde render eder (dangerouslySetInnerHTML yok). */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((part, i) =>
        part.strong ? (
          <strong key={i} className="font-semibold text-fg">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
