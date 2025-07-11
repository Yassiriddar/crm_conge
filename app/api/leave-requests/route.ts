import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"
import {
  calculateLeaveDays,
  calculateLeaveEligibility,
  updateLeaveBalanceWithEligibility,
} from "@/lib/leave-calculator"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const employeeId = searchParams.get("employeeId")

    const whereClause: any = {}

    if (user.role === "EMPLOYEE" && user.employee) {
      whereClause.employeeId = user.employee.id
    } else if (employeeId) {
      whereClause.employeeId = employeeId
    }

    if (status) {
      whereClause.status = status
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
        leaveType: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(leaveRequests)
  } catch (error) {
    console.error("Error fetching leave requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !user.employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leaveTypeId, startDate, endDate, reason } = await request.json()

    // Check employee eligibility
    const eligibility = calculateLeaveEligibility(user.employee.dateOfJoining)

    if (!eligibility.isEligible) {
      return NextResponse.json(
        {
          error: `You are not eligible for leave yet. You need ${6 - eligibility.monthsOfService} more months of service.`,
        },
        { status: 400 },
      )
    }

    const calculation = calculateLeaveDays(new Date(startDate), new Date(endDate))

    // Check leave balance with eligibility
    const currentYear = new Date().getFullYear()
    let leaveBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: user.employee.id,
          leaveTypeId,
          year: currentYear,
        },
      },
    })

    // Create balance if it doesn't exist
    if (!leaveBalance) {
      leaveBalance = await updateLeaveBalanceWithEligibility(user.employee.id, leaveTypeId, currentYear)
    }

    if (leaveBalance.remaining < calculation.workingDays) {
      return NextResponse.json(
        {
          error: `Insufficient leave balance. You have ${leaveBalance.remaining} days remaining.`,
        },
        { status: 400 },
      )
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: user.employee.id,
        leaveTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays: calculation.workingDays,
        reason,
      },
      include: {
        leaveType: true,
      },
    })

    return NextResponse.json(leaveRequest)
  } catch (error) {
    console.error("Error creating leave request:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
