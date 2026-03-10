import { Routes, Route, Link } from "react-router";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import Library from "./pages/Library";
import {
  BookOpen,
  Home as HomeIcon,
  Library as LibraryIcon,
} from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-lg"
          >
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>Sentence Scaffold</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-600">
            <Link
              to="/"
              className="hover:text-zinc-900 flex items-center gap-2"
            >
              <HomeIcon className="w-4 h-4" /> Home
            </Link>
            <Link
              to="/library"
              className="hover:text-zinc-900 flex items-center gap-2"
            >
              <LibraryIcon className="w-4 h-4" /> Library
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis/:id" element={<Analysis />} />
          <Route path="/library" element={<Library />} />
        </Routes>
      </main>
    </div>
  );
}
