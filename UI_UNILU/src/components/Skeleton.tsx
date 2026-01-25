export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
    );
}

export function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Banner Skeleton */}
            <div className="h-64 rounded-[40px] bg-gray-100 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200/50 to-transparent" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-32 rounded-[32px]" />
                <Skeleton className="h-32 rounded-[32px]" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Timeline Skeleton */}
                <div className="xl:col-span-2 space-y-6">
                    <Skeleton className="h-12 w-48" />
                    <div className="space-y-4">
                        <Skeleton className="h-24 rounded-3xl" />
                        <Skeleton className="h-24 rounded-3xl" />
                        <Skeleton className="h-24 rounded-3xl" />
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-6">
                    <Skeleton className="h-64 rounded-[40px]" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-24 rounded-[32px]" />
                        <Skeleton className="h-24 rounded-[32px]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
