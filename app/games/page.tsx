"use client"

import React, { useEffect, useState } from 'react'
import HeroNav from '../HeroNav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Gamepad2, Search, Eye, Sparkles, TrendingUp } from 'lucide-react'

export default function GamesPage() {
  const [games, setGames] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/admin/games')
      .then((r) => r.json())
      .then((data) => setGames(Array.isArray(data) ? data : []))
      .catch(() => setGames([]))
  }, [])

  const filteredGames = games.filter(g =>
    g.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <HeroNav />

        {/* Hero */}
        <div className="mt-10 mb-16">
          <div className="relative rounded-3xl bg-black/80 border border-yellow-500/20 p-10 backdrop-blur-2xl shadow-[0_0_30px_rgba(255,215,0,0.08)]">

            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-yellow-500/10 rounded-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-2xl shadow-inner backdrop-blur">
                  <Gamepad2 className="w-8 h-8 text-yellow-300" />
                </div>

                <div className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full backdrop-blur">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-medium text-yellow-300">Featured Collection</span>
                </div>
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-yellow-400 mb-3">
                Discover Games
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mb-8">
                Explore our curated collection and pick the game you want to compete in.
              </p>

              {/* Search */}
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400/50" />
                <Input
                  placeholder="Search for games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 bg-white/5 border-yellow-500/20 text-white placeholder:text-yellow-200/40 rounded-2xl focus:border-yellow-400/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-14 flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl backdrop-blur">
              <TrendingUp className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-300">{games.length}</p>
              <p className="text-yellow-200/60 text-sm">Available Games</p>
            </div>
          </div>

          {searchQuery && (
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl backdrop-blur">
                <Search className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-300">{filteredGames.length}</p>
                <p className="text-yellow-200/60 text-sm">Search Results</p>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredGames.length === 0 ? (
          <Card className="bg-black/60 border border-yellow-500/20 backdrop-blur-xl shadow-lg">
            <CardContent className="py-24 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 mb-6">
                <Gamepad2 className="w-12 h-12 text-yellow-400" />
              </div>

              <h3 className="text-2xl font-bold text-yellow-300 mb-2">
                {searchQuery ? "No games found" : "No games available"}
              </h3>

              <p className="text-yellow-200/60 max-w-md">
                {searchQuery
                  ? "Try adjusting your search keywords."
                  : "New games will be added soon."}
              </p>

              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery('')}
                  className="mt-6 bg-yellow-400 text-black font-semibold rounded-xl"
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredGames.map((g) => (
              <Card
                key={g.id}
                className="group p-0 overflow-hidden bg-black/70 border border-yellow-500/20 rounded-2xl backdrop-blur-xl shadow-[0_0_15px_rgba(255,215,0,0.08)] hover:shadow-[0_0_25px_rgba(255,215,0,0.2)] transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={g.img}
                    alt={g.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* subtle overlay that doesn't block interactions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-40 group-hover:opacity-60 transition duration-300 pointer-events-none z-10" />

                  {/* hover action sits above the overlay and is clickable */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 z-20 pointer-events-auto">
                    <Button className="bg-yellow-400 text-black font-semibold px-6 h-11 rounded-xl">
                      <Eye className="w-4 h-4 mr-2" /> View Game
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold mb-2 text-yellow-200 group-hover:text-yellow-300 transition">
                    {g.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2 text-yellow-200/70">
                      <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                      Available Now
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/10 rounded-lg"
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
