"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login, getMe, forgotPassword, resetPassword } from "@/lib/api";

type ViewMode = "login" | "forgot";
const THEME_GOLD_GRADIENT =
  "linear-gradient(90deg, #8A6A3A 0%, #A9844F 25%, #C9A46A 50%, #B8925A 75%, #7A5C2E 100%)";
const THEME_LIGHT_GRADIENT = "linear-gradient(90deg, #F2EFE5 0%, #FFF0E3 100%)";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Login State
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("password123");

  // Forgot Password & Reset State
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizeEmailInput = (value: string) => value.replace(/\s+/g, "").trim();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const normalizedEmail = normalizeEmailInput(email);
      await login({ email: normalizedEmail, password });
      const user = await getMe();
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userEmail", normalizedEmail);
      localStorage.setItem("userPassword", password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError("Email is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // First, get the reset token
      const forgotResponse = await forgotPassword({ email: resetEmail });
      
      if (forgotResponse && forgotResponse.resetToken) {
        // Then, use that token to reset the password
        const response = await resetPassword({ token: forgotResponse.resetToken, newPassword });
        setSuccess(response.message || "Password reset successfully! You can now log in.");
        setTimeout(() => {
          setView("login");
          setSuccess("");
          setResetEmail("");
          setNewPassword("");
        }, 3000);
      } else {
        throw new Error("Email not found or token generation failed.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans" style={{ background: THEME_LIGHT_GRADIENT }}>
      {/* Left Section - Benefits */}
      <div
        className="hidden w-2/5 flex-col p-12 text-white lg:flex"
        style={{ background: THEME_GOLD_GRADIENT }}
      >
        {/* Brand Block */}
        <div className="mb-12">
          <div className="flex items-center gap-2">
            <div
              className="rounded px-2 py-1 text-xs font-black uppercase tracking-wider text-[#3b2416]"
              style={{ background: THEME_GOLD_GRADIENT }}
            >
              custom
            </div>
            <div className="flex flex-col tracking-tighter">
              <span className="text-xs font-bold leading-none uppercase">Furnish</span>
              <span className="text-[10px] font-medium leading-none uppercase">Interior Platform</span>
            </div>
          </div>
          <div
            className="mt-4 h-0.5 w-16 opacity-90"
            style={{ background: THEME_GOLD_GRADIENT }}
          />
        </div>

        <h1 className="mb-4 text-2xl font-bold">Benefits of Login</h1>
        <p className="mb-10 text-sm font-light text-[#f8ecd9]/90">
          Access your Custom Furnish dashboard, products, and design workflow in one place.
        </p>

        {/* Benefits List */}
        <div className="space-y-12">
          <div className="flex gap-4 items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d6b27c]/40 bg-[#d2ad70]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <p className="text-sm font-medium leading-tight">
              Manage products, update details, and keep your catalog organized from one dashboard.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d6b27c]/40 bg-[#d2ad70]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <p className="text-sm font-medium leading-tight">
              Upload images, review materials, and prepare collections for your customers faster.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d6b27c]/40 bg-[#d2ad70]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 11 11 13 15 9" />
              </svg>
            </div>
            <p className="text-sm font-medium leading-tight">
              Get quick access to admin tools, category management, and product publishing controls.
            </p>
          </div>
        </div>

        {/* Bicycle Illustration Placeholder */}
        <div className="mt-auto relative h-64 w-full">
          <div className="absolute bottom-0 left-0 w-full flex justify-center">
            <svg viewBox="0 0 400 240" className="w-full max-w-sm h-auto opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="120" cy="180" r="40" stroke="white" strokeWidth="4" />
              <circle cx="280" cy="180" r="40" stroke="white" strokeWidth="4" />
              <path d="M120 180L180 100H280L280 180" stroke="white" strokeWidth="4" />
              <path d="M180 100L160 70H140" stroke="white" strokeWidth="4" />
              <path d="M280 100L300 70H320" stroke="white" strokeWidth="4" />
              <circle cx="200" cy="61" r="14" fill="white" />
              <path d="M200 75L180 120" stroke="white" strokeWidth="4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Section - Forms */}
      <div className="flex w-full items-center justify-center px-4 py-10 sm:p-8 lg:w-3/5">
        <div className="w-full max-w-[420px] space-y-8 rounded-3xl border border-[#dfcfb6] bg-[#fff9f2]/85 p-5 shadow-[0_20px_55px_rgba(73,42,19,0.14)] backdrop-blur-sm sm:p-8">

          {/* VIEW: LOGIN */}
          {view === "login" && (
            <>
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-[#5d3b24]">
                  Start your journey with us
                </h2>
                <p className="mt-4 text-sm text-[#8d7458]">
                  Sign in to Custom Furnish to manage products, categories, and your furnishing catalog.
                </p>
              </div>

              <form className="mt-10 space-y-6" onSubmit={handleLogin}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-full border border-[#e5d9c5] bg-[#faf5ed] py-3.5 pl-12 pr-4 text-sm text-[#5d3b24] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#c9a46a]"
                    placeholder="Email id"
                    value={email}
                    onChange={(e) => setEmail(normalizeEmailInput(e.target.value))}
                  />
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full rounded-full border border-[#e5d9c5] bg-[#faf5ed] py-3.5 pl-12 pr-12 text-sm text-[#5d3b24] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#c9a46a]"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.17 4.56" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {error && <div className="text-center text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
                {success && <div className="text-center text-sm font-medium text-green-600 bg-green-50 p-3 rounded-xl">{success}</div>}

                <div className="flex justify-end pr-2">
                  <button type="button" onClick={() => setView("forgot")} className="text-xs font-semibold text-[#6c4a2a] hover:underline">
                    Forgot password?
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-1/2 rounded-full py-3.5 text-sm font-black uppercase tracking-wider text-[#3b2416] shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                    style={{ background: THEME_GOLD_GRADIENT }}
                  >
                    {isLoading ? "PROCEEDING..." : "PROCEED"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* VIEW: FORGOT PASSWORD / SINGLE STEP RESET */}
          {view === "forgot" && (
            <>
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-[#5d3b24]">Reset Password</h2>
                <p className="mt-4 text-sm text-[#8d7458]">Enter your email and new password to reset.</p>
              </div>

              <form className="mt-10 space-y-6" onSubmit={handleResetPassword}>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full rounded-full border border-[#e5d9c5] bg-[#faf5ed] py-3.5 pl-12 pr-4 text-sm text-[#5d3b24] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#c9a46a]"
                      placeholder="Enter registered email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(normalizeEmailInput(e.target.value))}
                    />
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      className="block w-full rounded-full border border-[#e5d9c5] bg-[#faf5ed] py-3.5 pl-12 pr-12 text-sm text-[#5d3b24] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#c9a46a]"
                      placeholder="New password (8+ chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.17 4.56" />
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && <div className="text-center text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
                {success && <div className="text-center text-sm font-medium text-green-600 bg-green-50 p-3 rounded-xl">{success}</div>}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                        setView("login");
                        setError("");
                        setSuccess("");
                    }}
                    className="w-full rounded-full border-2 border-[#7f5a34] py-3 text-xs font-bold text-[#6c4a2a] active:scale-95 sm:w-40"
                  >
                    BACK
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-full py-3.5 text-sm font-black uppercase tracking-wider text-[#3b2416] shadow-lg transition-transform active:scale-95 disabled:opacity-50 sm:w-60"
                    style={{ background: THEME_GOLD_GRADIENT }}
                  >
                    {isLoading ? "RESETTING..." : "RESET PASSWORD"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* <div className="flex flex-col items-center space-y-8 pt-4">
            <a href="#" className="text-sm font-medium text-[#0468a3] hover:underline">
              Trouble in login?
            </a>

            <button className="w-full rounded-full bg-[#ffde59] py-4 text-sm font-black uppercase tracking-widest text-[#0468a3] shadow-md transition-transform active:scale-95">
              TRACK YOUR PROPOSAL/APPLICATION STATUS
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
