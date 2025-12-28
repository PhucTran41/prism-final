"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/src/frontend/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/frontend/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/frontend/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/src/frontend/components/ui/sheet";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/src/frontend/components/common/ThemeToggle";
import { Menu, X } from "lucide-react";
import { PrismLogo } from "@/src/frontend/components/common/PrismLogo";

export function Header() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  // const isAdmin = session?.organization?.type === "admin";
  const userName = session?.user?.name || "";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "U";

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  // Navigation items based on user role
  const navItems = [
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/docs", label: "Documentation" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="border-b">
      <div className="mx-auto w-full px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center" aria-label="Prism Home">
            <PrismLogo size={24} withWordmark />
          </Link>
          
          {/* Desktop Navigation - Hidden on Mobile */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        {item.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {/* Get Started Button - Always visible */}
          <Button variant="ghost" asChild className="hidden md:block mr-2">
            <Link href="/contact">Get Started</Link>
          </Button>
          
          {/* Mobile Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className="text-lg font-medium hover:underline"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          
          {/* User Menu Dropdown - Hidden on Mobile when logged in */}
          {isLoggedIn ? (
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image || ""} alt={userName} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session?.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/projects">All projects</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center">
              <Button variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 