"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Plus, Trash2, TrendingDown, Wallet, CreditCard, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, query, orderBy } from "firebase/firestore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Expense {
    id: string;
    name: string;
    amount: number;
    date: string;
    type: "Mine" | "Food" | "Family";
}

const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function Calculator() {
    const [appTitle, setAppTitle] = useState("Expenzerz");
    const [selectedMonth, setSelectedMonth] = useState<string>("");

    // Dialog States
    const [showResetDialog, setShowResetDialog] = useState(false);

    // Firebase
    const [salary, setSalary] = useState<number>(0);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    const [newName, setNewName] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newType, setNewType] = useState<"Mine" | "Food" | "Family">("Mine");

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // 1. Initialize Month & Listen to Firestore
    useEffect(() => {
        // Initialize Month safely
        const now = new Date();
        const currentMonth = monthNames[now.getMonth()];
        setSelectedMonth(currentMonth);

        // Listen for Salary
        const unsubSalary = onSnapshot(doc(db, "config", "main"), (doc) => {
            if (doc.exists()) {
                setSalary(doc.data().salary || 0);
            }
        });

        // Listen for Expenses
        const q = query(collection(db, "expenses"), orderBy("date", "desc"));
        const unsubExpenses = onSnapshot(q, (snapshot) => {
            const expenseData: Expense[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Expense));
            setExpenses(expenseData);
        });

        return () => {
            unsubSalary();
            unsubExpenses();
        };
    }, []);

    const history = useMemo(() => {
        return Array.from(new Set(expenses.map(e => e.name))).filter(Boolean);
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        if (!selectedMonth) return expenses;
        const monthIndex = monthNames.indexOf(selectedMonth);
        if (monthIndex === -1) return expenses;
        const monthStr = String(monthIndex + 1).padStart(2, '0');

        return expenses.filter(e => {
            const expenseMonth = e.date.split('-')[1];
            return expenseMonth === monthStr;
        });
    }, [expenses, selectedMonth]);

    const totalExpense = useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    }, [filteredExpenses]);

    const aggregatedExpenses = useMemo(() => {
        const acc: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            acc[e.name] = (acc[e.name] || 0) + e.amount;
        });
        return Object.entries(acc)
            .sort(([, a], [, b]) => b - a);
    }, [filteredExpenses]);

    const remaining = salary - totalExpense;

    // --- Actions ---

    const handleResetConfirm = async () => {
        // Delete all expenses
        const batch = []; // Note: Firestore batch has a limit, but for this demo we'll iterate
        // Ideally use a backend function for massive deletes, but simple loop here
        for (const expense of expenses) {
            await deleteDoc(doc(db, "expenses", expense.id));
        }
        // Reset salary
        await setDoc(doc(db, "config", "main"), { salary: 0 });
        setShowResetDialog(false);
    };

    const handleMonthChangeRequest = (val: string) => {
        setSelectedMonth(val);
    };

    const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value) || 0;
        // Local state update only
        setSalary(val);
    };

    const handleSalaryBlur = async () => {
        // Persist to Firestore only when user leaves the field
        await setDoc(doc(db, "config", "main"), { salary: salary }, { merge: true });
    };

    const addExpense = async () => {
        if (!newName || !newAmount) return;

        const dateStr = getLocalDateString();

        const newExpenseData = {
            name: newName,
            amount: Number(newAmount) || 0,
            date: dateStr,
            type: newType,
        };

        try {
            await addDoc(collection(db, "expenses"), newExpenseData);
            setNewName("");
            setNewAmount("");
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    };

    const removeExpense = async (id: string) => {
        try {
            await deleteDoc(doc(db, "expenses", id));
        } catch (e) {
            console.error("Error removing document: ", e);
        }
    };

    const [showSuggestions, setShowSuggestions] = useState(false);

    // Filter history based on input
    const filteredHistory = useMemo(() => {
        if (!newName) return history;
        return history.filter(h => h.toLowerCase().includes(newName.toLowerCase()));
    }, [history, newName]);

    return (
        <div className="min-h-screen text-white font-sans selection:bg-purple-500/30 p-4 md:p-8 pb-32">
            <ConfirmDialog
                isOpen={showResetDialog}
                onClose={() => setShowResetDialog(false)}
                onConfirm={handleResetConfirm}
                title="Reset History"
                description="Are you sure you want to delete ALL expense history? This action cannot be undone."
                confirmText="Delete Everything"
                type="danger"
            />

            {/* Header Section */}
            <header className="mb-12 pt-8">
                <div className="flex flex-col gap-6 items-center">
                    <input
                        type="text"
                        value={appTitle}
                        onChange={(e) => setAppTitle(e.target.value)}
                        className="w-full text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 tracking-tight text-center bg-transparent border-none outline-none"
                    />
                    <div className="flex flex-col md:flex-row items-center gap-2 text-gray-400 font-light relative z-50">
                        <span className="text-sm md:text-lg">Advanced Expense Tracker</span>
                        <div className="hidden md:block h-4 w-[1px] bg-gray-700 mx-2"></div>
                        <div className="w-40 relative">
                            <Select
                                value={selectedMonth}
                                onChange={(val) => handleMonthChangeRequest(val)}
                                options={monthNames}
                                variant="ghost"
                                isHeader
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Flattened Grid for Custom Ordering */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

                {/* 1. Income */}
                <section className="lg:col-span-7 order-1 glass p-6 rounded-3xl space-y-4 h-fit">
                    <h2 className="text-xl font-bold text-gradient flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-purple-400" /> Income
                    </h2>
                    <Input
                        label="Monthly Salary"
                        value={salary || ""}
                        onChange={handleSalaryChange}
                        onBlur={handleSalaryBlur}
                        onKeyDown={(e) => ["ArrowUp", "ArrowDown"].includes(e.key) && e.preventDefault()}
                        type="number"
                        startAdornment={<span className="text-green-400 font-mono text-lg">₹</span>}
                        className="text-lg font-mono text-green-400 [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </section>

                {/* 2. Remaining Balance */}
                <motion.div
                    className="lg:col-span-5 order-2 glass-card p-8 rounded-[2.5rem] relative overflow-hidden text-center space-y-2 h-fit"
                    layout
                >
                    <h3 className="text-gray-400 uppercase tracking-widest text-xs font-semibold">Remaining Balance</h3>
                    <motion.div
                        className={cn(
                            "text-5xl lg:text-6xl font-black tracking-tighter",
                            remaining >= 0 ? "text-white" : "text-red-500"
                        )}
                        key={remaining}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <span className="text-2xl align-top opacity-50 mr-1">₹</span>
                        {remaining.toLocaleString()}
                    </motion.div>
                </motion.div>

                {/* 3. Usage Breakdown */}
                <div className="lg:col-span-5 lg:col-start-8 lg:row-start-2 order-3 glass p-6 rounded-3xl space-y-4 h-fit">
                    <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" /> Usage Breakdown
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {aggregatedExpenses.length === 0 && (
                            <div className="text-sm text-gray-500 italic text-center py-4">No data for this month</div>
                        )}
                        {aggregatedExpenses.map(([name, amount], idx) => {
                            const percent = salary > 0 ? (amount / salary) * 100 : 0;
                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300 font-medium">{name}</span>
                                        <span className="text-white font-mono">₹{amount.toLocaleString()} <span className="text-xs text-gray-500">({percent.toFixed(1)}%)</span></span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(percent, 100)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center text-sm">
                        <span className="text-gray-400">Total Expenses</span>
                        <span className="text-xl font-bold text-red-400">₹{totalExpense.toLocaleString()}</span>
                    </div>
                </div>

                {/* 4. Expenses Section */}
                <section className="lg:col-span-7 lg:col-start-1 lg:row-start-2 order-4 glass p-6 rounded-3xl space-y-6 flex flex-col h-[700px] lg:h-[600px] relative">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gradient flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-pink-400" /> Expenses
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowResetDialog(true)}
                                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2 text-sm font-medium group"
                                title="Delete all expense history"
                            >
                                <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                                <span><span className="sm:hidden">Reset</span><span className="hidden sm:inline">Reset History</span></span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Add Form */}
                    <div className="pt-2 pb-6 border-b border-white/10 bg-[#0F0F11]/40 backdrop-blur-xl z-40 relative rounded-t-3xl">
                        <div className="flex flex-col md:flex-row gap-3 items-end">
                            {/* Custom Autocomplete Categories */}
                            <div className="md:flex-1 w-full relative z-50">
                                <Input
                                    label="Category"
                                    value={newName}
                                    onChange={(e) => {
                                        setNewName(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    // Delay hiding to allow click event on suggestion
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    autoComplete="off"
                                />
                                <AnimatePresence>
                                    {showSuggestions && filteredHistory.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[115px] overflow-y-auto custom-scrollbar"
                                        >
                                            {filteredHistory.map((item) => (
                                                <button
                                                    key={item}
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault(); // Prevent blur
                                                        setNewName(item);
                                                        setShowSuggestions(false);
                                                    }}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="w-full md:w-[140px] relative z-40">
                                <Select
                                    label="Type"
                                    options={["Mine", "Food", "Family"]}
                                    value={newType}
                                    onChange={(val) => setNewType(val as any)}
                                />
                            </div>

                            <div className="w-full md:w-[140px]">
                                <Input
                                    label="Amount"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                    onKeyDown={(e) => ["ArrowUp", "ArrowDown"].includes(e.key) && e.preventDefault()}
                                    type="number"
                                    startAdornment={<span className="text-gray-500">₹</span>}
                                    className="[&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>

                            <button
                                onClick={addExpense}
                                disabled={!newName || !newAmount}
                                className="w-full md:w-[52px] h-[52px] bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/25 active:scale-95 shrink-0"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Expense List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar md:pr-2 space-y-3 pb-4">
                        <AnimatePresence mode="popLayout">
                            {filteredExpenses.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-12 text-gray-600 gap-4"
                                >
                                    <div className="relative w-40 h-40">
                                        <Image
                                            src="/empty-state.png"
                                            alt="No expenses"
                                            fill
                                            className="object-contain opacity-80"
                                            priority
                                        />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500/80 uppercase tracking-widest">No expenses yet</p>
                                </motion.div>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <motion.div
                                        key={expense.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                        className="group relative glass-card p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors border border-white/5 hover:border-purple-500/30"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border border-white/10 shadow-inner",
                                                expense.type === "Mine" ? "bg-blue-500/20 text-blue-400" :
                                                    expense.type === "Food" ? "bg-orange-500/20 text-orange-400" :
                                                        "bg-pink-500/20 text-pink-400"
                                            )}>
                                                {expense.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">{expense.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        {/* <Calendar className="w-3 h-3" /> */}
                                                        {expense.date}
                                                    </span>
                                                    <span>•</span>
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border",
                                                        expense.type === "Mine" ? "border-blue-500/30 text-blue-400" :
                                                            expense.type === "Food" ? "border-orange-500/30 text-orange-400" :
                                                                "border-pink-500/30 text-pink-400"
                                                    )}>
                                                        {expense.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-bold font-mono text-white">
                                                ₹{expense.amount.toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() => removeExpense(expense.id)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </div >
    );
}
