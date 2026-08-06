"use client";

import Link from "next/link";
import { NewsletterForm } from "@/components/shared/NewsletterForm";

export function Footer() {
  return (
    <footer
      id="brands"
      className="mt-6 border-t border-neutral-200/70 bg-neutral-50"
    >
      <div className="container py-8 md:py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Newsletter
            </p>
            <h4 className="mt-2 max-w-sm text-2xl font-bold tracking-tight text-neutral-900 md:text-[1.65rem] md:leading-snug">
              Stay up to date about our latest offers
            </h4>
            <p className="mt-2 max-w-sm text-sm text-neutral-600">
              Occasional drops and deals
            </p>
            <div className="mt-5">
              <NewsletterForm
                formClassName="flex-col gap-2 sm:flex-row sm:items-stretch"
                inputClassName="rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm"
                buttonClassName="rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
                buttonLabel="Subscribe for Newsletter"
                successMessage="You're on the list."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7 md:grid-cols-3">
            <div>
              <h5 className="mb-3 text-sm font-semibold text-neutral-900">
                Company
              </h5>
              <ul className="space-y-2.5 text-sm text-neutral-600">
                <li>
                  <Link href="/shop" className="hover:text-neutral-900">
                    About
                  </Link>
                </li>
                <li>
                  <span className="cursor-default">Features</span>
                </li>
                <li>
                  <span className="cursor-default">Works</span>
                </li>
                <li>
                  <span className="cursor-default">Career</span>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="mb-3 text-sm font-semibold text-neutral-900">Help</h5>
              <ul className="space-y-2.5 text-sm text-neutral-600">
                <li>
                  <span className="cursor-default">Customer Support</span>
                </li>
                <li>
                  <span className="cursor-default">Delivery Details</span>
                </li>
                <li>
                  <span className="cursor-default">Terms & Conditions</span>
                </li>
                <li>
                  <span className="cursor-default">Privacy Policy</span>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h5 className="mb-3 text-sm font-semibold text-neutral-900">
                Explore
              </h5>
              <ul className="space-y-2.5 text-sm text-neutral-600">
                <li>
                  <Link href="/shop" className="hover:text-neutral-900">
                    Shop all
                  </Link>
                </li>
                <li>
                  <Link href="/shop/mood" className="hover:text-neutral-900">
                    Mood camera
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-neutral-900">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-neutral-100 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center">
          <p>© 2026 SmartShopping. All rights reserved.</p>
          <img
            src="/images/payment.png"
            alt="Payments"
            className="h-5 opacity-80"
          />
        </div>
      </div>
    </footer>
  );
}
