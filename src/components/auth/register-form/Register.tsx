"use client";

import React, { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form/RegisterForm";
import { Card } from "@/components/ui/card";

const Register = () => {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <RegisterForm />
    </Suspense>
  );
};

export default Register;
