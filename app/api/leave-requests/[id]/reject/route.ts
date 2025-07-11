import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request)
    if (!user || !["ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let comments = undefined;
    try {
      const body = await request.json();
      comments = body.comments;
    } catch {
      // No body sent, comments remain undefined
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
    })

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 })
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Leave request already processed" }, { status: 400 })
    }

    // Update leave request
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        approvedBy: user.id,
        approvedAt: new Date(),
        comments,
      },
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error("Error rejecting leave request:", error, error?.stack || "");
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  // Call PATCH handler for compatibility
  return PATCH(request, context);
} 