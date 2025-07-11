import { prisma } from "./prisma"

export interface LeaveCalculation {
  totalDays: number
  workingDays: number
  weekends: number
  holidays: number
}

export function calculateLeaveDays(startDate: Date, endDate: Date): LeaveCalculation {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let totalDays = 0
  let workingDays = 0
  let weekends = 0

  const current = new Date(start)
  while (current <= end) {
    totalDays++
    const dayOfWeek = current.getDay()

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Sunday or Saturday
      weekends++
    } else {
      workingDays++
    }

    current.setDate(current.getDate() + 1)
  }

  return {
    totalDays,
    workingDays,
    weekends,
    holidays: 0, // You can implement holiday calculation here
  }
}

export async function updateLeaveBalance(
  employeeId: string,
  leaveTypeId: string,
  daysUsed: number,
  year: number = new Date().getFullYear(),
) {
  const balance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId,
        year,
      },
    },
  })

  if (!balance) {
    throw new Error("Leave balance not found")
  }

  const newUsed = balance.used + daysUsed
  const newRemaining = balance.allocated + balance.carriedOver - newUsed

  return prisma.leaveBalance.update({
    where: { id: balance.id },
    data: {
      used: newUsed,
      remaining: newRemaining,
    },
  })
}

export async function initializeLeaveBalances(employeeId: string, year: number) {
  const leaveTypes = await prisma.leaveType.findMany({
    where: { isActive: true },
  })

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  })

  if (!employee) throw new Error("Employee not found")

  for (const leaveType of leaveTypes) {
    // Check if balance already exists
    const existingBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: leaveType.id,
          year,
        },
      },
    })

    if (!existingBalance) {
      // Calculate carry forward from previous year
      let carriedOver = 0
      if (leaveType.carryForward && year > new Date(employee.dateOfJoining).getFullYear()) {
        const previousBalance = await prisma.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId,
              leaveTypeId: leaveType.id,
              year: year - 1,
            },
          },
        })

        if (previousBalance && previousBalance.remaining > 0) {
          carriedOver = Math.min(previousBalance.remaining, leaveType.maxCarryForward || previousBalance.remaining)
        }
      }

      await prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId: leaveType.id,
          year,
          allocated: leaveType.maxDaysPerYear,
          carriedOver,
          remaining: leaveType.maxDaysPerYear + carriedOver,
        },
      })
    }
  }
}

export function calculateLeaveEligibility(dateOfJoining: Date): {
  isEligible: boolean
  monthsOfService: number
  accruedDays: number
} {
  const now = new Date()
  const joiningDate = new Date(dateOfJoining)

  // Calculate months of service
  const monthsDiff = (now.getFullYear() - joiningDate.getFullYear()) * 12 + (now.getMonth() - joiningDate.getMonth())

  // Add partial month if current date is past joining day
  const daysDiff = now.getDate() - joiningDate.getDate()
  const monthsOfService = daysDiff >= 0 ? monthsDiff : monthsDiff - 1

  // Check eligibility (6 months minimum)
  const isEligible = monthsOfService >= 6

  // Calculate accrued days (1.5 days per month after 6 months)
  const accruedDays = isEligible ? Math.floor((monthsOfService - 6) * 1.5) : 0

  return {
    isEligible,
    monthsOfService,
    accruedDays,
  }
}

export async function updateLeaveBalanceWithEligibility(
  employeeId: string,
  leaveTypeId: string,
  year: number = new Date().getFullYear(),
) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  })

  if (!employee) {
    throw new Error("Employee not found")
  }

  const eligibility = calculateLeaveEligibility(employee.dateOfJoining)

  if (!eligibility.isEligible) {
    throw new Error("Employee is not eligible for leave yet. Minimum 6 months of service required.")
  }

  // Get or create leave balance
  const existingBalance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId,
        year,
      },
    },
  })

  if (existingBalance) {
    return existingBalance
  }

  // Create new balance with accrued days
  const leaveType = await prisma.leaveType.findUnique({
    where: { id: leaveTypeId },
  })

  if (!leaveType) {
    throw new Error("Leave type not found")
  }

  // Use minimum of accrued days or max days per year
  const allocatedDays = Math.min(eligibility.accruedDays, leaveType.maxDaysPerYear)

  return prisma.leaveBalance.create({
    data: {
      employeeId,
      leaveTypeId,
      year,
      allocated: allocatedDays,
      remaining: allocatedDays,
    },
  })
}
