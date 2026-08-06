"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, cartSelectors } from "@/store/cart";

export type ShippingAddress = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

const EMPTY_ADDRESS: ShippingAddress = {
  fullName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "USA",
};

export function useCheckoutOrder() {
  const router = useRouter();
  const list = useCart(cartSelectors.list);
  const subtotal = useCart(cartSelectors.subtotal);
  const clear = useCart((s) => s.clear);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] =
    useState<ShippingAddress>(EMPTY_ADDRESS);

  const shipping = subtotal > 100 ? 0 : 15;
  const tax = subtotal * 0.02;
  const total = subtotal + shipping + tax;

  useEffect(() => {
    if (list.length === 0) {
      router.push("/shop/cart");
    }
  }, [list.length, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const placeOrder = async (e?: FormEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: list.map((item) => ({
            productId: item.id,
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

      clear();
      router.push(`/orders/${data.data.id}/confirmation`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
      setSubmitting(false);
    }
  };

  return {
    list,
    subtotal,
    shipping,
    tax,
    total,
    shippingAddress,
    setShippingAddress,
    handleInputChange,
    placeOrder,
    submitting,
    error,
    empty: list.length === 0,
  };
}
