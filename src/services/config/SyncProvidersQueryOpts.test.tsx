import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  QueryClientProvider as QueryClientProviderV5,
  QueryClient as QueryClientV5,
  useQuery as useQueryV5,
} from '@tanstack/react-queryV5'
import { renderHook, waitFor } from '@testing-library/react'
import { graphql, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route } from 'react-router-dom'

import {
  EnterpriseSyncProviders,
  SyncProvidersQueryOpts,
} from './SyncProvidersQueryOpts'

const server = setupServer()
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})
const queryClientV5 = new QueryClientV5({
  defaultOptions: { queries: { retry: false } },
})

const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <QueryClientProviderV5 client={queryClientV5}>
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Route path="/">{children}</Route>
      </MemoryRouter>
    </QueryClientProvider>
  </QueryClientProviderV5>
)

beforeAll(() => {
  server.listen()
})

beforeEach(() => {
  queryClient.clear()
  queryClientV5.clear()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

interface SetupArgs {
  syncProviders?: Array<EnterpriseSyncProviders>
  hasParsingError?: boolean
}

describe('useSyncProviders', () => {
  function setup({ syncProviders, hasParsingError }: SetupArgs) {
    server.use(
      graphql.query('GetSyncProviders', () => {
        if (hasParsingError) {
          return HttpResponse.json({ data: { idk: true } })
        }

        return HttpResponse.json({
          data: { config: { syncProviders: syncProviders } },
        })
      })
    )
  }

  describe('third party services are configured providers', () => {
    it('returns data', async () => {
      setup({ syncProviders: ['GITHUB', 'GITLAB', 'BITBUCKET'] })
      const { result } = renderHook(
        () => useQueryV5(SyncProvidersQueryOpts()),
        { wrapper }
      )

      await waitFor(() => result.current.isSuccess)
      await waitFor(() =>
        expect(result.current.data).toStrictEqual(['gh', 'gl', 'bb'])
      )
    })
  })

  describe('self hosted services are configured providers', () => {
    it('returns data', async () => {
      setup({
        syncProviders: [
          'GITHUB_ENTERPRISE',
          'GITLAB_ENTERPRISE',
          'BITBUCKET_SERVER',
        ],
      })
      const { result } = renderHook(
        () => useQueryV5(SyncProvidersQueryOpts()),
        { wrapper }
      )

      await waitFor(() => result.current.isSuccess)
      await waitFor(() =>
        expect(result.current.data).toStrictEqual(['ghe', 'gle', 'bbs'])
      )
    })
  })

  describe('error parsing request', () => {
    beforeAll(() => {
      vi.spyOn(global.console, 'error').mockImplementation(() => {})
    })

    afterAll(() => {
      vi.restoreAllMocks()
    })

    it('throws an error', async () => {
      setup({ hasParsingError: true })
      const { result } = renderHook(
        () => useQueryV5(SyncProvidersQueryOpts()),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isError).toBeTruthy())
      expect(result.current.error).toEqual(
        expect.objectContaining({
          dev: 'SyncProvidersQueryOpts - Parsing Error',
          status: 400,
        })
      )
    })
  })
})
