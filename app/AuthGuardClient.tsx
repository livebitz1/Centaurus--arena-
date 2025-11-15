"use client";

import React, { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGuardClient({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const pathname = usePathname();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only react once Clerk has loaded auth state to avoid flashing the modal
    if (!isLoaded) {
      setShowModal(false);
      return;
    }

    // Show modal when user navigates to any non-root route while unauthenticated.
    if (typeof pathname === 'string' && pathname !== '/' && !isSignedIn) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [pathname, isSignedIn, isLoaded]);

  const handleSignIn = () => {
    openSignIn && openSignIn();
    setShowModal(false);
  };

  const handleClose = () => {
    // Prevent staying on protected page after dismissing: send user home
    router.push('/');
    setShowModal(false);
  };

  return (
    <>
      {/* render app normally; the modal overlays and blocks interaction when shown */}
      {children}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div className="relative z-10 max-w-sm w-full bg-black/80 border border-white/10 rounded-xl shadow-xl p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 11V7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                  <circle cx="12" cy="12" r="9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">Sign in to continue</h3>
                <p className="text-sm text-gray-300 mt-1">Please sign in to access this page and continue your journey with CENTAURUS ARENA.</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition"
              >
                Close
              </button>

              <button
                onClick={handleSignIn}
                className="px-3 py-2 rounded-md bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-semibold hover:from-purple-600 hover:to-purple-700 transition"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
