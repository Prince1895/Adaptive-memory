"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowRight, 
  ChevronDown, 
  LogOut, 
  Mail, 
  BookOpen, 
  LayoutDashboard, 
  Brain, 
  Zap, 
  RefreshCw, 
  GitBranch, 
  Settings, 
  Database,
  Menu,
  X,
  Copy,
  Check,
  ChevronRight
} from "lucide-react";

const sections = [
  { id: "features", label: "Features" },
  { id: "installation", label: "Installation" },
  { id: "quick-start", label: "Quick Start" },
  { id: "basic-usage", label: "Basic Usage" },
  { id: "memory-types", label: "Memory Types" },
  { id: "full-example", label: "Full Example" },
  { id: "express-integration", label: "Express Integration" },
  { id: "configuration", label: "Configuration" },
  { id: "api-reference", label: "API Reference" },
  { id: "how-it-works", label: "How It Works" },
];

function CodeBlock({ code, filename, language = "typescript" }: { code: string; filename?: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightCode = (code: string, lang: string): React.ReactNode => {
    if (lang === "bash") {
      return <span className="text-[#dcdcaa]">{code}</span>;
    }
    
    const lines = code.split('\n');
    return lines.map((line, lineIndex) => {
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let key = 0;
      
      while (remaining.length > 0) {
        if (remaining.startsWith('//')) {
          parts.push(<span key={key++} className="text-[#6a9955]">{remaining}</span>);
          remaining = '';
          continue;
        }
        
        const stringMatch = remaining.match(/^(["'`][^"'`]*["'`])/);
        if (stringMatch) {
          parts.push(<span key={key++} className="text-[#ce9178]">{stringMatch[1]}</span>);
          remaining = remaining.slice(stringMatch[1].length);
          continue;
        }
        
        const keywordMatch = remaining.match(/^(import|export|from|const|let|var|function|async|await|return|if|else|for|while|try|catch|class|interface|type|new|default)\b/);
        if (keywordMatch) {
          parts.push(<span key={key++} className="text-[#c586c0]">{keywordMatch[1]}</span>);
          remaining = remaining.slice(keywordMatch[1].length);
          continue;
        }
        
        const classMatch = remaining.match(/^([A-Z][a-zA-Z0-9_]*)/);
        if (classMatch) {
          parts.push(<span key={key++} className="text-[#4ec9b0]">{classMatch[1]}</span>);
          remaining = remaining.slice(classMatch[1].length);
          continue;
        }
        
        const funcMatch = remaining.match(/^([a-z_][a-z0-9_]*)\s*(?=\()/i);
        if (funcMatch) {
          parts.push(<span key={key++} className="text-[#dcdcaa]">{funcMatch[1]}</span>);
          remaining = remaining.slice(funcMatch[1].length);
          continue;
        }
        
        const numMatch = remaining.match(/^(\d+\.?\d*)/);
        if (numMatch) {
          parts.push(<span key={key++} className="text-[#b5cea8]">{numMatch[1]}</span>);
          remaining = remaining.slice(numMatch[1].length);
          continue;
        }
        
        parts.push(<span key={key++} className="text-[#d4d4d4]">{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }
      
      return (
        <React.Fragment key={lineIndex}>
          {parts}
          {lineIndex < lines.length - 1 && '\n'}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="relative group rounded-xl border border-border/60 bg-[#1C1C1C] overflow-hidden">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#252525]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            <span className="ml-3 text-xs text-white/40 font-mono">{filename}</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
      <pre className="p-4 text-sm leading-relaxed font-mono overflow-x-auto bg-[#1C1C1C]">
        <code>{highlightCode(code, language)}</code>
      </pre>
      {!filename && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function CollapsibleCodeBlock({ code, filename, language = "typescript", previewLines = 15 }: { code: string; filename?: string; language?: string; previewLines?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lines = code.split('\n');
  const shouldCollapse = lines.length > previewLines;
  const displayCode = isExpanded || !shouldCollapse ? code : lines.slice(0, previewLines).join('\n') + '\n...';
  
  return (
    <div className="relative">
      <CodeBlock code={displayCode} filename={filename} language={language} />
      {shouldCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground bg-[#252525] border-t border-white/10 transition-colors flex items-center justify-center gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="w-4 h-4 rotate-180" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show full example ({lines.length} lines)
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function DocsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("features");
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

  useEffect(() => {
    const handleScroll = () => {
      // If user has scrolled near bottom of document, activate last section
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120) {
        setActiveSection("how-it-works");
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-10% 0px -35% 0px", threshold: 0.1 }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowProfileDropdown(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Logo size={32} />
          </div>

          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/docs" className="text-sm font-medium text-amber-600 transition-colors">
              Docs
            </Link>
            <div ref={productsDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileDropdown(false);
                  setShowProductsDropdown((v) => !v);
                }}
                aria-expanded={showProductsDropdown}
                aria-haspopup="true"
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Products
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProductsDropdown ? "rotate-180" : ""}`} />
              </button>
              {showProductsDropdown && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[220px] bg-card border border-border rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
                  role="menu"
                >
                  <a
                    href="https://www.npmjs.com/package/adaptive-context-memory"
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    onClick={() => setShowProductsDropdown(false)}
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
                    role="menuitem"
                    onClick={() => setShowProductsDropdown(false)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex flex-col gap-0.5">
                      <span>Interactive Dashboard</span>
                      <span className="text-xs text-muted-foreground">Visualize memories</span>
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
                    {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProfileDropdown ? "rotate-180" : ""}`} />
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-muted/50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" className="text-sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="text-sm rounded-full px-5">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute left-0 top-16 w-72 h-[calc(100vh-4rem)] bg-card border-r border-border p-4 overflow-y-auto">
            <div className="space-y-1">
              {sections.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveSection(id);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeSection === id
                      ? "bg-amber-500/10 text-amber-600 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === id ? "text-amber-500" : ""}`} />
                  {label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 py-8 lg:py-12">
        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="sticky top-24 space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documentation</p>
              {sections.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === id
                      ? "bg-amber-500/10 text-amber-600 font-medium border-l-2 border-amber-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {label}
                </a>
              ))}
              <div className="pt-6 mt-6 border-t border-border">
                <a 
                  href="https://www.npmjs.com/package/adaptive-context-memory" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:text-amber-500 transition-colors font-medium"
                >
                  npm Package v1.0.0
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-4xl">
            {/* Hero */}
            <section className="mb-16">
              <span className="inline-flex items-center gap-2 text-xs text-amber-600 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                <BookOpen className="w-3.5 h-3.5" />
                TypeScript / Node.js SDK
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Native TypeScript Memory for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                  AI Applications
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mb-8">
                <code className="text-amber-600 font-mono font-semibold">adaptive-context-memory</code> extracts, persists, and retrieves long-term user memories with MMR ranking, local SQLite vector store, and automatic state-change detection.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button className="rounded-full px-6 bg-foreground text-background hover:bg-foreground/90">
                    Try Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a href="#quick-start">
                  <Button variant="outline" className="rounded-full px-6">
                    Quick Start
                  </Button>
                </a>
              </div>
            </section>

            {/* Features */}
            <section id="features" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Key Features</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-border bg-card hover:border-amber-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                    <Brain className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">Dual Memory Lifecycle</h3>
                  <p className="text-xs text-muted-foreground">Differentiates long-term Semantic Facts from time-sensitive Episodic Bubbles.</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card hover:border-green-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">MMR Vector Search</h3>
                  <p className="text-xs text-muted-foreground">Maximal Marginal Relevance algorithm balances similarity with diversity.</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card hover:border-blue-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">State-Change Resolution</h3>
                  <p className="text-xs text-muted-foreground">Handles negations ("stopped using X") and replacements ("switched to Y") automatically.</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card hover:border-purple-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                    <Database className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">Pure JS SQLite Store</h3>
                  <p className="text-xs text-muted-foreground">Zero binary C++ compilation needed. Uses better-sqlite3 for high performance.</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card hover:border-pink-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center mb-3">
                    <GitBranch className="w-4 h-4 text-pink-600" />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">OpenRouter / OpenAI</h3>
                  <p className="text-xs text-muted-foreground">Supports OpenRouter (Claude, Llama, DeepSeek) and OpenAI out-of-the-box.</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card hover:border-cyan-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3">
                    <Settings className="w-4 h-4 text-cyan-600" />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">Embedding LRU Cache</h3>
                  <p className="text-xs text-muted-foreground">Batch embedding cache speeds up queries and reduces API token costs.</p>
                </div>
              </div>
            </section>

            {/* Installation */}
            <section id="installation" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Installation</h2>
              <CodeBlock code="npm install adaptive-context-memory" filename="terminal" language="bash" />
            </section>

            {/* Quick Start */}
            <section id="quick-start" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 text-sm flex items-center justify-center font-bold">1</span>
                    Initialize & Configure
                  </h3>
                  <CodeBlock 
                    filename="quickstart.ts"
                    code={`import { configure, createTables, getDb, ContextMemory } from "adaptive-context-memory";

// 1. Configure provider & models
configure({
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  llmProvider: "openrouter",
  llmModel: "openai/gpt-4o-mini",
  embeddingModel: "text-embedding-3-small",
});

// 2. Initialize database tables
createTables();

// 3. Instantiate ContextMemory
const memoryStore = new ContextMemory(getDb());`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 text-sm flex items-center justify-center font-bold">2</span>
                    Extract & Add Conversation Turns
                  </h3>
                  <CodeBlock 
                    filename="add_memories.ts"
                    code={`const conversationId = 1;

const result = await memoryStore.add([
  { role: "user", content: "Hi! My name is Prince and I build AI memory tools in TypeScript." },
  { role: "assistant", content: "Nice to meet you Prince! AI memory systems are fascinating." }
], conversationId);

console.log(result);
// Output:
// {
//   semantic: ["User's name is Prince", "User builds AI memory tools in TypeScript"],
//   bubbles: []
// }`}
                  />
                </div>
              </div>
            </section>

            {/* Basic Usage */}
            <section id="basic-usage" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Basic Usage</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3">MMR Vector Search</h3>
                  <CodeBlock 
                    filename="search.ts"
                    code={`const searchResult = await memoryStore.search("What does the user work on?", conversationId, {
  limit: 5,
  mmrLambda: 0.5 // Balances relevance vs diversity
});

searchResult.results.forEach(res => {
  console.log(\`[\${res.category}] \${res.text} (score: \${res.score.toFixed(4)})\`);
});`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Handle State Changes & Contradictions</h3>
                  <CodeBlock 
                    filename="state_change.ts"
                    code={`// User updates their workflow
await memoryStore.add([
  { role: "user", content: "I stopped using TypeScript completely and switched to Python." },
  { role: "assistant", content: "Got it! Updated your primary stack to Python." }
], conversationId);

// Stale fact "User works with TypeScript" is automatically DELETED or REPLACED with Python!`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">List & Delete Memories</h3>
                  <CodeBlock 
                    filename="manage.ts"
                    code={`// Fetch all active memories for conversation
const allMemories = memoryStore.getAll(conversationId);

// Delete specific memory by ID
const deleted = memoryStore.delete(memoryId);`}
                  />
                </div>
              </div>
            </section>

            {/* Memory Types */}
            <section id="memory-types" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Memory Architecture</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-lg font-semibold mb-3 text-amber-600">Semantic Facts</h3>
                  <p className="text-sm text-muted-foreground mb-4">Durable, persistent knowledge about the user:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Name, role, core skills
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Tool preferences & tech stack
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Long-term personal context
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-xl border border-blue-500/30 bg-blue-500/5">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Episodic Bubbles</h3>
                  <p className="text-sm text-muted-foreground mb-4">Time-sensitive moments with automatic decay:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Current tasks, upcoming demos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Recent errors & active debugging
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Event timestamps (`occurred_at`)
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Full Example */}
            <section id="full-example" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Full Example</h2>
              <p className="text-sm text-muted-foreground mb-4">
                A complete runnable TypeScript example demonstrating memory extraction, MMR search, state resolution, and automatic decay.
              </p>
              <CollapsibleCodeBlock 
                filename="full_example.ts"
                previewLines={30}
                code={`import { configure, createTables, getDb, ContextMemory } from "adaptive-context-memory";

async function main() {
  // 1. Configure LLM provider & SQLite storage
  configure({
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    llmProvider: "openrouter",
    llmModel: "openai/gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
  });

  // 2. Initialize database schema
  createTables();
  const memory = new ContextMemory(getDb());
  const conversationId = 1;

  // 3. Add conversation turn (Extracts facts & bubbles)
  console.log("--> Adding conversation turn...");
  const turn1 = await memory.add([
    { role: "user", content: "Hi, I am Prince. I build AI agent memory systems and have a demo presentation tomorrow at 2:00 PM." },
    { role: "assistant", content: "Great to meet you Prince! I have noted your demo presentation tomorrow at 2:00 PM." }
  ], conversationId);

  console.log("Extracted:", turn1);

  // 4. Perform MMR Semantic Search
  console.log("\\n--> Performing MMR vector search...");
  const searchRes = await memory.search("When is Prince's demo presentation?", conversationId, { limit: 3 });
  console.log("Retrieved Context:", searchRes.results);

  // 5. Update State (Handle Cancellation / Deletion)
  console.log("\\n--> Updating memory state...");
  await memory.add([
    { role: "user", content: "The demo presentation is rescheduled to next week." },
    { role: "assistant", content: "Updated your schedule for next week." }
  ], conversationId);

  // 6. Purge Episodic Memory Bubbles older than 30 days
  const purgedCount = memory.purge(30, conversationId);
  console.log(\`\\nPurged \${purgedCount} expired memory bubbles.\`);
}

main().catch(console.error);`}
              />
            </section>

            {/* Express Integration */}
            <section id="express-integration" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Express.js API Integration</h2>
              <CollapsibleCodeBlock 
                filename="server.ts"
                previewLines={25}
                code={`import express from "express";
import OpenAI from "openai";
import { configure, createTables, getDb, ContextMemory } from "adaptive-context-memory";

configure({
  openrouterApiKey: process.env.OPENROUTER_API_KEY!,
  llmProvider: "openrouter",
  llmModel: "openai/gpt-4o-mini",
});

createTables();
const memoryStore = new ContextMemory(getDb());
const app = express();
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message, userId } = req.body;

  // 1. Search relevant long-term memories
  const searchRes = await memoryStore.search(message, userId, { limit: 5 });
  const relevant = searchRes.results || [];
  const memoriesStr = relevant.map(r => \`- [\${r.isEpisodic ? 'bubble' : 'semantic'}] \${r.text}\`).join("\\n");

  // 2. Query LLM with injected context
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      { role: "system", content: \`User Context:\\n\${memoriesStr}\` },
      { role: "user", content: message }
    ]
  });

  const assistantMsg = response.choices[0].message.content!;

  // 3. Extract and update memories asynchronously
  await memoryStore.add([
    { role: "user", content: message },
    { role: "assistant", content: assistantMsg }
  ], userId);

  res.json({ response: assistantMsg });
});

app.listen(8000, () => console.log("Memory API running on port 8000"));`}
              />
            </section>

            {/* Configuration */}
            <section id="configuration" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Configuration Reference</h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left font-semibold border-b border-border">Option</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-border">Type</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-border">Default</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-border">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">openrouterApiKey</td><td className="px-4 py-3 border-b border-border">string</td><td className="px-4 py-3 border-b border-border">-</td><td className="px-4 py-3 border-b border-border">OpenRouter API Key</td></tr>
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">openaiApiKey</td><td className="px-4 py-3 border-b border-border">string</td><td className="px-4 py-3 border-b border-border">-</td><td className="px-4 py-3 border-b border-border">Direct OpenAI API Key</td></tr>
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">llmProvider</td><td className="px-4 py-3 border-b border-border">string</td><td className="px-4 py-3 border-b border-border font-mono">openrouter</td><td className="px-4 py-3 border-b border-border">openrouter or openai</td></tr>
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">llmModel</td><td className="px-4 py-3 border-b border-border">string</td><td className="px-4 py-3 border-b border-border font-mono">openai/gpt-4o-mini</td><td className="px-4 py-3 border-b border-border">LLM model used for classification</td></tr>
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">embeddingModel</td><td className="px-4 py-3 border-b border-border">string</td><td className="px-4 py-3 border-b border-border font-mono">text-embedding-3-small</td><td className="px-4 py-3 border-b border-border">Embedding model for vector search</td></tr>
                      <tr><td className="px-4 py-3 font-mono text-amber-600">dbPath</td><td className="px-4 py-3">string</td><td className="px-4 py-3 font-mono">~/.contextmemory/memory.db</td><td className="px-4 py-3">Custom SQLite database path</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api-reference" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">API Reference</h2>
              <div className="space-y-6">
                <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold font-mono text-amber-600">new ContextMemory(db: Database)</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-600">Class</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Main entry point for memory extraction, MMR search, state resolution, and local vector storage.</p>

                  <div className="space-y-4 pt-2">
                    <div className="border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-mono text-sm font-semibold text-foreground">.add(messages, conversationId, sessionId?): Promise&lt;AddResult&gt;</h4>
                        <span className="text-xs text-muted-foreground font-mono">async</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Extracts facts, resolves contradictions/state changes, and inserts episodic bubbles & semantic facts into SQLite and vector store.</p>
                    </div>

                    <div className="border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-mono text-sm font-semibold text-foreground">.search(query, conversationId, options?): Promise&lt;SearchResult&gt;</h4>
                        <span className="text-xs text-muted-foreground font-mono">async</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Performs Maximal Marginal Relevance (MMR) vector search to balance cosine relevance with diversity for context injection.</p>
                    </div>

                    <div className="border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-mono text-sm font-semibold text-foreground">.getAll(conversationId): MemoryRow[]</h4>
                        <span className="text-xs text-muted-foreground font-mono">sync</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Returns all active memories for the conversation including memory_text, type, importance, and connections.</p>
                    </div>

                    <div className="border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-mono text-sm font-semibold text-foreground">.delete(memoryId): boolean</h4>
                        <span className="text-xs text-muted-foreground font-mono">sync</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Deactivates a memory node (<code className="text-amber-600">is_active = 0</code>) and removes it from the cosine vector index.</p>
                    </div>

                    <div className="border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-mono text-sm font-semibold text-foreground">.consolidate(conversationId): Promise&lt;ConsolidateResult&gt;</h4>
                        <span className="text-xs text-muted-foreground font-mono">async</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Merges near-duplicate facts using LLM reasoning into unified high-level facts.</p>
                    </div>

                    <div className="border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-mono text-sm font-semibold text-foreground">.purge(days, conversationId?): number</h4>
                        <span className="text-xs text-muted-foreground font-mono">sync</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Deactivates episodic bubbles older than N days (default 30 days).</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">How It Works</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-6 rounded-xl border border-border bg-card space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center font-bold text-amber-600 text-sm">1</div>
                  <h3 className="font-semibold text-base">Extraction Phase</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Analyzes conversation turns with rolling transcript summaries to extract raw atomic candidate facts and time-sensitive episodic events.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border bg-card space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-600 text-sm">2</div>
                  <h3 className="font-semibold text-base">State Resolution Engine</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Compares candidate facts against existing vector-searched memories using LLM Tool Calls (<code className="text-emerald-600">ADD</code>, <code className="text-emerald-600">UPDATE</code>, <code className="text-emerald-600">DELETE</code>, <code className="text-emerald-600">REPLACE</code>, <code className="text-emerald-600">NOOP</code>) to prevent duplicates or stale information.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border bg-card space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-sm">3</div>
                  <h3 className="font-semibold text-base">MMR Vector Store</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Embeddings are indexed in a local high-performance vector store. Queries evaluate Maximal Marginal Relevance to retrieve pertinent yet non-redundant context.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border bg-card space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center font-bold text-purple-600 text-sm">4</div>
                  <h3 className="font-semibold text-base">Bidirectional Graph Links</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Computes bidirectional connections between related memories and assigns dynamic importance scores for interactive visualizer graphing.
                  </p>
                </div>
              </div>
            </section>

            {/* Links */}
            <section className="mb-16 pt-8 border-t border-border">
              <div className="flex flex-wrap gap-6">
                <a 
                  href="https://www.npmjs.com/package/adaptive-context-memory" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-500 font-semibold transition-colors"
                >
                  View Package on npmjs.com
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Powered by adaptive-context-memory npm package</p>
            <div className="flex items-center gap-6">
              <a href="https://www.npmjs.com/package/adaptive-context-memory" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors font-mono text-sm">
                npm i adaptive-context-memory
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
