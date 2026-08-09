import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/session";
import connectDB from "@/lib/mongodb";
import OrderModel from "@/models/Order";

// GET - List all orders for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const orders = await OrderModel.find({ userId: user.id }).sort({ createdAt: -1 });

    return NextResponse.json({
      data: orders.map((order) => ({
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        date: order.createdAt.toISOString(),
        status: order.status,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
      })),
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, shippingAddress } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
    }

    await connectDB();

    // Calculate totals
    const subtotal = (
      items as Array<{ price: number; qty: number }>
    ).reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
    const tax = subtotal * 0.02; // 2% tax
    const total = subtotal + shipping + tax;

    // Generate order number
    const orderCount = await OrderModel.countDocuments();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`;

    // Create order
    const order = await OrderModel.create({
      userId: user.id,
      orderNumber,
      status: "pending",
      items,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress,
    });

    return NextResponse.json(
      {
        data: {
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 }
    );
  }
}

