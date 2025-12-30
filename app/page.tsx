import Calculator from "@/components/Calculator";

export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center py-12 px-4 selection:bg-pink-500/30">
            <div className="w-full max-w-5xl mx-auto space-y-8">
                <Calculator />
            </div>
        </main>
    );
}
