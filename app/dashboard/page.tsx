'use client'

import React, { useEffect, useState, useMemo } from 'react'
import HeroNav from '../HeroNav'
import { useUser } from '@clerk/nextjs'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Download,
  Users,
  Trophy,
  Calendar,
  Filter,
  TrendingUp,
  MapPin,
  Gamepad2,
  CheckCircle2,
  Award,
} from 'lucide-react'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from 'recharts'

type RegRow = any

function TournamentCapacityChart({ data }: { data: any[] }) {
  const chartConfig = {
    capacity: { label: 'Capacity', color: '#f59e0b' },
    participants: { label: 'Participants', color: '#4f46e5' },
    others: { label: 'Others (same game)', color: '#06b6d4' },
    remaining: { label: 'Remaining slots', color: '#10b981' },
  } satisfies ChartConfig

  return (
    <div className="w-full h-96 sm:h-80 lg:h-96 -ml-2 sm:-ml-4 flex items-end">
      <ResponsiveContainer width="100%" height="100%">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 12, bottom: 55 }}
            barCategoryGap="12%"
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={70}
              className="hidden md:block"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              interval={0}
              height={50}
              className="md:hidden"
              tickFormatter={(v) => (v.length > 8 ? `${v.slice(0, 8)}…` : v)}
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => v}
                  formatter={(value, name) => [
                    value,
                    chartConfig[name]?.label || name,
                  ]}
                />
              }
            />
            <Legend
              verticalAlign="top"
              align="center"
              height={36}
              wrapperStyle={{ fontSize: 11, color: '#e5e7eb' }}
              className="hidden sm:flex"
            />
            <Bar dataKey="capacity" fill="var(--color-capacity)" radius={4} />
            <Bar dataKey="participants" fill="var(--color-participants)" radius={4}>
              <LabelList
                dataKey="participants"
                position="top"
                className="fill-foreground text-xs font-medium"
              />
            </Bar>
            <Bar dataKey="others" fill="var(--color-others)" radius={4}>
              <LabelList
                dataKey="others"
                position="top"
                className="fill-foreground text-xs"
              />
            </Bar>
            <Bar dataKey="remaining" fill="var(--color-remaining)" radius={4}>
              <LabelList
                dataKey="remaining"
                position="top"
                className="fill-foreground text-xs"
              />
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
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress
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
        console.error('Failed to load profile', e)
        setProfile(null)
        setRegistrations([])
      })
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/tournaments/counts')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        setGlobalCounts(data || {})
      } catch (e) {
        console.error('Failed to fetch global counts', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/tournaments')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        const map: Record<string, any> = {}
        if (Array.isArray(data)) {
          data.forEach((t: any) => { map[t.id] = t })
        }
        setTournamentsMap(map)
      } catch (e) {
        console.error('Failed to fetch tournaments for capacities', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  const exportCSV = () => {
    if (!registrations.length) return
    const headers = ['teamName', 'tournament', 'date', 'members', 'university', 'phone', 'createdAt']
    const rows = registrations.map((r: any) => [
      r.teamName,
      r.tournament_title,
      r.tournament_date,
      ((r.members || []).length + 1).toString(),
      r.university || '',
      r.phone || '',
      r.createdAt || '',
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chartData = useMemo(() => {
    const perTournament = new Map<string, { id: string; label: string; participants: number; capacity: number; game: string }>()

    for (const r of registrations) {
      const id = r.tournamentId || r.tournament_id || r.tournamentid || ''
      const label = r.tournament_title || 'Unknown'
      const game = r.tournament_game || 'Unknown'
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
      perTournament.set(id, { ...prev, participants: prev.participants + val, capacity: prev.capacity || capacity || 0 })
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
      (r) =>
        r.tournament_title?.toLowerCase().includes(q) ||
        r.teamName?.toLowerCase().includes(q)
    )
  }, [registrations, filter])

  const totalMembers = registrations.reduce(
    (acc, r) => acc + ((r.members || []).length + 1),
    0
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#0d0d0d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <HeroNav />

        {/* Enhanced Header */}
        <header className="mt-8 sm:mt-10 mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-300">
                Track your tournament journey and statistics
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT COLUMN: Profile + My Tournaments */}
          <div className="space-y-6">
            {/* Enhanced Profile Card */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-xl overflow-hidden">
              <CardContent className="pt-6">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                    <Skeleton className="h-6 w-40 mx-auto" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                ) : profile ? (
                  <div className="space-y-5">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <img
                          src={profile.image || '/file.svg'}
                          alt="avatar"
                          className="w-24 h-24 rounded-full object-cover ring-4 ring-yellow-400/30 shadow-lg"
                          onError={(e: any) => {
                            e.currentTarget.src = '/file.svg'
                          }}
                        />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <p className="mt-4 font-bold text-white text-lg">
                        {profile.name ?? 'User'}
                      </p>
                      <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                        <Calendar className="w-4 h-4" />
                        Member since{' '}
                        {profile.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                      <div className="text-center p-3 bg-white/5 rounded-xl">
                        <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{registrations.length}</p>
                        <p className="text-xs text-gray-400">Tournaments</p>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-xl">
                        <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{totalMembers}</p>
                        <p className="text-xs text-gray-400">Members</p>
                      </div>
                    </div>

                    <Button asChild className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40 transition-all">
                      <a href="/tournament" className="flex items-center justify-center gap-2">
                        <Gamepad2 className="w-4 h-4" />
                        Browse Tournaments
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-400">
                      No profile found. Sign in to sync.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced My Tournaments Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  My Tournaments
                </h3>
                <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                  {(() => {
                    const map = new Map<string, any>()
                    for (const r of registrations) {
                      const id = r.tournamentId || r.tournament_id || r.tournamentid || ''
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
                    const id = r.tournamentId || r.tournament_id || r.tournamentid || ''
                    if (!id || map.has(id)) continue
                    const t = tournamentsMap[id]
                    // determine if current user is the team leader for this registration
                    const leaderObj = typeof r.leader === 'string' ? (() => { try { return JSON.parse(r.leader); } catch { return null }} )() : r.leader
                    const currentUserEmail = (user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '').toString().trim().toLowerCase()
                    const isLeader = leaderObj && typeof leaderObj === 'object' && leaderObj.email && leaderObj.email.toString().trim().toLowerCase() === currentUserEmail
                    const obj = t
                      ? {
                          id,
                          title: t.title || r.tournament_title || 'Untitled',
                          date: t.date || r.tournament_date || '',
                          location: t.location || r.tournament_location || '',
                          slots: Number(t.slots ?? r.tournament_slots ?? 0),
                          game: t.game || r.tournament_game || '',
                          img: t.img || r.tournament_img || null,
                          roomId: t.roomId ?? null,
                          roomPassword: t.roomPassword ?? null,
                          showRoom: Boolean(t.showRoom),
                          isLeader: Boolean(isLeader),
                        }
                      : {
                          id,
                          title: r.tournament_title || 'Untitled',
                          date: r.tournament_date || '',
                          location: r.tournament_location || '',
                          slots: Number(r.tournament_slots ?? 0),
                          game: r.tournament_game || '',
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
                      <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">You haven't joined any tournaments yet.</p>
                        <Button asChild size="sm" className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black">
                          <a href="/tournament">Join Your First</a>
                        </Button>
                      </div>
                    )
                  }

                  return arr.map((t: any) => {
                    const totalRegistered = Number(globalCounts[t.id] ?? 0)
                    const remaining = Math.max(0, (Number(t.slots || 0) - totalRegistered))
                    const fillPercentage = ((totalRegistered / (t.slots || 1)) * 100).toFixed(0)
                    
                    return (
                      <article key={t.id} className="group rounded-xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-sm hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/10 transition-all">
                        <div className="relative h-32 overflow-hidden">
                          {t.img ? (
                            <>
                              <img src={t.img} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                              <Gamepad2 className="w-12 h-12 text-gray-600" />
                            </div>
                          )}
                          
                          {/* Game Badge */}
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-yellow-400 border border-yellow-400/30">
                              <Gamepad2 className="w-3 h-3" />
                              {t.game}
                            </span>
                          </div>
                          
                          {/* Registered Badge */}
                          <div className="absolute top-2 right-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/80 backdrop-blur-md rounded-full text-xs font-medium text-white">
                              <CheckCircle2 className="w-3 h-3" />
                              Registered
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          <h4 className="text-sm font-bold text-white line-clamp-2 mb-3 group-hover:text-yellow-400 transition-colors">
                            {t.title}
                          </h4>
                          
                          <div className="space-y-2 text-xs text-gray-300 mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{t.date}</span>
                            </div>
                            {t.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{t.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Slot Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">Slots filled</span>
                              <span className="font-medium text-white">{fillPercentage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, parseFloat(fillPercentage))}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">{totalRegistered} teams</span>
                              <span className="text-green-400">{remaining} remaining</span>
                            </div>
                          </div>

                          <Button asChild variant="outline" size="sm" className="w-full mt-4 border-white/20 hover:bg-white/10 text-white">
                            <a href="/tournament">View Details</a>
                          </Button>
                          {/* Room details - visible only when admin enabled showRoom */}
                          {t.showRoom && t.isLeader && (t.roomId || t.roomPassword) && (
                            <div className="mt-3 p-3 bg-white/3 rounded-lg border border-white/8 text-sm">
                              {t.roomId && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-300">Room ID</span>
                                  <span className="font-medium text-white">{t.roomId}</span>
                                </div>
                              )}
                              {t.roomPassword && (
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-gray-300">Password</span>
                                  <span className="font-medium text-white">{t.roomPassword}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })
                })()}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Stats + Chart + Registrations Table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-md border-white/10 shadow-xl overflow-hidden group hover:shadow-indigo-500/20 transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-300 mb-2">Total Tournaments</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{registrations.length}</p>
                      <p className="text-xs text-gray-400">Registered</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300 ml-4">
                      <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md border-white/10 shadow-xl overflow-hidden group hover:shadow-blue-500/20 transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-300 mb-2">Team Members</p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{totalMembers}</p>
                      <p className="text-xs text-gray-400">Total players</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300 ml-4">
                      <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Chart Card */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-xl overflow-hidden">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white">
                      <div className="p-2 bg-yellow-400/20 rounded-lg">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                      </div>
                      Registration Analytics
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      Track your tournament participation and performance metrics
                    </CardDescription>
                  </div>
                  {registrations.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportCSV}
                      className="h-9 px-3 sm:px-4 text-xs sm:text-sm flex items-center gap-2 border-white/20 hover:bg-white/10 hover:border-white/30 text-white transition-all duration-200 shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                      <span className="sm:hidden">CSV</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-10 sm:h-12 w-full rounded-lg bg-white/10" />
                    ))}
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                    </div>
                    <p className="text-gray-300 text-sm sm:text-base font-medium mb-2">No analytics data yet</p>
                    <p className="text-gray-500 text-xs sm:text-sm max-w-xs mx-auto">Join tournaments to start tracking your participation and performance</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center sm:text-left">
                      <p className="text-xs sm:text-sm text-gray-400 mb-2">Top 8 tournaments by participation</p>
                    </div>
                    <TournamentCapacityChart data={chartData} />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start gap-3 border-t border-white/10 pt-4 bg-white/[0.02]">
                <div className="w-full">
                  <p className="text-xs font-medium text-gray-300 mb-3">Legend</p>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                      <span className="text-gray-400">Capacity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm" />
                      <span className="text-gray-400">Your Teams</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-sm" />
                      <span className="text-gray-400">Other Teams</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                      <span className="text-gray-400">Remaining</span>
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>

            {/* Enhanced Registrations Table Card */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-white">My Registrations</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-400 mt-1">
                      {filteredRegistrations.length} of {registrations.length}{' '}
                      {registrations.length === 1 ? 'entry' : 'entries'}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Filter by name..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-10 h-9 sm:h-10 w-full sm:w-56 text-xs sm:text-sm bg-white/5 border-white/20 text-white placeholder-gray-500 focus:border-yellow-400/50 focus:ring-yellow-400/50"
                        aria-label="Filter registrations"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={exportCSV}
                      className="h-9 w-9 sm:hidden border-white/20 hover:bg-white/10"
                      aria-label="Export CSV"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/10" />
                    ))}
                  </div>
                ) : filteredRegistrations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      {filter ? (
                        <Filter className="w-10 h-10 text-gray-600" />
                      ) : (
                        <Trophy className="w-10 h-10 text-gray-600" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      {filter ? 'No matches found' : 'No registrations yet'}
                    </p>
                    {!filter && (
                      <Button asChild size="sm" className="mt-3 bg-yellow-400 hover:bg-yellow-500 text-black">
                        <a href="/tournament">Join a Tournament</a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="space-y-3 md:hidden">
                      {filteredRegistrations.map((r: any) => (
                        <div
                          key={r.id}
                          className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/10 transition-all"
                        >
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm truncate">{r.teamName}</p>
                              <p className="text-xs text-yellow-400 truncate flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
                                {r.tournament_title}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 rounded-lg">
                                <Users className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-bold text-indigo-400">
                                  {(r.members || []).length + 1}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5 text-xs text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{r.tournament_date}</span>
                            </div>
                            {r.tournament_location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{r.tournament_location}</span>
                              </div>
                            )}
                            {r.tournament_game && (
                              <div className="flex items-center gap-2">
                                <Gamepad2 className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{r.tournament_game}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto -mx-6 px-6 custom-scrollbar">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-xs font-semibold text-gray-400">Team Name</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-400">Tournament</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-400">Date</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-400">Location</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-gray-400">Members</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRegistrations.map((r: any, idx: number) => (
                            <TableRow
                              key={r.id}
                              className="border-white/10 hover:bg-white/5 transition-colors text-xs sm:text-sm"
                            >
                              <TableCell className="font-medium text-white">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-yellow-400">
                                    {idx + 1}
                                  </div>
                                  {r.teamName}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-300">
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                  {r.tournament_title}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-300">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  {r.tournament_date}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-400">
                                {r.tournament_location ? (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    {r.tournament_location}
                                  </div>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 rounded-lg">
                                  <Users className="w-4 h-4 text-indigo-400" />
                                  <span className="font-bold text-indigo-400">
                                    {(r.members || []).length + 1}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </main>
  )
}