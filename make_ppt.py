from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import copy

# Colors from PPT Format (dark navy theme)
NAVY    = RGBColor(0x0D, 0x1B, 0x2A)
BLUE    = RGBColor(0x1A, 0x6B, 0xC4)
CYAN    = RGBColor(0x00, 0xD4, 0xFF)
WHITE   = RGBColor(0xFF, 0xFF, 0xFF)
LGRAY   = RGBColor(0xCC, 0xDD, 0xEE)
YELLOW  = RGBColor(0xFF, 0xD7, 0x00)
GREEN   = RGBColor(0x00, 0xE5, 0x96)

W = Inches(13.33)
H = Inches(7.5)

prs = Presentation()
prs.slide_width  = W
prs.slide_height = H

def blank(prs):
    layout = prs.slide_layouts[6]   # completely blank
    return prs.slides.add_slide(layout)

def bg(slide, color=NAVY):
    from pptx.util import Emu
    sp = slide.shapes.add_shape(1, 0, 0, W, H)
    sp.fill.solid()
    sp.fill.fore_color.rgb = color
    sp.line.fill.background()

def txt(slide, text, x, y, w, h, size=20, bold=False, color=WHITE,
        align=PP_ALIGN.LEFT, italic=False, wrap=True):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.italic = italic
    return tb

def hbar(slide, x, y, w, h=Inches(0.05), color=CYAN):
    sp = slide.shapes.add_shape(1, x, y, w, h)
    sp.fill.solid()
    sp.fill.fore_color.rgb = color
    sp.line.fill.background()

def box(slide, x, y, w, h, fill=BLUE, alpha=None):
    sp = slide.shapes.add_shape(1, x, y, w, h)
    sp.fill.solid()
    sp.fill.fore_color.rgb = fill
    sp.line.fill.background()
    return sp

def circle(slide, x, y, d, color=CYAN):
    sp = slide.shapes.add_shape(9, x, y, d, d)  # 9=oval
    sp.fill.solid()
    sp.fill.fore_color.rgb = color
    sp.line.fill.background()

# ─── Slide 1: Title ───────────────────────────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
hbar(s, Inches(0.5), Inches(3.0), Inches(12.5))
txt(s, "ADAPTIVE CONTEXT MEMORY", Inches(0.6), Inches(1.2), Inches(12), Inches(1.2),
    size=44, bold=True, color=WHITE, align=PP_ALIGN.LEFT)
txt(s, "A Production-Ready Long-Term Memory System for AI Agents",
    Inches(0.6), Inches(2.5), Inches(11), Inches(0.8),
    size=22, color=CYAN, align=PP_ALIGN.LEFT)
hbar(s, Inches(0.6), Inches(3.15), Inches(5), h=Inches(0.04), color=CYAN)
txt(s, "adaptive-context-memory  |  TypeScript & Node.js  |  npm Package",
    Inches(0.6), Inches(3.4), Inches(12), Inches(0.5),
    size=14, color=LGRAY, align=PP_ALIGN.LEFT)
txt(s, "Semantic Memory  •  Episodic Memory  •  MMR Vector Search  •  LLM Contradiction Resolution",
    Inches(0.6), Inches(4.0), Inches(12), Inches(0.5),
    size=14, color=LGRAY, align=PP_ALIGN.LEFT)
txt(s, "Prince Kumar", Inches(0.6), Inches(6.4), Inches(6), Inches(0.6),
    size=16, bold=True, color=WHITE)

# ─── Slide 2: The Problem ─────────────────────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
txt(s, "THE PROBLEM", Inches(0.6), Inches(0.3), Inches(12), Inches(0.7),
    size=13, bold=True, color=CYAN)
txt(s, "AI Agents Forget Everything", Inches(0.6), Inches(0.9), Inches(12), Inches(0.9),
    size=36, bold=True, color=WHITE)
hbar(s, Inches(0.6), Inches(1.75), Inches(11.5), color=CYAN)

problems = [
    ("❌", "Stateless LLMs", "Every session starts fresh — zero memory of who the user is"),
    ("❌", "Context Window Limits", "Long conversations lose early context; critical info is dropped"),
    ("❌", "No Contradiction Handling", "Conflicting facts silently coexist — \"User likes Python\" vs \"User stopped using Python\""),
    ("❌", "Retrieval Quality", "Naive top-k similarity returns redundant, near-identical results"),
]
for i, (icon, title, desc) in enumerate(problems):
    y = Inches(2.0 + i * 1.1)
    box(s, Inches(0.6), y, Inches(12.3), Inches(0.95), fill=RGBColor(0x10, 0x25, 0x40))
    txt(s, icon, Inches(0.75), y+Inches(0.2), Inches(0.4), Inches(0.6), size=20)
    txt(s, title, Inches(1.25), y+Inches(0.08), Inches(3.5), Inches(0.45), size=16, bold=True, color=YELLOW)
    txt(s, desc,  Inches(1.25), y+Inches(0.48), Inches(11.2), Inches(0.42), size=13, color=LGRAY)

