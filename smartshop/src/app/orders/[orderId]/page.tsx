"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrderItem = {
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  size?: string;
  color?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
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
  trackingNumber?: string;
};

export default function OrderDetailPage({
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
      } else {
        setOrder(null);
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        fetchOrder(orderId);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to cancel order");
      }
    } catch (error) {
      alert("Failed to cancel order");
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-neutral-600 mb-6">
            We couldn't find this order. It may have been deleted or you don't have permission to view
            it.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/orders"
              className="px-6 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50"
            >
              View All Orders
            </Link>
            <Link href="/shop" className="px-6 py-3 bg-neutral-900 text-white rounded-xl hover:opacity-90">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Order Details</h1>
            <p className="text-neutral-600">Order #{order.orderNumber}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl border-2 ${getStatusColor(order.status)}`}>
            <span className="font-semibold">{getStatusText(order.status)}</span>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Order Status</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  order.status !== "cancelled" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                ✓
              </div>
              <div className="flex-1">
                <p className="font-semibold">Order Placed</p>
                <p className="text-sm text-neutral-500">
                  {new Date(order.date).toLocaleString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  order.status === "processing" || order.status === "shipped" || order.status === "delivered"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                📦
              </div>
              <div className="flex-1">
                <p className="font-semibold">Processing</p>
                <p className="text-sm text-neutral-500">
                  {order.status === "processing" || order.status === "shipped" || order.status === "delivered"
                    ? "Your order is being prepared"
                    : "Waiting to start"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  order.status === "shipped" || order.status === "delivered"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                🚚
              </div>
              <div className="flex-1">
                <p className="font-semibold">Shipped</p>
                <p className="text-sm text-neutral-500">
                  {order.status === "shipped" || order.status === "delivered"
                    ? order.trackingNumber
                      ? `Tracking: ${order.trackingNumber}`
                      : "On the way to you"
                    : "Not shipped yet"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  order.status === "delivered" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                🎉
              </div>
              <div className="flex-1">
                <p className="font-semibold">Delivered</p>
                <p className="text-sm text-neutral-500">
                  {order.status === "delivered" ? "Order has been delivered" : "Not delivered yet"}
                </p>
              </div>
            </div>

            {order.status === "cancelled" && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">
                  ⚠️ This order has been cancelled and will not be shipped.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Items ({order.items.length})</h2>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 pb-4 border-b border-neutral-100 last:border-0">
                <Link href={`/shop/product/${item.slug}`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                  />
                </Link>
                <div className="flex-1">
                  <Link href={`/shop/product/${item.slug}`}>
                    <h3 className="font-medium hover:underline">{item.title}</h3>
                  </Link>
                  <div className="text-sm text-neutral-500 mt-1 space-y-0.5">
                    {item.size && <p>Size: {item.size}</p>}
                    {item.color && <p>Color: {item.color}</p>}
                    <p>Quantity: {item.qty}</p>
                    <p className="font-medium text-neutral-700">
                      ${item.price.toFixed(2)} × {item.qty} = ${(item.price * item.qty).toFixed(2)}
                    </p>
                  </div>
                </div>
                {order.status === "delivered" && (
                  <Link
                    href={`/shop/product/${item.slug}#reviews`}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 h-fit"
                  >
                    Write Review
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pricing */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
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
                <span className="text-neutral-600">Tax (2%)</span>
                <span className="font-medium">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-neutral-200">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-600">Payment Method:</span>
                <span className="font-medium">💵 Cash on Delivery</span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Please have ${order.total.toFixed(2)} ready when your order arrives
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-base text-neutral-900">{order.shippingAddress.name}</p>
              <p className="text-neutral-600">{order.shippingAddress.street}</p>
              <p className="text-neutral-600">
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
              </p>
              <p className="text-neutral-600">{order.shippingAddress.country}</p>
            </div>

            {order.trackingNumber && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <p className="text-sm text-neutral-600 mb-2">Tracking Number</p>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 bg-neutral-100 rounded-lg font-mono text-sm">
                    {order.trackingNumber}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(order.trackingNumber!)}
                    className="p-2 hover:bg-neutral-100 rounded-lg"
                    title="Copy tracking number"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/orders"
            className="px-6 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50 font-medium"
          >
            ← Back to Orders
          </Link>
          
          {order.status === "pending" && (
            <button
              onClick={handleCancelOrder}
              className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-medium"
            >
              Cancel Order
            </button>
          )}

          {(order.status === "shipped" || order.status === "delivered") && order.trackingNumber && (
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
              Track Package
            </button>
          )}

          <Link
            href="/shop"
            className="ml-auto px-6 py-3 bg-neutral-900 text-white rounded-xl hover:opacity-90 font-medium"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
          <h3 className="font-semibold mb-3">Need Help?</h3>
          <div className="space-y-2 text-sm text-neutral-600">
            <p>• Contact our support team if you have questions about your order</p>
            <p>• Delivery time: 3-5 business days for standard shipping</p>
            <p>• For COD orders, please have exact change ready</p>
            <p>
              • Questions? Email us at{" "}
              <a href="mailto:support@smartshop.dev" className="text-blue-600 hover:underline">
                support@smartshop.dev
              </a>
            </p>
          </div>
        </div>

        {/* Delivered - Write Reviews */}
        {order.status === "delivered" && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>⭐</span>
              How was your experience?
            </h3>
            <p className="text-sm text-neutral-700 mb-4">
              Share your thoughts about the products you received. Your review helps other customers!
            </p>
            <div className="flex flex-wrap gap-3">
              {order.items.map((item, idx) => (
                <Link
                  key={idx}
                  href={`/shop/product/${item.slug}#reviews`}
                  className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                >
                  Review: {item.title.length > 30 ? item.title.substring(0, 30) + "..." : item.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

