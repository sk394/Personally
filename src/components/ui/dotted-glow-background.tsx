"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DottedGlowBackgroundProps {
    className?: string;
    opacity?: number;
    gap?: number;
    radius?: number;
    colorLightVar?: string;
    glowColorLightVar?: string;
    colorDarkVar?: string;
    glowColorDarkVar?: string;
    backgroundOpacity?: number;
    speedMin?: number;
    speedMax?: number;
    speedScale?: number;
}

export const DottedGlowBackground: React.FC<DottedGlowBackgroundProps> = ({
    className,
    opacity = 1,
    gap = 20,
    radius = 1,
    colorLightVar = "--color-neutral-300",
    glowColorLightVar = "--color-neutral-400",
    colorDarkVar = "--color-neutral-700",
    glowColorDarkVar = "--color-sky-500",
    speedMin = 0.5,
    speedMax = 1.5,
    speedScale = 1,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check initial color scheme
        setIsDarkMode(document.documentElement.classList.contains("dark"));

        // Observe changes to the html class
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    setIsDarkMode(document.documentElement.classList.contains("dark"));
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let dots: { x: number; y: number; phase: number; speed: number }[] = [];

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                initDots();
            }
        };

        const initDots = () => {
            dots = [];
            for (let x = gap / 2; x < canvas.width; x += gap) {
                for (let y = gap / 2; y < canvas.height; y += gap) {
                    dots.push({
                        x,
                        y,
                        phase: Math.random() * Math.PI * 2,
                        speed: (speedMin + Math.random() * (speedMax - speedMin)) * speedScale,
                    });
                }
            }
        };

        const getCSSVar = (varName: string) => {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "#888888";
        };

        const draw = (time: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const dotColor = getCSSVar(isDarkMode ? colorDarkVar : colorLightVar);
            const glowColor = getCSSVar(isDarkMode ? glowColorDarkVar : glowColorLightVar);

            dots.forEach((dot) => {
                const intensity = (Math.sin(dot.phase + (time / 1000) * dot.speed) + 1) / 2;

                ctx.beginPath();
                ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = dotColor;
                ctx.globalAlpha = 0.1 + intensity * 0.4 * opacity;
                ctx.fill();

                if (intensity > 0.8) {
                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, radius * 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = glowColor;
                    ctx.globalAlpha = (intensity - 0.8) * 2 * opacity;
                    ctx.fill();
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        animationFrameId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [gap, radius, isDarkMode, colorLightVar, glowColorLightVar, colorDarkVar, glowColorDarkVar, opacity, speedMin, speedMax, speedScale]);

    return (
        <canvas
            ref={canvasRef}
            className={cn("absolute inset-0 h-full w-full", className)}
            style={{ pointerEvents: "none" }}
        />
    );
};
