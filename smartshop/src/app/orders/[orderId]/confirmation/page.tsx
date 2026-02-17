"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
};

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    params.then((p) => {
      setOrderId(p.orderId);
      fetchOrder(p.orderId);
    });
  }, [params]);

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setOrder(data.data);
      } else if (response.status === 401) {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-20">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-neutral-500">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Link href="/shop" className="text-blue-600 hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-neutral-600">
            Thank you for your order. We'll send you a shipping confirmation email as soon as your
            order ships.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden mb-6">
          {/* Order Header */}
          <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-500">Order Number</p>
                <p className="text-lg font-bold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Order Date</p>
                <p className="font-semibold">
                  {new Date(order.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total</p>
                <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6">
            <h2 className="font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-4 border-b border-neutral-100 last:border-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    {item.size && <p className="text-sm text-neutral-500">Size: {item.size}</p>}
                    {item.color && <p className="text-sm text-neutral-500">Color: {item.color}</p>}
                    <p className="text-sm text-neutral-500">Qty: {item.qty}</p>
                  </div>
                  <div className="font-semibold">${(item.price * item.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="px-6 pb-6">
            <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Shipping</span>
                <span className="font-medium">
                  {order.shipping === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `$${order.shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Tax</span>
                <span className="font-medium">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="px-6 pb-6">
            <h3 className="font-semibold mb-2">Shipping Address</h3>
            <div className="text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="px-6 pb-6">
            <h3 className="font-semibold mb-2">Payment Method</h3>
            <div className="flex items-center gap-2 text-sm">
              <span>💵</span>
              <span>Cash on Delivery</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Please have ${order.total.toFixed(2)} ready when your order arrives
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/orders"
            className="px-6 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50 font-medium"
          >
            View All Orders
          </Link>
          <Link
            href="/shop"
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl hover:opacity-90 font-medium"
          >
            Continue Shopping
          </Link>
        </div>

        {/* What's Next */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
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
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex gap-2">
              <span>1️⃣</span>
              <span>We'll process your order and prepare it for shipping</span>
            </li>
            <li className="flex gap-2">
              <span>2️⃣</span>
              <span>You'll receive a shipping confirmation email with tracking details</span>
            </li>
            <li className="flex gap-2">
              <span>3️⃣</span>
              <span>Your order will be delivered to your address</span>
            </li>
            <li className="flex gap-2">
              <span>4️⃣</span>
              <span>Pay the delivery person ${order.total.toFixed(2)} in cash</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

