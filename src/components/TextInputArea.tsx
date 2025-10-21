import { useId } from "react";
import { cn } from "@/lib/utils";
import { getCounterColorClass, TEXT_INPUT_LIMITS } from "@/lib/validation";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  textLength: number;
  isValid: boolean;
  disabled?: boolean;
}

export function TextInputArea({ value, onChange, textLength, isValid, disabled = false }: TextInputAreaProps) {
  const inputId = useId();

  // Calculate validation state
  const isTooShort = textLength > 0 && textLength < TEXT_INPUT_LIMITS.MIN_LENGTH;
  const isTooLong = textLength > TEXT_INPUT_LIMITS.MAX_LENGTH;
  const showValidation = textLength > 0;

  return (
    <div className="space-y-2" data-testid="text-input-area">
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
        Wklej tekst źródłowy
      </label>

      <textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki (minimum 1000 znaków)..."
        rows={12}
        className={cn(
          "w-full rounded-md border bg-background px-3 py-2 text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y",
          isTooLong && "border-destructive focus-visible:ring-destructive",
          isValid && showValidation && "border-green-600 focus-visible:ring-green-600"
        )}
        aria-invalid={showValidation && !isValid}
        aria-describedby={`${inputId}-description ${inputId}-counter`}
        data-testid="source-text-textarea"
      />

      <div className="flex items-center justify-between text-sm">
        <p id={`${inputId}-description`} className="text-muted-foreground">
          Wprowadź tekst o długości {TEXT_INPUT_LIMITS.MIN_LENGTH}-{TEXT_INPUT_LIMITS.MAX_LENGTH.toLocaleString()}{" "}
          znaków
        </p>

        <p
          id={`${inputId}-counter`}
          className={cn("font-medium tabular-nums", getCounterColorClass(textLength))}
          aria-live="polite"
        >
          {textLength.toLocaleString()} / {TEXT_INPUT_LIMITS.MAX_LENGTH.toLocaleString()}
        </p>
      </div>

      {showValidation && !isValid && (
        <div className="text-sm" role="alert" aria-live="polite">
          {isTooShort && (
            <p className="text-orange-600 dark:text-orange-400">
              Potrzebujesz jeszcze {(TEXT_INPUT_LIMITS.MIN_LENGTH - textLength).toLocaleString()} znaków
            </p>
          )}
          {isTooLong && (
            <p className="text-destructive">
              Tekst jest za długi o {(textLength - TEXT_INPUT_LIMITS.MAX_LENGTH).toLocaleString()} znaków
            </p>
          )}
        </div>
      )}
    </div>
  );
}
