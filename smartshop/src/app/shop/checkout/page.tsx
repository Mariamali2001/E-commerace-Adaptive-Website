"use client";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart, cartSelectors } from "@/store/cart";

type ShippingAddress = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const list = useCart(cartSelectors.list);
  const subtotal = useCart(cartSelectors.subtotal);
  const clear = useCart((s) => s.clear);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shipping address form
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
  });

  // Calculate costs
  const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
  const tax = subtotal * 0.02; // 2% tax
  const total = subtotal + shipping + tax;

  // Redirect if cart is empty
  useEffect(() => {
    if (list.length === 0) {
      router.push("/shop/cart");
    }
  }, [list.length, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Create order
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: list.map((item) => ({
            productId: item.id, // Use 'id' field from cart
            slug: item.slug,
            title: item.title,
            image: item.image,
            price: item.price,
            qty: item.qty,
            size: item.size,
            color: item.color,
          })),
          shippingAddress: {
            name: shippingAddress.fullName,
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zip: shippingAddress.zip,
            country: shippingAddress.country,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      // Clear cart
      clear();

      // Redirect to order confirmation
      router.push(`/orders/${data.data.id}/confirmation`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
      setSubmitting(false);
    }
  };

  if (list.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={shippingAddress.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={shippingAddress.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      required
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleInputChange}
                    placeholder="123 Main Street, Apt 4B"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>

                {/* City, State, ZIP */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="zip"
                      value={shippingAddress.zip}
                      onChange={handleInputChange}
                      placeholder="10001"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      required
                    />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  >
                    <option value="USA">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <div className="border-2 border-neutral-900 rounded-xl p-4 bg-neutral-50">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-neutral-900 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-neutral-900"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Cash on Delivery</div>
                      <div className="text-sm text-neutral-600">Pay when you receive your order</div>
                    </div>
                    <div className="text-2xl">💵</div>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                  <div className="flex items-start gap-2 text-sm text-neutral-600">
                    <svg
                      className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>
                      Please have the exact amount ready. Our delivery person will hand over your order
                      after payment is received.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {list.map((item) => (
                  <div key={item.key} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-neutral-500">Qty: {item.qty}</p>
                      {item.size && <p className="text-xs text-neutral-500">Size: {item.size}</p>}
                    </div>
                    <div className="text-sm font-semibold">${(item.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-neutral-200">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tax (2%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Free Shipping Note */}
              {subtotal < 100 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  💡 Add ${(100 - subtotal).toFixed(2)} more for free shipping!
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {error}
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-6 py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {submitting ? "Placing Order..." : "Place Order"}
              </button>

              {/* Security Note */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Secure checkout</span>
              </div>

              {/* Back to Cart */}
              <Link
                href="/shop/cart"
                className="block text-center text-sm text-neutral-600 hover:text-neutral-900 mt-4"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
