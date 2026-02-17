import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/session";
import connectDB from "@/lib/mongodb";
import OrderModel from "@/models/Order";

export async function POST(
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

    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only cancel pending orders
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending orders can be cancelled" },
        { status: 400 }
      );
    }

    order.status = "cancelled";
    await order.save();

    return NextResponse.json({
      data: {
        id: order._id.toString(),
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Order cancel error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel order" },
      { status: 500 }
    );
  }
}

