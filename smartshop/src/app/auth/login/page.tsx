// app/auth/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="container grid min-h-[70vh] grid-cols-1 items-center md:grid-cols-2">
      <div className="hidden md:block">
        <img src="/images/logo.png" alt="SmartShopping" className="h-100 w-auto" />
      </div>

      <div className="max-w-lg md:ml-auto">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome to SmartShop</h1>
        <p className="mt-1 text-sm text-neutral-500">Please login here</p>

        <LoginForm />
      </div>
    </div>
  );
}

