import { useState, useEffect } from "react";
import { getDistinctNotes } from "@/services/db";

export function useNoteSuggestions(): string[] {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    getDistinctNotes()
      .then(setSuggestions)
      .catch(() => {});
  }, []);

  return suggestions;
}
