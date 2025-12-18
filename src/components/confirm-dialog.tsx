import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type Props = {
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({
    title = "Are you absolutely sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
}: Props) {
    return (
        <AlertDialog open onOpenChange={onCancel}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description && (
                        <AlertDialogDescription>{description}</AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        {cancelText}
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        {confirmText}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
