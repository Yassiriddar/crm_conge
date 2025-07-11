"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface Employee {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  department: { name: string }
  post: { title: string }
  user?: { email: string }
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [leaveBalances, setLeaveBalances] = useState<any[]>([])
  const [balancesOpen, setBalancesOpen] = useState(false)
  const [balancesLoading, setBalancesLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setEmployees(data)
    } catch (err) {
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewBalances = async (employee: Employee) => {
    setSelectedEmployee(employee)
    setBalancesOpen(true)
    setBalancesLoading(true)
    try {
      const token = localStorage.getItem("auth-token")
      const res = await fetch(`/api/leave-balances?employeeId=${employee.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setLeaveBalances(data)
    } catch (err) {
      setLeaveBalances([])
    } finally {
      setBalancesLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-teal-400">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white/80 text-blue-900 border-b border-border flex items-center px-6 py-4 mb-6 shadow-lg animate-fade-in">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4 text-blue-900 hover:bg-blue-100/40">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-blue-900">Employee Management</h1>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <Card key={emp.id} className="hover:shadow-2xl transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg text-blue-700">{emp.firstName} {emp.lastName}</CardTitle>
                <div className="text-sm text-blue-500">ID: {emp.employeeId}</div>
                {emp.user?.email && (
                  <div className="text-sm text-purple-500">Email: {emp.user.email}</div>
                )}
                <div className="text-sm text-teal-500">{emp.department?.name} • {emp.post?.title}</div>
              </CardHeader>
              <CardContent>
                <Button variant="gradient" onClick={() => handleViewBalances(emp)} className="hover:scale-105 transition-transform">
                  <Eye className="w-4 h-4 mr-2" />
                  View Leave Balances
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <Dialog open={balancesOpen} onOpenChange={setBalancesOpen}>
          <DialogContent className="max-w-lg bg-white/80 rounded-xl animate-fade-in-up">
            <DialogHeader>
              <DialogTitle className="text-blue-900">Leave Balances for {selectedEmployee?.firstName} {selectedEmployee?.lastName}</DialogTitle>
            </DialogHeader>
            {balancesLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : leaveBalances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No leave balances found.</div>
            ) : (
              <div className="space-y-4">
                {leaveBalances.map((balance: any) => (
                  <Card key={balance.id} className="hover:shadow-md transition-shadow bg-white/80 border-0 animate-fade-in-up rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-base text-blue-700">{balance.leaveType.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-500">Allocated:</span>
                          <span className="font-medium text-blue-900">{balance.allocated} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-500">Used:</span>
                          <span className="font-medium text-purple-900">{balance.used} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-teal-500">Remaining:</span>
                          <span className="font-bold text-teal-900">{balance.remaining} days</span>
                        </div>
                        {balance.carriedOver > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-500">Carried Over:</span>
                            <span className="font-medium text-blue-900">{balance.carriedOver} days</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 