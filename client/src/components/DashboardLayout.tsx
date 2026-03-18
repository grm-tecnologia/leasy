import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, LogOut, PanelLeft, Upload, FolderOpen,
  Search, ShoppingCart, History, BarChart3, Database, DollarSign,
  ArrowRight, ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

type MenuItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: string;
};

const adminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Upload, label: "Upload de Leads", path: "/admin/upload" },
  { icon: Database, label: "Gerenciar Leads", path: "/admin/leads" },
  { icon: FolderOpen, label: "Categorias", path: "/admin/categories" },
  { icon: DollarSign, label: "Preços", path: "/admin/pricing" },
  { icon: ShoppingCart, label: "Pedidos", path: "/admin/orders" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
];

const clientMenuItems: MenuItem[] = [
  { icon: Search, label: "Explorar Leads", path: "/explore" },
  { icon: Database, label: "Busca Global", path: "/search" },
  { icon: ShoppingCart, label: "Meu Carrinho", path: "/cart" },
  { icon: History, label: "Meus Pedidos", path: "/orders" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          {/* Subtle background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#FF4500]/5 rounded-full blur-[120px]" />
          </div>
          <div className="flex flex-col items-center gap-4 relative">
            <div className="flex items-center gap-3 mb-4">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029580797/o2whmyWEnyg2xHJMbHxmnn/leasy-icon-square-6Ux6CtihddRwJ7iaPJ5QTp.webp" alt="Leasy" className="h-11 w-11 rounded-xl" />
              <span className="text-2xl font-light tracking-tight text-white">Leasy</span>
            </div>
            <h1 className="text-xl font-light tracking-tight text-center text-white">
              Faça login para continuar
            </h1>
            <p className="text-xs font-mono text-zinc-500 text-center max-w-sm uppercase tracking-widest">
              Acesse a plataforma para explorar e comprar listas de leads segmentados.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            className="w-full bg-[#FF4500] hover:bg-[#FF4500]/90 text-white border-0 py-3 text-[10px] uppercase tracking-widest font-medium rounded-lg relative"
          >
            Entrar
            <ArrowRight className="h-3.5 w-3.5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const isAdmin = user?.role === "admin";
  const menuItems = useMemo(() => (isAdmin ? adminMenuItems : clientMenuItems), [isAdmin]);
  const activeMenuItem = menuItems.find(
    (item) => location === item.path || (item.path !== "/" && location.startsWith(item.path))
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
          {/* Header with logo */}
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
                  <span className="font-medium tracking-tight text-white truncate">
                    Leasy
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {/* Admin section label */}
            {isAdmin && !isCollapsed && (
              <div className="px-4 pt-4 pb-2">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#FF4500] rounded-full" />
                  Administração
                </span>
              </div>
            )}

            <SidebarMenu className="px-2 py-1 space-y-0.5">
              {menuItems.map((item) => {
                const isActive =
                  location === item.path ||
                  (item.path !== "/" && item.path !== "/admin" && location.startsWith(item.path));
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
                      {/* Active indicator bar */}
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

            {/* Admin can also access client view */}
            {isAdmin && (
              <>
                {!isCollapsed && (
                  <div className="px-4 pt-5 pb-2 border-t border-white/[0.06] mt-3">
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600">
                      Visão Cliente
                    </span>
                  </div>
                )}
                {isCollapsed && <div className="border-t border-white/[0.06] mt-3 mb-1" />}
                <SidebarMenu className="px-2 py-1 space-y-0.5">
                  {clientMenuItems.map((item) => {
                    const isActive = location === item.path;
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
              </>
            )}
          </SidebarContent>

          {/* Footer with user profile */}
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
                      {user?.role === "admin" ? "Administrador" : "Cliente"}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-600 shrink-0 group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0A0A0A] border-white/[0.08]">
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

        {/* Resize handle */}
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
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 bg-[#0F0F0F] min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
