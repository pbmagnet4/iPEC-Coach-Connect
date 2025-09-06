import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Global test setup for iPEC Coach Connect

// Mock window.matchMedia before any imports happen
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
beforeAll(() => {

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock Supabase client
  vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
      auth: {
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        updateUser: vi.fn(),
        setSession: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        containedBy: vi.fn().mockReturnThis(),
        rangeGt: vi.fn().mockReturnThis(),
        rangeLt: vi.fn().mockReturnThis(),
        rangeGte: vi.fn().mockReturnThis(),
        rangeLte: vi.fn().mockReturnThis(),
        rangeAdjacent: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        csv: vi.fn().mockResolvedValue({ data: '', error: null }),
        explain: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((callback) => callback({ data: [], error: null })),
      })),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn(),
      })),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(),
          download: vi.fn(),
          remove: vi.fn(),
          list: vi.fn(),
          getPublicUrl: vi.fn(),
          createSignedUrl: vi.fn(),
        })),
      },
      realtime: {
        channel: vi.fn(() => ({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
          unsubscribe: vi.fn(),
        })),
      },
    })),
  }))

  // Mock React Router
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
      ...actual,
      useNavigate: () => vi.fn(),
      useLocation: () => ({ pathname: '/' }),
      useParams: () => ({}),
    }
  })
})