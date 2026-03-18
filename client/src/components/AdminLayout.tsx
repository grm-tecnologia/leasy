import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, LogOut, PanelLeft, Upload, FolderOpen,
  ShoppingCart, BarChart3, Database, DollarSign,
  ChevronDown, Users, ExternalLink, Activity,
  type LucideIcon,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "wouter";
// DashboardLayoutSkeleton removed - auth loading handled by AppRouter

type MenuItem = {
  icon: LucideIcon;
  label: string;
  path: string;
};

const adminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Upload, label: "Upload de Leads", path: "/admin/upload" },
  { icon: Database, label: "Gerenciar Leads", path: "/admin/leads" },
  { icon: FolderOpen, label: "Categorias", path: "/admin/categories" },
  { icon: DollarSign, label: "Preços", path: "/admin/pricing" },
  { icon: ShoppingCart, label: "Pedidos", path: "/admin/orders" },
  { icon: Users, label: "Usuários", path: "/admin/users" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Activity, label: "Log de Atividades", path: "/admin/activity" },
];

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // Auth check already done by AppRouter/AdminGuard - no need for loading state here
  if (!user || user.role !== "admin") return null;

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <AdminLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}

function AdminLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const activeMenuItem = useMemo(() =>
    adminMenuItems.find(
      (item) => location === item.path || (item.path !== "/admin" && location.startsWith(item.path))
    ),
    [location]
  );

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-white/[0.06] bg-[#050505]" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-white/[0.06]">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-zinc-500" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029580797/o2whmyWEnyg2xHJMbHxmnn/leasy-icon-square-6Ux6CtihddRwJ7iaPJ5QTp.webp" alt="Leasy" className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium tracking-tight text-white truncate text-sm">
                      Leasy
                    </span>
                    <span className="text-[9px] font-mono text-[#FF4500] uppercase tracking-[0.2em]">
                      Admin
                    </span>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {!isCollapsed && (
              <div className="px-4 pt-4 pb-2">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#FF4500] rounded-full" />
                  Painel Administrativo
                </span>
              </div>
            )}

            <SidebarMenu className="px-2 py-1 space-y-0.5">
              {adminMenuItems.map((item) => {
                const isActive =
                  location === item.path ||
                  (item.path !== "/admin" && location.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 rounded-lg transition-all font-normal relative ${
                        isActive
                          ? "bg-[#FF4500]/10 text-white"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#FF4500] rounded-r-full" />
                      )}
                      <item.icon className={`h-4 w-4 ${isActive ? "text-[#FF4500]" : ""}`} />
                      <span className="text-[13px]">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {/* Go to Client Store button */}
            {!isCollapsed && (
              <div className="px-3 mt-4 pt-4 border-t border-white/[0.06]">
                <button
                  onClick={() => setLocation("/dashboard")}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition-colors group"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-600 group-hover:text-[#FF4500] transition-colors" />
                  <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest transition-colors">
                    Visão Cliente
                  </span>
                </button>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="p-2 border-t border-white/[0.06]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 rounded-lg border border-white/[0.08] shrink-0">
                    <AvatarFallback className="text-xs font-mono bg-[#FF4500]/15 text-[#FF4500] rounded-lg">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-white">
                      {user?.name || "-"}
                    </p>
                    <p className="text-[9px] font-mono text-zinc-600 truncate mt-1 uppercase tracking-[0.2em]">
                      Administrador
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-600 shrink-0 group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0A0A0A] border-white/[0.08]">
                <DropdownMenuItem
                  onClick={() => setLocation("/dashboard")}
                  className="cursor-pointer text-zinc-400 hover:text-white focus:text-white focus:bg-white/5"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Visão Cliente</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-zinc-400 hover:text-white focus:text-white focus:bg-white/5"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#FF4500]/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b border-white/[0.06] h-14 items-center justify-between bg-[#050505]/95 px-4 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9" />
              <span className="text-sm font-medium text-white">
                {activeMenuItem?.label ?? "Admin"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 bg-[#0F0F0F] min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
