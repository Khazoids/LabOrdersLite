import "@testing-library/jest-dom"

// Polyfill browser APIs not available in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
  root = null
  rootMargin = ""
  thresholds = []
  takeRecords() { return [] }
} as unknown as typeof IntersectionObserver

// Mock next/cache for all tests (server actions import it)
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock next/navigation for component tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND") }),
  redirect: vi.fn(),
}))

// Mock next/link to a plain anchor element (no JSX in .ts setup file)
vi.mock("next/link", () => ({
  default: function Link({ children, href, className }: {
    children: unknown
    href: string
    className?: string
  }) {
    const React = require("react")
    return React.createElement("a", { href, className }, children)
  },
}))
