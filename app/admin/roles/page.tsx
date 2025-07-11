"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users, ArrowLeft } from "lucide-react"
import { CreateRoleDialog } from "@/components/create-role-dialog"
import { EditRoleDialog } from "@/components/edit-role-dialog"
import { useRouter } from "next/navigation"

interface CustomRole {
  id: string
  name: string
  description: string | null
  permissions: string[]
  isActive: boolean
  _count: { employees: number }
}

export default function RolesPage() {
  const [roles, setRoles] = useState<CustomRole[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/roles", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setRoles(data)
    } catch (error) {
      console.error("Error fetching roles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return

    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchRoles()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete role")
      }
    } catch (error) {
      console.error("Error deleting role:", error)
      alert("Failed to delete role")
    }
  }

  const handleEditRole = (role: CustomRole) => {
    setSelectedRole(role)
    setEditDialogOpen(true)
  }

  const getPermissionBadges = (permissions: string[]) => {
    return permissions.slice(0, 3).map((permission) => (
      <Badge key={permission} variant="secondary" className="text-xs">
        {permission.replace("_", " ")}
      </Badge>
    ))
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
        <h1 className="text-2xl font-bold tracking-tight text-blue-900">Role Management</h1>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Role Management</h1>
            <p className="text-blue-700">Create and manage custom roles with specific permissions</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} variant="gradient" className="hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-2xl transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-blue-700">{role.name}</CardTitle>
                    <CardDescription className="mt-1 text-purple-500">{role.description || "No description provided"}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)} className="hover:bg-blue-100/40">
                      <Edit className="w-4 h-4 text-blue-900" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-blue-700">
                    <Users className="w-4 h-4 mr-2 text-blue-500" />
                    {role._count.employees} employee{role._count.employees !== 1 ? "s" : ""}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2 text-purple-700">Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {getPermissionBadges(role.permissions)}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Badge variant={role.isActive ? "default" : "secondary"} className={role.isActive ? "bg-blue-500 text-white" : "bg-purple-200 text-purple-700"}>
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {roles.length === 0 && (
          <Card className="hover:shadow-md transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-blue-300 mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">No roles found</h3>
              <p className="text-blue-700 mb-4">Get started by creating your first custom role.</p>
              <Button onClick={() => setCreateDialogOpen(true)} variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            </CardContent>
          </Card>
        )}
        <CreateRoleDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={fetchRoles} />
        <EditRoleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          role={selectedRole}
          onSuccess={fetchRoles}
        />
      </div>
    </div>
  )
}
