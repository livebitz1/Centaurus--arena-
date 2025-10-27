'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import HeroNav from '../HeroNav';
import { useUser } from '@clerk/nextjs';

type Tournament = {
  id: string;
  title: string;
  date: string;
  location: string;
  slots: number;
  game: string;
  img?: string | null;
};

// tournaments are loaded from the server (no hardcoded mock data)
export default function TournamentPage() {
  const { user, isSignedIn } = useUser();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    fetch('/api/admin/tournaments')
      .then((r) => r.json())
      .then((data) => setTournaments(data || []))
      .catch(() => setTournaments([]));
  }, []);

  const [query, setQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('All');

  // Maximum number of additional members (excluding leader)
  const MAX_MEMBERS = 4;

  // Track number of teams already registered per tournament (frontend-only state)
  const [registrations, setRegistrations] = useState<Record<string, number>>({});

  // initialize registrations when tournaments load
  useEffect(() => {
    const map: Record<string, number> = {};
    tournaments.forEach((t) => (map[t.id] = 0));
    setRegistrations(map);
  }, [tournaments]);

  // modal state
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joiningTournament, setJoiningTournament] = useState<any | null>(null);

  // form state (team registration) — updated to include registrationNo and gameId
  const [form, setForm] = useState({
    teamName: '',
    university: '',
    phone: '',
    leader: {
      name: '',
      email: '',
      registrationNo: '',
      gameId: '',
    },
    // dynamic team members (excluding leader). leader is separate.
    members: [
      { name: '', registrationNo: '', email: '', gameId: '' },
    ],
  });

  // when opening the modal, prefill leader name/email if clerk user available
  const openJoinModal = (tournament: any) => {
    setJoiningTournament(tournament);
    setForm((prev) => ({
      ...prev,
      teamName: prev.teamName,
      leader: {
        name: (user?.fullName || user?.firstName) ?? prev.leader.name,
        email:
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          prev.leader.email,
        registrationNo: prev.leader.registrationNo,
        gameId: prev.leader.gameId,
      },
    }));
    setJoinModalOpen(true);
  };

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setJoiningTournament(null);
  };

  const handleFormChange = (path: string, value: string) => {
    // path examples: 'teamName', 'leader.name', 'members.0.name'
    if (path.startsWith('leader.')) {
      const key = path.replace('leader.', '');
      setForm((s) => ({ ...s, leader: { ...s.leader, [key]: value } }));
      return;
    }
    if (path.startsWith('members.')) {
      const rest = path.replace('members.', '');
      const [indexStr, key] = rest.split('.');
      const idx = parseInt(indexStr, 10);
      setForm((s) => {
        const members = s.members.slice();
        members[idx] = { ...members[idx], [key]: value };
        return { ...s, members };
      });
      return;
    }
    setForm((s) => ({ ...s, [path]: value }));
  };

  const addMember = () => {
    if (form.members.length >= MAX_MEMBERS) {
      // friendly message — frontend-only
      alert(`You can only add ${MAX_MEMBERS} team members for this game`);
      return;
    }
    setForm((s) => ({ ...s, members: [...s.members, { name: '', registrationNo: '', email: '', gameId: '' }] }));
  };

  const removeMember = (idx: number) => {
    setForm((s) => ({ ...s, members: s.members.filter((_, i) => i !== idx) }));
  };

  const validateTeam = () => {
    // basic validation: teamName, university, leader name/email/registrationNo/gameId, and at least one member
    if (!form.teamName.trim()) return 'Team name is required';
    if (!form.university.trim()) return 'University is required';
    if (!form.leader.name.trim()) return 'Leader name is required';
    if (!form.leader.email.trim()) return 'Leader email is required';
    if (!form.leader.registrationNo.trim()) return 'Leader registration number is required';
    if (!form.leader.gameId.trim()) return 'Leader game ID is required';
    if (form.members.length === 0) return 'At least one team member is required';
    if (form.members.length > MAX_MEMBERS) return `You can only add ${MAX_MEMBERS} team members for this game`;
    // members: each must have name and registrationNo and gameId
    for (let i = 0; i < form.members.length; i++) {
      const m = form.members[i];
      if (!m.name.trim()) return `Member ${i + 1} name is required`;
      if (!m.registrationNo.trim()) return `Member ${i + 1} registration number is required`;
      if (!m.gameId.trim()) return `Member ${i + 1} game ID is required`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateTeam();
    if (err) {
      alert(err);
      return;
    }
    // Frontend-only: package team payload and log it
    const payload = {
      tournamentId: joiningTournament?.id,
      teamName: form.teamName,
      university: form.university,
      phone: form.phone,
      leader: form.leader,
      members: form.members,
    };
    console.log('Team join request', payload);
    // Increment frontend registration count for this tournament
    if (joiningTournament?.id) {
      setRegistrations((prev) => ({
        ...prev,
        [joiningTournament.id]: (prev[joiningTournament.id] || 0) + 1,
      }));
    }
    // TODO: call API to persist registration
    closeJoinModal();
    alert('Team registration submitted (frontend only)');
  };

  // derive unique game list from loaded tournaments
  const games = useMemo(() => {
      const set = new Set<string>();
      tournaments.forEach((t) => set.add(t.game));
      return ['All', ...Array.from(set)];
  }, [tournaments]);

  const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return tournaments.filter((t) => {
          if (selectedGame !== 'All' && t.game !== selectedGame) return false;
          if (!q) return true;
          return (
              t.title.toLowerCase().includes(q) ||
              t.location.toLowerCase().includes(q) ||
              t.date.toLowerCase().includes(q) ||
              t.game.toLowerCase().includes(q)
          );
      });
  }, [query, selectedGame, tournaments]);

  return (
      <main className="min-h-screen bg-[#f5f5f5] text-[#111827]">
          <div className="max-w-6xl mx-auto px-6 py-12">
              <HeroNav />

              <header className="mt-10 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                      <h2 className="text-3xl font-extrabold">Tournaments</h2>
                      <p className="text-sm text-[#6b7280] mt-1">
                          Browse and join upcoming events
                      </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                      <label
                          htmlFor="t-search"
                          className="sr-only"
                      >
                          Search tournaments
                      </label>
                      <div className="relative w-full sm:w-80">
                          <input
                              id="t-search"
                              type="search"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Search by title, location, date or game"
                              className="w-full pr-10 pl-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-sm"
                          />
                          {query ? (
                              <button
                                  onClick={() => setQuery('')}
                                  aria-label="Clear search"
                                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 text-sm text-[#6b7280]"
                              >
                                  Clear
                              </button>
                          ) : null}
                      </div>

                      {/* Game filter dropdown */}
                      <div className="ml-2">
                          <label
                              htmlFor="game-filter"
                              className="sr-only"
                          >
                              Filter by game
                          </label>
                          <select
                              id="game-filter"
                              value={selectedGame}
                              onChange={(e) => setSelectedGame(e.target.value)}
                              className="px-3 py-2 border rounded-md bg-white text-sm border-[#e5e7eb]"
                          >
                              {games.map((g) => (
                                  <option key={g} value={g}>
                                      {g}
                                  </option>
                              ))}
                          </select>
                      </div>
                  </div>
              </header>

              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.length ? (
                      filtered.map((t) => (
                          <article
                              key={t.id}
                              className="bg-white rounded-2xl shadow-sm border border-[#e6e6e9] overflow-hidden flex flex-col h-full text-[#0f1724]"
                          >
                              {/* Image */}
                              <div className="w-full h-40 md:h-48 bg-gray-50 overflow-hidden flex-shrink-0 relative">
                                  <img
                                      src={t.img ?? undefined}
                                      alt=""
                                      className="w-full h-full object-cover object-center"
                                  />
                                  {/* subtle light overlay for readability */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/40 pointer-events-none" />
                              </div>

                              {/* Content area */}
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                  <div>
                                      <h3 className="text-lg md:text-xl font-semibold mb-1 leading-tight text-[#0f1724]">{t.title}</h3>
                                      <div className="flex items-center gap-3 text-sm text-[#6b7280] mb-3">
                                          <span>{t.date}</span>
                                          <span className="hidden sm:inline">·</span>
                                          <span className="hidden sm:inline">{t.location}</span>
                                      </div>

                                      <div className="flex items-center gap-2 mb-3">
                                          <span className="inline-block text-xs px-2 py-1 bg-[#f3f4f6] rounded-full text-[#374151]">Game: {t.game}</span>
                                      </div>
                                  </div>

                                  <div className="flex items-center justify-between mt-2 gap-4">
                                      <div className="text-sm text-[#374151]">
                                          <span className="block md:inline">Team slots: </span>
                                          <span className="font-medium text-[#0f1724]">{t.slots}</span>
                                          {/* Remaining teams shown on its own line for clarity */}
                                          <div className="mt-1 text-xs text-[#9ca3af]">{Math.max(0, t.slots - (registrations[t.id] || 0))} remaining</div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                          <Link
                                              href="#"
                                              className="hidden sm:inline-flex items-center justify-center text-sm px-3 py-1.5 rounded-full border border-[#e6e6e9] text-[#0f1724] bg-white"
                                          >
                                              Details
                                          </Link>
                                          {(registrations[t.id] || 0) >= t.slots ? (
                                              <button
                                                  disabled
                                                  className="text-sm bg-[#f3f4f6] text-[#9ca3af] px-3 py-1.5 rounded-full opacity-50 cursor-not-allowed"
                                              >
                                                  Full
                                              </button>
                                          ) : (
                                              <button
                                                  onClick={() => openJoinModal(t)}
                                                  className="text-sm bg-[#111827] hover:bg-[#0b0b0b] text-white px-3 py-1.5 rounded-full whitespace-nowrap"
                                              >
                                                  Join
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </article>
                      ))
                  ) : (
                      <div className="col-span-full text-center py-12 text-[#6b7280]">
                          No tournaments found for "{query}"
                      </div>
                  )}
              </section>

              <footer className="mt-12 text-center text-sm text-[#6b7280]">
                  Showing {filtered.length} tournaments
              </footer>
          </div>

          {/* Join modal (frontend only) */}
          {joinModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="fixed inset-0 bg-black/40" onClick={closeJoinModal} />

                  <div className="relative z-10 w-full max-w-lg p-6 bg-white rounded-2xl shadow-lg">
                      <header className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                              Register for {joiningTournament?.title}
                          </h3>
                          <button
                              onClick={closeJoinModal}
                              aria-label="Close"
                              className="text-sm text-[#6b7280]"
                          >
                              Close
                          </button>
                      </header>

                      <form
                          onSubmit={handleSubmit}
                          className="grid grid-cols-1 gap-3"
                      >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                  <label className="text-xs text-[#374151]">
                                      Team name
                                  </label>
                                  <input
                                      value={form.teamName}
                                      onChange={(e) =>
                                          handleFormChange('teamName', e.target.value)
                                      }
                                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                      required
                                  />
                              </div>
                              <div>
                                  <label className="text-xs text-[#374151]">
                                      University / College
                                  </label>
                                  <input
                                      value={form.university}
                                      onChange={(e) =>
                                          handleFormChange('university', e.target.value)
                                      }
                                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                      required
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                  <label className="text-xs text-[#374151]">
                                      Phone
                                  </label>
                                  <input
                                      value={form.phone}
                                      onChange={(e) =>
                                          handleFormChange('phone', e.target.value)
                                      }
                                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                  />
                              </div>
                              <div>
                                  <label className="text-xs text-[#374151]">
                                      Team leader registration no
                                  </label>
                                  <input
                                      value={form.leader.registrationNo}
                                      onChange={(e) =>
                                          handleFormChange('leader.registrationNo', e.target.value)
                                      }
                                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                      required
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                  <label className="text-xs text-[#374151]">
                                      Leader name
                                  </label>
                                  <input
                                      value={form.leader.name}
                                      onChange={(e) =>
                                          handleFormChange('leader.name', e.target.value)
                                      }
                                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                      required
                                  />
                              </div>
                              <div>
                                  <label className="text-xs text-[#374151]">
                                      Leader email
                                  </label>
                                  <input
                                      value={form.leader.email}
                                      onChange={(e) =>
                                          handleFormChange('leader.email', e.target.value)
                                      }
                                      type="email"
                                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                      required
                                  />
                              </div>
                              <div>
                                  <label className="text-xs text-[#374151]">
                                      Leader game ID
                                  </label>
                                  <input
                                      value={form.leader.gameId}
                                      onChange={(e) =>
                                          handleFormChange('leader.gameId', e.target.value)
                                      }
                                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                      required
                                  />
                              </div>
                          </div>

                          {/* Members list */}
                          <div>
                              <label className="text-sm font-medium">Team members</label>
                              {/* Make members area scrollable with a max height so modal remains compact */}
                              <div className="mt-2 space-y-2 max-h-56 overflow-auto pr-2">
                              {form.members.map((m, idx) => (
                                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                                      <div>
                                          <label className="text-xs text-[#374151]">
                                              Name
                                          </label>
                                          <input
                                              value={m.name}
                                              onChange={(e) =>
                                                  handleFormChange(`members.${idx}.name`, e.target.value)
                                              }
                                              className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                                              required
                                          />
                                      </div>
                                      <div>
                                          <label className="text-xs text-[#374151]">
                                              Registration No
                                          </label>
                                          <input
                                              value={m.registrationNo}
                                              onChange={(e) =>
                                                  handleFormChange(`members.${idx}.registrationNo`, e.target.value)
                                              }
                                              className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                                              required
                                          />
                                      </div>
                                      <div>
                                          <label className="text-xs text-[#374151]">
                                              Game ID
                                          </label>
                                          <input
                                              value={m.gameId}
                                              onChange={(e) =>
                                                  handleFormChange(`members.${idx}.gameId`, e.target.value)
                                              }
                                              className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                                              required
                                          />
                                      </div>
                                      <div className="sm:col-span-3 flex justify-end gap-2 mt-1">
                                          <button
                                              type="button"
                                              onClick={() => removeMember(idx)}
                                              className="px-2 py-1 text-sm border rounded-md"
                                          >
                                              Remove
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              </div>
                              <div className="mt-3">
                                  <button
                                      type="button"
                                      onClick={addMember}
                                      disabled={form.members.length >= MAX_MEMBERS}
                                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                      Add member
                                  </button>
                                  {form.members.length >= MAX_MEMBERS && (
                                      <div className="mt-2 text-xs text-[#dc2626]">You can only add {MAX_MEMBERS} team members for this game.</div>
                                  )}
                              </div>
                          </div>

                          <div className="flex items-center justify-end gap-3 mt-2">
                              <button
                                  type="button"
                                  onClick={closeJoinModal}
                                  className="px-4 py-2 border rounded-md"
                              >
                                  Cancel
                              </button>
                              <button
                                  type="submit"
                                  className="px-4 py-2 bg-[#111827] text-white rounded-md"
                              >
                                  Submit registration
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
      </main>
  );
}
