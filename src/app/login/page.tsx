import Login from "@/components/auth/login-form/Login";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <Login />
    </Suspense>
  );
}
