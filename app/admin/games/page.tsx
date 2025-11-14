"use client"

import React, { useEffect, useState } from 'react'
import AdminNav from '../../../components/admin/Nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, ImageIcon, Pencil, Trash2, X, Check, AlertCircle, Gamepad2, Calendar, Search } from 'lucide-react'

export default function AdminGamesPage() {
  const [games, setGames] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [imgUrl, setImgUrl] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // edit/delete state
  const [editingGame, setEditingGame] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editImgUrl, setEditImgUrl] = useState('')
  const [editPreview, setEditPreview] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [toDeleteId, setToDeleteId] = useState<string | null>(null)

  useEffect(() => {
    // fetch existing games
    fetch('/api/admin/games')
      .then((r) => r.json())
      .then((data) => setGames(Array.isArray(data) ? data : []))
      .catch(() => setGames([]))
  }, [])

  // update preview when imgUrl changes
  useEffect(() => {
    setPreview(imgUrl && imgUrl.trim() ? imgUrl.trim() : null)
  }, [imgUrl])

  useEffect(() => {
    setEditPreview(editImgUrl && editImgUrl.trim() ? editImgUrl.trim() : editingGame?.img ?? null)
  }, [editImgUrl, editingGame])

  const createGame = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim()) return alert('Please provide a title')
    if (!imgUrl.trim()) return alert('Please provide an image URL')

    setLoading(true)
    try {
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), img: imgUrl.trim() }),
      })

      if (!res.ok) throw new Error('Create failed')
      const g = await res.json()
      setGames((s) => [g, ...s])
      setTitle('')
      setImgUrl('')
      setPreview(null)
    } catch (err) {
      console.error(err)
      alert('Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  // open edit modal
  function openEditModal(g: any) {
    setEditingGame(g)
    setEditTitle(g.title ?? '')
    setEditImgUrl(g.img ?? '')
    setEditPreview(g.img ?? null)
  }

  async function submitEdit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!editingGame) return
    if (!editTitle.trim()) return alert('Please provide a title')
    if (!editImgUrl.trim()) return alert('Please provide an image URL')
    setEditLoading(true)
    try {
      const res = await fetch(`/api/admin/games/${editingGame.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), img: editImgUrl.trim() }),
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      setGames((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      // close modal
      setEditingGame(null)
      setEditTitle('')
      setEditImgUrl('')
      setEditPreview(null)
    } catch (err) {
      console.error(err)
      alert('Failed to update')
    } finally {
      setEditLoading(false)
    }
  }

  function openDeleteConfirm(id: string) {
    setToDeleteId(id)
    setConfirmDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!toDeleteId) return
    try {
      const res = await fetch(`/api/admin/games/${toDeleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setGames((prev) => prev.filter((g) => g.id !== toDeleteId))
    } catch (err) {
      console.error(err)
      alert('Failed to delete')
    } finally {
      setConfirmDeleteOpen(false)
      setToDeleteId(null)
    }
  }

  const filteredGames = games.filter(g => 
    g.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AdminNav>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          
          {/* Header Section */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/20">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Games Management
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Create, edit and manage game catalog
                </p>
              </div>
            </div>
          </div>

          {/* Add Game Section */}
          <Card className="mb-8 lg:mb-12 overflow-hidden border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <div className="p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Plus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add New Game</h2>
              </div>
              
              <form onSubmit={createGame}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Preview Section */}
                  <div className="lg:col-span-3">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 group hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-300">
                      {preview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={preview} 
                            alt="preview" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-4">
                          <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                          <span className="text-sm font-medium text-center">Image Preview</span>
                          <span className="text-xs text-center mt-1 opacity-70">Enter URL to preview</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input Section */}
                  <div className="lg:col-span-9 flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4" />
                          Game Title
                        </label>
                        <Input 
                          placeholder="Enter game title" 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)}
                          className="h-12 text-base border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Image URL
                        </label>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          value={imgUrl} 
                          onChange={(e) => setImgUrl(e.target.value)}
                          className="h-12 text-base border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => { setTitle(''); setImgUrl(''); setPreview(null) }}
                        className="h-11 px-6 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="h-11 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Game
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </Card>

          {/* Search and Stats */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-2xl text-slate-900 dark:text-white">{games.length}</span>
                <span className="ml-2">Total Games</span>
              </div>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search games..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-slate-200 dark:border-slate-700 rounded-xl focus:border-violet-500 dark:focus:border-violet-500 focus:ring-violet-500/20"
              />
            </div>
          </div>

          {/* Games Grid */}
          {filteredGames.length === 0 ? (
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Gamepad2 className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                </div>
                <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  {searchQuery ? 'No games found' : 'No games yet'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery ? 'Try a different search term' : 'Add your first game to get started'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGames.map((g) => (
                <Card 
                  key={g.id} 
                  className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white dark:bg-slate-900 hover:-translate-y-1 p-0"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800 m-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={g.img} 
                      alt={g.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Action Buttons Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Button 
                        size="sm"
                        onClick={() => openEditModal(g)}
                        className="h-10 px-4 rounded-lg bg-white/90 hover:bg-white text-slate-900 shadow-lg backdrop-blur-sm"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteConfirm(g.id)}
                        className="h-10 px-4 rounded-lg shadow-lg backdrop-blur-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {g.title}
                    </h3>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {new Date(g.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={!!editingGame} onOpenChange={(open) => { if (!open) setEditingGame(null) }}>
            <DialogContent className="sm:max-w-2xl border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-2xl p-0">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-violet-600" />
                  Edit Game
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  Update the game title and image
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={submitEdit} className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                  <div className="md:col-span-4">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
                      {editPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={editPreview} 
                          alt="preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:col-span-8 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Game Title
                      </label>
                      <Input 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)} 
                        placeholder="Game title"
                        className="h-12 rounded-xl border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Image URL
                      </label>
                      <Input 
                        value={editImgUrl} 
                        onChange={(e) => setEditImgUrl(e.target.value)} 
                        placeholder="https://example.com/image.jpg"
                        className="h-12 rounded-xl border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setEditingGame(null)}
                    className="h-11 px-6 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={editLoading}
                    className="h-11 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    {editLoading ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-2xl">
              <DialogHeader>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
                </div>
                <DialogTitle className="text-center text-xl">Delete Game?</DialogTitle>
                <DialogDescription className="text-center">
                  This action cannot be undone. The game will be permanently removed from your catalog.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="flex-1 h-11 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={confirmDelete}
                  className="flex-1 h-11 rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </AdminNav>
  )
}