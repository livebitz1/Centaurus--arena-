'use client';

import React, { useEffect, useRef, useState } from 'react';
import DecryptedText from './DecryptedText';
import FadeContent from './FadeContent';
import * as SiIcons from 'react-icons/si';
import { FaGamepad } from 'react-icons/fa';
import HeroNav from './HeroNav';
import Link from 'next/link';

// Animated inline SVG icon (react-icons) — uses IntersectionObserver to trigger a pop-up transition
function AnimatedIcon({ Icon, label, delay = 0 }: { Icon: any; label?: string; delay?: number }) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current as Element | null;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.45 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <span
      ref={ref as any}
      aria-hidden
      className={
        `w-8 h-8 inline-flex items-center justify-center rounded-md shadow-sm transform transition-all duration-500 text-current ` +
        (visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95')
      }
      style={{ transitionDelay: `${delay}ms` }}
      title={label}
    >
      <Icon className="w-6 h-6" />
    </span>
  );
}

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

  // Larger pool of game icon names (will dynamically resolve from react-icons/si with a fallback)
  const allIconNames = [
    'SiLeagueoflegends',
    'SiDota2',
    'SiValorant',
    'SiFortnite',
    'SiOverwatch',
    'SiCallofduty',
    'SiCounterstrike',
    'SiMinecraft',
    'SiRoblox',
    'SiApexlegends',
    'SiHearthstone',
    'SiWorldofwarcraft',
    'SiTwitch',
    'SiSteam'
  ];

  const allIcons = allIconNames.map((name) => ({
    name,
    Icon: (SiIcons as any)[name] ?? FaGamepad,
    label: name.replace(/^Si/, '').replace(/([A-Z])/g, ' $1').trim(),
  }));

  // Rotation state: show 4 icons at a time and rotate the window every 2 seconds
  const [rotationStart, setRotationStart] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRotationStart((s) => (s + 1) % allIcons.length);
    }, 2000);
    return () => clearInterval(id);
  }, [allIcons.length]);

  // Compute 4 visible icons with wrap-around
  // Ensure the 4 visible icons are different visually (handle cases where multiple entries map to the same fallback Icon)
  const getUniqueWindow = (start: number, count: number) => {
    const picked: Array<typeof allIcons[0]> = [];
    const seen = new Set<any>();
    let checked = 0;
    let idx = start;
    // iterate until we collect `count` unique Icon references or we've inspected twice the list
    while (picked.length < count && checked < allIcons.length * 2) {
      const cand = allIcons[idx % allIcons.length];
      const key = cand.Icon; // compare by component reference
      if (!seen.has(key)) {
        seen.add(key);
        picked.push(cand);
      }
      idx++;
      checked++;
    }
    // If we still don't have enough unique icons (rare), fill with next items (may duplicate)
    idx = start;
    while (picked.length < count && checked < allIcons.length * 4) {
      const cand = allIcons[idx % allIcons.length];
      picked.push(cand);
      idx++;
      checked++;
    }
    return picked;
  };

  const visibleIcons = getUniqueWindow(rotationStart, 4);

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#111827] hero-grid">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Centered nav pill (extracted to component) */}
        <HeroNav />

        {/* Replaced colored circles + text with animated game icons (react-icons Simple Icons) */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center justify-center gap-3 text-[#52525b]">
            {visibleIcons.map((g, idx) => (
              <AnimatedIcon key={`${g.name}-${rotationStart}-${idx}`} Icon={g.Icon} label={g.label} delay={80 * (idx + 1)} />
            ))}
          </div>
        </div>

        {/* Centered hero content with decorative side images */}
        <header className="relative text-center pt-20 pb-12">
          {/* Left decorative cluster (visible on md+) */}
          <div className="hidden md:flex pointer-events-none absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 gap-4 items-center">
            <div className="w-16 h-16 rounded-xl shadow-sm flex items-center justify-center overflow-hidden rotate-[-6deg] translate-y-[-8px] border-2 border-black floating float-1">
              <img src="https://i.pinimg.com/736x/64/dd/db/64dddbf80576b4b57777fcbd42b5fc3d.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-20 h-20 rounded-xl shadow-sm flex items-center justify-center rotate-[8deg] translate-y-[8px] border-2 border-black overflow-hidden floating float-2">
              <img src="https://i.pinimg.com/1200x/f0/44/83/f04483bbad609167bf64d0fd5dd7c0d8.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-12 h-12 rounded-lg shadow-sm flex items-center justify-center rotate-[-4deg] translate-y-[2px] border-2 border-black overflow-hidden floating float-3">
              <img src="https://i.pinimg.com/736x/39/dc/66/39dc66a4fbaa85dcd12a49f216b60ead.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
          </div>

          {/* Right decorative cluster (visible on md+) */}
          <div className="hidden md:flex pointer-events-none absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 gap-4 items-center">
            <div className="w-12 h-12 rounded-lg shadow-sm flex items-center justify-center rotate-[6deg] translate-y-[-6px] border-2 border-black overflow-hidden floating float-2">
              <img src="https://i.pinimg.com/1200x/20/10/15/201015dbde9311d1170d6bc9eb945d2a.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-20 h-20 rounded-2xl shadow-sm flex items-center justify-center rotate-[-8deg] translate-y-[6px] border-2 border-black overflow-hidden floating float-3">
              <img src="https://i.pinimg.com/736x/93/f2/67/93f267d62e0b9fad885b6bc0f9768981.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-16 h-16 rounded-xl shadow-sm flex items-center justify-center rotate-[4deg] translate-y-[2px] border-2 border-black overflow-hidden floating float-4">
              <img src="https://i.pinimg.com/1200x/f4/0e/e0/f40ee0c794eb02b5cd83d00f0c98879b.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
          </div>

          {/* Mobile-friendly inline mini cluster (below title on small screens) */}
          <div className="flex md:hidden items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center border-2 border-black overflow-hidden floating float-1">
              <img src="https://i.pinimg.com/736x/64/dd/db/64dddbf80576b4b57777fcbd42b5fc3d.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center border-2 border-black overflow-hidden floating float-2">
              <img src="https://i.pinimg.com/1200x/f0/44/83/f04483bbad609167bf64d0fd5dd7c0d8.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center border-2 border-black overflow-hidden floating float-3">
              <img src="https://i.pinimg.com/1200x/20/10/15/201015dbde9311d1170d6bc9eb945d2a.jpg" alt="" className="w-full h-full object-cover opacity-90" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-extrabold tracking-tight mb-6">CENTAURUS ARENA</h1>

          <p className="max-w-2xl mx-auto text-[#52525b] mb-10 text-base sm:text-lg md:text-xl">
            <DecryptedText
              text="Register your university team. Compete live. Stream matches. Climb the leaderboards."
              animateOn="both"
              revealDirection="center"
              speed={45}
              maxIterations={28}
            />
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <FadeContent delay={80} duration={600} threshold={0.2} className="w-full sm:w-auto">
              <Link href="/tournament" className="bg-[#111827] text-white px-6 py-3 rounded-md font-semibold text-base w-full sm:w-auto inline-flex items-center justify-center">
                Explore Tournaments
              </Link>
            </FadeContent>

            <FadeContent delay={180} duration={700} threshold={0.2} className="w-full sm:w-auto">
              <button className="bg-white border border-[#d6d3d1] px-5 py-3 rounded-md text-base w-full sm:w-auto">Organize Now</button>
            </FadeContent>
          </div>
        </header>
      </div>
    </main>
  );
}
