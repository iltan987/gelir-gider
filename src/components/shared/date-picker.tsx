import { useState } from "react";
import { addDays, subDays, format, parse } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateTR } from "@/lib/format";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onGoToToday: () => void;
}

export function DatePicker({ value, onChange, onGoToToday }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const date = parse(value, "yyyy-MM-dd", new Date());

  function handlePrev() {
    onChange(format(subDays(date, 1), "yyyy-MM-dd"));
  }

  function handleNext() {
    onChange(format(addDays(date, 1), "yyyy-MM-dd"));
  }

  function handleSelect(selected: Date | undefined) {
    if (selected) {
      onChange(format(selected, "yyyy-MM-dd"));
      setOpen(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button className="hover:bg-accent inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4" />
              {formatDateTR(value)}
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

      <Button variant="outline" size="icon" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={onGoToToday}>
        Bugün
      </Button>
    </div>
  );
}
