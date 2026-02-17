"use client";

// components/shared/Newsletter.tsx
import { NewsletterForm } from "./NewsletterForm";

export function Newsletter() {
  return (
    <section className="container mt-14">
      <div className="rounded-2xl bg-neutral-900 px-6 py-10 text-white">
        <h3 className="text-2xl font-extrabold leading-tight">
          STAY UPTO DATE ABOUT
          <br />
          OUR LATEST OFFERS
        </h3>
        <div className="mt-6">
          <NewsletterForm
            formClassName="flex-col gap-2 sm:flex-row"
            inputClassName="rounded-xl border-0 p-3 text-neutral-900"
            buttonClassName="bg-white text-neutral-900"
            buttonLabel="Subscribe to Newsletter"
            successMessage="You are on the list! 🎉"
            errorMessage="Unable to subscribe. Please try again."
          />
        </div>
      </div>
    </section>
  );
}
