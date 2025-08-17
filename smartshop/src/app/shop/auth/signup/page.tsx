// app/auth/signup/page.tsx
"use client";

export default function SignupPage() {
  return (
    <div className="container grid min-h-[70vh] grid-cols-1 md:grid-cols-2 items-center">
      <div className="hidden md:block">
        <img src="/images/logo.png" alt="SmartShopping" className="h-10 w-auto" />
      </div>

      <div className="max-w-lg md:ml-auto">
        <h1 className="text-3xl font-extrabold tracking-tight">Create New Account</h1>
        <p className="text-sm text-neutral-500 mt-1">Please enter details</p>

        <form className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">First Name</span>
            <input className="mt-2 w-full rounded-xl border border-neutral-200 p-3 focus:ring-2 focus:ring-neutral-900" defaultValue="Robert" />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Last Name</span>
            <input className="mt-2 w-full rounded-xl border border-neutral-200 p-3 focus:ring-2 focus:ring-neutral-900" defaultValue="Fox" />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Email Address</span>
            <input type="email" className="mt-2 w-full rounded-xl border border-neutral-200 p-3 focus:ring-2 focus:ring-neutral-900" defaultValue="robertfox@example.com" />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input type="password" className="mt-2 w-full rounded-xl border border-neutral-200 p-3 focus:ring-2 focus:ring-neutral-900" defaultValue="••••••••••" />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked />
            I agree to the <a href="#" className="underline">Terms &amp; Conditions</a>
          </label>

          <button className="btn w-full bg-neutral-900 text-white hover:opacity-90">
            Signup
          </button>
        </form>
      </div>
    </div>
  );
}
