"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Clock, CheckCircle, Shield, Briefcase, Plus, Building, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { AddEmployeeDialog } from "@/components/add-employee-dialog"
import { AddDepartmentDialog } from "@/components/add-department-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import toast from "react-hot-toast"
import jwt_decode from "jwt-decode"

function getUserRole() {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("auth-token")
  if (!token) return null
  try {
    const decoded = jwt_decode(token)
    // @ts-ignore
    return decoded.role || null
  } catch {
    return null
  }
}

function AddLeaveTypeDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [maxDaysPerYear, setMaxDaysPerYear] = useState("")
  const [carryForward, setCarryForward] = useState(false)
  const [maxCarryForward, setMaxCarryForward] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("auth-token")
      const res = await fetch("/api/leave-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          maxDaysPerYear,
          carryForward,
          maxCarryForward: carryForward ? maxCarryForward : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to add leave type")
      }
      toast.success("Leave type added!")
      onOpenChange(false)
      onSuccess()
      setName("")
      setDescription("")
      setMaxDaysPerYear("")
      setCarryForward(false)
      setMaxCarryForward("")
    } catch (err: any) {
      setError(err.message || "Failed to add leave type")
      toast.error(err.message || "Failed to add leave type")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Leave Type</DialogTitle>
          <DialogDescription>Add a new leave type for employees</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Annual Leave" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Description</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Max Days Per Year *</label>
            <Input type="number" value={maxDaysPerYear} onChange={e => setMaxDaysPerYear(e.target.value)} required min={1} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={carryForward} onCheckedChange={setCarryForward} id="carryForward" />
            <label htmlFor="carryForward" className="text-sm">Carry Forward</label>
          </div>
          {carryForward && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Max Carry Forward</label>
              <Input type="number" value={maxCarryForward} onChange={e => setMaxCarryForward(e.target.value)} min={0} />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !name || !maxDaysPerYear}>{loading ? "Adding..." : "Add Leave Type"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DashboardStats {
  totalEmployees: number
  pendingRequests: number
  approvedRequests: number
  totalDepartments: number
}

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalDepartments: 0,
  })
  const [recentRequests, setRecentRequests] = useState([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [loading, setLoading] = useState(true)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [addDepartmentOpen, setAddDepartmentOpen] = useState(false)
  const [addLeaveTypeOpen, setAddLeaveTypeOpen] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const role = getUserRole()

  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
    fetchLeaveTypes()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("auth-token")

      // Fetch all data in parallel
      const [employeesRes, requestsRes, departmentsRes, postsRes, rolesRes] = await Promise.all([
        fetch("/api/employees", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/leave-requests", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/departments", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/posts", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/roles", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const [employees, requests, departments, posts, roles] = await Promise.all([
        employeesRes.json(),
        requestsRes.json(),
        departmentsRes.json(),
        postsRes.json(),
        rolesRes.json(),
      ])

      setStats({
        totalEmployees: employees.length || 0,
        pendingRequests: requests.filter((r: any) => r.status === "PENDING").length || 0,
        approvedRequests: requests.filter((r: any) => r.status === "APPROVED").length || 0,
        totalDepartments: departments.length || 0,
      })

      setRecentRequests(requests.slice(0, 5))
      setDepartments(departments)
      setPosts(posts)
      setEmployees(employees)
      setCustomRoles(roles)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaveTypes = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const res = await fetch("/api/leave-types", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setLeaveTypes(data)
    } catch (err) {
      setLeaveTypes([])
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-teal-400">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white/80 text-blue-900 border-b border-border flex items-center px-6 py-4 mb-6 shadow-lg animate-fade-in">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4 text-blue-900 hover:bg-blue-100/40">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-blue-900">Admin Dashboard</h1>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-900">Admin Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="gradient" className="transition-transform hover:scale-105" onClick={() => setAddEmployeeOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
            <Button variant="gradient2" className="transition-transform hover:scale-105" onClick={() => setAddDepartmentOpen(true)}>
              <Building className="w-4 h-4 mr-2" />
              Add Department
            </Button>
            <Button variant="gradient3" className="transition-transform hover:scale-105" onClick={() => router.push("/admin/employees")}> 
              <Users className="w-4 h-4 mr-2" />
              Manage Employees
            </Button>
            <Button variant="gradient" className="transition-transform hover:scale-105" onClick={() => router.push("/admin/roles")}> 
              <Shield className="w-4 h-4 mr-2" />
              Manage Roles
            </Button>
            <Button variant="gradient2" className="transition-transform hover:scale-105" onClick={() => router.push("/admin/posts")}> 
              <Briefcase className="w-4 h-4 mr-2" />
              Manage Posts
            </Button>
            <Button variant="gradient3" className="transition-transform hover:scale-105" onClick={() => router.push("/admin/leave-requests")}> 
              <Calendar className="w-4 h-4 mr-2" />
              Leave Requests
            </Button>
            <Button variant="gradient" className="transition-transform hover:scale-105" onClick={() => setAddLeaveTypeOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Leave Type
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-2xl transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalEmployees}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-2xl transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.pendingRequests}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-2xl transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-teal-700">Approved Requests</CardTitle>
              <CheckCircle className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-900">{stats.approvedRequests}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-2xl transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Departments</CardTitle>
              <Building className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalDepartments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leave Requests */}
        <Card className="hover:shadow-2xl transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-700">Recent Leave Requests</CardTitle>
            <CardDescription className="text-blue-500">Your recent leave applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 via-purple-50 to-teal-50 animate-fade-in-up shadow-md">
                  <div className="flex-1">
                    <div className="font-medium text-lg text-blue-900">
                      {request.employee.firstName} {request.employee.lastName}
                    </div>
                    <div className="text-sm text-blue-700">
                      {request.leaveType.name} • {request.totalDays} days
                    </div>
                    <div className="text-sm text-blue-700">
                      {new Date(request.startDate).toLocaleDateString()} -{" "}
                      {new Date(request.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(request.status)}
                    {request.status === "PENDING" && (
                      <div className="space-x-2">
                        <Button size="sm" variant="gradient2" className="hover:scale-105 transition-transform">Approve</Button>
                        <Button size="sm" variant="gradient3" className="hover:scale-105 transition-transform">Reject</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {recentRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">No recent leave requests found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <AddEmployeeDialog
          open={addEmployeeOpen}
          onOpenChange={setAddEmployeeOpen}
          departments={departments}
          posts={posts}
          employees={employees}
          customRoles={customRoles}
          onSuccess={fetchDashboardData}
        />

        <AddDepartmentDialog
          open={addDepartmentOpen}
          onOpenChange={setAddDepartmentOpen}
          onSuccess={fetchDashboardData}
        />

        {role && (role === "ADMIN" || role === "HR") && (
          <div className="mb-6">
            <Button onClick={() => setAddLeaveTypeOpen(true)}>
              Add Leave Type
            </Button>
          </div>
        )}
        <AddLeaveTypeDialog open={addLeaveTypeOpen} onOpenChange={setAddLeaveTypeOpen} onSuccess={fetchLeaveTypes} />
      </div>
    </div>
  )
}