# ─── Slide 3: Solution Overview ───────────────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
txt(s, "THE SOLUTION", Inches(0.6), Inches(0.3), Inches(12), Inches(0.7),
    size=13, bold=True, color=CYAN)
txt(s, "adaptive-context-memory", Inches(0.6), Inches(0.9), Inches(12), Inches(0.9),
    size=36, bold=True, color=WHITE)
hbar(s, Inches(0.6), Inches(1.75), Inches(11.5), color=CYAN)
txt(s, "A standalone npm library that gives AI agents persistent, intelligent long-term memory",
    Inches(0.6), Inches(1.85), Inches(12), Inches(0.6), size=16, color=LGRAY)

cards = [
    (BLUE,  "🧠", "Dual Memory Engine", "Semantic Facts + Episodic Bubbles"),
    (RGBColor(0x0A,0x4A,0x3A), "🔍", "MMR Vector Search", "Diverse, non-redundant retrieval"),
    (RGBColor(0x4A,0x1A,0x6A), "⚡", "Zero Heavy Deps", "Pure TypeScript + better-sqlite3"),
    (RGBColor(0x6A,0x3A,0x00), "🔄", "Smart Resolution", "ADD/UPDATE/REPLACE/DELETE via LLM"),
]
for i, (col, icon, title, desc) in enumerate(cards):
    x = Inches(0.55 + i * 3.2)
    box(s, x, Inches(2.6), Inches(3.05), Inches(3.8), fill=col)
    txt(s, icon,  x+Inches(0.15), Inches(2.75), Inches(0.6), Inches(0.6), size=26)
    txt(s, title, x+Inches(0.15), Inches(3.35), Inches(2.8), Inches(0.55), size=16, bold=True, color=WHITE)
    txt(s, desc,  x+Inches(0.15), Inches(3.9),  Inches(2.8), Inches(0.8),  size=13, color=LGRAY)

txt(s, "npm install adaptive-context-memory",
    Inches(2.5), Inches(6.5), Inches(9), Inches(0.65),
    size=18, bold=True, color=GREEN, align=PP_ALIGN.CENTER)

# ─── Slide 4: Architecture ────────────────────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
txt(s, "ARCHITECTURE", Inches(0.6), Inches(0.3), Inches(12), Inches(0.7),
    size=13, bold=True, color=CYAN)
txt(s, "System Architecture", Inches(0.6), Inches(0.9), Inches(12), Inches(0.9),
    size=36, bold=True, color=WHITE)
hbar(s, Inches(0.6), Inches(1.75), Inches(11.5), color=CYAN)

layers = [
    (BLUE,               "API Layer",        "ContextMemory class  |  add() · search() · consolidate() · purgeOldBubbles()"),
    (RGBColor(0x0A,0x4A,0x3A), "Memory Engine", "ExtractionPhase  |  UpdatePhase  |  BubbleCreator  |  ConnectionFinder"),
    (RGBColor(0x4A,0x1A,0x6A), "Vector & Storage", "VectorStore (cosine similarity)  |  LRU Embedding Cache  |  SQLite via better-sqlite3"),
    (RGBColor(0x6A,0x3A,0x00), "LLM Providers", "OpenAI  |  OpenRouter  |  Exponential Backoff Retry"),
]
for i, (col, lbl, desc) in enumerate(layers):
    y = Inches(2.0 + i * 1.1)
    box(s, Inches(0.6), y, Inches(12.3), Inches(0.95), fill=col)
    txt(s, lbl,  Inches(0.75), y+Inches(0.08), Inches(3.0), Inches(0.45), size=15, bold=True, color=WHITE)
    txt(s, desc, Inches(3.8),  y+Inches(0.25), Inches(9.0), Inches(0.45), size=13, color=LGRAY)

# ─── Slide 5: Dual Memory Engine ─────────────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
txt(s, "CORE FEATURE", Inches(0.6), Inches(0.3), Inches(12), Inches(0.7),
    size=13, bold=True, color=CYAN)
