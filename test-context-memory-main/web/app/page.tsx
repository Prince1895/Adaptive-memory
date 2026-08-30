"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Brain, 
  ArrowRight, 
  ChevronDown, 
  LogOut, 
  BookOpen, 
  LayoutDashboard, 
  ArrowUpRight, 
  Zap, 
  GitBranch, 
  Menu, 
  X,
  Layers,
  Cpu,
  RefreshCw,
  Search,
  Database,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { DEMO_DATA } from "@/lib/demo-data";

const LandingHeroGraph = dynamic(
  () => import("@/components/visualization/LandingHeroGraph").then((mod) => mod.LandingHeroGraph),
  { ssr: false, loading: () => <div className="w-full max-w-[480px] h-[380px] bg-muted/20 animate-pulse shrink-0 rounded-2xl" /> }
);

const AnimatedArchitectureDiagram = dynamic(
  () => import("@/components/visualization/AnimatedArchitectureDiagram").then((mod) => mod.AnimatedArchitectureDiagram),
  { ssr: false, loading: () => <div className="w-full h-[500px] bg-muted/10 animate-pulse rounded-3xl my-8" /> }
);

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(target)) {
        setShowProductsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowProfileDropdown(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="landing-grain" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative">
          <Logo size={32} />

          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-amber-600 transition-colors">
              Home
            </Link>
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <div ref={productsDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileDropdown(false);
                  setShowProductsDropdown((v) => !v);
                }}
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Products
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProductsDropdown ? "rotate-180" : ""}`} />
              </button>
              {showProductsDropdown && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[220px] bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                  <a
                    href="https://www.npmjs.com/package/adaptive-context-memory"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex flex-col gap-0.5">
                      <span>npm Package</span>
                      <span className="text-xs text-muted-foreground">v1.0.0 on npm</span>
                    </span>
                  </a>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex flex-col gap-0.5">
                      <span>Interactive Dashboard</span>
                      <span className="text-xs text-muted-foreground">Visualize memory bubbles</span>
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoading ? null : isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setShowProductsDropdown(false);
                    setShowProfileDropdown((v) => !v);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors">
                      <ArrowRight className="w-4 h-4" /> Go to Dashboard
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-muted/50 transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/signin"><Button variant="ghost" className="text-sm">Sign In</Button></Link>
                <Link href="/signup"><Button className="text-sm rounded-full px-5">Sign Up</Button></Link>
              </>
            )}
          </div>

          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 hover:bg-muted/50 rounded-lg">
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <section className="container mx-auto px-4 md:px-6 pt-12 pb-12 md:pt-24 md:pb-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl flex-shrink-0 space-y-6 md:space-y-8">
              <span className="inline-flex items-center gap-2 text-xs text-amber-600 font-semibold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Published on npm: adaptive-context-memory v1.0.0
              </span>

              <div className="space-y-4 md:space-y-5">
                <h1 className="text-[2.25rem] sm:text-[2.75rem] md:text-[3.5rem] font-bold tracking-tight text-foreground leading-[1.1]">
                  Long-term Memory for
                  <br />
                  <span className="landing-gradient-text">AI Agents in TypeScript</span>
                </h1>
                <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-md">
                  High-performance, zero-binary-dependency memory engine featuring automatic state-change resolution, dual-memory lifecycles, and MMR vector search.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto rounded-full bg-foreground text-background hover:bg-foreground/90 px-6 md:px-7 h-11 md:h-12 text-sm font-semibold shadow-lg">
                    Start Building
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="ghost" className="w-full sm:w-auto rounded-full h-11 md:h-12 text-sm font-semibold text-muted-foreground hover:text-foreground px-6 md:px-7 border border-border">
                    View Docs
                    <ArrowUpRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono text-amber-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  npm i adaptive-context-memory
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  Native TypeScript
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  SQLite Vector Store
                </span>
              </div>
            </div>

            <div className="hidden md:flex md:flex-shrink-0 md:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent rounded-3xl blur-2xl scale-110 pointer-events-none" />
                <div className="relative">
                  <LandingHeroGraph data={DEMO_DATA} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quickstart Code Block */}
        <section className="container mx-auto px-6 pb-20 md:pb-28">
          <div className="landing-code-card rounded-2xl border border-border/60 bg-[#1C1C1C] p-6 md:p-8 max-w-2xl mx-auto shadow-2xl shadow-black/5">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-xs text-white/30 font-mono">npm i adaptive-context-memory</span>
            </div>
            <pre className="text-sm md:text-[0.8125rem] leading-relaxed font-mono overflow-x-auto">
              <code>
                <span className="text-[#c586c0]">import</span>
                <span className="text-[#d4d4d4]"> {"{"} configure, createTables, getDb, ContextMemory {"}"} </span>
                <span className="text-[#c586c0]">from</span>
                <span className="text-[#ce9178]"> &quot;adaptive-context-memory&quot;</span>
                <span className="text-[#d4d4d4]">;</span>
                {"\n\n"}
                <span className="text-[#6a9955]">// 1. Configure OpenRouter / OpenAI</span>
                {"\n"}
                <span className="text-[#dcdcaa]">configure</span>
                <span className="text-[#d4d4d4]">({"{"} </span>
                <span className="text-[#9cdcfe]">openrouterApiKey</span>
                <span className="text-[#d4d4d4]">: </span>
                <span className="text-[#ce9178]">process.env.OPENROUTER_API_KEY</span>
                <span className="text-[#d4d4d4]"> {"}"});</span>
                {"\n"}
                <span className="text-[#dcdcaa]">createTables</span>
                <span className="text-[#d4d4d4]">();</span>
                {"\n\n"}
                <span className="text-[#6a9955]">// 2. Add memories from conversation turn</span>
                {"\n"}
                <span className="text-[#c586c0]">const</span>
                <span className="text-[#9cdcfe]"> memoryStore</span>
                <span className="text-[#d4d4d4]"> = </span>
                <span className="text-[#c586c0]">new</span>
                <span className="text-[#4ec9b0]"> ContextMemory</span>
                <span className="text-[#d4d4d4]">(</span>
                <span className="text-[#dcdcaa]">getDb</span>
                <span className="text-[#d4d4d4]">());</span>
                {"\n"}
                <span className="text-[#c586c0]">await</span>
                <span className="text-[#9cdcfe]"> memoryStore</span>
                <span className="text-[#d4d4d4]">.</span>
                <span className="text-[#dcdcaa]">add</span>
                <span className="text-[#d4d4d4]">([{"{"} </span>
                <span className="text-[#9cdcfe]">role</span>
                <span className="text-[#d4d4d4]">: </span>
                <span className="text-[#ce9178]">"user"</span>
                <span className="text-[#d4d4d4]">, </span>
                <span className="text-[#9cdcfe]">content</span>
                <span className="text-[#d4d4d4]">: </span>
                <span className="text-[#ce9178]">"I stopped using Rust and switched to Python"</span>
                <span className="text-[#d4d4d4]"> {"}"}], </span>
                <span className="text-[#b5cea8]">1</span>
                <span className="text-[#d4d4d4]">);</span>
                {"\n\n"}
                <span className="text-[#6a9955]">// 3. Search with MMR ranking (relevance + diversity)</span>
                {"\n"}
                <span className="text-[#c586c0]">const</span>
                <span className="text-[#9cdcfe]"> results</span>
                <span className="text-[#d4d4d4]"> = </span>
                <span className="text-[#c586c0]">await</span>
                <span className="text-[#9cdcfe]"> memoryStore</span>
                <span className="text-[#d4d4d4]">.</span>
                <span className="text-[#dcdcaa]">search</span>
                <span className="text-[#d4d4d4]">(</span>
                <span className="text-[#ce9178]">"What is user's tech stack?"</span>
                <span className="text-[#d4d4d4]">, </span>
                <span className="text-[#b5cea8]">1</span>
                <span className="text-[#d4d4d4]">);</span>
              </code>
            </pre>
          </div>
        </section>

        {/* System Architecture Section */}
        <section className="container mx-auto px-6 pb-24 md:pb-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs text-amber-600 font-semibold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Layers className="w-3.5 h-3.5" /> Package Architecture
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              How <code className="text-amber-600">adaptive-context-memory</code> Works
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              A high-level view of the memory processing pipeline from conversation turn to MMR vector retrieval.
            </p>
          </div>

          {/* Flow Diagram Cards */}
          <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
            <div className="p-5 rounded-2xl border border-border bg-card relative">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center mb-3 text-sm">1</div>
              <h3 className="font-bold text-sm mb-1">Turn Ingestion</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Extracts raw candidate memories from user and assistant turns.</p>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card relative">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 font-bold flex items-center justify-center mb-3 text-sm">2</div>
              <h3 className="font-bold text-sm mb-1">Tool Classifier</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Determines lifecycle action: <code className="text-amber-500 font-mono">ADD</code>, <code className="text-amber-500 font-mono">DELETE</code>, or <code className="text-amber-500 font-mono">REPLACE</code>.</p>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card relative">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 font-bold flex items-center justify-center mb-3 text-sm">3</div>
              <h3 className="font-bold text-sm mb-1">SQLite Vector Store</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Persists embeddings locally using LRU batch caching.</p>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card relative">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 font-bold flex items-center justify-center mb-3 text-sm">4</div>
              <h3 className="font-bold text-sm mb-1">MMR Search Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Ranks results via Cosine Similarity + Information Diversity.</p>
            </div>
          </div>
          {/* Animated Interactive Flow Diagram */}
          <AnimatedArchitectureDiagram />
        </section>

        {/* What Makes It Different Section */}
        <section className="container mx-auto px-6 pb-24 md:pb-32">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              What Makes <span className="landing-gradient-text">adaptive-context-memory</span> Different?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built specifically to overcome traditional vector store limitations in production AI agents.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card hover:border-amber-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <RefreshCw className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold mb-2">Smart State-Change Engine</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Handles negations and workflow changes automatically. When a user says <em className="text-foreground font-medium">&quot;I stopped using Rust and switched to Python&quot;</em>, it deletes the stale Rust memory instead of accumulating contradictions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card hover:border-green-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-base font-bold mb-2">Zero Binary Dependencies</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Pure TypeScript vector engine powered by <code className="text-amber-600 font-mono">better-sqlite3</code>. No native C++ FAISS bindings to break Docker builds or serverless deployments.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card hover:border-purple-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <Search className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-base font-bold mb-2">MMR-Ranked Vector Search</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Uses Maximal Marginal Relevance algorithm ($ \lambda = 0.5 $) to return results that are both highly relevant and informationally distinct, saving context space in your LLM system prompt.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border/40">
        <div className="container mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo size={24} />
              <span className="text-sm text-muted-foreground">
                AI memory, made visual.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://www.npmjs.com/package/adaptive-context-memory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-500 font-mono text-sm font-semibold transition-colors"
              >
                npm i adaptive-context-memory
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
