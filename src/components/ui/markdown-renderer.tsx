import React, { Suspense } from "react";
import Markdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";

interface MarkdownRendererProps {
  children: string;
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <div className="space-y-3">
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {children}
      </Markdown>
    </div>
  );
}

interface HighlightedPre extends React.HTMLAttributes<HTMLPreElement> {
  children: string;
  language: string;
}

const HighlightedPre = React.memo(
  async ({ children, language, ...props }: HighlightedPre) => {
    const { codeToTokens, bundledLanguages } = await import("shiki");

    if (!(language in bundledLanguages)) {
      return <pre {...props}>{children}</pre>;
    }

    const { tokens } = await codeToTokens(children, {
      lang: language as keyof typeof bundledLanguages,
      defaultColor: false,
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    });

    return (
      <pre {...props}>
        <code>
          {tokens.map((line, lineIndex) => (
            <>
              <span key={lineIndex}>
                {line.map((token, tokenIndex) => {
                  const style =
                    typeof token.htmlStyle === "string"
                      ? undefined
                      : token.htmlStyle;

                  return (
                    <span
                      key={tokenIndex}
                      className="text-shiki-light bg-shiki-light-bg dark:text-shiki-dark dark:bg-shiki-dark-bg"
                      style={style}
                    >
                      {token.content}
                    </span>
                  );
                })}
              </span>
              {lineIndex !== tokens.length - 1 && "\n"}
            </>
          ))}
        </code>
      </pre>
    );
  }
);
HighlightedPre.displayName = "HighlightedCode";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode;
  className?: string;
  language: string;
}

const CodeBlock = ({
  children,
  className,
  language,
  ...restProps
}: CodeBlockProps) => {
  const code =
    typeof children === "string"
      ? children
      : childrenTakeAllStringContents(children);

  const preClass = cn(
    "overflow-x-scroll rounded-md border bg-background/50 p-4 font-mono text-sm [scrollbar-width:none]",
    className
  );

  return (
    <div className="group/code relative mb-4">
      <Suspense
        fallback={
          <pre className={preClass} {...restProps}>
            {children}
          </pre>
        }
      >
        <HighlightedPre language={language} className={preClass}>
          {code}
        </HighlightedPre>
      </Suspense>

      <div className="invisible absolute right-2 top-2 flex space-x-1 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100">
        <CopyButton content={code} copyMessage="Copied code to clipboard" />
      </div>
    </div>
  );
};

function childrenTakeAllStringContents(element: unknown): string {
  if (typeof element === "string") {
    return element;
  }

  if (element && typeof element === "object") {
    // Safely check for props and children
    const elementObj = element as { props?: { children?: unknown } };

    if (elementObj.props?.children) {
      const children = elementObj.props.children;

      if (Array.isArray(children)) {
        return children
          .map((child) => childrenTakeAllStringContents(child))
          .join("");
      } else {
        return childrenTakeAllStringContents(children);
      }
    }
  }

  return "";
}

// Define correctly typed markdown components
const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="font-semibold text-xl">{children}</h2>,
  h3: ({ children }) => <h3 className="font-semibold text-lg">{children}</h3>,
  h4: ({ children }) => <h4 className="font-semibold text-base">{children}</h4>,
  h5: ({ children }) => <h5 className="font-medium">{children}</h5>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-primary underline underline-offset-2">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary pl-4">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <CodeBlock className={className} language={match[1]} {...props}>
        {children}
      </CodeBlock>
    ) : (
      <code
        className={cn(
          "font-mono [:not(pre)>&]:rounded-md [:not(pre)>&]:bg-background/50 [:not(pre)>&]:px-1 [:not(pre)>&]:py-0.5"
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  ol: ({ children }) => (
    <ol className="list-decimal space-y-2 pl-6">{children}</ol>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-2 pl-6">{children}</ul>
  ),
  li: ({ children }) => <li className="my-1.5">{children}</li>,
  table: ({ children }) => (
    <table className="w-full border-collapse overflow-y-auto rounded-md border border-foreground/20">
      {children}
    </table>
  ),
  th: ({ children, align }) => (
    <th
      className={cn(
        "border border-foreground/20 px-4 py-2 text-left font-bold",
        align === "center" && "text-center",
        align === "right" && "text-right"
      )}
    >
      {children}
    </th>
  ),
  td: ({ children, align }) => (
    <td
      className={cn(
        "border border-foreground/20 px-4 py-2 text-left",
        align === "center" && "text-center",
        align === "right" && "text-right"
      )}
    >
      {children}
    </td>
  ),
  tr: ({ children }) => (
    <tr className="m-0 border-t p-0 even:bg-muted">{children}</tr>
  ),
  p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
  hr: () => <hr className="border-foreground/20" />,
};

export default MarkdownRenderer;
