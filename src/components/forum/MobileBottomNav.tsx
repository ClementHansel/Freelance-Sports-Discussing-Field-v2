// src/components/forum/MobileBottomNav.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SharedMenuContent } from "./SharedMenuContent";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { QuickTopicModal } from "./QuickTopicModal";

export default function MobileBottomNav() {
  const pathname = usePathname(); // Initialize usePathname
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickTopicModalOpen, setQuickTopicModalOpen] = useState(false); // New state for QuickTopicModal

  const navItems = [
    { icon: Home, label: "Home", href: "/", active: pathname === "/" },
    {
      icon: Search,
      label: "Search",
      href: "/search",
      active: pathname === "/search",
    },
    // The 'Create' item will now directly open the modal via state
    { icon: Plus, label: "Create", href: "#", active: false, isCreate: true },
    {
      icon: User,
      label: user ? "Profile" : "Login",
      href: user ? "/profile" : "/login",
      active: pathname === (user ? "/profile" : "/login"),
    },
    { icon: Menu, label: "Menu", href: "#", active: false, isMenu: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center justify-center h-12 w-12 p-1 ${
              item.active
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
            // asChild is only needed for Link or SheetTrigger, not for direct onClick
            asChild={!item.isMenu && !item.isCreate}
            // If it's the create button, handle click to open modal
            onClick={
              item.isCreate ? () => setQuickTopicModalOpen(true) : undefined
            }
          >
            {item.isCreate ? (
              // No longer passing a 'trigger' prop, the button itself handles opening
              <div className="flex flex-col items-center">
                <item.icon className="h-5 w-5 mb-0.5" />
                <span className="text-xs">{item.label}</span>
              </div>
            ) : item.isMenu ? (
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <div className="flex flex-col items-center">
                    <item.icon className="h-5 w-5 mb-0.5" />
                    <span className="text-xs">{item.label}</span>
                  </div>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <SharedMenuContent onNavigate={() => setMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              // For regular navigation items
              <Link href={item.href}>
                <item.icon className="h-5 w-5 mb-0.5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )}
          </Button>
        ))}
      </div>

      {/* QuickTopicModal is now rendered here, controlled by state */}
      <QuickTopicModal
        isOpen={quickTopicModalOpen}
        onClose={() => setQuickTopicModalOpen(false)}
        // preselectedCategoryId can be passed if needed, otherwise omit
      />
    </nav>
  );
}
