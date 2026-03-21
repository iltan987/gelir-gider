import { addDays, subDays, format } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTR } from "@/lib/format";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onGoToToday: () => void;
}

export function DatePicker({ value, onChange, onGoToToday }: DatePickerProps) {
  const date = new Date(value + "T00:00:00");

  function handlePrev() {
    onChange(format(subDays(date, 1), "yyyy-MM-dd"));
  }

  function handleNext() {
    onChange(format(addDays(date, 1), "yyyy-MM-dd"));
  }

  function handleDateInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) {
      onChange(e.target.value);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={value}
          onChange={handleDateInput}
          className="w-auto"
        />
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {formatDateTR(value)}
        </span>
      </div>

      <Button variant="outline" size="icon" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={onGoToToday}>
        <CalendarDays className="mr-1 h-4 w-4" />
        Bugün
      </Button>
    </div>
  );
}
