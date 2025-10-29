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
        <div className="w-8 h-8 bg-[#111827] rounded-full flex items-center justify-center text-white text-sm">C</div>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-[#111827]">
          <Link href="/" className="opacity-90">Home</Link>
          <Link href="/dashboard" className="opacity-90">Dashboard</Link>
          <Link href="/tournament" className="opacity-90">Tournaments</Link>
          <Link href="#" className="opacity-90">Teams</Link>
          <Link href="#" className="opacity-90">Schedule</Link>
          <Link href="#" className="opacity-90">Leaderboard</Link>
        </nav>

        {/* Auth area: render Clerk UI only after mount to avoid hydration mismatch */}
        <div className="ml-auto flex items-center gap-2">
          {isMounted ? (
            <>
              <SignedOut>
                <button onClick={handleOpenSignIn} className="bg-[#111827] text-white px-4 py-2 rounded-full text-sm hidden sm:inline-block">Sign In</button>
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
                  className="p-2 rounded-md bg-transparent hover:bg-[rgba(17,24,39,0.06)]"
                >
                  <span className="sr-only">Sign in</span>
                  <span className="bg-[#111827] text-white px-3 py-1 rounded-full text-sm">Sign In</span>
                </button>
              </SignedOut>

              <SignedIn>
                {/* When authenticated on mobile: show the menu toggle (in addition to the UserButton already rendered) */}
                <button
                  type="button"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((s) => !s)}
                  className="p-2 rounded-md bg-transparent hover:bg-[rgba(17,24,39,0.06)]"
                >
                  {menuOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M6 6L18 18M6 18L18 6" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M4 7h16M4 12h16M4 17h16" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
        className={`absolute top-full mt-3 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-lg shadow-lg z-20 transition-all duration-200 ease-out ${
          menuOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex flex-col p-4 gap-2 text-center">
          <Link href="/" role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Home</Link>
          <Link href="/dashboard" role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Dashboard</Link>
          <Link href="/tournament" role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Tournaments</Link>
          <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Teams</a>
          <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Schedule</a>
          <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Leaderboard</a>
          <div className="pt-2">
            {isMounted ? (
              <>
                <SignedOut>
                  <button tabIndex={menuOpen ? 0 : -1} onClick={handleOpenSignIn} className="bg-[#111827] text-white px-4 py-2 rounded-full w-full">Sign In</button>
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
