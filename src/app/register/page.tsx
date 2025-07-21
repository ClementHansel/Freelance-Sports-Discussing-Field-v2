import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const RegisterClient = dynamic(
  () => import("@/components/auth/register-form/Register"),
  {
    ssr: false,
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading content...</div>
      </Card>
    ),
  }
);

export default function RegisterPage() {
  return (
    <div className="flex-1 w-full">
      <RegisterClient />
    </div>
  );
}
