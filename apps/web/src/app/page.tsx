import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Users,
  Dumbbell,
  ClipboardCheck,
  CreditCard,
  Star,
  BarChart2,
  Calendar,
  MessageSquare,
  Globe,
  Smartphone,
  TrendingUp,
  ShoppingBag,
  Video,
  Layers,
  Bell,
  Settings,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Brain,
  Target,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "For Coaches", href: "#coaches" },
  { label: "Pricing", href: "#pricing" },
];

const TRUST_LOGOS = [
  "EliteCoach", "FitForce", "StudioX", "PeakPerf", "IronPath",
];

const USER_TYPES = [
  {
    label: "Individual coaches",
    icon: Users,
    headline: "Manage every client from a single hub",
    desc: "Onboard clients, build programs, collect check-ins, and get paid — without juggling five different apps.",
    bullets: [
      "Client profiles & goal tracking",
      "Program builder with video library",
      "Automated check-in forms",
      "Invoicing & subscriptions",
    ],
    color: "from-blue-500 to-blue-700",
    cta: "Start for free",
  },
  {
    label: "Studios & gyms",
    icon: Dumbbell,
    headline: "Run your studio like a business",
    desc: "Class scheduling, member management, and revenue tracking under one roof.",
    bullets: [
      "Class & session booking",
      "Multi-trainer management",
      "Membership billing",
      "Attendance analytics",
    ],
    color: "from-violet-500 to-violet-700",
    cta: "Book a demo",
  },
  {
    label: "Fitness influencers",
    icon: Sparkles,
    headline: "Monetise your audience at scale",
    desc: "Sell digital plans, host cohort coaching, and build a recurring revenue stream from your community.",
    bullets: [
      "Digital plan storefront",
      "Cohort & group coaching",
      "Branded client app",
      "Affiliate & referral tools",
    ],
    color: "from-pink-500 to-rose-600",
    cta: "Explore plans",
  },
];

const AI_FEATURES = [
  {
    icon: Brain,
    title: "Smart Personalisation",
    desc: "AI analyses each client's metrics and adjusts programs automatically so they always train at the right intensity.",
  },
  {
    icon: Zap,
    title: "Ultra-Fast Content Creation",
    desc: "Generate full workout blocks, meal plans, and check-in questions in seconds — not hours.",
  },
  {
    icon: Target,
    title: "Client Retention Engine",
    desc: "Automated nudges, milestone celebrations, and progress summaries keep clients engaged and subscribed.",
  },
];

const APP_FEATURES = [
  { icon: Smartphone, label: "Custom branding" },
  { icon: Globe, label: "Content delivery" },
  { icon: TrendingUp, label: "Progress tracking" },
  { icon: Users, label: "Group classes" },
  { icon: Zap, label: "Instant launch" },
  { icon: BarChart2, label: "Scalability" },
];

const STORE_FEATURES = [
  { icon: ShoppingBag, label: "Sell globally" },
  { icon: CreditCard, label: "Accept all payments" },
  { icon: Globe, label: "Establish your brand" },
  { icon: TrendingUp, label: "Grow with tools" },
];

const DASHBOARD_FEATURES = [
  { icon: Calendar, label: "Calendar automation" },
  { icon: CreditCard, label: "Direct payments" },
  { icon: BarChart2, label: "Data & insights" },
];

const TOOLS = [
  { icon: Calendar, title: "Calendar", desc: "Sync sessions, block time, send reminders automatically." },
  { icon: Layers, title: "Integrations", desc: "Connect Stripe, Khalti, Google Fit, Apple Health, and more." },
  { icon: Video, title: "Video calls", desc: "Built-in 1-on-1 and group coaching calls, no Zoom needed." },
  { icon: ClipboardCheck, title: "Check-ins", desc: "Structured weekly forms with photo uploads and metric trends." },
  { icon: MessageSquare, title: "Messaging", desc: "In-app chat keeps all client communication in one place." },
  { icon: Bell, title: "Notifications", desc: "Smart nudges for workouts, check-ins, and payments." },
  { icon: Settings, title: "Automations", desc: "Onboarding flows, follow-ups, and billing — on autopilot." },
  { icon: Globe, title: "Coach website", desc: "Instant public profile page to share with prospective clients." },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Online coach · 80 clients",
    quote: "FitRix cut my admin time by 70%. I stopped chasing payments and started focusing on coaching.",
    rating: 5,
  },
  {
    name: "Marcus Tei",
    role: "Studio owner · Auckland",
    quote: "The class booking and membership billing replaced three separate tools. My members love the app.",
    rating: 5,
  },
  {
    name: "Ananya K.",
    role: "Fitness influencer · 200k followers",
    quote: "Launched my digital plan store in a day. I made more in month one than in six months on other platforms.",
    rating: 5,
  },
];

