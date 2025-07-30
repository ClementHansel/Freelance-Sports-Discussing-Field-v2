// src/components/forum/SharedMenuContent.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCategories, Category } from "@/hooks/useCategories"; // Import Category type

interface SharedMenuContentProps {
  onNavigate: () => void; // Callback to close the menu/sheet
}

export const SharedMenuContent = ({ onNavigate }: SharedMenuContentProps) => {
  const { user, signOut, isAdmin } = useAuth();
  // FIXED: Updated useCategories to use options object syntax
  const { data: mainForums } = useCategories({ parentId: null, level: 1 });
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    onNavigate(); // Close the menu
    router.push("/"); // Navigate to home page after sign out
  };

  return (
    // The main content area of the SheetContent should be a flex column
    // to allow internal sections to grow and scroll individually.
    <div className="flex flex-col h-full">
      {/* Main Forums Section */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Main Forums
        </h3>
        {/* Added max-h and overflow-y-auto for scrollability */}
        <div className="space-y-2 max-h-[calc(30vh-50px)] overflow-y-auto pr-2">
          {" "}
          {/* Adjust max-h as needed */}
          {mainForums?.map((forum) => (
            <Link
              key={forum.id}
              href={`/category/${forum.slug}`}
              className="flex items-center p-3 rounded-md hover:bg-accent"
              onClick={onNavigate}
            >
              <div
                className="w-3 h-3 rounded-sm mr-3"
                style={{ backgroundColor: forum.color ?? "" }} // FIXED: Added nullish coalescing for color
              />
              <div>
                <div className="font-medium text-sm">{forum.name}</div>
                {forum.description && (
                  <div className="text-xs text-muted-foreground">
                    {forum.description}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Community Links Section */}
      <div className="border-t pt-4 mb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Community
        </h3>
        {/* Added max-h and overflow-y-auto for scrollability */}
        <div className="space-y-2 max-h-[calc(20vh-30px)] overflow-y-auto pr-2">
          {" "}
          {/* Adjust max-h as needed */}
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/rules" onClick={onNavigate}>
              Forum Rules
            </Link>
          </Button>
          {/* Add more community links here if needed */}
        </div>
      </div>

      {/* User Actions Section - flex-grow to take remaining space */}
      <div className="border-t pt-4 flex-grow flex flex-col min-h-0">
        {" "}
        {/* min-h-0 is important for flex-grow with overflow */}
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Account
        </h3>
        {/* Added max-h and overflow-y-auto for scrollability */}
        <div className="space-y-2 flex-grow overflow-y-auto pr-2">
          {" "}
          {/* flex-grow to fill remaining space */}
          {user ? (
            <>
              <div className="px-3 py-2 text-sm font-medium">
                {user.username}
              </div>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/profile" onClick={onNavigate}>
                  Profile
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/settings" onClick={onNavigate}>
                  Settings
                </Link>
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600"
                  asChild
                >
                  <Link href="/admin" onClick={onNavigate}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button className="w-full" asChild>
                <Link href="/login" onClick={onNavigate}>
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/register" onClick={onNavigate}>
                  Register
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
