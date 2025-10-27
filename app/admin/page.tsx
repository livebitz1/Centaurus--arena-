"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import AdminNav from "../../components/admin/Nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Trash2, Edit2, Eye, Filter, X } from "lucide-react"

type Tournament = {
  id: string
  title: string
  date: string
  location: string
  slots: number
  game: string
  img: string
}

type Filters = {
  game: string
  location: string
  slots: string
}

function AdminContent() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Filters>({ game: "", location: "", slots: "" })
  const [showFilters, setShowFilters] = useState(false)
  const [editing, setEditing] = useState<Tournament | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<Partial<Tournament>>({})

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

  function openCreate() {
    setForm({ title: "", date: "", location: "", slots: 8, game: "", img: "" })
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
    if (!form.title || !form.date || !form.location || !form.game || !form.slots || !form.img) {
      alert("Please fill all fields")
      return
    }
    const payload = { ...(form as Tournament) }
    if (editing) {
      // update
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
            console.error('Update returned unexpected payload', updated)
            alert(updated?.error || 'Failed to update')
          }
        })
        .catch(() => alert("Failed to update"))
    } else {
      // create
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
            console.error('Create returned unexpected payload', created)
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

  // load tournaments from API
  useEffect(() => {
    fetch("/api/admin/tournaments")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTournaments(data || [])
        } else {
          console.error("Unexpected /api/admin/tournaments response:", data)
          setTournaments([])
          // optionally show error to admin
          // alert(data?.error || 'Failed to load tournaments')
        }
      })
      .catch((err) => {
        console.error('Failed to fetch tournaments', err)
        setTournaments([])
      })
  }, [])

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Tournaments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, edit and delete tournaments</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          Create Tournament
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search tournaments..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                !
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="filter-game" className="text-xs font-medium">
                  Game
                </Label>
                <select
                  id="filter-game"
                  value={filters.game}
                  onChange={(e) => setFilters((prev) => ({ ...prev, game: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">All Games</option>
                  {uniqueGames.map((game) => (
                    <option key={game} value={game}>
                      {game}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-location" className="text-xs font-medium">
                  Location
                </Label>
                <select
                  id="filter-location"
                  value={filters.location}
                  onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-slots" className="text-xs font-medium">
                  Slots
                </Label>
                <select
                  id="filter-slots"
                  value={filters.slots}
                  onChange={(e) => setFilters((prev) => ({ ...prev, slots: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">All Slots</option>
                  {uniqueSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} Slots
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-xs">
                <X className="mr-2 h-4 w-4" />
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t, idx) => (
          <Card key={t.id ?? `t-${idx}`} className="flex flex-col">
            {/* Image for admin card */}
            {t.img ? (
              <div className="w-full h-40 md:h-48 bg-gray-50 overflow-hidden flex-shrink-0 relative">
                <img src={t.img} alt={t.title || 'Tournament image'} className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/30 pointer-events-none" />
              </div>
            ) : (
              <div className="w-full h-40 md:h-48 bg-gray-100 flex items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}

            <CardHeader className="pb-3">
              <CardTitle className="line-clamp-2 text-lg">{t.title}</CardTitle>
              <CardDescription className="text-xs">
                {t.date} · {t.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Game</p>
                  <p className="mt-1 font-semibold">{t.game}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Slots</p>
                  <p className="mt-1 font-semibold">{t.slots}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(t)} className="flex-1">
                  <Edit2 className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(t.id)} className="flex-1">
                  <Trash2 className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
                <Link href={`/tournament`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">No tournaments found</p>
        </div>
      )}

      <div className="mt-8 text-sm text-muted-foreground">
        Showing {filtered.length} tournament{filtered.length !== 1 ? "s" : ""}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Create"} Tournament</DialogTitle>
            <DialogDescription>
              {editing ? "Update tournament details" : "Add a new tournament to the system"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title || ""}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Tournament name"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  value={form.date || ""}
                  onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                  placeholder="e.g., Nov 8, 2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location || ""}
                  onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                  placeholder="e.g., Online"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="game">Game</Label>
                <Input
                  id="game"
                  value={form.game || ""}
                  onChange={(e) => setForm((s) => ({ ...s, game: e.target.value }))}
                  placeholder="e.g., Valorant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slots">Slots</Label>
                <Input
                  id="slots"
                  type="number"
                  value={form.slots ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, slots: Number(e.target.value) }))}
                  placeholder="8"
                />
              </div>
            </div>

            {/* Image URL for tournament card */}
            <div className="space-y-2">
              <Label htmlFor="img">Image URL</Label>
              <Input
                id="img"
                value={form.img || ""}
                onChange={(e) => setForm((s) => ({ ...s, img: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editing ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function AdminPage() {
  return (
    <AdminNav>
      <AdminContent />
    </AdminNav>
  )
}
