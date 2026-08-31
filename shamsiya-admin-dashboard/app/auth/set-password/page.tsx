"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Eye, EyeOff, LockKeyhole, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const hasCallbackError = new URLSearchParams(window.location.search).has(
      "error",
    );
    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (hasCallbackError || userError || !data.user)
        setError(
          "Your invitation link is invalid or has expired. Please request a new invitation.",
        );
      setLoading(false);
    });
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (password !== confirmation) return setError("Passwords do not match.");
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError)
      return setError(
        "Unable to set your password. Please request a new invitation.",
      );
    setSuccess(true);
  }
  if (loading)
    return (
      <main className="login-page">
        <section className="login-form-panel">
          <div className="login-form-wrap">
            <p>Checking your invitation...</p>
          </div>
        </section>
      </main>
    );
  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-copy">
          <span className="eyebrow">Customer account</span>
          <h1>Welcome to Shamsiya Special Food</h1>
          <p>Complete your account setup and get ready for your next order.</p>
        </div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <span className="eyebrow">Account setup</span>
          <h2>Create your password</h2>
          <p className="login-subtitle">
            Complete your account setup by creating your password.
          </p>
          {success ? (
            <div className="success-note">
              <Check />
              <p>Password created successfully.</p>
              <button
                className="primary-button"
                onClick={() =>
                  router.push(
                    process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || "/login",
                  )
                }
              >
                Continue to Customer App <ArrowRight />
              </button>
            </div>
          ) : (
            <form className="login-form" onSubmit={submit}>
              <label htmlFor="new-password">New Password</label>
              <div className="login-input-wrap">
                <LockKeyhole />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <label htmlFor="confirm-password">Confirm Password</label>
              <div className="login-input-wrap">
                <LockKeyhole />
                <input
                  id="confirm-password"
                  type={showConfirmation ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showConfirmation ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowConfirmation(!showConfirmation)}
                >
                  {showConfirmation ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <button
                type="submit"
                className="primary-button login-submit"
                disabled={saving}
              >
                {saving ? "Setting password..." : "Set Password"}{" "}
                {!saving && <ArrowRight />}
              </button>
              {error && (
                <p className="login-message" role="alert">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
