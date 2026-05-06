import * as React from "react";
import { useMemo } from "react";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { useNoteSuggestions } from "@/hooks/use-note-suggestions";
import { cn } from "@/lib/utils";

interface NoteAutocompleteProps {
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function NoteAutocomplete({
  value,
  onChange,
  onBlur,
  id,
  placeholder,
  autoFocus,
  className,
  ref,
}: NoteAutocompleteProps) {
  const suggestions = useNoteSuggestions();
  const currentValue = value ?? "";

  const filtered = useMemo(() => {
    const q = currentValue.trim().toLowerCase();
    if (!q) return [];
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [suggestions, currentValue]);

  return (
    <Autocomplete.Root
      items={filtered}
      value={currentValue}
      onValueChange={(val) => onChange(val)}
      mode="none"
    >
      <Autocomplete.Input
        id={id}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        onBlur={onBlur}
        ref={ref}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 dark:bg-input/30 dark:disabled:bg-input/80 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
      />
      {filtered.length > 0 && <Autocomplete.Portal>
        <Autocomplete.Positioner
          className="isolate z-50 outline-none"
          align="start"
          sideOffset={4}
        >
          <Autocomplete.Popup className="bg-popover text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 w-(--anchor-width) min-w-40 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg p-1 shadow-md ring-1 duration-100 outline-none data-closed:overflow-hidden">
            <Autocomplete.List>
              {(item: string) => (
                <Autocomplete.Item
                  key={item}
                  value={item}
                  className="data-highlighted:bg-accent data-highlighted:text-accent-foreground relative flex cursor-default items-center rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  {item}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>}
    </Autocomplete.Root>
  );
}
