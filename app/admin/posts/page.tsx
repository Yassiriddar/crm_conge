"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users, Building, ArrowLeft } from "lucide-react"
import { CreatePostDialog } from "@/components/create-post-dialog"
import { EditPostDialog } from "@/components/edit-post-dialog"
import { useRouter } from "next/navigation"

interface Post {
  id: string
  title: string
  description: string | null
  requirements: string | null
  responsibilities: string | null
  salaryRange: string | null
  employmentType: string
  isActive: boolean
  department: { name: string }
  _count: { employees: number }
}

interface Department {
  id: string
  name: string
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
    fetchDepartments()
  }, [])

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const url = selectedDepartment ? `/api/posts?departmentId=${selectedDepartment}` : "/api/posts"

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/departments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      console.error("Error fetching departments:", error)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [selectedDepartment])

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchPosts()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Failed to delete post")
    }
  }

  const handleEditPost = (post: Post) => {
    setSelectedPost(post)
    setEditDialogOpen(true)
  }

  const getEmploymentTypeBadge = (type: string) => {
    const colors = {
      FULL_TIME: "default",
      PART_TIME: "secondary",
      CONTRACT: "outline",
      INTERNSHIP: "destructive",
    } as const

    return <Badge variant={colors[type as keyof typeof colors] || "secondary"}>{type.replace("_", " ")}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-teal-400">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-teal-400">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white/80 text-blue-900 border-b border-border flex items-center px-6 py-4 mb-6 shadow-lg animate-fade-in rounded-b-xl">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4 text-blue-900 hover:bg-blue-100/40">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-blue-900">Post Management</h1>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Post Management</h1>
            <p className="text-blue-700">Create and manage job positions across departments</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} variant="gradient" className="hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>
        {/* Department Filter */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-blue-900">Filter by Department:</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 text-blue-900"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-2xl transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-blue-700">{post.title}</CardTitle>
                    <CardDescription className="mt-1 flex items-center text-purple-500">
                      <Building className="w-4 h-4 mr-1 text-blue-500" />
                      {post.department.name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditPost(post)} className="hover:bg-blue-100/40">
                      <Edit className="w-4 h-4 text-blue-900" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {post.description && <p className="text-sm text-blue-700 line-clamp-2">{post.description}</p>}

                  <div className="flex items-center text-sm text-purple-500">
                    <Users className="w-4 h-4 mr-2 text-blue-500" />
                    {post._count.employees} employee{post._count.employees !== 1 ? "s" : ""}
                  </div>

                  {post.salaryRange && (
                    <div className="text-sm">
                      <span className="font-medium text-blue-900">Salary: </span>
                      <span className="text-teal-600">{post.salaryRange}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-2">
                      <Badge variant={post.isActive ? "default" : "secondary"} className={post.isActive ? "bg-blue-500 text-white" : "bg-purple-200 text-purple-700"}>
                        {post.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {posts.length === 0 && (
          <Card className="hover:shadow-md transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
            <CardContent className="text-center py-12">
              <Building className="w-12 h-12 mx-auto text-blue-300 mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">No posts found</h3>
              <p className="text-blue-700 mb-4">
                {selectedDepartment
                  ? "No posts found for the selected department."
                  : "Get started by creating your first job post."}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </CardContent>
          </Card>
        )}
        <CreatePostDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          departments={departments}
          onSuccess={fetchPosts}
        />
        <EditPostDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          post={selectedPost}
          departments={departments}
          onSuccess={fetchPosts}
        />
      </div>
    </div>
  )
}
