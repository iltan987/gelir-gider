import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
  const [open, setOpen] = useState(false);
  const [showSecond, setShowSecond] = useState(false);

  function handleConfirm() {
    if (doubleConfirm && !showSecond) {
      setShowSecond(true);
      return;
    }
    setShowSecond(false);
    setOpen(false);
    onConfirm();
  }

  function handleCancel() {
    setShowSecond(false);
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setShowSecond(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
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
          <Button variant="outline" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button
            autoFocus
            variant={
              showSecond || variant === "destructive"
                ? "destructive"
                : "default"
            }
            onClick={handleConfirm}
          >
            {showSecond ? "Evet, devam et" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
