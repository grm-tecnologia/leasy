export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#0F0F0F]">
      {/* Sidebar skeleton */}
      <div className="w-[260px] border-r border-white/10 bg-[#0A0A0A] p-4 space-y-6 relative">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-2 h-16 border-b border-white/10">
          <div className="h-7 w-7 bg-white/5 animate-pulse" />
          <div className="h-4 w-24 bg-white/5 animate-pulse" />
        </div>

        {/* Menu items */}
        <div className="space-y-2 px-2">
          <div className="h-10 w-full bg-white/5 animate-pulse" />
          <div className="h-10 w-full bg-white/5 animate-pulse" />
          <div className="h-10 w-full bg-white/5 animate-pulse" />
          <div className="h-10 w-full bg-white/5 animate-pulse" />
        </div>

        {/* User profile area at bottom */}
        <div className="absolute bottom-4 left-4 right-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-1">
            <div className="h-9 w-9 bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-white/5 animate-pulse" />
              <div className="h-2 w-32 bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-6 space-y-6">
        <div className="h-8 w-48 bg-white/5 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="h-28 bg-white/5 animate-pulse border border-white/5" />
          <div className="h-28 bg-white/5 animate-pulse border border-white/5" />
          <div className="h-28 bg-white/5 animate-pulse border border-white/5" />
          <div className="h-28 bg-white/5 animate-pulse border border-white/5" />
        </div>
        <div className="h-64 bg-white/5 animate-pulse border border-white/5" />
      </div>
    </div>
  );
}
