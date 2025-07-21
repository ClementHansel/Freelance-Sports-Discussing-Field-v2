"use client";

import React from "react";
import { LoginForm } from "@/components/auth/login-form/LoginForm";
import { AdBanner } from "@/components/ads/AdBanner";

const Login = () => {
  return (
    <>
      <LoginForm />
      <AdBanner />
    </>
  );
};

export default Login;
