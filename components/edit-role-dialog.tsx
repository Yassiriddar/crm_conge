"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CustomRole {
  id: string
  name: string
  description: string | null
  permissions: string[]
  isActive: boolean
}

interface EditRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: CustomRole | null
  onSuccess: () => void
}

const AVAILABLE_PERMISSIONS = [
  { id: "view_employees", label: "View Employees", description: "Can view employee information" },
  { id: "create_employees", label: "Create Employees", description: "Can add new employees" },
  { id: "edit_employees", label: "Edit Employees", description: "Can modify employee information" },
  { id: "delete_employees", label: "Delete Employees", description: "Can remove employees" },
  { id: "view_leave_requests", label: "View Leave Requests", description: "Can view leave requests" },
  { id: "approve_leave_requests", label: "Approve Leave Requests", description: "Can approve/reject leave requests" },
  { id: "view_departments", label: "View Departments", description: "Can view department information" },
  { id: "create_departments", label: "Create Departments", description: "Can create new departments" },
  { id: "edit_departments", label: "Edit Departments", description: "Can modify departments" },
  { id: "view_reports", label: "View Reports", description: "Can access reporting features" },
  { id: "manage_roles", label: "Manage Roles", description: "Can create and manage roles" },
  { id: "view_articles", label: "View Articles", description: "Can view internal articles" },
  { id: "create_articles", label: "Create Articles", description: "Can create internal articles" },
  { id: "edit_articles", label: "Edit Articles", description: "Can modify articles" },
]

export function EditRoleDialog({ open, onOpenChange, role, onSuccess }: EditRoleDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [permissions, setPermissions] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (role) {
      setName(role.name)
      setDescription(role.description || "")
      setPermissions(role.permissions)
      setIsActive(role.isActive)
    }
  }, [role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/roles/${role.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          permissions,
          isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update role")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setPermissions([...permissions, permissionId])
    } else {
      setPermissions(permissions.filter((p) => p !== permissionId))
    }
  }

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>Update the role details and permissions.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Active Role</Label>
          </div>

          <div className="space-y-4">
            <Label>Permissions *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={permission.id}
                    checked={permissions.includes(permission.id)}
                    onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                      {permission.label}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name || permissions.length === 0}>
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
