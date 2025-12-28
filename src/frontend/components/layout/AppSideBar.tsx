"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/src/frontend/lib/utils";
import { Button } from "@/src/frontend/components/ui/button";
import { ScrollArea } from "@/src/frontend/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/src/frontend/components/ui/sheet";
import { ChevronDown, ChevronRight, Menu, PanelLeftClose, PanelLeft } from "lucide-react";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    image?: string;
    role?: string;
  };
  project?: {
    name: string;
  };
  items: {
    title: string;
    href?: string;
    icon?: React.ReactNode;
    submenu?: boolean;
    subItems?: {
      title: string;
      href: string;
    }[];
  }[];
  onSignOut?: () => void;
}

export function AppSidebar({ 
  user, 
  project,
  items, 
  onSignOut
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = React.useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarCollapsed');
      return savedState === 'true';
    }
    return false;
  });
  
  // State to track if we're on the client side
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Set isMounted to true when component mounts
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Set initial state for API Keys dropdown based on pathname
  React.useEffect(() => {
    if (pathname?.startsWith('/app/api-keys')) {
      setOpenGroups(prev => ({ ...prev, 'API Keys': true }));
    }
  }, [pathname]);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleItemClick = async (
    e: React.MouseEvent,
    item: { title: string; href?: string; submenu?: boolean }
  ) => {
    if (item.submenu && item.href) {
      e.preventDefault(); // Prevent default navigation
      
      // If we're not already on the API Keys page, set the dropdown state first
      if (!pathname?.startsWith(item.href)) {
        setOpenGroups(prev => ({ ...prev, [item.title]: true }));
        // Use Next.js router for navigation
        router.push(item.href);
      }
    }
  };

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(newState));
      // Dispatch event for other components to listen
      window.dispatchEvent(new Event('storage'));
    }
  };

  // If not mounted yet, return a simple loading state or nothing
  if (!isMounted) {
    return <div className="hidden md:block relative" />;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block relative">
        <aside 
          className={cn(
            "h-[calc(100vh-4rem)] flex-col fixed top-16 bottom-0 z-50 transition-all duration-300",
            collapsed ? "w-20" : "w-64"
          )}
        >
          <div className="border-r bg-background h-full flex flex-col">
            {/* Simple header showing project name - hidden when collapsed to avoid awkward spacing */}
            {!collapsed && (
              <div className="border-b px-4 py-3">
                <p className="text-xs text-muted-foreground">Project</p>
                <p className="text-sm font-medium truncate">{project?.name ?? "Untitled project"}</p>
              </div>
            )}

            {/* Navigation */}
            <ScrollArea className="flex-1">
              <div className={cn("py-2", collapsed ? "px-1" : "px-3")}>
                {!collapsed && <h3 className="mb-2 px-4 text-xs font-medium text-muted-foreground">Platform</h3>}
                <nav className="space-y-1">
                  {items.map((item) => {
                    const isActive = item.href ? pathname === item.href : false;
                    const isOpen = openGroups[item.title] || false;
                    
                    if (item.submenu && !collapsed) {
                      // Check if any subitem is active
                      const isSubItemActive = item.subItems?.some(
                        subItem => pathname === subItem.href
                      );
                      
                      return (
                        <div key={item.title} className="space-y-1">
                          <div className="flex">
                            <Link
                              href={item.href || "#"}
                              className={cn(
                                "flex-1 flex items-center px-4 py-2 text-sm font-medium rounded-l-md",
                                (isActive || isSubItemActive)
                                  ? "bg-accent text-accent-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                              onClick={(e) => handleItemClick(e, item)}
                            >
                              <span className="flex items-center gap-3">
                                {item.icon}
                                {item.title}
                              </span>
                            </Link>
                            <Button
                              variant="ghost"
                              className={cn(
                                "px-2 py-2 rounded-l-none",
                                (isOpen || isSubItemActive) && "bg-accent text-accent-foreground"
                              )}
                              onClick={() => toggleGroup(item.title)}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          {isOpen && item.subItems && (
                            <div className="ml-4 pl-3 border-l border-border">
                              {item.subItems.map((subItem) => {
                                const isSubActive = pathname === subItem.href;
                                return (
                                  <Link
                                    key={subItem.title}
                                    href={subItem.href}
                                    className={cn(
                                      "flex items-center py-2 px-4 text-sm rounded-md",
                                      isSubActive
                                        ? "bg-accent text-accent-foreground font-medium"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                  >
                                    {subItem.title}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // For collapsed state or non-submenu items
                    const isSubItemActive = item.submenu && item.subItems?.some(
                      subItem => pathname === subItem.href
                    );
                    
                    return (
                      <Link
                        key={item.title}
                        href={item.href || "#"}
                        className={cn(
                          "flex items-center rounded-md text-sm font-medium",
                          (isActive || isSubItemActive)
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          collapsed 
                            ? "justify-center h-10 w-10 mx-auto" 
                            : "gap-3 px-4 py-2"
                        )}
                        title={collapsed ? item.title : undefined}
                      >
                        {item.icon}
                        {!collapsed && item.title}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
            
            {/* Footer actions */}
            <div className={cn("border-t", collapsed ? "p-2" : "p-4")}>
              <div className={cn("flex", collapsed ? "flex-col items-center gap-2" : "justify-between items-center")}>
                <Button variant="outline" asChild className={cn(collapsed ? "w-10 h-10 mx-auto p-0" : "w-full")}>
                  <Link href="/projects" title={collapsed ? "All projects" : undefined}>
                    {collapsed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v4" />
                        <path d="M21 3l-7 7" />
                        <path d="M3 15v4a2 2 0 0 0 2 2h4" />
                        <path d="M3 21l7-7" />
                      </svg>
                    ) : (
                      "Back to all projects"
                    )}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Toggle Button Outside Sidebar */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleSidebar} 
          className={cn(
            "fixed top-20 z-50 shadow-md border bg-background transition-all duration-300",
            collapsed ? "left-24" : "left-[270px]"
          )}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Mobile Sidebar Button */}
      <div className="md:hidden fixed top-20 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="border-r bg-card h-full flex flex-col">
              {/* No header/logo in mobile sidebar */}
              
              {/* Navigation */}
              <ScrollArea className="flex-1">
                <div className="px-3 py-2">
                  <h3 className="mb-2 px-4 text-xs font-medium text-muted-foreground">Platform</h3>
                  <nav className="space-y-1">
                    {items.map((item) => {
                      const isActive = item.href ? pathname === item.href : false;
                      const isOpen = openGroups[item.title] || false;
                      
                      if (item.submenu) {
                        return (
                          <div key={item.title} className="space-y-1">
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-between px-4 py-2 text-sm font-medium",
                                isOpen && "bg-accent text-accent-foreground"
                              )}
                              onClick={() => toggleGroup(item.title)}
                            >
                              <span className="flex items-center gap-3">
                                {item.icon}
                                {item.title}
                              </span>
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            
                            {isOpen && item.subItems && (
                              <div className="ml-4 pl-3 border-l border-border">
                                {item.subItems.map((subItem) => {
                                  const isSubActive = pathname === subItem.href;
                                  return (
                                    <Link
                                      key={subItem.title}
                                      href={subItem.href}
                                      className={cn(
                                        "flex items-center py-2 px-4 text-sm rounded-md",
                                        isSubActive
                                          ? "bg-accent text-accent-foreground font-medium"
                                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                      )}
                                    >
                                      {subItem.title}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      return (
                        <Link
                          key={item.title}
                          href={item.href || "#"}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {item.icon}
                          {item.title}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </ScrollArea>
              
              {/* Footer actions */}
              <div className="p-4 border-t">
                <div className="flex justify-between items-center">
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/projects">Back to all projects</Link>
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
} 