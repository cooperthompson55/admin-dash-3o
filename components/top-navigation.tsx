"use client"

import { Home, Menu, X } from "lucide-react"
import Link from "next/link"

export function TopNavigation({ onBurgerClick }: { onBurgerClick?: () => void }) {
  return (
    <header className="bg-white shadow sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <Link href="/" className="text-xl font-semibold">
              RePhotos Admin
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="text-sm text-gray-600">Logged in as Admin</div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={onBurgerClick}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
