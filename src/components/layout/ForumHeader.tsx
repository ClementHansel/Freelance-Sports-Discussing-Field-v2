"use client"; // This component uses client-side hooks like useState, so it must be a Client Component

import React, { useState } from "react";
import Link from "next/link"; // Replaced react-router-dom Link with next/link
import { useRouter } from "next/navigation"; // Replaced useNavigate with useRouter
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, User, Settings, Shield, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // Assuming useAuth is a client-side hook
import { useIsMobile } from "@/hooks/use-mobile"; // Assuming useIsMobile is a client-side hook
import { SharedMenuContent } from "../forum/SharedMenuContent"; // Adjust path if SharedMenuContent is elsewhere
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ForumHeader() {
  const { user, signOut, isAdmin } = useAuth();
  const router = useRouter(); // Initialize useRouter
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");

  // --- DEBUGGING: Log isMobile status and window width ---
  console.log("ForumHeader Debug:", {
    isMobile,
    innerWidth: typeof window !== "undefined" ? window.innerWidth : "N/A",
  });
  // --- END DEBUGGING ---

  const handleSignOut = async () => {
    await signOut();
    router.push("/"); // Use router.push for programmatic navigation
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`); // Use router.push
      setSearchTerm("");
    }
  };

  const MobileNav = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Corrected state variable name

    return (
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        {" "}
        {/* Corrected onOpenChange handler */}
        <SheetTrigger asChild>
          {/* Reverted span back to Button */}
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[90vw] max-w-sm p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Search in mobile menu */}
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search forums..."
                    className="pl-10 pr-4"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </form>
                <SharedMenuContent
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <header className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs sm:text-sm">
                MHT
              </span>
            </div>
            <span className="font-bold text-base sm:text-lg text-foreground hidden xs:block">
              Minor Hockey Talks
            </span>
            <span className="font-bold text-sm text-foreground xs:hidden">
              MHT
            </span>
          </Link>

          {/* Desktop Search */}
          {!isMobile && (
            <div className="flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search forums..."
                  className="pl-10 pr-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>
          )}

          {/* Desktop User Actions */}
          {!isMobile ? (
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      {/* Reverted span back to Button */}
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="text-red-600">
                              <span>
                                <Shield className="mr-2 h-4 w-4" />
                                Admin Panel
                              </span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/login">
                      <span>Sign In</span>
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register">
                      <span>Register</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Mobile Navigation */
            // Re-enabled MobileNav
            <MobileNav />
          )}
        </div>
      </div>
    </header>
  );
}