const INTEGRATIONS = [
  "Stripe", "Khalti", "Google Fit", "Apple Health",
  "Zoom", "Slack", "Zapier", "WhatsApp",
];

const SUPPORT_CARDS = [
  {
    icon: Sparkles,
    title: "Branding & customisation",
    desc: "Our design team helps you configure your branded client app.",
  },
  {
    icon: Settings,
    title: "Data migration",
    desc: "We import your existing client data — no spreadsheet chaos.",
  },
  {
    icon: MessageSquare,
    title: "Email, chat & zoom support",
    desc: "Real humans on standby 7 days a week across all time zones.",
  },
];

const FAQS = [
  {
    q: "Is FitRix free to start?",
    a: "Yes — FitRix is completely free during beta. No credit card required.",
  },
  {
    q: "Do my clients need to download an app?",
    a: "Clients access their programs via a mobile-responsive web app. Native iOS & Android apps are coming soon.",
  },
  {
    q: "Which payment methods do you support?",
    a: "We support Stripe (USD, AUD, GBP, EUR), Khalti & eSewa (NPR), and manual invoice payments.",
  },
  {
    q: "Can I migrate from another platform?",
    a: "Absolutely. Our team will help you import clients, programs, and payment history from any CSV or API export.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted at rest and in transit. We are SOC 2 compliant and GDPR-ready.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavBar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-sm">
            F
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">FitRix</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:inline-flex">
            Sign in
          </Link>
          <Link href="/sign-up" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700">
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-brand-gradient-soft opacity-60" aria-hidden />
      <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-blue-100 opacity-40 blur-3xl" aria-hidden />
      <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-indigo-100 opacity-30 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 pb-0 pt-20 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur">
            <Zap className="h-3.5 w-3.5" />
            Built for independent coaches
          </div>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Launch your{" "}
            <span className="text-brand-gradient">Branded Fitness</span>
            {" "}App in minutes
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
            Clients, programs, check-ins, nutrition, and payments — the modern coaching platform that replaces your spreadsheets, Calendly, and half-dozen Telegram groups.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-up" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-brand-600/40 sm:w-auto">
              Launch my app
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/coach/dashboard" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 sm:w-auto">
              Book a demo
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-500">Free during beta · No credit card required · Setup in 5 minutes</p>
        </div>

        {/* Dashboard mock */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <div className="mx-auto flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-400">
                <span>app.fitrix.io/coach/dashboard</span>
              </div>
            </div>
            {/* Dashboard content mock */}
            <div className="grid grid-cols-4 gap-0">
              {/* Sidebar */}
              <div className="col-span-1 border-r border-slate-100 bg-slate-50 p-4">
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand-gradient" />
                  <div className="h-4 w-20 rounded bg-slate-200" />
                </div>
                {["Dashboard", "Clients", "Programs", "Check-ins", "Payments"].map((item, i) => (
                  <div key={item} className={`mb-1.5 flex items-center gap-2 rounded-lg px-3 py-2 ${i === 0 ? "bg-brand-600 text-white" : "text-slate-500"}`}>
                    <div className={`h-3.5 w-3.5 rounded ${i === 0 ? "bg-white/40" : "bg-slate-200"}`} />
                    <span className="text-xs font-medium">{item}</span>
                  </div>
                ))}
              </div>

              {/* Main area */}
              <div className="col-span-3 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="h-5 w-36 rounded bg-slate-800" />
                    <div className="mt-1.5 h-3 w-52 rounded bg-slate-200" />
                  </div>
                  <div className="h-8 w-28 rounded-lg bg-brand-gradient" />
                </div>

                {/* Stat cards */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                  {[["24", "Active clients"], ["12", "Plans this week"], ["$3.2k", "Monthly rev"]].map(([val, lbl]) => (
                    <div key={lbl} className="rounded-xl border border-slate-100 bg-white p-4 shadow-card">
                      <div className="text-lg font-bold text-slate-900">{val}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{lbl}</div>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                        <div className="h-1.5 w-3/4 rounded-full bg-brand-gradient" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Client rows */}
                <div className="rounded-xl border border-slate-100 bg-white shadow-card">
                  <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold text-slate-500">RECENT CLIENTS</div>
                  {["Alex M.", "Sarah K.", "Jordan P.", "Mia C."].map((name, i) => (
                    <div key={name} className="flex items-center gap-3 border-b border-slate-50 px-4 py-3 last:border-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="h-3 w-24 rounded bg-slate-200" />
                        <div className="mt-1 h-2 w-36 rounded bg-slate-100" />
                      </div>
                      <div className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${i % 2 === 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {i % 2 === 0 ? "On track" : "Check-in due"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -left-6 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Payment received</div>
                <div className="text-xs text-slate-500">NPR 5,000 · Alex M.</div>
              </div>
            </div>
          </div>

          <div className="absolute -right-6 -top-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">New client joined</div>
                <div className="text-xs text-slate-500">Sarah K. signed up</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-b border-t border-slate-100 bg-white py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center text-sm font-medium text-slate-400 uppercase tracking-wider">
          Trusted by the biggest names in fitness today
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
          {TRUST_LOGOS.map((name) => (
            <span key={name} className="text-lg font-bold tracking-tight text-slate-300 hover:text-slate-400 transition-colors">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function VersatileToolsSection() {
  return (
    <section id="coaches" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Versatile tools for diverse fitness pros</h2>
          <p className="mt-4 text-lg text-slate-600">One platform, every use case — whether you coach one-on-one, run a studio, or sell to thousands online.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {USER_TYPES.map((type) => (
            <div key={type.label} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover">
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${type.color} shadow-lg`}>
                <type.icon className="h-7 w-7 text-white" />
              </div>

              <div className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {type.label}
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">{type.headline}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{type.desc}</p>

              <ul className="mt-6 space-y-2">
                {type.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-brand-600" />
                    {b}
                  </li>
                ))}
              </ul>

              <Link href="/sign-up" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700">
                {type.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AISection() {
  return (
    <section className="overflow-hidden bg-slate-900 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-blue-400">
              <Brain className="h-3.5 w-3.5" />
              Smart AI Assistant for Fitness Pros
            </div>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Your AI-powered{" "}
              <span className="text-brand-gradient">coaching co-pilot</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400">
              FitRix AI learns from your coaching style and your clients' data to save you hours every week — without replacing your expertise.
            </p>

            <div className="mt-10 space-y-6">
              {AI_FEATURES.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 ring-1 ring-slate-700">
                    <f.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{f.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/sign-up" className="mt-10 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700">
              Try it free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* AI feature cards mock */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-white">FitRix AI</span>
                <span className="ml-auto rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">Active</span>
              </div>

              <div className="space-y-3">
                {[
                  { msg: "Generate week 3 program for Sarah — she hit all her week 2 targets.", type: "user" },
                  { msg: "Generated! Week 3 includes progressive overload on squats (+5kg), added tempo rows for lagging back development. Ready to assign.", type: "ai" },
                  { msg: "Send check-in reminder to clients who haven't logged this week.", type: "user" },
                  { msg: "Done — 4 reminders sent to Alex, Jordan, Mia, and Tom. I'll follow up again in 24 hours if they don't respond.", type: "ai" },
                ].map((m, i) => (
                  <div key={i} className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs rounded-xl px-4 py-2.5 text-sm ${m.type === "user" ? "bg-brand-600 text-white" : "bg-slate-700 text-slate-200"}`}>
                      {m.msg}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5">
                <span className="flex-1 text-sm text-slate-500">Ask FitRix AI anything…</span>
                <ArrowRight className="h-4 w-4 text-brand-500" />
              </div>
            </div>

            {/* Stat pill */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-xl">
              ⚡ 3 hours saved per client per week
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BrandedAppSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Phone mockups */}
          <div className="relative flex justify-center gap-4">
            {/* Phone 1 - main */}
            <div className="w-48 overflow-hidden rounded-3xl border-4 border-slate-800 bg-slate-800 shadow-2xl">
              <div className="bg-brand-gradient px-4 py-8">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-white/20" />
                  <span className="text-sm font-bold text-white">CoachPro</span>
                </div>
                <div className="mt-6 text-xs text-white/70">Welcome back</div>
                <div className="mt-1 text-lg font-bold text-white">Alex Morrison</div>
              </div>
              <div className="bg-white p-4">
                <div className="mb-3 h-3 w-24 rounded bg-slate-100" />
                {["Push Day A", "HIIT Cardio", "Recovery"].map((w, i) => (
                  <div key={w} className="mb-2 flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                    <div className={`h-6 w-6 rounded-md ${i === 0 ? "bg-brand-gradient" : "bg-slate-100"}`} />
                    <span className="text-xs font-medium text-slate-700">{w}</span>
                    <CheckCircle2 className={`ml-auto h-4 w-4 ${i === 0 ? "text-brand-600" : "text-slate-200"}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Phone 2 - secondary */}
            <div className="mt-12 w-44 overflow-hidden rounded-3xl border-4 border-slate-800 bg-white shadow-xl">
              <div className="bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-6">
                <div className="text-sm font-bold text-white">Week 3 Check-in</div>
                <div className="mt-2 text-xs text-white/80">Due today</div>
              </div>
              <div className="p-3">
                {["Weight this week?", "Energy levels?", "Sleep quality?", "Biggest challenge?"].map((q) => (
                  <div key={q} className="mb-2 rounded-lg border border-slate-100 px-3 py-2">
                    <div className="text-xs text-slate-600">{q}</div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-1.5 w-2/3 rounded-full bg-violet-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Your brand. Your app.{" "}
              <span className="text-brand-gradient">Powered by FitRix.</span>
            </h2>
            <p className="mt-6 text-lg text-slate-600">
              Give clients a beautiful, white-labelled coaching experience that feels like you built it — because with FitRix, you did.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {APP_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <f.icon className="h-5 w-5 text-brand-600" />
                  <span className="text-sm font-medium text-slate-700">{f.label}</span>
                </div>
              ))}
            </div>

            <Link href="/sign-up" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-700">
              Book a demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StorefrontSection() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Your online storefront,{" "}
              <span className="text-brand-gradient">ready in minutes</span>
            </h2>
            <p className="mt-6 text-lg text-slate-600">
              Sell digital plans, subscriptions, and 1-on-1 coaching packages from your own branded storefront — with zero commission.
            </p>

            <div className="mt-8 space-y-3">
              {STORE_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
                    <f.icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <span className="font-medium text-slate-800">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Storefront mock */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-brand-gradient px-6 py-8 text-white">
              <div className="mb-4 h-8 w-8 rounded-xl bg-white/20" />
              <div className="text-xl font-bold">Let's Transform</div>
              <div className="mt-1 text-sm text-white/80">12-Week Fat Loss Program</div>
              <div className="mt-4 text-3xl font-extrabold">NPR 8,500</div>
              <div className="mt-1 text-xs text-white/70">One-time · Lifetime access</div>
            </div>
            <div className="p-6">
              <div className="mb-4 font-semibold text-slate-900">What's included</div>
              {["12 weeks of structured training", "Custom meal plan templates", "Weekly video check-ins", "WhatsApp group access"].map((item) => (
                <div key={item} className="mb-2 flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" />
                  {item}
                </div>
              ))}
              <button className="mt-4 w-full rounded-xl bg-brand-gradient py-3 text-sm font-semibold text-white shadow-lg">
                Enrol now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Dashboard mini mock */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 font-semibold text-slate-900">Overview · April 2026</div>
              {/* Revenue chart mock */}
              <div className="flex h-28 items-end gap-2">
                {[40, 65, 45, 80, 70, 90, 75, 95, 85, 100, 88, 92].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-brand-100 transition-all hover:bg-brand-300" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {DASHBOARD_FEATURES.map((f) => (
                  <div key={f.label} className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 p-3">
                    <f.icon className="h-5 w-5 text-brand-600" />
                    <span className="text-center text-xs text-slate-600">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              A dynamic dashboard with{" "}
              <span className="text-brand-gradient">unlimited capabilities</span>
            </h2>
            <p className="mt-6 text-lg text-slate-600">
              See your business at a glance. Revenue trends, client retention, upcoming sessions, and outstanding payments — all in one view.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Real-time revenue & MRR tracking",
                "Client retention & churn alerts",
                "Session & check-in completion rates",
                "Automated payment reminders",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-brand-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolsGridSection() {
  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Lots of versatile tools.{" "}
            <span className="text-brand-gradient">One powerful platform.</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600">Everything you need to run your coaching business — nothing you don't.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => (
            <div key={t.title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient shadow-sm">
                <t.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">FitRix — the favourite among coaches & fitness pros</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 text-slate-700 leading-relaxed">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IntegrationsSection() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Make all your favourite apps work as one
          </h2>
          <p className="mt-4 text-lg text-slate-600">FitRix connects with the tools you already use and love.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {INTEGRATIONS.map((name) => (
            <div key={name} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
              <div className="h-6 w-6 rounded-md bg-brand-gradient" />
              <span className="font-medium text-slate-700">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SupportSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Round-the-clock support</h2>
          <p className="mt-4 text-lg text-slate-600">We're with you every step of the way — from setup to scale.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {SUPPORT_CARDS.map((c) => (
            <div key={c.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient shadow-sm">
                <c.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="pricing" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Frequently asked questions</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group rounded-2xl border border-slate-200 bg-white shadow-card open:shadow-card-hover">
              <summary className="flex cursor-pointer items-center justify-between px-6 py-5 font-semibold text-slate-900 list-none">
                {faq.q}
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-3xl bg-brand-gradient p-12 text-center shadow-2xl shadow-brand-600/25 sm:p-20">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ready to build a coaching business your clients brag about?
          </h2>
          <p className="mt-5 text-lg text-white/85">
            Sign up in under 60 seconds. Import your first client today.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-brand-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/coach/dashboard" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-7 py-3.5 text-base font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10">
              Book a demo
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/60">Free during beta · No credit card required</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-sm">
                F
              </div>
              <span className="text-lg font-semibold text-slate-900">FitRix</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              The modern coaching platform for independent fitness professionals.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 text-sm">
            <div>
              <div className="mb-3 font-semibold text-slate-900">Product</div>
              <div className="space-y-2 text-slate-500">
                <div><Link href="#features" className="hover:text-slate-900">Features</Link></div>
                <div><Link href="#pricing" className="hover:text-slate-900">Pricing</Link></div>
                <div><Link href="#coaches" className="hover:text-slate-900">For coaches</Link></div>
              </div>
            </div>
            <div>
              <div className="mb-3 font-semibold text-slate-900">Company</div>
              <div className="space-y-2 text-slate-500">
                <div><Link href="#" className="hover:text-slate-900">About</Link></div>
                <div><Link href="#" className="hover:text-slate-900">Blog</Link></div>
                <div><Link href="#" className="hover:text-slate-900">Contact</Link></div>
              </div>
            </div>
            <div>
              <div className="mb-3 font-semibold text-slate-900">Legal</div>
              <div className="space-y-2 text-slate-500">
                <div><Link href="#" className="hover:text-slate-900">Privacy</Link></div>
                <div><Link href="#" className="hover:text-slate-900">Terms</Link></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
          <span className="text-sm text-slate-500">© {new Date().getFullYear()} FitRix. All rights reserved.</span>
          <div className="flex items-center gap-5 text-sm text-slate-500">
            <Link href="/sign-in" className="hover:text-slate-900">Sign in</Link>
            <Link href="/sign-up" className="hover:text-slate-900">Sign up</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <NavBar />
      <HeroSection />
      <TrustBar />
      <VersatileToolsSection />
      <AISection />
      <BrandedAppSection />
      <StorefrontSection />
      <DashboardSection />
      <ToolsGridSection />
      <TestimonialsSection />
      <IntegrationsSection />
      <SupportSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
