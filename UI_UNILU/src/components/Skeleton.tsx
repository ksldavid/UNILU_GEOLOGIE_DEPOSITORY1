export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-slate-100 rounded-lg relative overflow-hidden ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="p-10 space-y-12 max-w-7xl mx-auto">
            {/* Banner Skeleton */}
            <div className="h-80 rounded-[50px] bg-slate-100 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200/50 to-transparent" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Skeleton className="h-40 rounded-[40px]" />
                <Skeleton className="h-40 rounded-[40px]" />
                <Skeleton className="h-40 rounded-[40px]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content Skeleton */}
                <div className="lg:col-span-2 space-y-10">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <div className="space-y-6">
                        <Skeleton className="h-32 rounded-[36px]" />
                        <Skeleton className="h-32 rounded-[36px]" />
                        <Skeleton className="h-32 rounded-[36px]" />
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-10">
                    <Skeleton className="h-80 rounded-[50px]" />
                    <Skeleton className="h-40 rounded-[40px]" />
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
}
