import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Plus, Briefcase, Filter, X, ChevronDown, Check, Hash } from "lucide-react";
import { contractsApi } from "../lib/api";
import type { Contract } from "../types";
import { ContractCard } from "../components/contracts/ContractCard";
import { Spinner } from "../components/ui/Spinner";
import { useAuthStore } from "../store/auth";
import { CreateContractModal } from "../components/contracts/CreateContractModal";

const CATEGORIES = [
  "All", "Smart Contract", "Frontend", "Backend", "Full Stack",
  "Design", "Mobile", "Security Audit",
];

const STATUS_FILTERS = ["all", "open", "active", "completed"] as const;
type SortOption = "newest" | "budget-high" | "budget-low" | "deadline";

export function Marketplace() {
  const { isAuthenticated } = useAuthStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState<typeof STATUS_FILTERS[number]>("open");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const { data } = await contractsApi.getAll();
      setContracts(data.contracts || []);
    } catch {
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  // Combined Filter and Sort Logic
  const filtered = contracts
    .filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = category === "All" || c.category === category;
      const matchStatus = status === "all" || c.status === status;
      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "budget-high") {
        return Number(b.totalAmount) - Number(a.totalAmount);
      }
      if (sortBy === "budget-low") {
        return Number(a.totalAmount) - Number(b.totalAmount);
      }
      if (sortBy === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return 0;
    });

  return (
    <div className="min-h-screen font-inter bg-white text-[#1f2328] selection:bg-[#0969da22]">
      <div className="max-w-[1216px] mx-auto px-4 py-8 space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f6f8fa] border border-[#d0d7de] rounded-md shadow-sm">
              <Briefcase size={18} className="text-[#636c76]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight text-[#1f2328]">Marketplace</h1>
              <p className="text-sm text-[#636c76]">
                Find and ship <span className="font-semibold text-[#1f2328]">{contracts.length}</span> verified jobs
              </p>
            </div>
          </div>
          
          {isAuthenticated && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f883d] text-white rounded-md text-sm font-semibold hover:bg-[#1a7f37] border border-[#1b1f2326] shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>Post a job</span>
            </button>
          )}
        </header>

        {/* Filter Toolbar */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-0">
            {/* Search Input */}
            <div className="relative flex-grow">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636c76]"
              />
              <input
                className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-t-md md:rounded-tr-none md:rounded-l-md py-[5px] pl-9 pr-3 text-sm focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] outline-none transition-all placeholder:text-[#636c76]"
                placeholder="Search all jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Segmented Status Picker */}
            <div className="flex bg-[#f6f8fa] border-x border-b md:border-x-0 md:border-y md:border-r border-[#d0d7de] rounded-b-md md:rounded-bl-none md:rounded-r-md overflow-hidden">
              {STATUS_FILTERS.map((s, i) => {
                const isActive = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`
                      relative px-4 py-1.5 text-xs font-medium capitalize transition-all
                      ${i !== STATUS_FILTERS.length - 1 ? "border-r border-[#d0d7de]" : ""}
                      ${isActive 
                        ? "bg-white text-[#1f2328] font-semibold" 
                        : "text-[#636c76] hover:bg-[#eaeef2] hover:text-[#1f2328]"
                      }
                    `}
                  >
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#fd8c73]" />
                    )}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-[#636c76] shrink-0">
              <Filter size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wide">Category</span>
            </div>
            
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full border transition-all font-medium ${
                  category === cat
                    ? "bg-[#21262d] text-white border-[#21262d]"
                    : "bg-white text-[#636c76] border-[#d0d7de] hover:border-[#8c959f] hover:text-[#1f2328]"
                }`}
              >
                {cat}
              </button>
            ))}

            {(search || category !== "All" || status !== "open") && (
              <button 
                onClick={() => {setSearch(""); setCategory("All"); setStatus("open")}}
                className="flex items-center gap-1 ml-2 text-xs font-semibold text-[#636c76] hover:text-[#0969da]"
              >
                <div className="bg-[#afb8c1] rounded-full p-0.5">
                  <X size={10} className="text-white" />
                </div>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results Container */}
        <div className="border border-[#d0d7de] rounded-md bg-white shadow-sm overflow-hidden">
          {/* List Header */}
          <div className="bg-[#f6f8fa] border-b border-[#d0d7de] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1f2328]">
                <Check size={16} className="text-[#1f883d]" />
                {filtered.length} Results
              </div>
            </div>
            
            {/* Functional Sort Section */}
            <div className="flex items-center gap-2 text-xs font-medium text-[#636c76]">
              <span className="hidden sm:inline">Sort:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent border-none outline-none text-[#1f2328] font-semibold cursor-pointer hover:text-[#0969da] appearance-none sm:appearance-auto"
              >
                <option value="newest">Newest</option>
                <option value="budget-high">Budget: High to Low</option>
                <option value="budget-low">Budget: Low to High</option>
                <option value="deadline">Closest Deadline</option>
              </select>
              <ChevronDown size={14} className="sm:hidden" />
            </div>
          </div>

          {/* List Content */}
          <main className="min-h-[450px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-[#f6f8fa]/20">
                <Spinner size="md" />
                <p className="mt-4 text-sm text-[#636c76] font-medium tracking-tight font-mono">Fetching block data...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-32 text-center flex flex-col items-center px-4">
                <div className="w-16 h-16 bg-[#f6f8fa] rounded-full flex items-center justify-center mb-4 border border-[#d0d7de]">
                  <Search size={24} className="text-[#8c959f]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1f2328]">No results found</h3>
                <p className="text-[#636c76] text-sm mt-2 max-w-sm mx-auto">
                  Try adjusting your search or category filters to find what you're looking for.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#d0d7de]">
                <AnimatePresence mode="popLayout">
                  {filtered.map((c, i) => (
                    <ContractCard key={c.contractId} contract={c} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>

        <CreateContractModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={loadContracts}
        />
      </div>
    </div>
  );
}