txt(s, "Dual Memory Engine", Inches(0.6), Inches(0.9), Inches(12), Inches(0.9),
    size=36, bold=True, color=WHITE)
hbar(s, Inches(0.6), Inches(1.75), Inches(11.5), color=CYAN)

# Semantic side
box(s, Inches(0.55), Inches(2.0), Inches(5.9), Inches(4.8), fill=BLUE)
txt(s, "🧠  SEMANTIC FACTS", Inches(0.7), Inches(2.15), Inches(5.5), Inches(0.55),
    size=17, bold=True, color=WHITE)
txt(s, "Long-term durable user knowledge", Inches(0.7), Inches(2.65), Inches(5.5), Inches(0.45),
    size=13, color=LGRAY)
sem_items = [
    "User's name is Prince",
    "User develops in TypeScript",
    "User prefers dark mode",
    "User's goal: publish npm package",
    "User switched from Python to TypeScript",
]
for i, item in enumerate(sem_items):
    txt(s, f"•  {item}", Inches(0.85), Inches(3.15+i*0.52), Inches(5.4), Inches(0.48), size=13, color=WHITE)

txt(s, "Categories: profile · skill · preference · goal · professional",
    Inches(0.7), Inches(5.9), Inches(5.5), Inches(0.45), size=11, color=CYAN)

# Episodic side
box(s, Inches(6.85), Inches(2.0), Inches(6.0), Inches(4.8), fill=RGBColor(0x0A,0x4A,0x3A))
txt(s, "⏱  EPISODIC BUBBLES", Inches(7.0), Inches(2.15), Inches(5.5), Inches(0.55),
    size=17, bold=True, color=WHITE)
txt(s, "Time-bound events with importance scoring", Inches(7.0), Inches(2.65), Inches(5.5), Inches(0.45),
    size=13, color=LGRAY)
bub_items = [
    ("Production deploy deadline Friday", "0.9"),
    ("Active bug: auth crash on login", "0.8"),
    ("Meeting rescheduled to 3pm", "0.6"),
    ("User asked to remember API key", "0.7"),
]
for i, (item, imp) in enumerate(bub_items):
    txt(s, f"•  {item}", Inches(7.0), Inches(3.15+i*0.65), Inches(4.3), Inches(0.55), size=13, color=WHITE)
    txt(s, f"imp: {imp}", Inches(11.4), Inches(3.15+i*0.65+0.1), Inches(1.2), Inches(0.38), size=11, color=YELLOW)

txt(s, "Auto-decays via recency scoring  |  Purge after N days",
    Inches(7.0), Inches(5.9), Inches(5.5), Inches(0.45), size=11, color=GREEN)

# ─── Slide 6: MMR Search ──────────────────────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
txt(s, "CORE FEATURE", Inches(0.6), Inches(0.3), Inches(12), Inches(0.7),
    size=13, bold=True, color=CYAN)
txt(s, "MMR Vector Search", Inches(0.6), Inches(0.9), Inches(12), Inches(0.9),
    size=36, bold=True, color=WHITE)
hbar(s, Inches(0.6), Inches(1.75), Inches(11.5), color=CYAN)

txt(s, "Maximum Marginal Relevance — balances similarity AND diversity to avoid redundant results",
    Inches(0.6), Inches(1.9), Inches(12), Inches(0.55), size=15, color=LGRAY)

box(s, Inches(0.6), Inches(2.55), Inches(12.3), Inches(1.15), fill=RGBColor(0x10,0x25,0x40))
txt(s, "MMR Score  =  λ · sim(c, query)  −  (1 − λ) · max{ sim(c, s) : s ∈ Selected }",
    Inches(0.8), Inches(2.65), Inches(12), Inches(0.9), size=17, bold=True, color=CYAN, align=PP_ALIGN.CENTER)

lambda_info = [("λ = 1.0", "Pure similarity ranking"), ("λ = 0.6", "Recommended — balanced (default)"), ("λ = 0.0", "Maximum diversity (greedy)")]
for i, (lv, desc) in enumerate(lambda_info):
    x = Inches(1.0 + i * 4.1)
    box(s, x, Inches(3.85), Inches(3.8), Inches(0.9), fill=BLUE)
    txt(s, lv,   x+Inches(0.15), Inches(3.9),  Inches(1.4), Inches(0.45), size=15, bold=True, color=YELLOW)
    txt(s, desc, x+Inches(1.6),  Inches(3.95), Inches(2.1), Inches(0.38), size=12, color=WHITE)

