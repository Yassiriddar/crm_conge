import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !["ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roles = await prisma.customRole.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !["ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, permissions } = await request.json()

    if (!name || !permissions) {
      return NextResponse.json({ error: "Name and permissions are required" }, { status: 400 })
    }

    // Validate permissions structure
    const validPermissions = [
      "view_employees",
      "create_employees",
      "edit_employees",
      "delete_employees",
      "view_leave_requests",
      "approve_leave_requests",
      "view_departments",
      "create_departments",
      "edit_departments",
      "view_reports",
      "manage_roles",
      "view_articles",
      "create_articles",
      "edit_articles",
    ]

    const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p))
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid permissions: ${invalidPermissions.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const role = await prisma.customRole.create({
      data: {
        name,
        description,
        permissions,
      },
    })

    return NextResponse.json(role)
  } catch (error) {
    console.error("Error creating role:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Role name already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
