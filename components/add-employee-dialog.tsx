"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const employeeSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  employeeId: z.string().min(3, "Employee ID must be at least 3 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfJoining: z.date({
    required_error: "Date of joining is required",
  }),
  departmentId: z.string().min(1, "Department is required"),
  postId: z.string().min(1, "Post is required"),
  managerId: z.string().optional(),
  customRoleId: z.string().optional(),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

interface Department {
  id: string
  name: string
}

interface Post {
  id: string
  title: string
  departmentId: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
}

interface CustomRole {
  id: string
  name: string
}

interface AddEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: Department[]
  posts: Post[]
  employees: Employee[]
  customRoles: CustomRole[]
  onSuccess: () => void
}

export function AddEmployeeDialog({
  open,
  onOpenChange,
  departments,
  posts,
  employees,
  customRoles,
  onSuccess,
}: AddEmployeeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  })

  const watchedDepartment = watch("departmentId")
  const watchedDate = watch("dateOfJoining")

  // Filter posts by selected department
  const filteredPosts = posts.filter((post) => post.departmentId === watchedDepartment)

  const onSubmit = async (data: EmployeeFormData) => {
    setLoading(true)
    setError("")

    try {
      // First create the user account
      const userResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({
          email: data.email,
          password: "temp123", // Temporary password - should be changed on first login
          role: "EMPLOYEE",
        }),
      })

      const userData = await userResponse.json()

      if (!userResponse.ok) {
        throw new Error(userData.error || "Failed to create user account")
      }

      // Then create the employee record
      const employeeResponse = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({
          userId: userData.user.id,
          employeeId: data.employeeId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          address: data.address || null,
          dateOfJoining: data.dateOfJoining.toISOString(),
          departmentId: data.departmentId,
          postId: data.postId,
          managerId: data.managerId || null,
          customRoleId: data.customRoleId || null,
        }),
      })

      const employeeData = await employeeResponse.json()

      if (!employeeResponse.ok) {
        throw new Error(employeeData.error || "Failed to create employee")
      }

      onSuccess()
      onOpenChange(false)
      reset()
      setSelectedDepartment("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee")
    } finally {
      setLoading(false)
    }
  }

  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartment(departmentId)
    setValue("departmentId", departmentId)
    setValue("postId", "") // Reset post selection when department changes
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>Create a new employee account and profile.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" {...register("firstName")} placeholder="John" />
                {errors.firstName && <p className="text-sm text-red-600">{errors.firstName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" {...register("lastName")} placeholder="Doe" />
                {errors.lastName && <p className="text-sm text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} placeholder="john.doe@company.com" />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input id="employeeId" {...register("employeeId")} placeholder="EMP001" />
                {errors.employeeId && <p className="text-sm text-red-600">{errors.employeeId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} placeholder="+1234567890" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfJoining">Date d'embauche *</Label>
                <Input
                  id="dateOfJoining"
                  type="date"
                  {...register("dateOfJoining", {
                    valueAsDate: true,
                  })}
                />
                {errors.dateOfJoining && <p className="text-sm text-red-600">{errors.dateOfJoining.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} placeholder="123 Main Street, City, State" />
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Work Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={watchedDepartment} onValueChange={handleDepartmentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && <p className="text-sm text-red-600">{errors.departmentId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="post">Post *</Label>
                <Select
                  value={watch("postId")}
                  onValueChange={(value) => setValue("postId", value)}
                  disabled={!watchedDepartment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select post" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPosts.map((post) => (
                      <SelectItem key={post.id} value={post.id}>
                        {post.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.postId && <p className="text-sm text-red-600">{errors.postId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Select
                  value={watch("managerId") || "no-manager"}
                  onValueChange={(value) => setValue("managerId", value === "no-manager" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-manager">No Manager</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customRole">Custom Role</Label>
                <Select
                  value={watch("customRoleId") || "no-custom-role"}
                  onValueChange={(value) => setValue("customRoleId", value === "no-custom-role" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-custom-role">No Custom Role</SelectItem>
                    {customRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