steps = [
    "1. Embed query → vector",
    "2. Cosine similarity scan of all memory vectors",
    "3. Apply recency decay for episodic bubbles (half-life 14d)",
    "4. Apply importance weighting: score × √importance × recency",
    "5. MMR re-rank: pick next result that is relevant but not redundant",
    "6. Optionally fetch connected bubble IDs",
]
for i, step in enumerate(steps):
    txt(s, step, Inches(0.8), Inches(4.9 + i*0.38), Inches(12), Inches(0.38), size=13, color=WHITE)

# ─── Slide 7: Contradiction Resolution ───────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
txt(s, "CORE FEATURE", Inches(0.6), Inches(0.3), Inches(12), Inches(0.7),
    size=13, bold=True, color=CYAN)
txt(s, "LLM Contradiction Resolution", Inches(0.6), Inches(0.9), Inches(12), Inches(0.9),
    size=36, bold=True, color=WHITE)
hbar(s, Inches(0.6), Inches(1.75), Inches(11.5), color=CYAN)

actions = [
    (GREEN,  "ADD",     "New fact not in memory → store as new memory"),
    (CYAN,   "UPDATE",  "Same topic, more detail → enrich existing memory"),
    (YELLOW, "REPLACE", "Contradiction: 'switched from X to Y' → overwrite"),
    (RGBColor(0xFF,0x60,0x60), "DELETE", "Discontinued: 'stopped using X' → remove memory"),
    (LGRAY,  "NOOP",   "Already stored with same meaning → skip"),
]
for i, (col, action, desc) in enumerate(actions):
    y = Inches(2.0 + i * 0.98)
    box(s, Inches(0.6), y, Inches(12.3), Inches(0.85), fill=RGBColor(0x10,0x25,0x40))
    box(s, Inches(0.6), y, Inches(1.5), Inches(0.85), fill=col)
    txt(s, action, Inches(0.65), y+Inches(0.18), Inches(1.4), Inches(0.5), size=14, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
    txt(s, desc,   Inches(2.25), y+Inches(0.2),  Inches(10.5), Inches(0.45), size=13, color=WHITE)

txt(s, "Decision Priority:  Contradiction → REPLACE/DELETE  |  Same meaning → NOOP  |  More detail → UPDATE  |  New → ADD",
    Inches(0.6), Inches(6.9), Inches(12.5), Inches(0.45), size=12, color=LGRAY)

# ─── Slide 8: Full-Stack Application ─────────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
txt(s, "FULL-STACK APP", Inches(0.6), Inches(0.3), Inches(12), Inches(0.7),
    size=13, bold=True, color=CYAN)
txt(s, "Production Web Application", Inches(0.6), Inches(0.9), Inches(12), Inches(0.9),
    size=36, bold=True, color=WHITE)
hbar(s, Inches(0.6), Inches(1.75), Inches(11.5), color=CYAN)

components = [
    (BLUE,               "Next.js 15 Frontend",   "Port 3000", ["Real-time chat UI", "D3.js memory graph", "Memory graph controls", "SWR data fetching"]),
    (RGBColor(0x0A,0x4A,0x3A), "Express REST API", "Port 8000", ["POST /api/chat", "GET /api/memories/graph", "POST /api/memories/consolidate", "DELETE /api/memories/:id"]),
    (RGBColor(0x4A,0x1A,0x6A), "SQLite Database",  "Embedded",  ["memories table", "conversations table", "Vector embeddings stored as JSON", "Auto-migrations on start"]),
]
for i, (col, title, port, items) in enumerate(components):
    x = Inches(0.55 + i * 4.25)
    box(s, x, Inches(2.1), Inches(4.0), Inches(4.8), fill=col)
    txt(s, title, x+Inches(0.15), Inches(2.25), Inches(3.7), Inches(0.55), size=16, bold=True, color=WHITE)
    txt(s, port,  x+Inches(0.15), Inches(2.75), Inches(3.7), Inches(0.4), size=12, color=CYAN)
    for j, item in enumerate(items):
        txt(s, f"•  {item}", x+Inches(0.2), Inches(3.2+j*0.55), Inches(3.6), Inches(0.5), size=13, color=LGRAY)

# ─── Slide 9: Key Features Summary ───────────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
txt(s, "FEATURES", Inches(0.6), Inches(0.3), Inches(12), Inches(0.7),
    size=13, bold=True, color=CYAN)
txt(s, "Complete Feature Set", Inches(0.6), Inches(0.9), Inches(12), Inches(0.9),
    size=36, bold=True, color=WHITE)
hbar(s, Inches(0.6), Inches(1.75), Inches(11.5), color=CYAN)

features = [
    ("Zero Binary Deps",      "Pure TypeScript cosine similarity — no FAISS, no C++ compilation"),
    ("High-Perf Storage",     "SQLite via better-sqlite3 with auto-schema migrations"),
    ("LRU Embedding Cache",   "512-slot LRU cache — repeated text = zero API calls"),
    ("Batch Embeddings",      "N texts in 1 API call; chunks of 100 for large batches"),
    ("Auto-Retry",            "Exponential backoff handles rate limits (429) automatically"),
    ("Multi-Provider",        "OpenAI and OpenRouter plug-and-play support"),
    ("Memory Consolidation",  "Exact + vector-based deduplication with LLM merging"),
    ("Bubble Decay & Purge",  "Recency scoring + soft-delete bubbles older than N days"),
]
for i, (feat, desc) in enumerate(features):
    col_i = i % 2
    row_i = i // 2
    x = Inches(0.55 + col_i * 6.45)
    y = Inches(2.1 + row_i * 1.2)
    box(s, x, y, Inches(6.2), Inches(1.05), fill=RGBColor(0x10,0x25,0x40))
    txt(s, feat, x+Inches(0.15), y+Inches(0.05), Inches(6.0), Inches(0.45), size=14, bold=True, color=CYAN)
    txt(s, desc, x+Inches(0.15), y+Inches(0.55), Inches(6.0), Inches(0.45), size=12, color=LGRAY)

# ─── Slide 10: Quick Start Code ───────────────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
txt(s, "QUICK START", Inches(0.6), Inches(0.3), Inches(12), Inches(0.7),
    size=13, bold=True, color=CYAN)
txt(s, "Get Started in Minutes", Inches(0.6), Inches(0.9), Inches(12), Inches(0.9),
    size=36, bold=True, color=WHITE)
hbar(s, Inches(0.6), Inches(1.75), Inches(11.5), color=CYAN)

box(s, Inches(0.6), Inches(2.0), Inches(12.3), Inches(4.7), fill=RGBColor(0x08,0x14,0x24))
code = """import { configure, createTables, getDb, ContextMemory } from 'adaptive-context-memory';

// 1. Configure LLM provider
configure({ openrouterApiKey: process.env.OPENROUTER_API_KEY,
            llmProvider: 'openrouter', llmModel: 'openai/gpt-4o-mini' });

// 2. Initialize DB schema
createTables();
const memory = new ContextMemory(getDb());

// 3. Extract & store memories from conversation
await memory.add([
  { role: 'user', content: "My name is Prince, I build TypeScript apps." }
], conversationId);

// 4. MMR semantic search — diverse, relevant results
const result = await memory.search("what tech does the user prefer?", conversationId);
console.log(result.results);   // [{ memory: "User is a TypeScript developer", score: 0.92 }]

// 5. Consolidate near-duplicate memories
await memory.consolidate(conversationId);"""

txt(s, code, Inches(0.85), Inches(2.1), Inches(12.0), Inches(4.5),
    size=11, color=GREEN)

# ─── Slide 11: Thank You ──────────────────────────────────────────────────────
s = blank(prs)
bg(s)
box(s, 0, 0, Inches(0.35), H, BLUE)
hbar(s, Inches(0.5), Inches(3.1), Inches(12.5))
txt(s, "THANK YOU", Inches(0.6), Inches(1.8), Inches(12.5), Inches(1.1),
    size=52, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
txt(s, "adaptive-context-memory", Inches(0.6), Inches(3.2), Inches(12.5), Inches(0.7),
    size=24, color=CYAN, align=PP_ALIGN.CENTER)
hbar(s, Inches(2.0), Inches(4.05), Inches(9.0), h=Inches(0.04), color=CYAN)
txt(s, "npm install adaptive-context-memory", Inches(0.6), Inches(4.3), Inches(12.5), Inches(0.7),
    size=20, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
txt(s, "MIT License  |  TypeScript & Node.js  |  Zero Heavy Dependencies",
    Inches(0.6), Inches(5.1), Inches(12.5), Inches(0.55),
    size=14, color=LGRAY, align=PP_ALIGN.CENTER)

out = "/home/prince-kumar/PROJECTS/Adaptive memory/ContextMemory_Presentation.pptx"
prs.save(out)
print(f"Saved: {out}")
