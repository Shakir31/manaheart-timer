import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { setViewport } from './viewport'

// jsdom has no matchMedia: answer width queries from a test-controlled viewport.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => {
    const min = /min-width:\s*(\d+)px/.exec(query)
    const width = (window as unknown as { __testWidth: number }).__testWidth
    return {
      matches: min ? width >= Number(min[1]) : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }
  },
})

setViewport('mobile')

afterEach(() => {
  cleanup()
  localStorage.clear()
  setViewport('mobile')
})
