import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogContextType {
    open: boolean
    setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined)

const useDialog = () => {
    const context = React.useContext(DialogContext)
    if (!context) {
        throw new Error("Dialog components must be used within Dialog")
    }
    return context
}

interface DialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const setOpen = React.useCallback(
        (newOpen: boolean) => {
            if (!isControlled) {
                setUncontrolledOpen(newOpen)
            }
            onOpenChange?.(newOpen)
        },
        [isControlled, onOpenChange]
    )

    return (
        <DialogContext.Provider value={{ open, setOpen }}>
            {children}
        </DialogContext.Provider>
    )
}

interface DialogTriggerProps {
    asChild?: boolean
    children: React.ReactNode
    className?: string
}

export function DialogTrigger({ asChild, children, className }: DialogTriggerProps) {
    const { setOpen } = useDialog()

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation()
                setOpen(true)
                if (typeof (children as any).props?.onClick === 'function') {
                    (children as any).props.onClick(e)
                }
            },
        } as any)
    }

    return (
        <button onClick={() => setOpen(true)} className={className}>
            {children}
        </button>
    )
}

interface DialogContentProps {
    children: React.ReactNode
    className?: string
    closeButton?: boolean
    onClose?: () => void
}

export function DialogContent({
    children,
    className,
    closeButton = true,
    onClose
}: DialogContentProps) {
    const { open, setOpen } = useDialog()

    const handleClose = React.useCallback(() => {
        setOpen(false)
        onClose?.()
    }, [setOpen, onClose])

    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) {
                handleClose()
            }
        }

        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [open, handleClose])

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl pointer-events-auto w-full max-w-lg overflow-hidden",
                                "border border-zinc-200 dark:border-zinc-800",
                                className
                            )}
                        >
                            {closeButton && (
                                <button
                                    onClick={handleClose}
                                    className="absolute right-4 top-4 z-10 rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    aria-label="Close dialog"
                                >
                                    <X className="size-4 text-zinc-600 dark:text-zinc-400" />
                                </button>
                            )}
                            {children}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}

interface DialogHeaderProps {
    children: React.ReactNode
    className?: string
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
    return (
        <div className={cn("px-6 pt-6 pb-4", className)}>
            {children}
        </div>
    )
}

interface DialogTitleProps {
    children: React.ReactNode
    className?: string
}

export function DialogTitle({ children, className }: DialogTitleProps) {
    return (
        <h2 className={cn("text-2xl font-semibold text-zinc-900 dark:text-zinc-100", className)}>
            {children}
        </h2>
    )
}

interface DialogDescriptionProps {
    children: React.ReactNode
    className?: string
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
    return (
        <p className={cn("text-sm text-zinc-600 dark:text-zinc-400 mt-2", className)}>
            {children}
        </p>
    )
}

interface DialogBodyProps {
    children: React.ReactNode
    className?: string
}

export function DialogBody({ children, className }: DialogBodyProps) {
    return (
        <div className={cn("px-6 py-4", className)}>
            {children}
        </div>
    )
}

interface DialogFooterProps {
    children: React.ReactNode
    className?: string
}

export function DialogFooter({ children, className }: DialogFooterProps) {
    return (
        <div className={cn("px-6 pb-6 pt-4 flex items-center justify-end gap-2", className)}>
            {children}
        </div>
    )
}
