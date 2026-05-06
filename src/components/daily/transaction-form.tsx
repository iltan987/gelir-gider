import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteAutocomplete } from "@/components/shared/note-autocomplete";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { CategorySelect } from "@/components/shared/category-select";
import { parseTurkishAmount, formatAmountInput } from "@/lib/format";
import { getCategoriesForType } from "@/lib/categories";
import type { Transaction, TransactionType } from "@/types";

const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, "Tutar gerekli")
    .refine(
      (val) => {
        const parsed = parseTurkishAmount(val);
        return parsed !== null && parsed !== 0;
      },
      { message: "Geçerli bir tutar girin (sıfır olamaz)" },
    ),
  category: z.string().min(1, "Kategori seçin"),
  note: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  type: TransactionType;
  editingTransaction: Transaction | null;
  onSave: (data: {
    type: TransactionType;
    amount: number;
    category: string;
    note: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

function formatInitialAmount(transaction: Transaction): string {
  const tl = Math.abs(transaction.amount) / 100;
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tl);
}

export function TransactionForm({
  type,
  editingTransaction,
  onSave,
  onCancel,
}: TransactionFormProps) {
  const { handleSubmit, control, setError, reset } =
    useForm<TransactionFormData>({
      resolver: zodResolver(transactionSchema),
      defaultValues: {
        amount: editingTransaction
          ? formatInitialAmount(editingTransaction)
          : "",
        category:
          editingTransaction?.category ??
          (type === "revenue" ? "EFT-HAVALE" : "DİĞER"),
        note: editingTransaction?.note ?? "",
      },
    });

  async function onSubmit(data: TransactionFormData) {
    const categories = getCategoriesForType(type);
    if (!categories.includes(data.category)) {
      setError("category", {
        message: "Seçilen kategori bu işlem türü için geçersiz",
      });
      return;
    }

    const amount = parseTurkishAmount(data.amount)!;

    await onSave({
      type,
      amount: Math.abs(amount),
      category: data.category,
      note: data.note?.trim() || null,
    });

    if (!editingTransaction) {
      reset();
    }
  }

  const typeLabel = type === "revenue" ? "Gelir" : "Gider";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      autoComplete="off"
      className="space-y-3 rounded-lg border p-4"
    >
      <p className="text-sm font-medium">
        {editingTransaction ? `${typeLabel} Düzenle` : `${typeLabel} Ekle`}
      </p>

      <FieldGroup>
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="note">Not (isteğe bağlı)</FieldLabel>
                <NoteAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  id="note"
                  placeholder="Açıklama"
                  autoFocus
                />
              </Field>
            )}
          />

          <Controller
            name="amount"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="amount">Tutar</FieldLabel>
                <Input
                  id="amount"
                  className="placeholder:text-muted-foreground/50"
                  placeholder="15.000,00"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(formatAmountInput(e.target.value))
                  }
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="category"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Kategori</FieldLabel>
                <CategorySelect
                  type={type}
                  value={field.value}
                  onValueChange={field.onChange}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </FieldGroup>

      <div className="flex gap-2">
        <Button type="submit">
          {editingTransaction ? "Güncelle" : "Ekle"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
