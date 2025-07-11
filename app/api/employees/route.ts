import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"
import { initializeLeaveBalances } from "@/lib/leave-calculator"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !["ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: { email: true, role: true, isActive: true },
        },
        department: true,
        post: true,
        manager: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !["ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, employeeId, firstName, lastName, phone, address, dateOfJoining, departmentId, postId, managerId } =
      await request.json()

    const employee = await prisma.employee.create({
      data: {
        userId,
        employeeId,
        firstName,
        lastName,
        phone,
        address,
        dateOfJoining: new Date(dateOfJoining),
        departmentId,
        postId,
        managerId,
      },
      include: {
        user: true,
        department: true,
        post: true,
      },
    })

    // Initialize leave balances for current year
    await initializeLeaveBalances(employee.id, new Date().getFullYear())

    return NextResponse.json(employee)
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
