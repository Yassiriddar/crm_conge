import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const leaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(leaveTypes)
  } catch (error) {
    console.error("Error fetching leave types:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !["ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { name, description, maxDaysPerYear, carryForward, maxCarryForward } = await request.json()
    if (!name || !maxDaysPerYear) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const leaveType = await prisma.leaveType.create({
      data: {
        name,
        description: description || null,
        maxDaysPerYear: Number(maxDaysPerYear),
        carryForward: !!carryForward,
        maxCarryForward: maxCarryForward ? Number(maxCarryForward) : null,
      },
    })
    return NextResponse.json(leaveType)
  } catch (error) {
    console.error("Error creating leave type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 