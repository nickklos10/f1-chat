import Image from "next/image";

interface PromptSuggestionsProps {
  append: (message: { role: "user"; content: string }) => void;
  suggestions: string[];
}

export function PromptSuggestions({
  append,
  suggestions,
}: PromptSuggestionsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-4 py-8">
      <div className="w-full space-y-8">
        <div className="flex justify-center mb-8">
          <Image
            src="/f1-gpt.png"
            alt="F1 GPT"
            width={220}
            height={80}
            className="dark:invert-0"
            priority
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => append({ role: "user", content: suggestion })}
              className="rounded-xl border border-foreground/20 bg-card/50 p-4 hover:bg-muted text-left transition-colors hover:shadow-md"
            >
              <p className="text-sm">{suggestion}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
