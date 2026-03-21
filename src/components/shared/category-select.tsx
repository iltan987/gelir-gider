import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategoriesForType } from "@/lib/categories";
import type { TransactionType } from "@/types";

interface CategorySelectProps {
  type: TransactionType;
  value: string;
  onValueChange: (value: string) => void;
}

export function CategorySelect({
  type,
  value,
  onValueChange,
}: CategorySelectProps) {
  const categories = getCategoriesForType(type);

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v !== null) onValueChange(v);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Kategori seçin" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {cat}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
