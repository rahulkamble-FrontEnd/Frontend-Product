"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUsers, deleteUser, updateUser } from "@/lib/api";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  projectName?: string;
  isActive: boolean;
  createdAt: string;
  assignedDesigner?: { id: string; name: string };
};

type EditableUser = User & {
  assignedDesignerId?: string;
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [userRole, setUserRole] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const [designers, setDesigners] = useState<User[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");

    if (!storedName || storedRole !== "admin") {
      router.push("/dashboard");
    } else {
      setUserRole(storedRole);
      setAdminEmail(storedEmail || "");
      fetchUsers();
      fetchDesigners();
    }
  }, [router]);

  const fetchDesigners = async () => {
    try {
      const data = await getUsers("designer");
      setDesigners(data);
    } catch (err) {
      console.error("Failed to fetch designers", err);
    }
  };

  const fetchUsers = async (filter?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers(filter === "all" ? undefined : filter);
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (role: string) => {
    setRoleFilter(role);
    fetchUsers(role);
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Are you sure you want to deactivate this user?")) return;
    
    try {
      await deleteUser(id);
      fetchUsers(roleFilter);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to deactivate user.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);
    setUpdateMsg("");
    setError("");

    try {
      const payload: {
        name: string;
        email: string;
        role: string;
        projectName?: string;
        assignedDesignerId?: string;
      } = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        projectName: editingUser.projectName || "",
      };

      if (editingUser.role === "customer" && editingUser.assignedDesignerId) {
        payload.assignedDesignerId = editingUser.assignedDesignerId;
      }

      await updateUser(editingUser.id, payload);
      setUpdateMsg("User updated successfully!");
      fetchUsers(roleFilter);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setUpdateMsg("");
        setEditingUser(null);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (userRole !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">User Management</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-2">Filter by Role:</span>
             <div className="flex gap-1 rounded-full bg-gray-100 p-1">
                {['all', 'customer', 'designer'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleFilterChange(role)}
                    className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                      roleFilter === role 
                        ? "bg-black text-[#ffde59] shadow-md" 
                        : "text-gray-500 hover:text-black"
                    }`}
                  >
                    {role}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-center text-sm font-bold text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Project</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Assign Designer</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Date Created</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-4"><div className="h-4 w-full rounded bg-gray-100" /></td>
                    </tr>
                  ))
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4d2c1e] text-[10px] font-bold text-[#ffde59]">
                            {user.name.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'designer' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.projectName || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.assignedDesigner ? (
                          <div className="flex flex-col">
                             <span className="font-bold text-[#4d2c1e]">{user.assignedDesigner.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-[11px] font-bold text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          {user.email !== adminEmail && (
                            <button 
                              onClick={() => {
                                setEditingUser({ ...user });
                                setIsEditModalOpen(true);
                                setError("");
                                setUpdateMsg("");
                              }}
                              className="text-[10px] font-black uppercase tracking-widest text-[#4d2c1e] hover:underline"
                            >
                              Edit
                            </button>
                          )}
                          {user.isActive && user.role !== "admin" && (
                            <button 
                              onClick={() => handleDeactivate(user.id)}
                              className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:underline"
                            >
                              Deactivate
                            </button>
                          )}
                          {!user.isActive && (
                             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 italic">
                               Deactivated
                             </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-gray-400">
                      No users found for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Edit Profile</h2>
              <button 
                onClick={() => {
                   setIsEditModalOpen(false);
                   setEditingUser(null);
                }}
                className="text-gray-400 hover:text-black"
                disabled={isUpdating}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</label>
                  <select
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    <option value="customer">Customer</option>
                    <option value="designer">Designer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Project Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={editingUser.projectName || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, projectName: e.target.value })}
                  />
                </div>
              </div>

              {editingUser.role === "customer" && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Assign Designer</label>
                  <select
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={editingUser.assignedDesignerId || editingUser.assignedDesigner?.id || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, assignedDesignerId: e.target.value })
                    }
                  >
                    <option value="">Select a designer</option>
                    {designers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {updateMsg && <div className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">{updateMsg}</div>}
              {error && <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">{error}</div>}

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full rounded-full bg-[#ffcb05] py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-4"
              >
                {isUpdating ? "Saving Changes..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
