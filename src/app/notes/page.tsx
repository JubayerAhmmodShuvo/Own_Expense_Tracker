'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Pin, 
  PinOff, 
  FileText,
  X,
  Tag,
  Save,
  Palette,
  Calendar,
  LogOut,
  Shield,
  Settings,
  DollarSign
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import ThemeToggle from '@/components/ThemeToggle'
import CurrencySelector from '@/components/CurrencySelector'
import { format } from 'date-fns'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  isPinned: boolean
  color: string
  userId: string
  createdAt: string
  updatedAt: string
}

const NOTE_COLORS = [
  '#FFFFFF', '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24',
  '#FED7AA', '#FDBA74', '#FB923C', '#F97316',
  '#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8',
  '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA',
  '#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6',
]

export default function NotesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()
  
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [userCurrency, setUserCurrency] = useState('BDT')

  const handleSignOut = () => {
    signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedTag) params.append('tag', selectedTag)
      if (showPinnedOnly) params.append('pinned', 'true')

      const response = await fetch(`/api/notes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      } else {
        addToast({
          type: 'error',
          title: 'Failed to Load Notes',
          message: 'Please refresh the page and try again.',
        })
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to load notes. Please check your connection.',
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedTag, showPinnedOnly, addToast])

  useEffect(() => {
    if (session) {
      fetchNotes()
    }
  }, [session, fetchNotes])

  const handleCreateNote = async (noteData: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Note Created',
          message: 'Your note has been created successfully.',
        })
        setIsCreating(false)
        fetchNotes()
      } else {
        const errorData = await response.json()
        addToast({
          type: 'error',
          title: 'Failed to Create Note',
          message: errorData.error || 'Please try again.',
        })
      }
    } catch (error) {
      console.error('Error creating note:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create note. Please try again.',
      })
    }
  }

  const handleUpdateNote = async (id: string, noteData: Partial<Note>) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Note Updated',
          message: 'Your note has been updated successfully.',
        })
        setEditingNote(null)
        fetchNotes()
      } else {
        const errorData = await response.json()
        addToast({
          type: 'error',
          title: 'Failed to Update Note',
          message: errorData.error || 'Please try again.',
        })
      }
    } catch (error) {
      console.error('Error updating note:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to update note. Please try again.',
      })
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return
    }

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Note Deleted',
          message: 'Your note has been deleted successfully.',
        })
        fetchNotes()
      } else {
        addToast({
          type: 'error',
          title: 'Failed to Delete Note',
          message: 'Please try again.',
        })
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to delete note. Please try again.',
      })
    }
  }

  const handleTogglePin = async (note: Note) => {
    await handleUpdateNote(note.id, { isPinned: !note.isPinned })
  }

  const handleColorChange = async (noteId: string, color: string) => {
    await handleUpdateNote(noteId, { color })
    setShowColorPicker(null)
  }

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])))

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-sofia-condensed">Expense Tracker</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-spline-mono">Welcome back, {session.user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                <DollarSign className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <ThemeToggle />
              <CurrencySelector
                currentCurrency={userCurrency}
                onCurrencyChange={setUserCurrency}
              />
              <Link
                href="/notes"
                className="flex items-center space-x-2 text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 transition-colors"
              >
                <FileText className="h-5 w-5" />
                <span>Notes</span>
              </Link>
              <Link
                href="/privacy"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                <Shield className="h-5 w-5" />
                <span>Privacy</span>
              </Link>
              {(session.user as { role?: string })?.role === 'admin' || (session.user as { role?: string })?.role === 'super_admin' ? (
                <Link
                  href="/admin/login"
                  className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              ) : null}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-sofia-condensed">
                Notes
              </h1>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>New Note</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                showPinnedOnly
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              {showPinnedOnly ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Create Note Form */}
        {isCreating && (
          <NoteForm
            onSubmit={handleCreateNote}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {/* Edit Note Form */}
        {editingNote && !isCreating && (
          <NoteForm
            note={editingNote}
            onSubmit={(data) => handleUpdateNote(editingNote.id, data)}
            onCancel={() => setEditingNote(null)}
          />
        )}

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No notes found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || selectedTag || showPinnedOnly
                ? 'Try adjusting your filters'
                : 'Create your first note to get started'}
            </p>
            {!searchQuery && !selectedTag && !showPinnedOnly && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Note
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => setEditingNote(note)}
                onDelete={() => handleDeleteNote(note.id)}
                onTogglePin={() => handleTogglePin(note)}
                onColorChange={(color) => handleColorChange(note.id, color)}
                showColorPicker={showColorPicker === note.id}
                onShowColorPicker={() => setShowColorPicker(showColorPicker === note.id ? null : note.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface NoteFormProps {
  note?: Note
  onSubmit: (data: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

function NoteForm({ note, onSubmit, onCancel }: NoteFormProps) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [tags, setTags] = useState<string[]>(note?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [color, setColor] = useState(note?.color || '#FFFFFF')
  const [isPinned, setIsPinned] = useState(note?.isPinned || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      return
    }
    onSubmit({ title: title.trim(), content: content.trim(), tags, color, isPinned })
    if (!note) {
      setTitle('')
      setContent('')
      setTags([])
      setColor('#FFFFFF')
      setIsPinned(false)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {note ? 'Edit Note' : 'New Note'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter note title..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={10000}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Enter note content..."
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {content.length}/10000 characters
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add tag and press Enter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Pin note</span>
            </label>
            <div className="relative">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Color</span>
              </label>
              <div className="mt-2 flex gap-2">
                {NOTE_COLORS.slice(0, 8).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColor(col)}
                    className={`w-8 h-8 rounded border-2 ${
                      color === col ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{note ? 'Update' : 'Create'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

interface NoteCardProps {
  note: Note
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  onColorChange: (color: string) => void
  showColorPicker: boolean
  onShowColorPicker: () => void
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, onColorChange, showColorPicker, onShowColorPicker }: NoteCardProps) {
  return (
    <div
      className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      style={{ backgroundColor: note.color === '#FFFFFF' ? undefined : note.color }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          return
        }
        onEdit()
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 pr-2">
          {note.title}
        </h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin()
            }}
            className="p-1 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors cursor-pointer"
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            {note.isPinned ? (
              <Pin className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            ) : (
              <PinOff className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onShowColorPicker()
            }}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            title="Change color"
          >
            <Palette className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            title="Edit"
          >
            <Edit2 className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showColorPicker && (
        <div className="absolute top-16 right-4 bg-white dark:bg-gray-700 p-3 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-4 gap-2">
            {NOTE_COLORS.map((col) => (
              <button
                key={col}
                onClick={(e) => {
                  e.stopPropagation()
                  onColorChange(col)
                }}
                className={`w-8 h-8 rounded border-2 ${
                  note.color === col ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: col }}
                title={col}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap line-clamp-6">
        {note.content}
      </p>

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(note.updatedAt), 'MMM dd, yyyy')}</span>
        </div>
        {note.isPinned && (
          <Pin className="h-3 w-3" />
        )}
      </div>
    </div>
  )
}

