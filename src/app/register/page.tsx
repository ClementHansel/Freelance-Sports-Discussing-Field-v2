import Register from "@/components/auth/register-form/Register";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <Register />
    </Suspense>
  );
}
