import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import qs from 'qs'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'

import config from 'config'

import { ThemeContextProvider } from 'shared/ThemeContext'

import GuestHeader from './GuestHeader'

vi.mock('config')

// silence console errors
console.error = () => {}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeContextProvider>
      <MemoryRouter initialEntries={['/gh']}>
        <Route path={'/:provider'} exact>
          {children}
        </Route>
      </MemoryRouter>
    </ThemeContextProvider>
  </QueryClientProvider>
)

afterEach(() => {
  queryClient.clear()
})

describe('GuestHeader', () => {
  describe('links on the page', () => {
    describe('codecov icon link', () => {
      it('directs user to about page', async () => {
        render(<GuestHeader />, {
          wrapper,
        })

        const link = await screen.findByTestId('homepage-link')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', 'https://about.codecov.io')
      })
    })

    describe('why test code link', () => {
      it('directs user to what is code coverage page', async () => {
        render(<GuestHeader />, {
          wrapper,
        })

        const link = await screen.findByTestId('why-test-link')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute(
          'href',
          'https://about.codecov.io/resource/what-is-code-coverage'
        )
      })
    })

    describe('Get a demo link', () => {
      it('directs user to demo page', async () => {
        render(<GuestHeader />, {
          wrapper,
        })

        const link = await screen.findByTestId('demo-link')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', 'https://about.codecov.io/demo')
      })
    })

    describe('pricing link', () => {
      it('directs user to pricing page', async () => {
        render(<GuestHeader />, {
          wrapper,
        })

        const link = await screen.findByTestId('pricing-link')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', 'https://about.codecov.io/pricing')
      })
    })

    describe('login link', () => {
      it('directs user to login page with redirect to path', async () => {
        render(<GuestHeader />, {
          wrapper,
        })

        const queryString = qs.stringify({ to: '/gh' })
        const link = await screen.findByTestId('login-link')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', `/login?${queryString}`)
      })
    })

    describe('start trial link', () => {
      it('directs user to start trial page', async () => {
        render(<GuestHeader />, {
          wrapper,
        })

        const link = await screen.findByTestId('start-trial-link')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute(
          'href',
          'https://about.codecov.io/codecov-free-trial'
        )
      })
    })

    it('has toggle for light/dark mode', async () => {
      render(<GuestHeader />, { wrapper })

      const toggle = await screen.findByTestId('theme-toggle')
      expect(toggle).toBeInTheDocument()
    })
  })

  describe('self hosted build', () => {
    beforeEach(() => {
      config.IS_SELF_HOSTED = true
    })

    it('does not render pricing link', () => {
      render(<GuestHeader />, { wrapper })

      const pricing = screen.queryByText('Pricing')
      expect(pricing).not.toBeInTheDocument()
    })

    it('does not render start free trial link', () => {
      render(<GuestHeader />, { wrapper })

      const startFreeTrial = screen.queryByText('Start Free Trial')
      expect(startFreeTrial).not.toBeInTheDocument()
    })

    it('renders a login button with redirect to path', () => {
      render(<GuestHeader />, { wrapper })

      const queryString = qs.stringify({ to: '/gh' })
      const login = screen.queryByText('Log in')
      expect(login).toBeInTheDocument()
      expect(login).toHaveAttribute('href', `/?${queryString}`)
    })
  })
})
