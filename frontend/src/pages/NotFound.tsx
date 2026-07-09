import { Link } from 'react-router-dom'
import { Brain, Home, Search, BookOpen } from 'lucide-react'
import { SEO } from '@/components/SEO'

export function NotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <SEO title="Page Not Found" />
      <div className="text-7xl font-bold chinese-text text-primary-600 mb-4">四〇四</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-600 mb-8">
        The page you're looking for doesn't exist or has moved. 没关系 (méi guānxi) — no worries!
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary inline-flex items-center">
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Link>
        <Link to="/flashcards" className="btn-outline inline-flex items-center">
          <Brain className="w-4 h-4 mr-2" />
          Flashcards
        </Link>
        <Link to="/vocabulary" className="btn-outline inline-flex items-center">
          <BookOpen className="w-4 h-4 mr-2" />
          Vocabulary
        </Link>
        <Link to="/dictionary" className="btn-outline inline-flex items-center">
          <Search className="w-4 h-4 mr-2" />
          Dictionary
        </Link>
      </div>
    </div>
  )
}
