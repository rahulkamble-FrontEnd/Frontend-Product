"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout, createUser } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    name: "",
    role: "customer",
    projectName: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedRole = localStorage.getItem("userRole");
    if (!storedName) {
      router.push("/login");
    } else {
      setUserName(storedName);
      setUserRole(storedRole || "");
    }
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const email = localStorage.getItem("userEmail") || "";
      const password = localStorage.getItem("userPassword") || "";
      await logout({ email, password });
      localStorage.clear();
      router.push("/login");
    } catch (err) {
      localStorage.clear();
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateMsg("");
    setCreateError("");
    try {
      await createUser(newUserData);
      setCreateMsg("User created successfully!");
      setNewUserData({ email: "", name: "", role: "customer", projectName: "" });
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateMsg("");
      }, 2000);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!userName) return null;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Top Header */}
      <header className="border-b border-gray-100 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl font-black text-[#ffde59]">
              M
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black uppercase tracking-tighter">Material</span>
              <span className="text-lg font-black uppercase tracking-tighter">Depot</span>
            </div>
          </div>

          {/* Delivery & Links (Desktop) */}
          <div className="hidden items-center gap-6 lg:flex">
             <div className="flex items-center gap-1 rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-600 border border-gray-100">
                <span>Deliver to</span>
                <span className="font-bold underline decoration-dotted">560001</span>
             </div>
             <nav className="flex gap-6 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                <a href="#" className="hover:text-black">Visit Store</a>
                <a href="#" className="flex items-center gap-1 hover:text-black">
                    Tools
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </a>
             </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <input
              type="text"
              placeholder="Search tropical wallpapers...."
              className="w-full rounded-md border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
            <div className="absolute inset-y-0 right-3 flex items-center gap-2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {userRole === "admin" && (
                <>
                  <button 
                    onClick={() => router.push("/users")}
                    className="hidden rounded-md border-2 border-black px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-black md:block shadow-sm hover:bg-black hover:text-white transition-all mr-1"
                  >
                    Manage Users
                  </button>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="hidden rounded-md bg-black px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#ffcb05] md:block shadow-sm hover:opacity-90 mr-1"
                  >
                    Create User
                  </button>
                </>
            )}
            <button className="hidden rounded-md bg-[#ffcb05] px-4 py-2 text-[11px] font-black uppercase tracking-wider md:block shadow-sm">
              Shop on call
            </button>
            <div className="relative cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">0</span>
            </div>
             {/* Profile/Menu (Mobile replacement for logout) */}
             <button 
                onClick={handleLogout}
                className="ml-2 flex flex-col items-center justify-center"
             >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-[#ffcb05]">
                    {userName.charAt(0)}
                </div>
                <span className="text-[10px] font-bold uppercase mt-0.5">{isLoggingOut ? "..." : "Logout"}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="bg-[#4d2c1e] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 py-2.5 text-[11px] font-bold uppercase tracking-widest px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <a href="#" className="flex items-center gap-1 hover:text-[#ffcb05]">Flooring <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></a>
          <a href="#" className="flex items-center gap-1 hover:text-[#ffcb05]">Laminates <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></a>
          <a href="#" className="flex items-center gap-1 hover:text-[#ffcb05]">Louvers & Panels <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></a>
          <a href="#" className="flex items-center gap-1 hover:text-[#ffcb05]">Wallpaper <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></a>
          <a href="#" className="flex items-center gap-1 hover:text-[#ffcb05]">Kitchen <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></a>
          <a href="#" className="flex items-center gap-1 hover:text-[#ffcb05]">Bathroom <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></a>
          <a href="#" className="flex items-center gap-1 hover:text-[#ffcb05]">Wardrobe <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></a>
          <a href="#" className="flex items-center gap-1 hover:text-[#ffcb05]">TV Unit <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></a>
          <a href="#" className="flex items-center gap-1 hover:text-[#ffcb05]">Outdoor <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#f7f2ed] py-4 lg:py-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="relative rounded-3xl bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center h-[280px] lg:h-[450px] shadow-sm">
             {/* Overlay for text readability */}
             <div className="absolute inset-0 bg-gradient-to-r from-[#4d2c1e]/60 to-transparent flex items-center p-8 lg:p-20">
                <div className="max-w-xl text-white">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="h-0.5 w-8 bg-[#ffcb05]" />
                      <span className="text-xl italic font-serif leading-none tracking-wide">Newly Launched</span>
                      <div className="h-0.5 w-8 bg-[#ffcb05]" />
                   </div>
                   <h2 className="text-4xl lg:text-7xl font-black uppercase italic leading-tight tracking-tighter">
                      का​री​गरी
                   </h2>
                   <p className="text-2xl lg:text-5xl font-black uppercase mt-2 tracking-tight">
                    Laminate Collection
                   </p>
                   <p className="mt-4 text-xs lg:text-lg font-medium opacity-90 italic">
                    Celebration of <span className="font-bold">Faith, Folklore & Creativity</span>
                   </p>
                </div>
             </div>

             {/* Slider Navigation */}
             <button className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-md md:left-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
             </button>
             <button className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-md md:right-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
             </button>

             {/* Pagination Dots */}
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                <div className="h-2 w-6 rounded-full bg-white" />
                <div className="h-2 w-2 rounded-full bg-white/40" />
                <div className="h-2 w-2 rounded-full bg-white/40" />
                <div className="h-2 w-2 rounded-full bg-white/40" />
             </div>
          </div>
        </div>
      </section>

      {/* Product Section Intro */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
         <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-gray-500 shadow-sm">
                <div className="h-1 w-1 rounded-full bg-[#ffcb05]" />
                Newly Launched
                <div className="h-1 w-1 rounded-full bg-[#ffcb05]" />
            </span>
         </div>
         <h3 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter">
            Karigari Laminates
         </h3>
      </section>

      {/* User Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Create New User</h2>
              <button 
                onClick={() => {
                   setIsCreateModalOpen(false);
                   setCreateError("");
                   setCreateMsg("");
                }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Priya"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="e.g. priya@gmail.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</label>
                  <select
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
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
                    value={newUserData.projectName}
                    onChange={(e) => setNewUserData({ ...newUserData, projectName: e.target.value })}
                    placeholder="e.g. 3BHK Kondapur"
                  />
                </div>
              </div>

              {createError && <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">{createError}</div>}
              {createMsg && <div className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">{createMsg}</div>}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded-full bg-[#ffcb05] py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-4"
              >
                {isCreating ? "Creating User..." : "Confirm & Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
           {/* Tooltip replacement for WhatsApp vibe */}
           <span className="absolute right-16 top-1/2 -translate-y-1/2 scale-0 rounded-lg bg-white px-2 py-1 text-xs font-bold text-gray-900 shadow-md group-hover:scale-100 transition-all origin-right">
             Chat with us
           </span>
        </button>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
