import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    let targetEmployeeId: string | undefined
    if (user.role === "EMPLOYEE" && user.employee) {
      targetEmployeeId = user.employee.id
    } else if ((user.role === "ADMIN" || user.role === "HR") && employeeId) {
      targetEmployeeId = employeeId
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const year = new Date().getFullYear()
    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId: targetEmployeeId, year },
      include: { leaveType: true },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json(balances)
  } catch (error) {
    console.error("Error fetching leave balances:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 