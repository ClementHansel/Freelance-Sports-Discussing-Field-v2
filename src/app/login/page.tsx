import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const LoginClient = dynamic(
  () => import("@/components/auth/login-form/Login"),
  {
    ssr: false,
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading content...</div>
      </Card>
    ),
  }
);

export default function LoginPage() {
  return (
    <div className="flex-1 w-full">
      <LoginClient />
    </div>
  );
}
