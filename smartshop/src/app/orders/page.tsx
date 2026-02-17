"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrderItem = {
  productId: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  size?: string;
  color?: string;
  slug: string;
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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data);
      } else if (response.status === 401) {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Refresh orders
        fetchOrders();
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
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-neutral-500">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <Link href="/shop" className="text-sm text-neutral-600 hover:text-neutral-900">
            Continue Shopping →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-2xl">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-neutral-500 mb-6">Start shopping to see your orders here</p>
            <Link
              href="/shop"
              className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-xl hover:opacity-90"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border border-neutral-200 rounded-2xl overflow-hidden">
                {/* Order Header */}
                <div className="bg-neutral-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <p className="text-sm text-neutral-500">Order Number</p>
                      <p className="font-semibold">{order.orderNumber}</p>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-neutral-200" />
                    <div>
                      <p className="text-sm text-neutral-500">Date</p>
                      <p className="font-semibold">
                        {new Date(order.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-neutral-200" />
                    <div>
                      <p className="text-sm text-neutral-500">Total</p>
                      <p className="font-semibold">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>

                {/* Order Items */}
                <div className="p-6 space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <Link href={`/shop/product/${item.slug}`}>
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-20 h-20 object-cover rounded-lg hover:opacity-80 transition-opacity"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link href={`/shop/product/${item.slug}`}>
                          <h3 className="font-medium hover:underline">{item.title}</h3>
                        </Link>
                        <div className="text-sm text-neutral-500 mt-1">
                          {item.size && <span>Size: {item.size} </span>}
                          {item.color && <span>• Color: {item.color}</span>}
                        </div>
                        <div className="text-sm text-neutral-500 mt-1">Qty: {item.qty}</div>
                      </div>
                      <div className="font-semibold">${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="bg-neutral-50 px-6 py-4 flex flex-wrap gap-3 border-t border-neutral-200">
                  <Link
                    href={`/orders/${order.id}`}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-white transition-colors"
                  >
                    View Details
                  </Link>
                  {order.status === "delivered" &&
                    order.items.map((item, idx) => (
                      <Link
                        key={idx}
                        href={`/shop/product/${item.slug}#reviews`}
                        className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-white transition-colors"
                      >
                        Write Review
                      </Link>
                    ))}
                  {(order.status === "delivered" || order.status === "shipped") &&
                    order.trackingNumber && (
                      <button className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-white transition-colors">
                        Track Order
                      </button>
                    )}
                  {order.status === "pending" && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
