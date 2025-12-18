import {
    createContext,
    useContext,
    useState,
    ReactNode,
} from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"

type ConfirmOptions = {
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
}

type ConfirmContextType = {
    confirm: (options?: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<{
        options: ConfirmOptions
        resolve?: (value: boolean) => void
    }>({
        options: {},
    })

    const confirm = (options: ConfirmOptions = {}) => {
        return new Promise<boolean>((resolve) => {
            setState({ options, resolve })
        })
    }

    const close = (value: boolean) => {
        state.resolve?.(value)
        setState({ options: {} })
    }

    return (
        <ConfirmContext.Provider value={{ confirm }
        }>
            {children}
            {
                state.resolve && (
                    <ConfirmDialog
                        {...state.options}
                        onConfirm={() => close(true)
                        }
                        onCancel={() => close(false)}
                    />
                )}
        </ConfirmContext.Provider>
    )
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext)
    if (!ctx) {
        throw new Error("useConfirm must be used within ConfirmProvider")
    }
    return ctx.confirm
}
