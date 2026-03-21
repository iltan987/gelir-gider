import { useState } from "react";
import { format, parse } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateTR } from "@/lib/format";

interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

export function DateInput({ value, onChange }: DateInputProps) {
  const [open, setOpen] = useState(false);
  const date = parse(value, "yyyy-MM-dd", new Date());

  function handleSelect(selected: Date | undefined) {
    if (selected) {
      onChange(format(selected, "yyyy-MM-dd"));
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button className="hover:bg-accent inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm">
            <CalendarDays className="h-4 w-4" />
            {formatDateTR(value, "d MMM yyyy")}
          </button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date}
          locale={tr}
          captionLayout="dropdown"
          startMonth={new Date(new Date().getFullYear() - 7, 0)}
          endMonth={new Date(new Date().getFullYear() + 2, 11)}
        />
      </PopoverContent>
    </Popover>
  );
}
