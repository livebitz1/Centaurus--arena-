"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Download,
  Users,
  Trophy,
  Calendar,
  TrendingUp,
  Gamepad2,
  CheckCircle2,
  ArrowRight,
  Search,
  Zap,
  BarChart3,
  Flame,
  Menu,
  X,
  Crown,
} from "lucide-react"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList, ResponsiveContainer } from "recharts"
import HeroNav from '../HeroNav'

type RegRow = any

function NavigationBar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="flex items-center justify-between mb-8">
      <Link
        href="/"
        className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all"
      >
        Tournaments
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden sm:flex items-center gap-8">
        <Link href="/tournament" className="text-slate-300 hover:text-cyan-400 transition-colors text-sm font-medium">
          Browse
        </Link>
        <Link href="/dashboard" className="text-slate-300 hover:text-cyan-400 transition-colors text-sm font-medium">
          Dashboard
        </Link>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400 bg-transparent hover:text-cyan-300"
        >
          <Link href="/profile">Profile</Link>
        </Button>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="absolute top-20 left-0 right-0 bg-slate-900/95 backdrop-blur border-b border-slate-700/50 sm:hidden z-50">
          <div className="p-4 space-y-3">
            <Link
              href="/tournament"
              className="block text-slate-300 hover:text-cyan-400 transition-colors text-sm font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/dashboard"
              className="block text-slate-300 hover:text-cyan-400 transition-colors text-sm font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400 bg-transparent"
            >
              <Link href="/profile" onClick={() => setIsOpen(false)}>
                Profile
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}

