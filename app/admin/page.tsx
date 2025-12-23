"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Trash2, Edit2, Eye, Filter, X, Plus, Search, Users, Calendar, MapPin, Gamepad2, Menu, ChevronDown, Download, AlertCircle, Lock } from "lucide-react"
import AdminNav from "@/components/admin/Nav"

type Tournament = {
  id: string
  title: string
  date: string
  location: string
  slots: number
  game: string
  img: string
  roomId?: string
  roomPassword?: string
  showRoom?: boolean
}

type Filters = {
  game: string
  location: string
  slots: string
}

function EnhancedAdminPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Filters>({ game: "", location: "", slots: "" })
  const [showFilters, setShowFilters] = useState(false)
  const [editing, setEditing] = useState<Tournament | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [totalPlayers, setTotalPlayers] = useState<number>(0)
  const [form, setForm] = useState<Partial<Tournament>>({})
  const [regsOpen, setRegsOpen] = useState(false)
  const [currentRegs, setCurrentRegs] = useState<any[]>([])
  const [currentTournamentId, setCurrentTournamentId] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [regsLoading, setRegsLoading] = useState<boolean>(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmData, setConfirmData] = useState<{ id?: string; title?: string; showRoom?: boolean; roomId?: string | null; roomPassword?: string | null } | null>(null)
  const [registrations, setRegistrations] = useState<Record<string, number>>({})
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const [isAdminVerified, setIsAdminVerified] = useState(false)
  const [adminModalOpen, setAdminModalOpen] = useState(true)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const initial: Record<string, number> = {}
    tournaments.forEach((t) => (initial[t.id] = 0))
    setRegistrations(initial)

    let mounted = true
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/tournaments/counts')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        setRegistrations((prev) => {
          const next = { ...prev }
          tournaments.forEach((t) => {
            next[t.id] = Number(data?.[t.id] ?? 0)
          })
          return next
        })
      } catch (e) {
        console.error('Failed to fetch tournament counts', e)
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 5000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [tournaments])

  const filtered = tournaments.filter((t) => {
    const matchesSearch = (t.title + " " + t.location + " " + t.game + " " + t.date)
      .toLowerCase()
      .includes(query.toLowerCase())
    const matchesGame = !filters.game || t.game.toLowerCase() === filters.game.toLowerCase()
    const matchesLocation = !filters.location || t.location.toLowerCase() === filters.location.toLowerCase()
    const matchesSlots = !filters.slots || t.slots === Number(filters.slots)

    return matchesSearch && matchesGame && matchesLocation && matchesSlots
  })

  const uniqueGames = Array.from(new Set(tournaments.map((t) => t.game)))
  const uniqueLocations = Array.from(new Set(tournaments.map((t) => t.location)))
  const uniqueSlots = Array.from(new Set(tournaments.map((t) => t.slots))).sort((a, b) => a - b)
  const hasActiveFilters = filters.game || filters.location || filters.slots

  // compute stats; 'active' here refers to tournaments created by the admin.
  const isAdminCreated = (t: Tournament) => {
    const anyT = t as any
    if (anyT.createdBy && typeof anyT.createdBy === 'string') return anyT.createdBy === 'admin'
    if (anyT.createdByAdmin !== undefined) return Boolean(anyT.createdByAdmin)
    if (anyT.owner && typeof anyT.owner === 'string') return anyT.owner === 'admin'
    if (anyT.isAdminCreated !== undefined) return Boolean(anyT.isAdminCreated)
    // fallback: assume tournaments returned by the admin API are admin-created
    return true
  }

  const stats = {
    total: tournaments.length,
    active: tournaments.filter((t) => isAdminCreated(t)).length,
    shared: tournaments.filter((t) => Boolean(t.showRoom)).length,
    totalSlots: tournaments.reduce((acc, t) => acc + t.slots, 0),
  }

  // fetch total registered players (try sensible endpoints; fallback to 0)
  React.useEffect(() => {
    let mounted = true

    const fetchCount = async () => {
      try {
        // primary: server route that returns { count }
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)

        const res = await fetch('/api/admin/users/count', { signal: controller.signal })
        clearTimeout(timeout)

        if (res.ok) {
          const data = await res.json()
          const val = Number(data?.count ?? data?.total ?? data)
          if (mounted && Number.isFinite(val)) {
            setTotalPlayers(Math.max(0, Math.floor(val)))
            return
          }
        }

        // fallback: try a public users endpoint that returns an array
        const res2 = await fetch('/api/users')
        if (res2.ok) {
          const data = await res2.json()
          if (Array.isArray(data)) {
            if (mounted) setTotalPlayers(data.length)
            return
          }
          if (Array.isArray(data?.users)) {
            if (mounted) setTotalPlayers(data.users.length)
            return
          }
        }

        // final fallback: try an admin list endpoint
        const res3 = await fetch('/api/admin/users')
        if (res3.ok) {
          const data = await res3.json()
          if (Array.isArray(data)) {
            if (mounted) setTotalPlayers(data.length)
            return
          }
          if (Array.isArray(data?.users)) {
            if (mounted) setTotalPlayers(data.users.length)
            return
          }
        }
      } catch (e) {
        // network/abort errors
        if ((e as any)?.name === 'AbortError') {
          console.warn('User count fetch aborted')
        } else {
          console.error('Failed to fetch total players', e)
        }
      }
    }

    fetchCount()

    return () => {
      mounted = false
    }
  }, [])

  function openCreate() {
    setForm({ title: "", date: "", location: "", slots: 8, game: "", img: "", roomId: "", roomPassword: "", showRoom: false })
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(t: Tournament) {
    setEditing(t)
    setForm({ ...t })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setForm({})
    setEditing(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.date || !form.location || !form.game || !form.slots || !form.img || !((form as any).roomId) || !((form as any).roomPassword)) {
      alert("Please fill all fields")
      return
    }
    const payload = { ...(form as Tournament) }
    if (editing) {
      fetch(`/api/admin/tournaments/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((updated) => {
          if (updated && updated.id) {
            setTournaments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
            closeModal()
          } else {
            alert(updated?.error || 'Failed to update')
          }
        })
        .catch(() => alert("Failed to update"))
    } else {
      fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((created) => {
          if (created && created.id) {
            setTournaments((prev) => [created, ...prev])
            closeModal()
          } else {
            alert(created?.error || 'Failed to create')
          }
        })
        .catch(() => alert("Failed to create"))
    }
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this tournament?")) return
    fetch(`/api/admin/tournaments/${id}`, { method: "DELETE" })
      .then((r) => {
        if (r.ok) setTournaments((prev) => prev.filter((p) => p.id !== id))
        else alert("Failed to delete")
      })
      .catch(() => alert("Failed to delete"))
  }

  function clearFilters() {
    setFilters({ game: "", location: "", slots: "" })
    setQuery("")
  }

  async function openRegs(tid: string) {
    setCurrentTournamentId(tid)
    setRegsOpen(true)
    setRegsLoading(true)
    try {
      const res = await fetch(`/api/admin/tournaments/${tid}/registrations`)
      const data = await res.json()
      if (Array.isArray(data)) setCurrentRegs(data)
      else setCurrentRegs([])
    } catch (e) {
      setCurrentRegs([])
    } finally {
      setRegsLoading(false)
    }
  }

  function openConfirm(t: Tournament) {
    setConfirmData({ id: t.id, title: t.title, showRoom: Boolean(t.showRoom), roomId: t.roomId ?? null, roomPassword: t.roomPassword ?? null })
    setConfirmOpen(true)
  }

  async function confirmToggle() {
    if (!confirmData?.id) return
    try {
      const desired = !confirmData.showRoom
      const res = await fetch(`/api/admin/tournaments/${confirmData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showRoom: desired }),
      })
      const updated = await res.json()
      if (updated && updated.id) {
        setTournaments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      }
    } catch (e) {
      console.error('Failed to update showRoom', e)
    } finally {
      setConfirmOpen(false)
      setConfirmData(null)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetch("/api/admin/tournaments")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTournaments(data || [])
        } else {
          setTournaments([])
        }
      })
      .catch((err) => {
        setTournaments([])
      })
      .finally(() => setLoading(false))
  }, [])

  const submitAdminPassword = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setAdminError(null)
    try {
      const res = await fetch('/api/admin/check', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ password: adminPassword }) 
      })
      const data = await res.json()
      if (res.ok && data?.ok) {
        setIsAdminVerified(true)
        setAdminModalOpen(false)
      } else {
        setAdminError(data?.error || 'Invalid password')
      }
    } catch (err) {
      setAdminError('Request failed')
    }
  }

  const handleAdminClose = () => {
    setAdminModalOpen(false)
    setIsAdminVerified(false)
  }

  return (
    <AdminNav>
      {/* Admin Password Modal */}
      {adminModalOpen && !isAdminVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/70">
          <div className="absolute inset-0" onClick={handleAdminClose} />
          <form onSubmit={submitAdminPassword} className="relative z-10 w-full max-w-md bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/6 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 ring-1 ring-cyan-600/25 shadow-md">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-semibold text-center text-slate-50 mb-1">Admin Access</h3>
            <p className="text-sm text-center text-slate-400 mb-5">Enter your admin password to manage tournaments</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/3 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-shadow"
                  placeholder="Enter admin password"
                  autoFocus
                />
              </div>
              {adminError && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-600/10 border border-red-600/30 rounded-md">
                  <div className="flex-shrink-0 bg-red-600/20 p-2 rounded-full">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-sm text-red-300">{adminError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button 
                type="button" 
                onClick={handleAdminClose} 
                className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/8 text-slate-50 font-medium hover:bg-white/6 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:translate-y-0.5 transition-transform"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}

      {isAdminVerified && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2 truncate">
                  Tournament Manager
                </h1>
                <p className="text-slate-400 text-sm sm:text-base">Create, manage, and monitor all tournaments</p>
              </div>

              <div className="flex-shrink-0 w-full sm:w-auto">
                <button
                  onClick={openCreate}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Create Tournament</span>
                  <span className="sm:hidden">Create</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-cyan-500/30 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-medium">Total Events</span>
                  <Gamepad2 className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-3xl font-bold text-slate-50">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-emerald-500/30 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-medium">Total Players</span>
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-slate-50">{totalPlayers.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-medium">Room Shared</span>
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-slate-50">{stats.shared}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-orange-500/30 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-medium">Total Slots</span>
                  <MapPin className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-3xl font-bold text-slate-50">{stats.totalSlots}</p>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search tournaments..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition ${
                    showFilters || hasActiveFilters
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-white text-xs font-bold">
                      !
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Game</label>
                      <select
                        value={filters.game}
                        onChange={(e) => setFilters((prev) => ({ ...prev, game: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                      >
                        <option value="">All Games</option>
                        {uniqueGames.map((game) => (
                          <option key={game} value={game}>{game}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                      <select
                        value={filters.location}
                        onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                      >
                        <option value="">All Locations</option>
                        {uniqueLocations.map((location) => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Slots</label>
                      <select
                        value={filters.slots}
                        onChange={(e) => setFilters((prev) => ({ ...prev, slots: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                      >
                        <option value="">All Slots</option>
                        {uniqueSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot} Slots</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-slate-50 transition"
                    >
                      <X className="w-4 h-4" />
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tournament Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-emerald-500 rounded-full animate-spin animation-delay-150" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-50">Loading Tournaments</h3>
              <p className="text-sm text-slate-400 mt-2">Fetching tournament data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-slate-800/40 to-slate-800/20 backdrop-blur-sm border border-dashed border-white/10 rounded-2xl">
              <Gamepad2 className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No tournaments found</h3>
              <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {filtered.map((t) => {
                  const registered = registrations[t.id] || 0
                  const remaining = Math.max(0, t.slots - registered)
                  const progress = Math.min(100, Math.round((registered / Math.max(1, t.slots)) * 100))

                  return (
                    <div key={t.id} className="group bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300">
                      {/* Tournament Image */}
                      <div className="relative h-48 overflow-hidden">
                        {t.img ? (
                          <>
                            <img 
                              src={t.img} 
                              alt={t.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-slate-800/50 flex items-center justify-center">
                            <Gamepad2 className="w-12 h-12 text-slate-600" />
                          </div>
                        )}
                        {t.showRoom && (
                          <div className="absolute top-3 right-3 px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full text-xs font-semibold text-white shadow-lg">
                            Room Shared
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-slate-50 mb-2 line-clamp-2 group-hover:text-cyan-400 transition">
                          {t.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg text-xs text-slate-300">
                            <Calendar className="w-3.5 h-3.5" />
                            {t.date}
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg text-xs text-slate-300">
                            <MapPin className="w-3.5 h-3.5" />
                            {t.location}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Registrations</p>
                            <p className="text-2xl font-bold text-slate-50">
                              {registered}<span className="text-sm text-slate-400">/{t.slots}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400 mb-1">Game</p>
                            <p className="text-sm font-semibold text-slate-300">{t.game}</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                            <span>{remaining} slots remaining</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEdit(t)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-50 text-sm font-medium transition"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 text-sm font-medium transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                          <button
                            onClick={() => openConfirm(t)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
                          >
                            {t.showRoom ? 'Hide' : 'Share'}
                          </button>
                          <button
                            onClick={() => openRegs(t.id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-emerald-300 text-sm font-medium transition"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="text-center text-sm text-slate-400">
                Showing {filtered.length} of {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}
              </div>
            </>
          )}

          {/* Create/Edit Modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/70">
              <div className="absolute inset-0" onClick={closeModal} />
              <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl shadow-2xl">
                <div className="sticky top-0 bg-gradient-to-br from-slate-900 to-slate-800 border-b border-white/10 p-6 z-10">
                  <h2 className="text-2xl font-bold text-slate-50">{editing ? "Edit" : "Create"} Tournament</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {editing ? "Update tournament details" : "Add a new tournament to the system"}
                  </p>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tournament Title</label>
                    <input
                      value={form.title || ""}
                      onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                      placeholder="e.g., Valorant Champions Cup 2025"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                      <input
                        value={form.date || ""}
                        onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                        placeholder="e.g., Dec 25, 2025"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                      <input
                        value={form.location || ""}
                        onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                        placeholder="e.g., Online"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Game</label>
                      <input
                        value={form.game || ""}
                        onChange={(e) => setForm((s) => ({ ...s, game: e.target.value }))}
                        placeholder="e.g., Valorant"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Total Slots</label>
                      <input
                        type="number"
                        value={form.slots ?? ""}
                        onChange={(e) => setForm((s) => ({ ...s, slots: Number(e.target.value) }))}
                        placeholder="8"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
                    <input
                      value={form.img || ""}
                      onChange={(e) => setForm((s) => ({ ...s, img: e.target.value }))}
                      placeholder="https://example.com/tournament-image.jpg"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                    />
                  </div>

                  <div className="border-t border-white/10 pt-5">
                    <h3 className="text-lg font-semibold text-slate-50 mb-4">Room Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Room ID</label>
                        <input
                          value={(form as any).roomId || ""}
                          onChange={(e) => setForm((s) => ({ ...s, roomId: e.target.value }))}
                          placeholder="Room/Voice ID"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Room Password</label>
                        <input
                          value={(form as any).roomPassword || ""}
                          onChange={(e) => setForm((s) => ({ ...s, roomPassword: e.target.value }))}
                          placeholder="Password or PIN"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <input
                        id="showRoom"
                        type="checkbox"
                        checked={Boolean((form as any).showRoom)}
                        onChange={(e) => setForm((s) => ({ ...s, showRoom: e.target.checked }))}
                        className="w-5 h-5 accent-cyan-500 rounded"
                      />
                      <label htmlFor="showRoom" className="text-sm text-slate-300 cursor-pointer">
                        Share room details with registered users immediately
                      </label>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gradient-to-br from-slate-900 to-slate-800 border-t border-white/10 p-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-50 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/25 transition"
                  >
                    {editing ? "Save Changes" : "Create Tournament"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Confirm Modal */}
          {confirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/70">
              <div className="absolute inset-0" onClick={() => setConfirmOpen(false)} />
              <div className="relative z-10 w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl shadow-2xl p-6">
                <h3 className="text-xl font-bold text-slate-50 mb-2">Confirm Action</h3>
                <p className="text-sm text-slate-400 mb-6">
                  {confirmData?.showRoom ? 'Hide' : 'Share'} room details for "{confirmData?.title}"?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-50 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmToggle}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/25 transition"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Registrations Sheet */}
          {regsOpen && (
            <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/70">
              <div className="absolute inset-0" onClick={() => setRegsOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 border-t border-white/10 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-50">Registrations</h2>
                      <p className="text-sm text-slate-400 mt-1">
                        {currentRegs.length} team{currentRegs.length !== 1 ? 's' : ''} registered
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {currentTournamentId && (
                        <a
                          href={`/api/admin/tournaments/${currentTournamentId}/registrations/export`}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium transition"
                        >
                          <Download className="w-4 h-4" />
                          Export CSV
                        </a>
                      )}
                      <button
                        onClick={() => setRegsOpen(false)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-slate-50 font-medium transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-[calc(90vh-120px)] overflow-auto p-6">
                  {regsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-4" />
                      <p className="text-slate-400">Loading registrations...</p>
                    </div>
                  ) : currentRegs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Users className="w-16 h-16 text-slate-600 mb-4" />
                      <p className="text-slate-400">No registrations yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1100px]">
                        <thead className="bg-white/5 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Team</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">University</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Phone</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Leader Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Leader Email</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Leader Reg No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Leader Game ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Members</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Registered</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {currentRegs.map((r) => {
                            const leader = typeof r.leader === 'string' ? JSON.parse(r.leader || '{}') : r.leader || {}
                            const members = typeof r.members === 'string' ? JSON.parse(r.members || '[]') : r.members || []

                            return (
                              <tr key={r.id} className="hover:bg-white/5 transition">
                                <td className="px-4 py-4 text-sm font-medium text-slate-50">{r.teamName}</td>
                                <td className="px-4 py-4 text-sm text-slate-300">{r.university}</td>
                                <td className="px-4 py-4 text-sm text-slate-300">{r.phone || '—'}</td>
                                <td className="px-4 py-4 text-sm text-slate-300">{leader.name || '—'}</td>
                                <td className="px-4 py-4 text-sm text-slate-300">{leader.email || '—'}</td>
                                <td className="px-4 py-4 text-sm text-slate-300">{leader.registrationNo || '—'}</td>
                                <td className="px-4 py-4 text-sm text-slate-300">{leader.gameId || '—'}</td>
                                <td className="px-4 py-4">
                                  <details className="text-sm">
                                    <summary className="cursor-pointer text-cyan-400 hover:text-cyan-300">
                                      {members.length} member{members.length !== 1 ? 's' : ''}
                                    </summary>
                                    <div className="mt-2 space-y-2 pl-4 max-h-44 overflow-auto">
                                      {members.map((m: any, i: number) => (
                                        <div key={i} className="text-xs border-l-2 border-cyan-500/30 pl-3">
                                          <div className="font-medium text-slate-200">{m.name}</div>
                                          <div className="text-slate-400">
                                            {m.registrationNo} • {m.email}
                                          </div>
                                          <div className="text-slate-500">{m.gameId}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                </td>
                                <td className="px-4 py-4 text-xs text-slate-400">
                                  {new Date(r.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminNav>
  )
}

export default EnhancedAdminPage