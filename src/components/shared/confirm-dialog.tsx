import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  trigger: React.ReactElement;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  doubleConfirm?: boolean;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  doubleConfirm = false,
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  const [showSecond, setShowSecond] = useState(false);

  function handleConfirm() {
    if (doubleConfirm && !showSecond) {
      setShowSecond(true);
      return;
    }
    setShowSecond(false);
    onConfirm();
  }

  function handleCancel() {
    setShowSecond(false);
  }

  return (
    <AlertDialog onOpenChange={(open) => !open && setShowSecond(false)}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {showSecond ? "Emin misiniz?" : title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {showSecond
              ? "Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?"
              : description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelLabel}
          </AlertDialogCancel>
          {showSecond ? (
            <AlertDialogAction variant="destructive" onClick={handleConfirm}>
              Evet, devam et
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
