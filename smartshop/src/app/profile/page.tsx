"use client";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "preferences">("profile");

  // Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status messages
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
        setName(data.data.name);
        setEmail(data.data.email);
        setPhone(data.data.phone || "");
        setBio(data.data.bio || "");
      } else {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, phone, bio }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setUser(data.data);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update password",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-neutral-500">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-neutral-200">
          <button
            onClick={() => {
              setActiveTab("profile");
              setMessage(null);
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-neutral-900 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => {
              setActiveTab("password");
              setMessage(null);
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "password"
                ? "border-b-2 border-neutral-900 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Change Password
          </button>
          <button
            onClick={() => {
              setActiveTab("preferences");
              setMessage(null);
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "preferences"
                ? "border-b-2 border-neutral-900 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Preferences
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Information Tab */}
        {activeTab === "profile" && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio (Optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-neutral-900 text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-medium"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName(user.name);
                    setEmail(user.email);
                    setPhone("");
                    setBio("");
                  }}
                  className="px-6 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50 font-medium"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === "password" && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
                <p className="text-sm text-neutral-500 mt-1">Must be at least 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-neutral-900 text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-medium"
                >
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-neutral-100">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-neutral-500">Receive emails about your orders and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-neutral-100">
                <div>
                  <h3 className="font-medium">Marketing Emails</h3>
                  <p className="text-sm text-neutral-500">Receive emails about promotions and sales</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-neutral-100">
                <div>
                  <h3 className="font-medium">SMS Notifications</h3>
                  <p className="text-sm text-neutral-500">Receive text messages about order updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neutral-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
                </label>
              </div>

              <div className="pt-4">
                <h3 className="font-semibold mb-4">Account Actions</h3>
                <div className="space-y-3">
                  <button className="w-full md:w-auto px-6 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50 font-medium text-left">
                    Download My Data
                  </button>
                  <br />
                  <button className="w-full md:w-auto px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-medium text-left">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="mt-8 p-4 bg-neutral-50 rounded-xl">
          <p className="text-sm text-neutral-600">
            <span className="font-medium">Member since:</span>{" "}
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

