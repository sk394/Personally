import React, { useState, createContext, useContext } from "react"
import { Plus, X } from "lucide-react"

const Context = createContext<{
    status: string
    setStatus: React.Dispatch<React.SetStateAction<string>>
}>({ status: "", setStatus: () => null })

export interface ActionItem {
    id: string
    icon: React.ReactNode
    name: string
    onClick?: () => void
}

interface CreateNewBoxTheme {
    // Container colors
    containerBg?: string
    containerBgDark?: string
    containerText?: string
    containerTextDark?: string
    containerRing?: string

    // Button colors
    buttonBg?: string
    buttonBgDark?: string
    buttonText?: string
    buttonTextDark?: string
    buttonHoverBg?: string
    buttonHoverBgDark?: string

    // Close button colors
    closeBtnBg?: string
    closeBtnBgDark?: string
    closeBtnIcon?: string

    // Action item colors
    itemBg?: string
    itemBgDark?: string
    itemHoverBg?: string
    itemHoverBgDark?: string
    itemText?: string
    itemTextDark?: string

    // Inner panel
    panelBg?: string
    panelBgDark?: string
}

interface CreateNewBoxProps {
    actions: ActionItem[]
    onActionClick?: (action: ActionItem) => void
    label?: string
    theme?: CreateNewBoxTheme
}

function InnerContent({ actions, onActionClick, label = "Create New", theme = {} }: CreateNewBoxProps) {
    const ctx = useContext(Context)
    const isOpen = ctx.status === "open"
    const isHovered = ctx.status === "hovered"

    const handleActionItemClick = (item: ActionItem) => {
        if (onActionClick) {
            onActionClick(item)
        }
        ctx.setStatus("idle")
    }

    // Default theme values
    const t = {
        containerBg: theme.containerBg || "bg-[#f7f6ef]",
        containerBgDark: theme.containerBgDark || "dark:bg-black",
        containerText: theme.containerText || "text-[#6b6967]",
        containerTextDark: theme.containerTextDark || "dark:text-white",
        containerRing: theme.containerRing || "ring-2 ring-black/[8%]",

        buttonBg: theme.buttonBg || "bg-[#fafafa]",
        buttonBgDark: theme.buttonBgDark || "dark:bg-black",
        buttonText: theme.buttonText || "text-[#202020]",
        buttonTextDark: theme.buttonTextDark || "dark:text-white",
        buttonHoverBg: theme.buttonHoverBg || "hover:bg-[#e0deda]",
        buttonHoverBgDark: theme.buttonHoverBgDark || "dark:hover:bg-gray-800",

        closeBtnBg: theme.closeBtnBg || "bg-[#b8b6af]",
        closeBtnBgDark: theme.closeBtnBgDark || "dark:bg-transparent",
        closeBtnIcon: theme.closeBtnIcon || "text-[#fafafa]",

        itemBg: theme.itemBg || "bg-[#fefefe]",
        itemBgDark: theme.itemBgDark || "dark:bg-black",
        itemHoverBg: theme.itemHoverBg || "hover:bg-[#f6f4f0]",
        itemHoverBgDark: theme.itemHoverBgDark || "dark:hover:bg-gray-700",
        itemText: theme.itemText || "text-[#6b6967]",
        itemTextDark: theme.itemTextDark || "dark:text-white",

        panelBg: theme.panelBg || "bg-[#fafafa]",
        panelBgDark: theme.panelBgDark || "dark:bg-black",
    }

    return (
        <div className="relative">
            {isOpen || isHovered ? (
                <div
                    style={{ borderRadius: 22 }}
                    className={`${t.containerBg} tracking-tight ${t.containerText} shadow-lg ${t.containerRing} ${t.containerBgDark} ${t.containerTextDark} dark:border dark:border-gray-800 transition-all duration-300 ease-out`}
                >
                    <div className="flex w-full items-center justify-between py-2.5 pl-5 pr-2.5">
                        <span className="relative">
                            {label}
                        </span>
                        <div className="relative">
                            {isHovered && (
                                <p className="absolute -left-11 top-0.5 text-sm text-[#6b6967]/70 transition-opacity duration-200">
                                    Close
                                </p>
                            )}
                            <button
                                onClick={() => ctx.setStatus("idle")}
                                onMouseEnter={() => ctx.setStatus("hovered")}
                                onMouseLeave={() => ctx.setStatus("open")}
                                className={`size-6 flex items-center justify-center rounded-full ${t.closeBtnBg} ${t.closeBtnBgDark} hover:scale-90 active:scale-75 transition-transform duration-200`}
                            >
                                <X
                                    strokeWidth={4}
                                    className={`size-4 ${t.closeBtnIcon}`}
                                />
                            </button>
                        </div>
                    </div>
                    <div
                        className={`flex flex-col gap-2.5 rounded-[22px] ${t.panelBg} p-2.5 shadow-[0_-3px_3px_-1.5px_rgba(0,0,0,0.08)] ring-1 ring-black/[8%] ${t.panelBgDark} dark:border dark:border-gray-800 transition-all duration-300 ${isHovered ? 'scale-95 opacity-95' : 'scale-100 opacity-100'
                            }`}
                    >
                        <div className="grid grid-cols-3 gap-2.5">
                            {actions.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleActionItemClick(item)}
                                    className={`size-24 grid cursor-pointer place-items-center rounded-2xl ${t.itemBg} transition-all duration-200 ease-in-out ${t.itemHoverBg} ${t.itemHoverBgDark} hover:scale-105 active:scale-90 ${t.itemBgDark} dark:shadow-xl dark:border dark:border-gray-900`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        {item.icon}
                                        <p className={`text-xs ${t.itemText} ${t.itemTextDark}`}>{item.name}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => ctx.setStatus("open")}
                    style={{ borderRadius: 22 }}
                    className={`flex items-center gap-1.5 ${t.buttonBg} px-5 py-2.5 tracking-tight ${t.buttonText} shadow-lg ring-1 ring-black/[8%] transition-all duration-200 ${t.buttonHoverBg} hover:scale-105 active:scale-95 active:shadow-none ${t.buttonBgDark} ${t.buttonTextDark} dark:border dark:border-gray-700 ${t.buttonHoverBgDark}`}
                >
                    <Plus strokeWidth={1} />
                    {label}
                </button>
            )}
        </div>
    )
}

export function CreateNewProjectBox({ actions, onActionClick, label, theme }: CreateNewBoxProps) {
    const [status, setStatus] = useState("idle")

    return (
        <Context.Provider value={{ status, setStatus }}>
            <InnerContent actions={actions} onActionClick={onActionClick} label={label} theme={theme} />
        </Context.Provider>
    )
}