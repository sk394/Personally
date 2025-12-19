import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { CreateNewProjectDialog } from "@/features/project/create-new-project-dialog";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
    ChevronDown,
    Circle,
    Laptop,
    Paperclip,
    Plus,
    Bot,
    Send,
    User,
    FolderKanban,
    ChevronRight,
    Folders,
    AudioLines,
} from "lucide-react";
import { useRef, useState } from "react";

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading?: boolean;
    projects?: Array<{ id: string; title: string }>;
    selectedProject?: string | null;
    onProjectChange?: (projectId: string | null) => void;
}

export default function ChatInput({
    input,
    setInput,
    onSubmit,
    isLoading = false,
    projects = [],
    selectedProject,
    onProjectChange
}: ChatInputProps) {
    const [newProjectOpen, setNewProjectOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState("Agent");
    const [autoMode, setAutoMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedProjectTitle = projects.find(p => p.id === selectedProject)?.title || "Select Project";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSubmit(e);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                        // Handle file upload
                        console.log("Files selected:", e.target.files);
                    }}
                />

                <div className="px-3 pt-3 pb-2 grow">
                    <form onSubmit={handleSubmit}>
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything"
                            className="w-full bg-transparent! p-0 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder-muted-foreground resize-none border-none outline-none text-sm min-h-10 max-h-[25vh]"
                            rows={1}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height = target.scrollHeight + "px";
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                    </form>
                </div>

                <div className="mb-2 px-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 rounded-full border border-border hover:bg-accent"
                                >
                                    <Plus className="size-3" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="start"
                                className="max-w-xs rounded-2xl p-1.5"
                            >
                                <DropdownMenuGroup className="space-y-1">
                                    <DropdownMenuItem
                                        className="rounded-[calc(1rem-6px)] text-xs"
                                        onClick={() => {
                                            alert("Image upload is not implemented yet.");
                                        }}
                                    // onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Paperclip size={16} className="opacity-60" />
                                        Attach Files
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="rounded-[calc(1rem-6px)] text-xs"
                                        onClick={() => {
                                            alert("Voice mode is not implemented yet.");
                                        }}
                                    >
                                        <AudioLines size={16} className="opacity-60" />
                                        Voice Mode
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {projects.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setAutoMode(!autoMode)}
                                        className={cn(
                                            "h-7 px-2 pl-1 rounded-full border border-border hover:bg-accent ",
                                            {
                                                "bg-primary/10 text-primary border-primary/30": autoMode,
                                                "text-muted-foreground": !autoMode,
                                            }
                                        )}
                                    >
                                        <FolderKanban className="size-3" />
                                        <span className="text-xs">{selectedProjectTitle}</span>
                                        <ChevronDown className="size-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="max-w-xs rounded-2xl p-1.5 bg-popover border-border"
                                >
                                    <DropdownMenuGroup className="space-y-1">
                                        <DropdownMenuItem
                                            className="rounded-[calc(1rem-6px)] text-xs"
                                            onClick={() => onProjectChange?.(null)}
                                        >
                                            <Circle size={16} className="opacity-60" />
                                            No Project
                                        </DropdownMenuItem>
                                        {projects.map((project) => (
                                            <DropdownMenuItem
                                                key={project.id}
                                                className="rounded-[calc(1rem-6px)] text-xs"
                                                onClick={() => onProjectChange?.(project.id)}
                                            >
                                                <FolderKanban size={16} className="opacity-60" />
                                                {project.title}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>)
                        }
                    </div>

                    <div>
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="size-7 p-0 rounded-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSubmit}
                        >
                            <Send className="size-3 fill-primary" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-0 pt-2">
                <div>
                    <Link to="/dashboard/projects">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 rounded-full border border-transparent hover:bg-accent text-muted-foreground text-xs"
                        >
                            <Folders className="size-3" />
                            <span>Projects</span>
                            <ChevronRight className="size-3" />
                        </Button>
                    </Link>
                </div>
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 rounded-full border border-transparent hover:bg-accent text-muted-foreground text-xs"
                        onClick={() => setNewProjectOpen(true)}
                    >
                        <Laptop className="size-3" />
                        <span>New Project</span>
                        <ChevronRight className="size-3" />
                    </Button>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 rounded-full border border-transparent hover:bg-accent text-muted-foreground text-xs"
                        >
                            <User className="size-3" />
                            <span>{selectedAgent}</span>
                            <ChevronDown className="size-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="max-w-xs rounded-2xl p-1.5 bg-popover border-border"
                    >
                        <DropdownMenuGroup className="space-y-1">
                            <DropdownMenuItem
                                className="rounded-[calc(1rem-6px)] text-xs"
                                onClick={() => setSelectedAgent("ChatGPT")}
                            >
                                <User size={16} className="opacity-60" />
                                ChatGPT
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="rounded-[calc(1rem-6px)] text-xs"
                                onClick={() => setSelectedAgent("Gemini")}
                            >
                                <Bot size={16} className="opacity-60" />
                                Gemini
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex-1" />
            </div>
            <CreateNewProjectDialog
                open={newProjectOpen}
                onOpenChange={setNewProjectOpen}
            />
        </div>
    );
}
