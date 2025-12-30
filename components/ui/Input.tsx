"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    wrapperClassName?: string;
    startAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, wrapperClassName, startAdornment, type = "text", ...props }, ref) => {
        return (
            <div className={cn("relative group", wrapperClassName)}>
                {startAdornment && (
                    <div className="absolute left-4 top-[55%] -translate-y-1/2 z-10 pointer-events-none">
                        {startAdornment}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "peer w-full bg-white/5 border border-white/10 rounded-xl px-4 pt-7 pb-3 text-white outline-none transition-all duration-300 focus:bg-white/10 focus:border-purple-500/50 placeholder-transparent",
                        startAdornment && "pl-10",
                        className
                    )}
                    placeholder={label}
                    ref={ref}
                    {...props}
                />
                <label
                    className={cn(
                        "absolute top-4 text-xs text-gray-400 transition-all duration-300 pointer-events-none",
                        "peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500",
                        "peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-purple-400",
                        startAdornment ? "left-10 peer-placeholder-shown:left-10" : "left-4"
                    )}
                >
                    {label}
                </label>
            </div>
        );
    }
);
Input.displayName = "Input";
