import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import api from "../utils/api";
import { useWallet } from "@solana/wallet-adapter-react";
import { User, Star, FileCheck } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { publicKey } = useWallet();
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState(user?.skills?.join(", ") || "");
  const [role, setRole] = useState(user?.role || "both");

  const mutation = useMutation({
    mutationFn: () =>
      api.patch("/api/users/me", {
        username, bio,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        role,
      }),
    onSuccess: ({ data }) => { updateUser(data); toast.success("Profile saved!"); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Update failed"),
  });

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-white">Profile</h1>
        <p className="text-zinc-500 mt-1 text-sm">Manage your TrustPay identity</p>
      </div>

      {/* Profile header card */}
      <div className="card p-6 mb-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl font-bold text-accent font-display">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="font-display font-bold text-white text-xl">{user?.username}</h2>
          <p className="font-mono text-xs text-zinc-600 mt-1 truncate">{publicKey?.toBase58()}</p>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <div className="flex items-center gap-1 justify-center text-accent">
              <Star className="w-3.5 h-3.5" />
              <span className="font-display font-bold text-lg">{user?.reputation?.toFixed(1) || "—"}</span>
            </div>
            <p className="text-zinc-600 text-xs mt-0.5">Rating</p>
          </div>
          <div>
            <div className="flex items-center gap-1 justify-center text-blue-400">
              <FileCheck className="w-3.5 h-3.5" />
              <span className="font-display font-bold text-lg">{user?.completedContracts || 0}</span>
            </div>
            <p className="text-zinc-600 text-xs mt-0.5">Done</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card p-6 space-y-4">
        <h3 className="font-display font-semibold text-zinc-400 text-xs uppercase tracking-wider pb-3 border-b border-dark-border">
          Edit Profile
        </h3>
        <div>
          <label className="label">Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea className="input resize-none" rows={3} value={bio}
            onChange={(e) => setBio(e.target.value)} placeholder="Tell clients about yourself…" />
        </div>
        <div>
          <label className="label">Skills (comma-separated)</label>
          <input className="input" value={skills} onChange={(e) => setSkills(e.target.value)}
            placeholder="Solana, React, Rust, Smart Contracts…" />
        </div>
        <div>
          <label className="label">Primary Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="both">Client & Freelancer</option>
            <option value="client">Client only</option>
            <option value="freelancer">Freelancer only</option>
          </select>
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-accent w-full py-3">
          {mutation.isPending ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}