export const metadata = {
  title: "Centaurus Arena - Home",
  description: "Centaurus Arena - Gaming tournament hub",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6efdf] text-[#111827] hero-grid">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Centered nav pill */}
        <div className="flex justify-center mb-8">
          <div className="nav-pill flex items-center gap-6">
            <div className="w-8 h-8 bg-[#111827] rounded-full flex items-center justify-center text-white text-sm">C</div>
            <nav className="hidden sm:flex items-center gap-6 text-sm text-[#111827]">
              <a className="opacity-90">Home</a>
              <a className="opacity-90">Tournaments</a>
              <a className="opacity-90">Teams</a>
              <a className="opacity-90">Schedule</a>
              <a className="opacity-90">Leaderboard</a>
            </nav>
            <button className="ml-auto bg-[#111827] text-white px-4 py-2 rounded-full text-sm">Create Tournament</button>
          </div>
        </div>

        {/* Hero center content (gaming tournament focused) */}
        <header className="text-center py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#ffd24d] border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-[#f7dbe6] border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-[#dfe7ff] border-2 border-white" />
            </div>
            <span className="text-sm text-[#52525b]">Over 1k active players</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4">Centaurus Arena — where champions clash</h1>

          <p className="max-w-2xl mx-auto text-[#52525b] mb-8 text-base">Organize, join and stream competitive gaming tournaments. Fast setup, built-in brackets, live spectating and global leaderboards designed for players and organizers.</p>

          <div className="flex items-center justify-center gap-4">
            <button className="bg-[#111827] text-white px-6 py-3 rounded-full font-semibold">Explore Tournaments</button>
            <button className="bg-white border border-[#d6d3d1] px-5 py-3 rounded-full">Organize Now</button>
          </div>
        </header>
      </div>
    </main>
  );
}
