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

  // helper to get a safe email from Clerk user resource
  const getUserEmail = () => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      undefined
    );
  };

  // track tournaments this user has already registered for (client-side cache)
  // null = not yet fetched, [] = fetched and none
  const [userRegisteredTournamentIds, setUserRegisteredTournamentIds] = useState<string[] | null>(null);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/tournaments')
      .then((r) => r.json())
      .then((data) => setTournaments(data || []))
      .catch(() => setTournaments([]))
      .finally(() => setLoading(false))
  }, []);

  const [query, setQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('All');

  // Maximum number of additional members (excluding leader)
  const MAX_MEMBERS = 4;

  // Track number of teams already registered per tournament (frontend-only state)
  const [registrations, setRegistrations] = useState<Record<string, number>>({});

  // initialize registrations when tournaments load and poll server for realtime counts
  useEffect(() => {
    // start with zeros for immediate UI response
    const initial: Record<string, number> = {};
    tournaments.forEach((t) => (initial[t.id] = 0));
    setRegistrations(initial);

    let mounted = true;

    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/tournaments/counts');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        // Update only tournaments we know about (keep other keys unchanged)
        setRegistrations((prev) => {
          const next = { ...prev };
          tournaments.forEach((t) => {
            next[t.id] = Number(data?.[t.id] ?? 0);
          });
          return next;
        });
      } catch (err) {
        // non-fatal; keep previous counts
        console.error('Failed to fetch tournament counts', err);
      }
    };

    // fetch once immediately and then poll every 5s for near-realtime updates
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [tournaments]);

  // fetch user's registered tournaments when signed in
  useEffect(() => {
    // if user explicitly signed out, mark as no registrations for UI
    if (isSignedIn === false) {
      setUserRegisteredTournamentIds([]);
      return;
    }

    // only fetch when we know user is signed in
    if (isSignedIn !== true) return;

    const email = getUserEmail();
    // if email not yet available, keep null (show checking) and wait for user state to update
    if (!email) {
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const q = new URLSearchParams({ email: email.toString().trim().toLowerCase() }).toString();
        const res = await fetch(`/api/tournaments/registered?${q}`);
        if (!res.ok) {
          if (mounted) setUserRegisteredTournamentIds([]);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setUserRegisteredTournamentIds(Array.isArray(data.tournamentIds) ? data.tournamentIds : data.tournamentIds || []);
      } catch (e) {
        console.error('Failed to fetch user registered tournaments', e);
        if (mounted) setUserRegisteredTournamentIds([]);
      }
    })();

    return () => { mounted = false };
  }, [user, isSignedIn]);

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
        email: getUserEmail() ?? prev.leader.email,
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
    const payload = {
      teamName: form.teamName,
      university: form.university,
      phone: form.phone,
      leader: form.leader,
      members: form.members,
    };

    // Persist registration to server
    if (!joiningTournament?.id) {
      alert('No tournament selected');
      return;
    }

    setSubmitting(true)
    fetch(`/api/tournaments/${joiningTournament.id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.created?.id) {
          // update registrations count from server
          setRegistrations((prev) => ({ ...prev, [joiningTournament.id]: data.count }));
          // mark user as registered for this tournament locally
          setUserRegisteredTournamentIds((prev) => {
            const base = prev ?? [];
            return Array.from(new Set([...base, joiningTournament.id]));
          });
          closeJoinModal();
          alert('Registration submitted')
        } else {
          console.error('Registration API error', data)
          alert(data?.error || 'Failed to submit registration')
        }
      })
      .catch((err) => {
        console.error('Registration request failed', err)
        alert('Failed to submit registration')
      })
      .finally(() => setSubmitting(false))
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
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
              <HeroNav />

              {/* Enhanced Header Section */}
              <header className="mt-8 sm:mt-12 mb-8 sm:mb-12">
                  <div className="text-center mb-8">
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent mb-3">
                          Live Tournaments
                      </h2>
                      <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto px-4">
                          Join exciting esports competitions and showcase your skills
                      </p>
                  </div>

                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-center">
                      <div className="relative flex-1 max-w-md">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                               id="t-search"
                               type="search"
                               value={query}
                               onChange={(e) => setQuery(e.target.value)}
                               placeholder="Search tournaments..."
                               className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                           />
                          {query && (
                              <button
                                  onClick={() => setQuery('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                              </button>
                          )}
                      </div>

                      <div className="relative">
                          <select
                               id="game-filter"
                               value={selectedGame}
                               onChange={(e) => setSelectedGame(e.target.value)}
                               className="w-full sm:w-auto appearance-none pl-4 pr-10 py-3 border rounded-xl bg-white/5 backdrop-blur-md text-white border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer transition-all"
                           >
                              {games.map((g) => (
                                  <option key={g} value={g} className="bg-gray-900">
                                       {g}
                                   </option>
                              ))}
                          </select>
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                      </div>
                  </div>
              </header>

              {/* Tournament Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {loading ? (
                  // Enhanced skeleton cards
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-sm">
                      <div className="h-48 bg-gradient-to-br from-gray-700/50 to-gray-800/50 animate-pulse" />
                      <div className="p-5">
                        <div className="h-5 bg-gray-700/50 rounded-lg w-3/4 mb-3 animate-pulse" />
                        <div className="h-4 bg-gray-700/50 rounded-lg w-1/2 mb-4 animate-pulse" />
                        <div className="flex justify-between items-center mt-4">
                          <div className="h-9 w-24 bg-gray-700/50 rounded-lg animate-pulse" />
                          <div className="h-9 w-20 bg-gray-700/50 rounded-lg animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((t) => (
                      <article 
                          key={t.id} 
                          className="group rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-sm hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-400/10 transition-all duration-300 flex flex-col"
                      >
                          {/* Tournament Image */}
                          <div className="relative h-48 sm:h-52 overflow-hidden">
                              {t.img ? (
                                  <>
                                      <img 
                                          src={t.img} 
                                          alt={t.title} 
                                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" 
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                  </>
                              ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                      <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                  </div>
                              )}
                              
                              {/* Game Badge */}
                              <div className="absolute top-3 left-3">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-cyan-300 border border-cyan-400/20">
                                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                      </svg>
                                      {t.game}
                                  </span>
                              </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-5 flex-1 flex flex-col">
                              <h3 className="text-lg sm:text-xl font-bold mb-2 leading-tight text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                                  {t.title}
                              </h3>
                              
                              {/* Date and Location */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-300 mb-4">
                                  <span className="flex items-center gap-1.5">
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {t.date}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      {t.location}
                                  </span>
                              </div>

                              {/* Slots Info */}
                              <div className="mt-auto pt-4 border-t border-white/10">
                                  <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                          <span className="text-xs text-gray-400">Available Slots</span>
                                      </div>
                                      <span className="text-sm font-bold text-white">
                                          {Math.max(0, t.slots - (registrations[t.id] || 0))} / {t.slots}
                                      </span>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                                      <div 
                                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                                          style={{ width: `${Math.min(100, ((registrations[t.id] || 0) / t.slots) * 100)}%` }}
                                   />
                                   </div>

                                  {/* Action Button */}
                                  <div className="flex">
                                      {(registrations[t.id] || 0) >= t.slots ? (
                                          <button
                                              disabled
                                              className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-gray-700/50 text-gray-400 px-4 py-2.5 rounded-xl cursor-not-allowed"
                                          >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                              </svg>
                                              Tournament Full
                                          </button>
                                      ) : (isSignedIn === true && userRegisteredTournamentIds === null) || loading ? (
                                           // while we are determining whether the user is registered, avoid showing the Join button to prevent a flash
                                           <button
                                               disabled
                                               className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-white/5 text-gray-300 px-4 py-2.5 rounded-xl cursor-not-allowed"
                                           >
                                               <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                               </svg>
                                               <span>Checking…</span>
                                           </button>
                                       ) : userRegisteredTournamentIds?.includes(t.id) ? (
                                            <button
                                              disabled
                                              className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-green-500/20 text-green-400 px-4 py-2.5 rounded-xl cursor-not-allowed border border-green-400/30"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              </svg>
                                              Already Registered
                                            </button>
                                       ) : (
                                            <button
                                                onClick={() => openJoinModal(t)}
                                                className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 group"
                                            >
                                                <span>Join Tournament</span>
                                                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </button>
                                       )}
                                    </div>
                                 </div>
                             </div>
                         </article>
                      ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 sm:py-20">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-400 text-base sm:text-lg mb-2">No tournaments found</p>
                      {query && (
                          <p className="text-gray-500 text-sm">
                              Try adjusting your search or filters
                          </p>
                      )}
                  </div>
                )}
              </section>

              {/* Footer Stats */}
              {filtered.length > 0 && (
                  <footer className="mt-12 text-center">
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                          <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-300">
                               Showing <span className="font-semibold text-white">{filtered.length}</span> tournament{filtered.length !== 1 ? 's' : ''}
                           </span>
                       </div>
                   </footer>
               )}
          </div>

          {/* Enhanced Registration Modal */}
          {joinModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeJoinModal} />

                  <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border border-white/20">
                      {/* Modal Header */}
                      <div className="sticky top-0 z-10 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-md border-b border-white/10 px-6 py-4">
                          <div className="flex items-start justify-between gap-4">
                              <div>
                                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                                      Team Registration
                                  </h3>
                                  <p className="text-sm text-gray-400">
                                      {joiningTournament?.title}
                                  </p>
                              </div>
                              <button
                                  onClick={closeJoinModal}
                                  className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                                  aria-label="Close"
                              >
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                              </button>
                          </div>
                      </div>

                      {/* Modal Content */}
                      <form onSubmit={handleSubmit} className="p-6 space-y-6">
                          {/* Team Info Section */}
                          <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                      </svg>
                                  </div>
                                  <h4 className="text-lg font-semibold text-white">Team Information</h4>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Team Name *
                                      </label>
                                      <input
                                          value={form.teamName}
                                          onChange={(e) => handleFormChange('teamName', e.target.value)}
                                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                          placeholder="Enter team name"
                                          required
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                          University / College *
                                      </label>
                                      <input
                                          value={form.university}
                                          onChange={(e) => handleFormChange('university', e.target.value)}
                                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                          placeholder="Enter university"
                                          required
                                      />
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Contact Phone
                                  </label>
                                  <input
                                      value={form.phone}
                                      onChange={(e) => handleFormChange('phone', e.target.value)}
                                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                      placeholder="Enter phone number"
                                  />
                              </div>
                          </div>

                          {/* Team Leader Section */}
                          <div className="space-y-4 pt-6 border-t border-white/10">
                              <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-400/20 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                      </svg>
                                  </div>
                                  <h4 className="text-lg font-semibold text-white">Team Leader</h4>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Full Name *
                                      </label>
                                      <input
                                          value={form.leader.name}
                                          onChange={(e) => handleFormChange('leader.name', e.target.value)}
                                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                          placeholder="Leader name"
                                          required
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Email *
                                      </label>
                                      <input
                                          value={form.leader.email}
                                          onChange={(e) => handleFormChange('leader.email', e.target.value)}
                                          type="email"
                                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                          placeholder="leader@email.com"
                                          required
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Registration Number *
                                      </label>
                                      <input
                                          value={form.leader.registrationNo}
                                          onChange={(e) => handleFormChange('leader.registrationNo', e.target.value)}
                                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                          placeholder="Registration no."
                                          required
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Game ID *
                                      </label>
                                      <input
                                          value={form.leader.gameId}
                                          onChange={(e) => handleFormChange('leader.gameId', e.target.value)}
                                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                          placeholder="Game ID"
                                          required
                                      />
                                  </div>
                              </div>
                          </div>

                          {/* Team Members Section */}
                          <div className="space-y-4 pt-6 border-t border-white/10">
                              <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-green-400/20 flex items-center justify-center">
                                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                          </svg>
                                      </div>
                                      <h4 className="text-lg font-semibold text-white">Team Members</h4>
                                  </div>
                                  <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                                      {form.members.length} / {MAX_MEMBERS}
                                  </span>
                              </div>

                              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                  {form.members.map((m, idx) => (
                                      <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                                          <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm font-medium text-gray-300">Member {idx + 1}</span>
                                              <button
                                                  type="button"
                                                  onClick={() => removeMember(idx)}
                                                  className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group"
                                              >
                                                  <svg className="w-4 h-4 text-gray-400 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                  </svg>
                                              </button>
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              <div className="sm:col-span-2">
                                                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                                      Full Name *
                                                  </label>
                                                  <input
                                                      value={m.name}
                                                      onChange={(e) => handleFormChange(`members.${idx}.name`, e.target.value)}
                                                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                                      placeholder="Member name"
                                                      required
                                                  />
                                              </div>
                                              <div>
                                                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                                      Registration No *
                                                  </label>
                                                  <input
                                                      value={m.registrationNo}
                                                      onChange={(e) => handleFormChange(`members.${idx}.registrationNo`, e.target.value)}
                                                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                                      placeholder="Reg. number"
                                                      required
                                                  />
                                              </div>
                                              <div>
                                                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                                      Game ID *
                                                  </label>
                                                  <input
                                                      value={m.gameId}
                                                      onChange={(e) => handleFormChange(`members.${idx}.gameId`, e.target.value)}
                                                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                                      placeholder="Game ID"
                                                      required
                                                  />
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>

                              <button
                                  type="button"
                                  onClick={addMember}
                                  disabled={form.members.length >= MAX_MEMBERS}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/5 group"
                              >
                                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                      Add Team Member
                                  </span>
                              </button>

                              {form.members.length >= MAX_MEMBERS && (
                                  <div className="flex items-start gap-2 p-3 bg-cyan-400/10 border border-cyan-400/30 rounded-lg">
                                      <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                                      </svg>
                                      <p className="text-xs text-cyan-400">
                                          Maximum team size reached. You can add up to {MAX_MEMBERS} members for this tournament.
                                      </p>
                                  </div>
                              )}
                          </div>

                          {/* Form Actions */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-6 border-t border-white/10">
                              <button
                                  type="button"
                                  onClick={closeJoinModal}
                                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all"
                              >
                                  Cancel
                              </button>
                              <button
                                  type="submit"
                                  disabled={submitting}
                                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-black font-semibold rounded-xl shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  {submitting ? (
                                      <>
                                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                          </svg>
                                          <span>Submitting...</span>
                                      </>
                                  ) : (
                                      <>
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span>Submit Registration</span>
                                      </>
                                  )}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          )}

          {/* Custom Scrollbar Styles */}
          <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
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
  );
}