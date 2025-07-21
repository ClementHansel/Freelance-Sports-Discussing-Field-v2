"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";

interface SharedMenuContentProps {
  onNavigate: () => void; // Callback to close the menu/sheet
}

export const SharedMenuContent = ({ onNavigate }: SharedMenuContentProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const { data: mainForums } = useCategories(null, 1);
  const router = useRouter(); // Initialize useRouter

  const handleSignOut = async () => {
    await signOut();
    onNavigate(); // Close the menu
    router.push("/"); // Navigate to home page after sign out
  };

  return (
    <>
      {/* Main Forums */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Main Forums
        </h3>
        <div className="space-y-2">
          {mainForums?.map((forum) => (
            <Link
              key={forum.id}
              href={`/category/${forum.slug}`} // Changed 'to' to 'href'
              className="flex items-center p-3 rounded-md hover:bg-accent"
              onClick={onNavigate} // Close menu on navigation
            >
              <div
                className="w-3 h-3 rounded-sm mr-3"
                style={{ backgroundColor: forum.color }}
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

      {/* Community Links */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Community
        </h3>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/rules" onClick={onNavigate}>
              {" "}
              {/* Changed 'to' to 'href' */}
              Forum Rules
            </Link>
          </Button>
        </div>
      </div>

      {/* User Actions */}
      <div className="border-t pt-4">
        {user ? (
          <div className="space-y-2">
            <div className="px-3 py-2 text-sm font-medium">{user.username}</div>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/profile" onClick={onNavigate}>
                {" "}
                {/* Changed 'to' to 'href' */}
                Profile
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/settings" onClick={onNavigate}>
                {" "}
                {/* Changed 'to' to 'href' */}
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
                  {" "}
                  {/* Changed 'to' to 'href' */}
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
          </div>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/login" onClick={onNavigate}>
                {" "}
                {/* Changed 'to' to 'href' */}
                Sign In
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/register" onClick={onNavigate}>
                {" "}
                {/* Changed 'to' to 'href' */}
                Register
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
