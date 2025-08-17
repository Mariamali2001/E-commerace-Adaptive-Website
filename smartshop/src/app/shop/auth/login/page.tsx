// app/auth/login/page.tsx
"use client";
import { useState } from "react";

export default function LoginPage() {
  const [remember, setRemember] = useState(true);

  return (
    <div className="container grid min-h-[70vh] grid-cols-1 md:grid-cols-2 items-center">
      <div className="hidden md:block">
        <img src="/images/logo.svg" alt="SmartShopping" className="h-10 w-auto" />
      </div>

      <div className="max-w-lg md:ml-auto">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome 👋</h1>
        <p className="text-sm text-neutral-500 mt-1">Please login here</p>

        <form className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email Address</span>
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 outline-none focus:ring-2 focus:ring-neutral-900"
              defaultValue="robertfox@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 outline-none focus:ring-2 focus:ring-neutral-900"
              defaultValue="••••••••••"
            />
          </label>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember((v) => !v)}
              />
              Remember Me
            </label>
            <a className="text-sm text-neutral-500 hover:text-neutral-900" href="#">
              Forgot Password?
            </a>
          </div>

          <button className="btn w-full bg-neutral-900 text-white hover:opacity-90">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
