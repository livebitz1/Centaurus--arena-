'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

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
    <main className="min-h-screen bg-[#f5f5f5] text-[#111827] hero-grid">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Centered nav pill */}
        <div className="flex justify-center mb-8 relative">
          <div className="nav-pill flex items-center gap-6" ref={navRef}>
            <div className="w-8 h-8 bg-[#111827] rounded-full flex items-center justify-center text-white text-sm">C</div>

            <nav className="hidden sm:flex items-center gap-6 text-sm text-[#111827]">
              <a className="opacity-90">Home</a>
              <a className="opacity-90">Tournaments</a>
              <a className="opacity-90">Teams</a>
              <a className="opacity-90">Schedule</a>
              <a className="opacity-90">Leaderboard</a>
            </nav>

            <button className="ml-auto bg-[#111827] text-white px-4 py-2 rounded-full text-sm hidden sm:inline-block">Create Tournament</button>

            {/* Mobile menu button */}
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((s) => !s)}
              className="sm:hidden ml-auto p-2 rounded-md bg-transparent hover:bg-[rgba(17,24,39,0.06)]"
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
              <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Home</a>
              <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Tournaments</a>
              <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Teams</a>
              <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Schedule</a>
              <a role="menuitem" tabIndex={menuOpen ? 0 : -1} className="py-2 text-sm text-[#111827]">Leaderboard</a>
              <div className="pt-2">
                <button tabIndex={menuOpen ? 0 : -1} className="bg-[#111827] text-white px-4 py-2 rounded-full w-full">Create Tournament</button>
              </div>
            </div>
          </div>
        </div>

        {/* Small stats placed between navbar and hero */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#ffd24d] border-2 border-white" />
            <div className="w-8 h-8 rounded-full bg-[#f7dbe6] border-2 border-white" />
            <div className="w-8 h-8 rounded-full bg-[#dfe7ff] border-2 border-white" />
          </div>
          <span className="text-sm text-[#52525b]">Over 10+ games</span>
        </div>

        {/* Centered hero content with decorative side images */}
        <header className="relative text-center py-12">
          {/* Left decorative cluster (visible on md+) */}
          <div className="hidden md:flex pointer-events-none absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 gap-4 items-center">
            <div className="w-16 h-16 rounded-xl shadow-sm flex items-center justify-center overflow-hidden rotate-[-6deg] translate-y-[-8px] border-2 border-black">
              <img src="https://i.pinimg.com/736x/64/dd/db/64dddbf80576b4b57777fcbd42b5fc3d.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-20 h-20 rounded-xl shadow-sm flex items-center justify-center rotate-[8deg] translate-y+[8px] border-2 border-black overflow-hidden">
              <img src="https://i.pinimg.com/1200x/f0/44/83/f04483bbad609167bf64d0fd5dd7c0d8.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-12 h-12 rounded-lg shadow-sm flex items-center justify-center rotate-[-4deg] translate-y+[2px] border-2 border-black overflow-hidden">
              <img src="https://i.pinimg.com/736x/39/dc/66/39dc66a4fbaa85dcd12a49f216b60ead.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
          </div>

          {/* Right decorative cluster (visible on md+) */}
          <div className="hidden md:flex pointer-events-none absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 gap-4 items-center">
            <div className="w-12 h-12 rounded-lg shadow-sm flex items-center justify-center rotate-[6deg] translate-y-[-6px] border-2 border-black overflow-hidden">
              <img src="https://i.pinimg.com/1200x/20/10/15/201015dbde9311d1170d6bc9eb945d2a.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-20 h-20 rounded-2xl shadow-sm flex items-center justify-center rotate-[-8deg] translate-y+[6px] border-2 border-black overflow-hidden">
              <img src="https://i.pinimg.com/736x/93/f2/67/93f267d62e0b9fad885b6bc0f9768981.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-16 h-16 rounded-xl shadow-sm flex items-center justify-center rotate-[4deg] translate-y+[2px] border-2 border-black overflow-hidden">
              <img src="https://i.pinimg.com/1200x/f4/0e/e0/f40ee0c794eb02b5cd83d00f0c98879b.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
          </div>

          {/* Mobile-friendly inline mini cluster (below title on small screens) */}
          <div className="flex md:hidden items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center border-2 border-black overflow-hidden">
              <img src="https://i.pinimg.com/736x/64/dd/db/64dddbf80576b4b57777fcbd42b5fc3d.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center border-2 border-black overflow-hidden">
              <img src="https://i.pinimg.com/1200x/f0/44/83/f04483bbad609167bf64d0fd5dd7c0d8.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center border-2 border-black overflow-hidden">
              <img src="https://i.pinimg.com/1200x/20/10/15/201015dbde9311d1170d6bc9eb945d2a.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-extrabold tracking-tight mb-6">CENTAURUS ARENA</h1>

          <p className="max-w-2xl mx-auto text-[#52525b] mb-10 text-base sm:text-lg md:text-xl">Register your university team. Compete live. Stream matches. Climb the leaderboards.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="bg-[#111827] text-white px-6 py-3 rounded-md font-semibold text-base w-full sm:w-auto">Explore Tournaments</button>
            <button className="bg-white border border-[#d6d3d1] px-5 py-3 rounded-md text-base w-full sm:w-auto">Organize Now</button>
          </div>
        </header>
      </div>
    </main>
  );
}
