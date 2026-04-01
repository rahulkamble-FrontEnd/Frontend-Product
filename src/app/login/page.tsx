"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { login, getMe, forgotPassword, resetPassword } from "@/lib/api";

type ViewMode = "login" | "forgot" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("login");
  
  // Login State
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("password123");
  
  // Forgot Password & Reset State
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await login({ email, password });
      const user = await getMe();
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userPassword", password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await forgotPassword({ email: resetEmail });
      // The API returns 'resetToken' based on the network preview
      if (response && response.resetToken) {
        setResetToken(response.resetToken); 
        setSuccess("Reset token generated successfully! Please set your new password.");
        setView("reset");
      } else {
        throw new Error("Token not found in response.");
      }
    } catch (err: any) {
      setError(err.message || "Request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
        setError("New password must be at least 8 characters long.");
        return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await resetPassword({ token: resetToken, newPassword });
      setSuccess(response.message || "Password reset successfully! You can now log in.");
      setTimeout(() => {
        setView("login");
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Reset failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* Left Section - Benefits */}
      <div className="hidden w-2/5 flex-col bg-[#0468a3] p-12 text-white lg:flex">
        {/* Logo Placeholder */}
        <div className="mb-12">
          <div className="flex items-center gap-2">
            <div className="bg-[#ffde59] px-2 py-1 text-xs font-black text-[#0468a3] italic">
              care
            </div>
            <div className="flex flex-col tracking-tighter">
              <span className="text-xs font-bold leading-none uppercase">Health</span>
              <span className="text-[10px] font-medium leading-none uppercase">Insurance</span>
            </div>
          </div>
          <div className="mt-4 h-0.5 w-12 bg-white/50" />
        </div>

        <h1 className="mb-4 text-2xl font-bold">Benefits of Login</h1>
        <p className="mb-10 text-sm font-light text-blue-50/80">
          Being part of Care Health Insurance, It&apos;s really worth it.
        </p>

        {/* Benefits List */}
        <div className="space-y-12">
          <div className="flex gap-4 items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <p className="text-sm font-medium leading-tight">
              Review, edit & update details of all enrolled member instantly and do much more.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <p className="text-sm font-medium leading-tight">
              Avail Annual health checkup & book appointment online.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 11 13 15 9"/>
              </svg>
            </div>
            <p className="text-sm font-medium leading-tight">
              Get access to host of other benefits and self service option.
            </p>
          </div>
        </div>

        {/* Bicycle Illustration Placeholder */}
        <div className="mt-auto relative h-64 w-full">
            <div className="absolute bottom-0 left-0 w-full flex justify-center">
                 <svg viewBox="0 0 400 240" className="w-full max-w-sm h-auto opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="120" cy="180" r="40" stroke="white" strokeWidth="4"/>
                    <circle cx="280" cy="180" r="40" stroke="white" strokeWidth="4"/>
                    <path d="M120 180L180 100H280L280 180" stroke="white" strokeWidth="4"/>
                    <path d="M180 100L160 70H140" stroke="white" strokeWidth="4"/>
                    <path d="M280 100L300 70H320" stroke="white" strokeWidth="4"/>
                    <circle cx="200" cy="61" r="14" fill="white"/>
                    <path d="M200 75L180 120" stroke="white" strokeWidth="4"/>
                 </svg>
            </div>
        </div>
      </div>

      {/* Right Section - Forms */}
      <div className="flex w-full items-center justify-center p-8 lg:w-3/5">
        <div className="w-full max-w-md space-y-8">
          
          {/* VIEW: LOGIN */}
          {view === "login" && (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-[#0468a3]">
                  Start your journey with us
                </h2>
                <p className="mt-4 text-sm text-gray-500">
                  Have a Care Health Insurance Policy number, but never signed in? Don&apos;t worry, We got you cover
                </p>
              </div>

              <form className="mt-10 space-y-6" onSubmit={handleLogin}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-full bg-gray-100 py-3.5 pl-12 pr-4 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#ffde59]"
                    placeholder="Email id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full rounded-full bg-gray-100 py-3.5 pl-12 pr-4 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#ffde59]"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && <div className="text-center text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
                {success && <div className="text-center text-sm font-medium text-green-600 bg-green-50 p-3 rounded-xl">{success}</div>}

                <div className="flex justify-end pr-2">
                  <button type="button" onClick={() => setView("forgot")} className="text-xs font-semibold text-[#0468a3] hover:underline">
                    Forgot password?
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-1/2 rounded-full bg-[#ffde59] py-3.5 text-sm font-black uppercase tracking-wider text-[#0468a3] shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? "PROCEEDING..." : "PROCEED"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === "forgot" && (
             <>
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-[#0468a3]">Forgot Password?</h2>
                <p className="mt-4 text-sm text-gray-500">Enter your email and we&apos;ll generate a reset token for you.</p>
              </div>

              <form className="mt-10 space-y-6" onSubmit={handleForgotPassword}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full rounded-full bg-gray-100 py-3.5 pl-12 pr-4 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#ffde59]"
                    placeholder="Enter registered email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>

                {error && <div className="text-center text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}

                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="w-1/3 rounded-full border-2 border-[#0468a3] py-2.5 text-xs font-bold text-[#0468a3] active:scale-95"
                  >
                    BACK
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-1/2 rounded-full bg-[#ffde59] py-3.5 text-sm font-black uppercase tracking-wider text-[#0468a3] shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? "REQUESTING..." : "GET TOKEN"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* VIEW: RESET PASSWORD */}
          {view === "reset" && (
             <>
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-[#0468a3]">Reset Password</h2>
                <p className="mt-4 text-sm text-gray-500">Please enter your new password to continue.</p>
              </div>

              <form className="mt-10 space-y-6" onSubmit={handleResetPassword}>
                <div className="space-y-4">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <input
                            type="password"
                            required
                            className="block w-full rounded-full bg-gray-100 py-3.5 pl-12 pr-4 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#ffde59]"
                            placeholder="New password (8+ chars)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && <div className="text-center text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
                {success && <div className="text-center text-sm font-medium text-green-600 bg-green-50 p-3 rounded-xl">{success}</div>}

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-1/2 rounded-full bg-[#ffde59] py-3.5 text-sm font-black uppercase tracking-wider text-[#0468a3] shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? "RESETTING..." : "RESET PASSWORD"}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="flex flex-col items-center space-y-8 pt-4">
            <a href="#" className="text-sm font-medium text-[#0468a3] hover:underline">
              Trouble in login?
            </a>

            <button className="w-full rounded-full bg-[#ffde59] py-4 text-sm font-black uppercase tracking-widest text-[#0468a3] shadow-md transition-transform active:scale-95">
              TRACK YOUR PROPOSAL/APPLICATION STATUS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
