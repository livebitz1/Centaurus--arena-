'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton, useClerk, useUser } from '@clerk/nextjs';

export default function HeroNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  // Ensure Clerk UI that depends on client auth state only renders after hydration
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Clerk hook to open the Sign In modal (client-only)
  const { openSignIn } = useClerk();
  const handleOpenSignIn = () => {
    // openSignIn is provided by Clerk's client SDK
    openSignIn && openSignIn();
  };

  // Get basic user info client-side
  const { user, isSignedIn } = useUser();

  // When the user becomes signed in, call our server endpoint to upsert their data
  useEffect(() => {
    if (!isMounted) return;
    if (isSignedIn && user) {
      // send user id to server where we securely fetch full info with Clerk Server SDK
      fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id }),
      }).catch((err) => console.error('Failed to upsert user', err));
    }
  }, [isMounted, isSignedIn, user]);

  // Close menu when clicking outside and on Escape; focus first item when opened
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      const clickedInsideMenu = menuRef.current?.contains(target);
      const clickedInsideNav = navRef.current?.contains(target);

      if (menuOpen && !clickedInsideMenu && !clickedInsideNav) {
        setMenuOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen && menuRef.current) {
      const first = menuRef.current.querySelector('a,button') as HTMLElement | null;
      first?.focus();
    }
  }, [menuOpen]);

  return (
    <div className="flex justify-center mb-8 relative">
      <div className="nav-pill flex items-center gap-6" ref={navRef}>
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-sm shadow-lg">C</div>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-white">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/tournament">Tournaments</Link>
          <Link href="#">Teams</Link>
          <Link href="#">Schedule</Link>
          <Link href="#">Leaderboard</Link>
        </nav>

        {/* Auth area: render Clerk UI only after mount to avoid hydration mismatch */}
        <div className="ml-auto flex items-center gap-2">
          {isMounted ? (
            <>
              <SignedOut>
                <button onClick={handleOpenSignIn} className="bg-white text-black px-4 py-2 rounded-full text-sm hidden sm:inline-block shadow-lg hover:bg-gray-100 transition-all">Sign In</button>
              </SignedOut>

              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          ) : (
            // Stable placeholder during SSR so server and initial client HTML match
            <div className="hidden sm:inline-block" style={{ width: 112 /* approx width of the Sign In button */ }} />
          )}
        </div>

        {/* Mobile menu button or mobile Sign In (when signed out) */}
        <div className="sm:hidden ml-auto">
          {isMounted ? (
            <>
              <SignedOut>
                {/* When not authenticated on mobile: show Sign In instead of the menu button */}
                <button
                  type="button"
                  onClick={handleOpenSignIn}
                  className="p-2 rounded-md bg-transparent hover:bg-white/10"
                >
                  <span className="sr-only">Sign in</span>
                  <span className="bg-white text-black px-3 py-1 rounded-full text-sm shadow-lg">Sign In</span>
                </button>
              </SignedOut>

              <SignedIn>
                {/* When authenticated on mobile: show the menu toggle (in addition to the UserButton already rendered) */}
                <button
                  type="button"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((s) => !s)}
                  className="p-2 rounded-md bg-transparent hover:bg-white/10"
                >
                  {menuOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M6 6L18 18M6 18L18 6" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M4 7h16M4 12h16M4 17h16" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </SignedIn>
            </>
          ) : (
            <div style={{ width: 40 }} />
          )}
        </div>
      </div>

      {/* Mobile dropdown menu (centered under the pill) - always in DOM to allow smooth transition */}
      <div
        ref={menuRef}
        role="menu"
        aria-hidden={!menuOpen}
        className={`absolute top-full mt-3 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-black/90 backdrop-blur-md rounded-lg shadow-2xl border border-white/20 z-20 transition-all duration-200 ease-out ${
          menuOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex flex-col p-4 gap-2 text-center">
          <Link href="/" role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-white">Home</Link>
          <Link href="/dashboard" role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-white">Dashboard</Link>
          <Link href="/tournament" role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-white">Tournaments</Link>
          <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-white">Teams</a>
          <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-white">Schedule</a>
          <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-white">Leaderboard</a>
          <div className="pt-2">
            {isMounted ? (
              <>
                <SignedOut>
                  <button tabIndex={menuOpen ? 0 : -1} onClick={handleOpenSignIn} className="bg-white text-black px-4 py-2 rounded-full w-full shadow-lg hover:bg-gray-100 transition-all">Sign In</button>
                </SignedOut>

                <SignedIn>
                  <UserButton />
                </SignedIn>
              </>
            ) : (
              <div style={{ height: 40 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
