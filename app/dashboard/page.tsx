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
    <div className="w-full h-96 sm:h-72 lg:h-80 -ml-2 sm:-ml-4 flex items-end">
      <ResponsiveContainer width="100%" height="100%">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 12, bottom: 55 }}
            barCategoryGap="12%"
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={70}
              className="hidden md:block"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              interval={0}
              height={50}
              className="md:hidden"
              tickFormatter={(v) => (v.length > 8 ? `${v.slice(0, 8)}…` : v)}
            />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
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
              wrapperStyle={{ fontSize: 11, color: '#374151' }}
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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <HeroNav />

        <header className="mt-6 sm:mt-8 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Your profile, stats, and tournament registrations
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* LEFT COLUMN: Profile + My Tournaments */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="shadow-sm border-0 h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full" />
                    <Skeleton className="h-5 w-32 sm:w-36" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : profile ? (
                  <div className="space-y-4 sm:space-y-5">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <img
                        src={profile.image || '/file.svg'}
                        alt="avatar"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-gray-100"
                        onError={(e: any) => {
                          e.currentTarget.src = '/file.svg'
                        }}
                      />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          {profile.name ?? 'User'}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Joined{' '}
                      {profile.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </p>

                    <Button asChild className="w-full text-sm h-9 sm:h-10 bg-indigo-600 hover:bg-indigo-700">
                      <a href="/tournament">Tournaments</a>
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-xs sm:text-sm text-gray-500 py-5">
                    No profile found. Sign in to sync.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* My Tournaments Section - Now under Profile */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">My Tournaments</h3>
              <div className="space-y-3">
                {(() => {
                  const map = new Map<string, any>()
                  for (const r of registrations) {
                    const id = r.tournamentId || r.tournament_id || r.tournamentid || ''
                    if (!id || map.has(id)) continue
                    const t = tournamentsMap[id]
                    const obj = t
                      ? {
                          id,
                          title: t.title || r.tournament_title || 'Untitled',
                          date: t.date || r.tournament_date || '',
                          location: t.location || r.tournament_location || '',
                          slots: Number(t.slots ?? r.tournament_slots ?? 0),
                          game: t.game || r.tournament_game || '',
                          img: t.img || r.tournament_img || null,
                        }
                      : {
                          id,
                          title: r.tournament_title || 'Untitled',
                          date: r.tournament_date || '',
                          location: r.tournament_location || '',
                          slots: Number(r.tournament_slots ?? 0),
                          game: r.tournament_game || '',
                          img: r.tournament_img || null,
                        }
                    map.set(id, obj)
                  }

                  const arr = Array.from(map.values())
                  if (arr.length === 0) return <div className="text-xs text-gray-500">You haven't joined any tournaments yet.</div>

                  return arr.map((t: any) => {
                    const totalRegistered = Number(globalCounts[t.id] ?? 0)
                    const remaining = Math.max(0, (Number(t.slots || 0) - totalRegistered))
                    return (
                      <article key={t.id} className="rounded-lg border overflow-hidden flex">
                        {t.img ? (
                          <div className="w-28 h-20 md:w-32 md:h-24 overflow-hidden flex-shrink-0 relative">
                            <img src={t.img} alt={t.title} className="w-full h-full object-cover object-center" />
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 pointer-events-none" />
                          </div>
                        ) : (
                          <div className="w-28 h-20 md:w-32 md:h-24 bg-gray-100 flex items-center justify-center text-sm text-gray-400">No image</div>
                        )}

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{t.title}</h4>
                            <div className="text-xs text-gray-500 mt-1">{t.date} {t.location ? `· ${t.location}` : ''}</div>
                            <div className="mt-2">
                              <span className="inline-block text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700">Game: {t.game}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-600">
                              <div>Slots: <span className="font-medium text-gray-900">{t.slots}</span></div>
                              <div className="text-xs text-gray-500">Remaining: <span className="font-medium">{remaining}</span></div>
                            </div>

                            <div className="flex items-center gap-2">
                              <a href="/tournament" className="text-xs inline-flex items-center px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-900">View</a>
                              <span className="text-xs text-green-600 font-medium">Registered</span>
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

          {/* RIGHT COLUMN: Stats + Chart + Registrations Table */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1.5 sm:gap-2">
                    <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                    Tournaments
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{registrations.length}</p>
                  <p className="text-xs text-gray-500">Registered</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1.5 sm:gap-2">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                    Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalMembers}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm border-0">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                      Registrations
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-0.5">
                      Top 8 tournaments (participants vs capacity)
                    </CardDescription>
                  </div>
                  {registrations.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportCSV}
                      className="h-8 text-xs flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-8 sm:h-10 w-full rounded" />
                    ))}
                  </div>
                ) : registrations.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 text-xs sm:text-sm">
                    No registration data to display.
                  </p>
                ) : (
                  <TournamentCapacityChart data={chartData} />
                )}
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="leading-none text-muted-foreground">
                  Each tournament shows: Capacity, Participants, Others, Remaining
                </div>
              </CardFooter>
            </Card>

            <Card className="shadow-sm border-0">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg">My Registrations</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {filteredRegistrations.length} of {registrations.length}{' '}
                      {registrations.length === 1 ? 'entry' : 'entries'}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input
                        placeholder="Filter..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-9 h-8 sm:h-9 w-full sm:w-48 lg:w-64 text-xs sm:text-sm"
                        aria-label="Filter registrations"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={exportCSV}
                      className="h-8 w-8 sm:hidden"
                      aria-label="Export CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 sm:h-20 w-full rounded-lg" />
                    ))}
                  </div>
                ) : filteredRegistrations.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-xs sm:text-sm">
                    {filter
                      ? 'No matches found.'
                      : 'No registrations yet. Join a tournament!'}
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {filteredRegistrations.map((r: any) => (
                        <Card
                          key={r.id}
                          className="p-3 sm:p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{r.teamName}</p>
                              <p className="text-xs sm:text-sm text-indigo-600 truncate">{r.tournament_title}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {r.tournament_date}
                                  {r.tournament_location && ` · ${r.tournament_location}`}
                                </span>
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-base sm:text-lg font-bold text-indigo-600">
                                {(r.members || []).length + 1}
                              </p>
                              <p className="text-xs text-gray-500">members</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto -mx-4 px-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Team</TableHead>
                            <TableHead className="text-xs">Tournament</TableHead>
                            <TableHead className="text-xs">Date</TableHead>
                            <TableHead className="text-xs">Location</TableHead>
                            <TableHead className="text-right text-xs">Members</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRegistrations.map((r: any) => (
                            <TableRow
                              key={r.id}
                              className="hover:bg-gray-50 text-xs sm:text-sm"
                            >
                              <TableCell className="font-medium">{r.teamName}</TableCell>
                              <TableCell>{r.tournament_title}</TableCell>
                              <TableCell>{r.tournament_date}</TableCell>
                              <TableCell className="text-gray-600">
                                {r.tournament_location || '—'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                <span className="inline-flex items-center justify-end gap-1">
                                  <Users className="w-3 h-3 text-indigo-600" />
                                  {(r.members || []).length + 1}
                                </span>
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
    </main>
  )
}