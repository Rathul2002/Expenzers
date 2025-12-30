"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    label?: string;
    placeholder?: string;
    className?: string;
    variant?: "default" | "ghost";
    isHeader?: boolean;
}

export function Select({
    value,
    onChange,
    options,
    label,
    placeholder = "Select...",
    className,
    variant = "default",
    isHeader = false,
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = value || placeholder;

    return (
        <div
            ref={containerRef}
            className={cn("relative z-30", className)} // Added z-30 to ensure it's above other elements
        >
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between transition-all duration-300 outline-none group",
                    variant === "default" && "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white hover:bg-white/10 focus:border-purple-500/50",
                    variant === "ghost" && "bg-transparent border border-transparent rounded-full px-3 py-1.5 text-purple-300 hover:bg-white/5 hover:border-white/10"
                )}
            >
                <div className="flex flex-col items-start gap-0.5">
                    {label && variant === "default" && (
                        <span className={cn(
                            "text-[10px] uppercase tracking-wider font-semibold transition-colors",
                            isOpen ? "text-purple-400" : "text-gray-500"
                        )}>
                            {label}
                        </span>
                    )}
                    <span className={cn(
                        "font-medium truncate",
                        variant === "ghost" ? "text-sm uppercase tracking-wide" : "text-sm"
                    )}>
                        {selectedLabel}
                    </span>
                </div>
                <ChevronDown
                    className={cn(
                        "transition-transform duration-300",
                        variant === "ghost" ? "w-3 h-3 ml-2 opacity-50" : "w-4 h-4 text-gray-400 group-hover:text-white",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={cn(
                            "absolute left-0 mt-2 w-full min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-[#121214]/95 backdrop-blur-xl shadow-2xl z-50",
                            isHeader && "left-1/2 -translate-x-1/2" // Center align for header
                        )}
                    >
                        <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                            {options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                                        value === option
                                            ? "bg-purple-500/20 text-purple-200 font-medium"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <span>{option}</span>
                                    {value === option && (
                                        <Check className="w-3.5 h-3.5 text-purple-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