function TournamentCapacityChart({ data }: { data: any[] }) {
  const chartConfig = {
    capacity: { label: "Capacity", color: "#06b6d4" },
    participants: { label: "Your Teams", color: "#10b981" },
    others: { label: "Other Teams", color: "#8b5cf6" },
    remaining: { label: "Available Slots", color: "#fbbf24" },
  } satisfies ChartConfig

  return (
    <div className="w-full h-96 sm:h-80 lg:h-96 -ml-2 sm:-ml-4 flex items-end">
      <ResponsiveContainer width="100%" height="100%">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 12, bottom: 55 }} barCategoryGap="12%" barGap={6}>
            <defs>
              <linearGradient id="gradCapacity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradParticipants" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradOthers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradRemaining" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
            <XAxis
              dataKey="label"
              // hide labels beneath the bars (cleaner visual)
              tick={false}
              axisLine={false}
              tickLine={false}
              interval={0}
              height={20}
              className="hidden md:block"
            />
            <XAxis
              dataKey="label"
              // hide labels on mobile as well
              tick={false}
              axisLine={false}
              tickLine={false}
              interval={0}
              height={20}
              className="md:hidden"
            />
            {/* Custom tick renderer for professional multi-line labels */}
            {
              (() => {
                const CustomTick = ({ x, y, payload }: any) => {
                  const raw = String(payload?.value ?? '')
                  if (!raw) return null

                  // Split into words and distribute across two lines to keep text readable
                  const words = raw.split(/\s+/).filter(Boolean)
                  if (words.length === 0) return null

                  // If single short word, show as-is
                  const maxLineLen = 26
                  if (raw.length <= maxLineLen) {
                    return (
                      <text x={x} y={y + 16} textAnchor="middle" fill="#94a3b8" fontSize={11} style={{ transform: 'none' }}>
                        {raw}
                      </text>
                    )
                  }

                  // Distribute words into two balanced lines
                  const lineA: string[] = []
                  const lineB: string[] = []
                  let lenA = 0
                  let lenB = 0
                  for (const w of words) {
                    if (lenA <= lenB) {
                      lineA.push(w)
                      lenA += w.length
                    } else {
                      lineB.push(w)
                      lenB += w.length
                    }
                  }

                  let l1 = lineA.join(' ')
                  let l2 = lineB.join(' ')

                  // Ensure lines aren't too long — truncate with ellipsis if needed
                  const truncate = (s: string, limit: number) => (s.length > limit ? s.slice(0, Math.max(0, limit - 1)).trim() + '…' : s)
                  l1 = truncate(l1, maxLineLen)
                  l2 = truncate(l2, maxLineLen)

                  // If second line ended up empty (all words fitted in line1), split roughly
                  if (!l2) {
                    const mid = Math.ceil(raw.length / 2)
                    const idx = raw.indexOf(' ', mid)
                    if (idx !== -1) {
                      l1 = truncate(raw.slice(0, idx).trim(), maxLineLen)
                      l2 = truncate(raw.slice(idx).trim(), maxLineLen)
                    } else {
                      l1 = truncate(raw.slice(0, maxLineLen).trim(), maxLineLen)
                      l2 = ''
                    }
                  }

                  // allow up to three lines for very long names
                  const l3 = ''
                  return (
                    <text x={x} y={y + 6} textAnchor="middle" fill="#94a3b8" fontSize={10} style={{ transform: 'none', lineHeight: '1.15' }}>
                      <tspan x={x} dy="0">{l1}</tspan>
                      {l2 && <tspan x={x} dy="1.15em">{l2}</tspan>}
                      {l3 && <tspan x={x} dy="1.15em">{l3}</tspan>}
                    </text>
                  )
                }

                return (
                  <>
                    <XAxis dataKey="label" interval={0} height={92} tick={<CustomTick />} className="hidden md:block" axisLine={false} tickLine={false} />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      height={64}
                      tick={(p) => {
                        const v = String(p?.payload?.value ?? '')
                        const short = v.length > 12 ? `${v.slice(0, 12)}…` : v
                        return (
                          <text x={p.x} y={p.y + 16} textAnchor="middle" fill="#94a3b8" fontSize={10} style={{ transform: 'none' }}>
                            {short}
                          </text>
                        )
                      }}
                      className="md:hidden"
                      axisLine={false}
                      tickLine={false}
                    />
                  </>
                )
              })()
            }
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => v}
                  formatter={(value, name) => [value, chartConfig[name]?.label || name]}
                  className="bg-slate-900/95 border-slate-700 shadow-2xl"
                />
              }
            />
            <Legend
              verticalAlign="top"
              align="center"
              height={36}
              wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }}
              className="hidden sm:flex"
            />
            <Bar dataKey="capacity" fill="url(#gradCapacity)" radius={[6, 6, 0, 0]} isAnimationActive={true} />
            <Bar dataKey="participants" fill="url(#gradParticipants)" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="participants" position="top" className="fill-slate-50 text-xs font-semibold" />
            </Bar>
            <Bar dataKey="others" fill="url(#gradOthers)" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="others" position="top" className="fill-slate-50 text-xs font-medium" />
            </Bar>
            <Bar dataKey="remaining" fill="url(#gradRemaining)" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="remaining" position="top" className="fill-slate-50 text-xs font-medium" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </ResponsiveContainer>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any | null>(null)
  const [registrations, setRegistrations] = useState<RegRow[]>([])
  const [globalCounts, setGlobalCounts] = useState<Record<string, number>>({})
  const [tournamentsMap, setTournamentsMap] = useState<Record<string, any>>({})
  const [filter, setFilter] = useState("")

  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress
    if (!email) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`/api/user/profile?email=${encodeURIComponent(email.toLowerCase())}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.user || null)
        setRegistrations(Array.isArray(data.registrations) ? data.registrations : [])
      })
      .catch((e) => {
        console.error("Failed to load profile", e)
        setProfile(null)
        setRegistrations([])
      })
      .finally(() => setLoading(false))
  }, [user])

  const exportCSV = () => {
    if (!registrations.length) return
    const headers = ["teamName", "tournament", "date", "members", "university", "phone", "createdAt"]
    const rows = registrations.map((r: any) => [
      r.teamName,
      r.tournament_title,
      r.tournament_date,
      ((r.members || []).length + 1).toString(),
      r.university || "",
      r.phone || "",
      r.createdAt || "",
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `registrations-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chartData = useMemo(() => {
    const perTournament = new Map<
      string,
      { id: string; label: string; participants: number; capacity: number; game: string }
    >()

    for (const r of registrations) {
      const id = r.tournamentId || r.tournament_id || r.tournamentid || ""
      const label = r.tournament_title || "Unknown"
      const game = r.tournament_game || "Unknown"
      const val = (r.members || []).length + 1
      let capacity = Number(r.tournament_slots ?? r.tournament_slots) || 0
      if (!capacity) {
        const fallback = tournamentsMap[id]
        if (fallback && (fallback.slots || fallback.slots === 0)) {
          capacity = Number(fallback.slots)
        } else {
          const vals = Object.values(tournamentsMap || {}) as any[]
          const byTitle = vals.find((t) => (t.title || t.name) === label)
          if (byTitle && (byTitle.slots || byTitle.slots === 0)) {
            capacity = Number(byTitle.slots)
          }
        }
      }
      if (!capacity) {
        console.warn(`Missing capacity for tournament: ${label} (id: ${id})`)
      }

      const prev = perTournament.get(id) || { id, label, participants: 0, capacity: capacity || 0, game }
      perTournament.set(id, {
        ...prev,
        participants: prev.participants + val,
        capacity: prev.capacity || capacity || 0,
      })
    }

    const list = Array.from(perTournament.values()).map((v) => {
      const totalRegistered = Number(globalCounts[v.id] ?? 0)
      const userParticipants = v.participants
      const others = Math.max(0, totalRegistered - userParticipants)
      const remaining = Math.max(0, (v.capacity || 0) - totalRegistered)
      return { id: v.id, label: v.label, participants: userParticipants, others, capacity: v.capacity || 0, remaining }
    })

    return list.sort((a, b) => b.participants - a.participants).slice(0, 8)
  }, [registrations, globalCounts, tournamentsMap])

  const filteredRegistrations = useMemo(() => {
    if (!filter.trim()) return registrations
    const q = filter.toLowerCase()
    return registrations.filter(
      (r) => r.tournament_title?.toLowerCase().includes(q) || r.teamName?.toLowerCase().includes(q),
    )
  }, [registrations, filter])

  const totalMembers = registrations.reduce((acc, r) => acc + ((r.members || []).length + 1), 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl -z-10" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <HeroNav />

        <header className="mt-8 mb-12 sm:mb-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-lg border border-cyan-500/30 backdrop-blur">
                  <BarChart3 className="w-6 h-6 text-cyan-400" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-50 to-slate-300 tracking-tight">
                  Tournament Hub
                </h1>
              </div>
              <p className="text-base text-slate-400 max-w-2xl leading-relaxed">
                Manage your teams, track progress, and dominate the competition
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Active Tournaments",
                value: registrations.length,
                icon: Trophy,
                color: "from-amber-600 to-orange-600",
              },
              { label: "Total Members", value: totalMembers, icon: Users, color: "from-cyan-600 to-blue-600" },
              { label: "Win Rate", value: "—", icon: TrendingUp, color: "from-emerald-600 to-green-600" },
              { label: "Next Event", value: "TBD", icon: Calendar, color: "from-purple-600 to-pink-600" },
            ].map((stat, i) => (
              <div
                key={i}
                className="group p-3 rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-800/10 backdrop-blur hover:border-slate-600/70 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                  <div
                    className={`p-1.5 rounded-md bg-gradient-to-br ${stat.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                  >
                    <stat.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-50">{stat.value}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 shadow-xl hover:shadow-2xl hover:border-slate-600/70 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6 relative z-10">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto bg-slate-700/50" />
                    <Skeleton className="h-6 w-40 mx-auto bg-slate-700/50" />
                    <Skeleton className="h-4 w-32 mx-auto bg-slate-700/50" />
                  </div>
                ) : profile ? (
                  <div className="space-y-5">
                    <div className="flex flex-col items-center">
                      <div className="relative group/avatar">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full blur-lg opacity-50 group-hover/avatar:opacity-75 transition-opacity duration-300" />
                        <img
                          src={profile.image || "/file.svg"}
                          alt="avatar"
                          className="relative w-24 h-24 rounded-full object-cover ring-4 ring-cyan-500/30 shadow-lg"
                          onError={(e: any) => {
                            e.currentTarget.src = "/file.svg"
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full border-3 border-slate-800 flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <p className="mt-4 font-bold text-slate-50 text-lg">{profile.name ?? "Player"}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2.5 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        {profile.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-5 border-t border-slate-700/50">
                      <div className="group/stat p-3 rounded-lg bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 hover:border-amber-500/50 transition-all hover:from-amber-600/30 hover:to-orange-600/30">
                        <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1.5 group-hover/stat:scale-110 transition-transform" />
                        <p className="text-2xl font-bold text-slate-50 text-center">{registrations.length}</p>
                        <p className="text-xs text-slate-400 mt-1 text-center">Tournaments</p>
                      </div>
                      <div className="group/stat p-3 rounded-lg bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:from-cyan-600/30 hover:to-blue-600/30">
                        <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1.5 group-hover/stat:scale-110 transition-transform" />
                        <p className="text-2xl font-bold text-slate-50 text-center">{totalMembers}</p>
                        <p className="text-xs text-slate-400 mt-1 text-center">Members</p>
                      </div>
                    </div>

                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 font-semibold py-2.5 h-auto rounded-lg border border-cyan-500/20 transition-all duration-300 group/btn"
                    >
                      <a href="/tournament" className="flex items-center justify-center gap-2">
                        <Gamepad2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        Browse Tournaments
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400 mb-4">No profile found</p>
                    <Button asChild size="sm" className="bg-slate-700 hover:bg-slate-600">
                      <a href="/login">Sign In</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  My Tournaments
                </h2>
                <span className="text-xs font-semibold text-slate-50 bg-gradient-to-r from-amber-600/30 to-orange-600/30 px-2.5 py-1 rounded-full border border-amber-500/40">
                  {(() => {
                    const map = new Map<string, any>()
                    for (const r of registrations) {
                      const id = r.tournamentId || r.tournament_id || r.tournamentid || ""
                      if (!id || map.has(id)) continue
                      map.set(id, true)
                    }
                    return map.size
                  })()} Active
                </span>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {(() => {
                  const map = new Map<string, any>()
                  for (const r of registrations) {
                    const id = r.tournamentId || r.tournament_id || r.tournamentid || ""
                    if (!id || map.has(id)) continue
                    const t = tournamentsMap[id]
                    const leaderObj =
                      typeof r.leader === "string"
                        ? (() => {
                            try {
                              return JSON.parse(r.leader)
                            } catch {
                              return null
                            }
                          })()
                        : r.leader
                    const currentUserEmail = (
                      user?.primaryEmailAddress?.emailAddress ||
                      user?.emailAddresses?.[0]?.emailAddress ||
                      ""
                    )
                      .toString()
                      .trim()
                      .toLowerCase()
                    const isLeader =
                      leaderObj &&
                      typeof leaderObj === "object" &&
                      leaderObj.email &&
                      leaderObj.email.toString().trim().toLowerCase() === currentUserEmail
                    const obj = t
                      ? {
                          id,
                          title: t.title || r.tournament_title || "Untitled",
                          date: t.date || r.tournament_date || "",
                          location: t.location || r.tournament_location || "",
                          slots: Number(t.slots ?? r.tournament_slots ?? 0),
                          game: t.game || r.tournament_game || "",
                          img: t.img || r.tournament_img || null,
                          roomId: t.roomId ?? null,
                          roomPassword: t.roomPassword ?? null,
                          showRoom: Boolean(t.showRoom),
                          isLeader: Boolean(isLeader),
                        }
                      : {
                          id,
                          title: r.tournament_title || "Untitled",
                          date: r.tournament_date || "",
                          location: r.tournament_location || "",
                          slots: Number(r.tournament_slots ?? 0),
                          game: r.tournament_game || "",
                          img: r.tournament_img || null,
                          roomId: r.tournament_roomId ?? null,
                          roomPassword: r.tournament_roomPassword ?? null,
                          showRoom: Boolean(r.tournament_showRoom),
                          isLeader: Boolean(isLeader),
                        }
                    map.set(id, obj)
                  }

                  const arr = Array.from(map.values())
                  if (arr.length === 0) {
                    return (
                      <div className="text-center py-12 bg-gradient-to-br from-slate-800/50 to-slate-800/20 rounded-lg border border-slate-700/50 backdrop-blur">
                        <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-400 mb-4 font-medium">No tournaments joined yet</p>
                        <Button asChild size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                          <a href="/tournament">Join Tournament</a>
                        </Button>
                      </div>
                    )
                  }

                  return arr.map((t: any) => {
                    const totalRegistered = Number(globalCounts[t.id] ?? 0)
                    const remaining = Math.max(0, Number(t.slots || 0) - totalRegistered)
                    const fillPercentage = ((totalRegistered / (t.slots || 1)) * 100).toFixed(0)

                    return (
                      <article
                        key={t.id}
                        className="group relative overflow-hidden rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-800/10 backdrop-blur hover:border-slate-600/70 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative h-28 overflow-hidden">
                          {t.img ? (
                            <>
                              <img
                                src={t.img || "/placeholder.svg"}
                                alt={t.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center">
                              <Gamepad2 className="w-8 h-8 text-slate-600" />
                            </div>
                          )}
                          {t.isLeader && (
                            <div className="absolute top-2 right-2 px-2.5 py-1 bg-gradient-to-r from-amber-600 to-orange-600 text-xs font-bold text-white rounded-md shadow-lg flex items-center gap-1.5 border border-amber-500/50">
                              <Crown className="w-3.5 h-3.5" />
                              Leader
                            </div>
                          )}
                        </div>
                        <div className="p-3.5 space-y-2.5">
                          <p className="font-bold text-slate-50 text-sm line-clamp-2 group-hover:text-cyan-400 transition-colors">
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {t.date || "TBD"}
                          </div>
                          <div className="pt-1.5 border-t border-slate-700/50">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-400">Capacity</span>
                              <span className="font-semibold text-slate-50">{fillPercentage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-700/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })
                })()}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {/* Charts Section */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 shadow-xl hover:shadow-2xl hover:border-slate-600/70 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                      Tournament Capacity Overview
                    </CardTitle>
                    <CardDescription>Real-time registration distribution across your tournaments</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {chartData.length > 0 ? (
                  <TournamentCapacityChart data={chartData} />
                ) : (
                  <div className="h-96 flex items-center justify-center text-slate-400">
                    <p>No tournament data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registrations Table Section */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 shadow-xl hover:shadow-2xl hover:border-slate-600/70 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10 pb-4">
                <div className="space-y-4">
                  <div>
                    <CardTitle className="text-xl">Team Registrations</CardTitle>
                    <CardDescription>Manage and track all your team registrations</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Search by tournament or team name..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="pl-10 bg-slate-700/20 border-slate-600/50 text-slate-50 placeholder:text-slate-500 focus:border-cyan-500/50 focus:bg-slate-700/30 transition-all"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {filteredRegistrations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-400 font-semibold">Team Name</TableHead>
                          <TableHead className="text-slate-400 font-semibold">Tournament</TableHead>
                          <TableHead className="text-slate-400 font-semibold">Game</TableHead>
                          <TableHead className="text-slate-400 font-semibold text-right">Members</TableHead>
                          <TableHead className="text-slate-400 font-semibold text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRegistrations.map((reg: any, i) => (
                          <TableRow
                            key={i}
                            className="border-slate-700/50 hover:bg-slate-700/20 transition-colors cursor-pointer group/row"
                          >
                            <TableCell className="font-medium text-slate-50 group-hover/row:text-cyan-400 transition-colors">
                              {reg.teamName || "—"}
                            </TableCell>
                            <TableCell className="text-slate-300 group-hover/row:text-slate-50 transition-colors">
                              {reg.tournament_title || "—"}
                            </TableCell>
                            <TableCell className="text-slate-400">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300">
                                {reg.tournament_game || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-slate-300">
                              {(reg.members || []).length + 1}
                            </TableCell>
                            <TableCell className="text-right text-slate-400 text-sm">
                              {reg.tournament_date
                                ? new Date(reg.tournament_date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No registrations found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
