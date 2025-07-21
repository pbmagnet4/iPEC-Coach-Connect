import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Global test setup for iPEC Coach Connect

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
beforeAll(() => {
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
        onAuthStateChange: vi.fn(),
        getUser: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
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