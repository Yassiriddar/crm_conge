import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../lib/auth"
import { prisma } from "../lib/prisma";
import { initializeLeaveBalances } from "../lib/leave-calculator";

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await hashPassword("admin123")
  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      password: adminPassword,
      role: "ADMIN",
    },
  })

  // Create HR user
  const hrPassword = await hashPassword("hr123")
  const hr = await prisma.user.upsert({
    where: { email: "hr@company.com" },
    update: {},
    create: {
      email: "hr@company.com",
      password: hrPassword,
      role: "HR",
    },
  })

  // Create employee user
  const empPassword = await hashPassword("emp123")
  const employee = await prisma.user.upsert({
    where: { email: "john.doe@company.com" },
    update: {},
    create: {
      email: "john.doe@company.com",
      password: empPassword,
      role: "EMPLOYEE",
    },
  })

  // Create departments
  const itDept = await prisma.department.upsert({
    where: { name: "Information Technology" },
    update: {},
    create: {
      name: "Information Technology",
      description: "IT Department handling all technical operations",
    },
  })

  const hrDept = await prisma.department.upsert({
    where: { name: "Human Resources" },
    update: {},
    create: {
      name: "Human Resources",
      description: "HR Department managing employee relations",
    },
  })

  // Create posts
  const devPost = await prisma.post.upsert({
    where: { id: "dev-post" },
    update: {},
    create: {
      id: "dev-post",
      title: "Software Developer",
      description: "Full-stack software development",
      departmentId: itDept.id,
    },
  })

  const hrPost = await prisma.post.upsert({
    where: { id: "hr-post" },
    update: {},
    create: {
      id: "hr-post",
      title: "HR Manager",
      description: "Human Resources Management",
      departmentId: hrDept.id,
    },
  })

  // Create employees
  const hrEmployee = await prisma.employee.upsert({
    where: { userId: hr.id },
    update: {},
    create: {
      userId: hr.id,
      employeeId: "EMP001",
      firstName: "Jane",
      lastName: "Smith",
      phone: "+1234567890",
      address: "123 HR Street",
      dateOfJoining: new Date("2023-01-15"),
      departmentId: hrDept.id,
      postId: hrPost.id,
    },
  })

  const devEmployee = await prisma.employee.upsert({
    where: { userId: employee.id },
    update: {},
    create: {
      userId: employee.id,
      employeeId: "EMP002",
      firstName: "John",
      lastName: "Doe",
      phone: "+1234567891",
      address: "456 Dev Avenue",
      dateOfJoining: new Date("2023-03-01"),
      departmentId: itDept.id,
      postId: devPost.id,
      managerId: hrEmployee.id,
    },
  })

  // Create leave types
  const annualLeave = await prisma.leaveType.upsert({
    where: { name: "Annual Leave" },
    update: {},
    create: {
      name: "Annual Leave",
      description: "Yearly vacation leave",
      maxDaysPerYear: 21,
      carryForward: true,
      maxCarryForward: 5,
    },
  })

  const sickLeave = await prisma.leaveType.upsert({
    where: { name: "Sick Leave" },
    update: {},
    create: {
      name: "Sick Leave",
      description: "Medical leave",
      maxDaysPerYear: 10,
      carryForward: false,
    },
  })

  const personalLeave = await prisma.leaveType.upsert({
    where: { name: "Personal Leave" },
    update: {},
    create: {
      name: "Personal Leave",
      description: "Personal time off",
      maxDaysPerYear: 5,
      carryForward: false,
    },
  })

  // Create leave balances for current year
  const currentYear = new Date().getFullYear()

  await prisma.leaveBalance.upsert({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: devEmployee.id,
        leaveTypeId: annualLeave.id,
        year: currentYear,
      },
    },
    update: {},
    create: {
      employeeId: devEmployee.id,
      leaveTypeId: annualLeave.id,
      year: currentYear,
      allocated: 21,
      remaining: 21,
    },
  })

  await prisma.leaveBalance.upsert({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: devEmployee.id,
        leaveTypeId: sickLeave.id,
        year: currentYear,
      },
    },
    update: {},
    create: {
      employeeId: devEmployee.id,
      leaveTypeId: sickLeave.id,
      year: currentYear,
      allocated: 10,
      remaining: 10,
    },
  })

  // Create custom roles
  const teamLeadRole = await prisma.customRole.upsert({
    where: { name: "Team Lead" },
    update: {},
    create: {
      name: "Team Lead",
      description: "Team leadership role with employee management permissions",
      permissions: [
        "view_employees",
        "edit_employees",
        "view_leave_requests",
        "approve_leave_requests",
        "view_departments",
        "view_reports",
        "view_articles",
        "create_articles",
      ],
    },
  })

  const projectManagerRole = await prisma.customRole.upsert({
    where: { name: "Project Manager" },
    update: {},
    create: {
      name: "Project Manager",
      description: "Project management role with comprehensive permissions",
      permissions: [
        "view_employees",
        "create_employees",
        "edit_employees",
        "view_leave_requests",
        "approve_leave_requests",
        "view_departments",
        "create_departments",
        "view_reports",
        "view_articles",
        "create_articles",
        "edit_articles",
      ],
    },
  })

  // Update the developer employee to have a custom role
  await prisma.employee.update({
    where: { id: devEmployee.id },
    data: {
      customRoleId: teamLeadRole.id,
    },
  })

  // Create sample article
  await prisma.article.upsert({
    where: { id: "sample-article" },
    update: {},
    create: {
      id: "sample-article",
      title: "Welcome to the Leave Management System",
      content: "This is our new leave management system. Please familiarize yourself with the new processes.",
      authorId: hr.id,
    },
  })

  console.log("✅ Database seeded successfully!")
  console.log("👤 Admin: admin@company.com / admin123")
  console.log("👤 HR: hr@company.com / hr123")
  console.log("👤 Employee: john.doe@company.com / emp123")
}

async function initializeLeaveBalancesForAllEmployees() {
  const year = new Date().getFullYear();
  const employees = await prisma.employee.findMany();
  for (const emp of employees) {
    await initializeLeaveBalances(emp.id, year);
    console.log(`Initialized leave balances for employee ${emp.id}`);
  }
  console.log("Leave balances initialized for all employees.");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
