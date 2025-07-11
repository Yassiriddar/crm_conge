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
    const departmentId = searchParams.get("departmentId")

    const whereClause: any = { isActive: true }
    if (departmentId) {
      whereClause.departmentId = departmentId
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        department: {
          select: { name: true },
        },
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { title: "asc" },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !["ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, departmentId, requirements, responsibilities, salaryRange, employmentType } =
      await request.json()

    if (!title || !departmentId) {
      return NextResponse.json({ error: "Title and department are required" }, { status: 400 })
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    })

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    const post = await prisma.post.create({
      data: {
        title,
        description,
        departmentId,
        requirements: requirements || null,
        responsibilities: responsibilities || null,
        salaryRange: salaryRange || null,
        employmentType: employmentType || "FULL_TIME",
      },
      include: {
        department: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error creating post:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Post title already exists in this department" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
