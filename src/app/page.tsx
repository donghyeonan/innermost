import Link from "next/link";
import { Shield, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header */}
      <header className="w-full px-6 md:px-12 lg:px-20 py-6 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl md:text-2xl font-bold tracking-tight">
          Innermost
        </Link>
        <nav className="flex items-center gap-6 md:gap-8">
          <Link
            href="/dashboard"
            className="text-xs tracking-widest font-medium hover:text-gray-600 transition-colors"
          >
            JOURNAL
          </Link>
          <Link
            href="/public"
            className="text-xs tracking-widest font-medium hover:text-gray-600 transition-colors"
          >
            PUBLIC
          </Link>
          <Link
            href="/login"
            className="text-xs tracking-widest font-medium hover:text-gray-600 transition-colors"
          >
            LOGIN
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 py-20 md:py-32 lg:py-40">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-center leading-tight tracking-tight max-w-4xl">
          Your Private Thoughts,
          <br />
          <span className="italic">Clarified.</span>
        </h1>

        <p className="mt-6 md:mt-8 text-base md:text-lg text-gray-600 text-center max-w-xl leading-relaxed">
          Daily record your inner thoughts in private → Curate and post to public later.
        </p>

        <Link
          href="/register"
          className="mt-10 md:mt-12 px-8 py-3 bg-black text-white text-sm tracking-widest font-medium hover:bg-gray-800 transition-colors rounded-sm"
        >
          GET STARTED
        </Link>
      </main>

      {/* Features Section */}
      <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24 lg:py-32">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          {/* The Sanctuary */}
          <div className="flex flex-col">
            <Shield className="w-8 h-8 mb-6 stroke-[1.5]" />
            <h2 className="font-serif text-2xl md:text-3xl font-medium mb-4">
              The Sanctuary
            </h2>
            <p className="text-gray-600 leading-relaxed">
              A distraction-free, end-to-end encrypted space for your rawest ideas.
              No likes, no comments, no audience. Just you and the cursor.
            </p>
          </div>

          {/* The Stage */}
          <div className="flex flex-col">
            <Globe className="w-8 h-8 mb-6 stroke-[1.5]" />
            <h2 className="font-serif text-2xl md:text-3xl font-medium mb-4">
              The Stage
            </h2>
            <p className="text-gray-600 leading-relaxed">
              When an idea is ready for the world, transition it with one click.
              Refine, edit, and publish to your minimalist public profile.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 lg:px-20 py-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium">INNERMOST EDITORIAL TOOL</span>
            <span>•</span>
            <span>©2026 All rights reserved</span>
          </div>
          <nav className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-black transition-colors">
              PRIVACY
            </Link>
            <Link href="/terms" className="hover:text-black transition-colors">
              TERMS
            </Link>
            <Link href="https://twitter.com" className="hover:text-black transition-colors">
              TWITTER
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
