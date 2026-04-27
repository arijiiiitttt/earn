import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Save, X, ExternalLink, Copy, Wallet, Award, CheckCircle, Shield, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/auth";
import { usersApi, shortenAddress } from "../lib/api";
import { SiSolana } from "react-icons/si";
import { useBalance } from "../hooks/useBalance";
import { Spinner } from "../components/ui/Spinner";

const SKILL_SUGGESTIONS = [
  "Rust", "Anchor", "Solana", "TypeScript", "React", "Next.js",
  "Solidity", "Python", "Golang", "Web3.js", "Figma", "Node.js",
];

export function Profile() {
  const { user, updateUser } = useAuthStore();
  const { balance, refresh: refreshBalance } = useBalance();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState("");

  const [form, setForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    skills: user?.skills || [],
    role: user?.role || "both",
  });

  useEffect(() => {
    usersApi.getMe().then(({ data }) => {
      updateUser(data);
      setForm({
        username: data.username || "",
        bio: data.bio || "",
        skills: data.skills || [],
        role: data.role || "both",
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, [updateUser]);

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (!s || form.skills.includes(s)) return;
    setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await usersApi.updateMe({
        username: form.username,
        bio: form.bio,
        skills: form.skills,
        role: form.role as "client" | "freelancer" | "both",
      });
      updateUser(data);
      setEditing(false);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      username: user?.username || "",
      bio: user?.bio || "",
      skills: user?.skills || [],
      role: user?.role || "both",
    });
    setEditing(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(user?.walletAddress || "");
    toast.success("Address copied");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen font-inter bg-white text-[#1f2328]">
      {/* Container ensures content doesn't crash into the Navbar */}
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#d0d7de] pb-8 mb-10">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1f2328]">@{user.username}</h1>
              <p className="text-sm text-[#656d76] font-medium">Your global Solana profile</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#d0d7de] bg-[#f6f8fa] hover:bg-[#f3f4f6] rounded-md text-sm font-semibold transition-all shadow-sm"
              >
                <Edit2 size={14} />
                Edit Profile
              </button>
            ) : (
              <>
                <button onClick={handleCancel} className="text-sm font-semibold text-[#cf222e] hover:underline px-2">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#1f883d] text-white rounded-md text-sm font-semibold hover:bg-[#1a7f37] transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? <Spinner size="sm" /> : <Save size={14} />}
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Sidebar: Wallet & Stats */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="border border-[#d0d7de] rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f6f8fa] border-b border-[#d0d7de] px-4 py-3 flex items-center gap-2">
                <Wallet size={14} className="text-[#656d76]" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Active Wallet</span>
              </div>
              <div className="p-5 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#656d76] uppercase">Public Key</p>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-mono bg-[#f6f8fa] border border-[#d0d7de] px-2 py-1.5 rounded-md flex-1 truncate">
                      {user.walletAddress}
                    </code>
                    <button onClick={copyAddress} className="p-1.5 hover:bg-[#f6f8fa] rounded-md text-[#656d76] transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#f6f8fa] pt-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#656d76] uppercase">Solana Balance</p>
                    <p className="text-xl flex flex-row items-center gap-2 font-bold text-[#1f2328]">
                      <SiSolana size={20} /> 
                      <span>{balance?.toFixed(4) || "0.00"}</span>
                    </p>
                  </div>
                  <button onClick={refreshBalance} className="p-2 hover:bg-[#f6f8fa] rounded-full text-[#0969da] transition-all active:rotate-180">
                    <RefreshCw size={16} />
                  </button>
                </div>

                <a
                  href={`https://explorer.solana.com/address/${user.walletAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 border border-[#d0d7de] rounded-md text-xs font-bold hover:bg-[#f6f8fa] transition-all"
                >
                  <ExternalLink size={14} />
                  Explorer
                </a>
              </div>
            </div>

            <div className="border border-[#d0d7de] rounded-lg p-5 bg-[#f6f8fa]/40 space-y-5">
              <div className="flex items-center gap-2">
                <Shield size={16} />
                <span className="text-sm font-bold">Network Reputation</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#d0d7de] p-3 rounded-md">
                  <p className="text-[10px] font-bold text-[#656d76] uppercase mb-1">Rep</p>
                  <div className="flex items-center gap-1 text-[#9a6700] font-bold">
                    <Award size={14} />
                    {(user.reputation ?? 0).toFixed(1)}
                  </div>
                </div>
                <div className="bg-white border border-[#d0d7de] p-3 rounded-md">
                  <p className="text-[10px] font-bold text-[#656d76] uppercase mb-1">Success</p>
                  <div className="flex items-center gap-1 text-[#1f883d] font-bold">
                    <CheckCircle size={14} />
                    {user.completedContracts ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main: Form Details */}
          <main className="lg:col-span-8">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1f2328] uppercase">Display Name</label>
                  <input
                    disabled={!editing}
                    className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-2 px-3 text-sm focus:bg-white focus:border-[#0969da] outline-none transition-all disabled:opacity-60"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1f2328] uppercase">Platform Role</label>
                  <div className={`flex p-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md w-full ${!editing && 'opacity-60 pointer-events-none'}`}>
                    {(["client", "freelancer", "both"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setForm((f) => ({ ...f, role: r }))}
                        className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${form.role === r ? "bg-white text-black shadow-sm border border-[#d0d7de]" : "text-[#656d76] hover:text-black"
                          }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1f2328] uppercase">Bio / Background</label>
                <textarea
                  disabled={!editing}
                  className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-3 px-3 text-sm focus:bg-white focus:border-[#0969da] outline-none transition-all min-h-[140px] resize-none disabled:opacity-60 leading-relaxed"
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell us about your technical expertise..."
                />
              </div>

              <div className="pt-6 border-t border-[#f0f0f0]">
                <label className="text-xs font-bold text-[#1f2328] uppercase mb-4 block">Tech Stack</label>
                <div className="flex flex-wrap gap-2 mb-6">
                  <AnimatePresence mode="popLayout">
                    {(editing ? form.skills : user.skills || []).map((skill) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-[11px] font-bold text-[#0969da]"
                      >
                        {skill}
                        {editing && (
                          <button onClick={() => removeSkill(skill)} className="text-[#656d76] hover:text-[#cf222e]">
                            <X size={12} />
                          </button>
                        )}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>

                {editing && (
                  <div className="bg-[#f6f8fa] border border-[#d0d7de] p-4 rounded-lg space-y-4">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-white border border-[#d0d7de] rounded-md py-2 px-3 text-sm focus:border-[#0969da] outline-none transition-all"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(newSkill); } }}
                        placeholder="Add skill..."
                      />
                      <button onClick={() => addSkill(newSkill)} className="px-4 py-2 bg-[#21262d] text-white rounded-md text-xs font-bold hover:bg-[#30363d]">
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).map((s) => (
                        <button
                          key={s}
                          onClick={() => addSkill(s)}
                          className="text-[10px] font-bold px-2 py-1 bg-white border border-[#d0d7de] hover:border-[#0969da] hover:text-[#0969da] rounded transition-all shadow-sm"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}