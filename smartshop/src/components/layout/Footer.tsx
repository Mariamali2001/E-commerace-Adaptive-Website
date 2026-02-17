"use client";

// components/layout/Footer.tsx
import { NewsletterForm } from "@/components/shared/NewsletterForm";

export function Footer() {
  return (
    <footer id="brands" className="border-t border-neutral-100 bg-neutral-50">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2">
            <h4 className="text-lg font-extrabold mb-3 leading-tight">
              STAY UPTO DATE ABOUT
              <br /> OUR LATEST OFFERS
            </h4>
            <NewsletterForm
              formClassName="flex-col sm:flex-row gap-2"
              inputClassName="rounded-xl border border-neutral-200 p-3"
              buttonClassName="bg-neutral-900 text-white"
              buttonLabel="Subscribe to Newsletter"
              successMessage="Check your inbox for confirmation."
            />
          </div>

          <div>
            <h5 className="mb-3 font-semibold">Company</h5>
            <ul className="space-y-2 text-neutral-600">
              <li>About</li>
              <li>Features</li>
              <li>Works</li>
              <li>Career</li>
            </ul>
          </div>
          <div>
            <h5 className="mb-3 font-semibold">Help</h5>
            <ul className="space-y-2 text-neutral-600">
              <li>Customer Support</li>
              <li>Delivery Details</li>
              <li>Terms & Conditions</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-neutral-200 pt-6 text-xs text-neutral-500">
          <p>
            © {new Date().getFullYear()} SmartShopping. All rights reserved.
          </p>
          <div className="flex gap-3">
            <img src="/images/payment.png" alt="Payments" className="h-5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
