import Profile from "@/components/dashboard/user/profile/Profile";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function ProfilePage() {
  return (
    <div className="flex-1 w-full">
      <Suspense
        fallback={
          <Card className="p-6">
            <div className="text-center">Loading content...</div>
          </Card>
        }
      >
        <Profile />
      </Suspense>
    </div>
  );
}
