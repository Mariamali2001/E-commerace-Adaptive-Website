import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/session";
import connectDB from "@/lib/mongodb";
import OrderModel from "@/models/Order";

// GET single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ensure user owns this order
    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      data: {
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
      },
    });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch order" },
      { status: 500 }
    );
  }
}

