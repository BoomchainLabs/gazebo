import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  QueryClientProvider as QueryClientProviderV5,
  QueryClient as QueryClientV5,
} from '@tanstack/react-queryV5'
import { renderHook, waitFor } from '@testing-library/react'
import { graphql, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route } from 'react-router-dom'

import { Trend } from 'shared/utils/timeseriesCharts'

import { useRepoCoverageTimeseries } from './useRepoCoverageTimeseries'

const mockRepoOverview = {
  owner: {
    isCurrentUserActivated: true,
    repository: {
      __typename: 'Repository',
      private: false,
      defaultBranch: 'main',
      oldestCommitAt: '2022-10-10T11:59:59',
      coverageEnabled: true,
      bundleAnalysisEnabled: true,
      languages: [],
      testAnalyticsEnabled: false,
    },
  },
}

const mockBranchMeasurements = {
  owner: {
    repository: {
      __typename: 'Repository',
      coverageAnalytics: {
        measurements: [
          { timestamp: '2023-01-01T00:00:00+00:00', max: 85 },
          { timestamp: '2023-01-02T00:00:00+00:00', max: 80 },
          { timestamp: '2023-01-03T00:00:00+00:00', max: 90 },
          { timestamp: '2023-01-04T00:00:00+00:00', max: 100 },
        ],
      },
    },
  },
}

const mockNullBranchMeasurements = {
  owner: {
    repository: {
      __typename: 'Repository',
      coverageAnalytics: {
        measurements: [
          { timestamp: '2023-01-01T00:00:00+00:00', max: null },
          { timestamp: '2023-01-02T00:00:00+00:00', max: null },
        ],
      },
    },
  },
}

const server = setupServer()
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})
const queryClientV5 = new QueryClientV5({
  defaultOptions: { queries: { retry: false } },
})

const wrapper =
  (searchParams = ''): React.FC<React.PropsWithChildren> =>
  ({ children }) => (
    <QueryClientProviderV5 client={queryClientV5}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/gh/caleb/mighty-nein${searchParams}`]}>
          <Route path="/:provider/:owner/:repo">{children}</Route>
        </MemoryRouter>
      </QueryClientProvider>
    </QueryClientProviderV5>
  )

beforeAll(() => {
  server.listen()
})

afterEach(() => {
  queryClient.clear()
  queryClientV5.clear()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

interface SetupArgs {
  noCoverageData?: boolean
}

describe('useRepoCoverageTimeseries', () => {
  const config = vi.fn()

  function setup(
    { noCoverageData = false }: SetupArgs = {
      noCoverageData: false,
    }
  ) {
    server.use(
      graphql.query('GetRepoOverview', () => {
        return HttpResponse.json({ data: mockRepoOverview })
      }),
      graphql.query('GetBranchCoverageMeasurements', (info) => {
        config(info.variables)

        if (noCoverageData) {
          return HttpResponse.json({ data: mockNullBranchMeasurements })
        }

        return HttpResponse.json({ data: mockBranchMeasurements })
      })
    )
  }

  describe('with a trend in the url', () => {
    beforeEach(() => {
      setup()
    })

    it('called the legacy repo coverage with the correct body', async () => {
      renderHook(() => useRepoCoverageTimeseries({ branch: 'c3' }), {
        wrapper: wrapper(`?trend=${Trend.ALL_TIME}`),
      })

      await waitFor(() => expect(config).toHaveBeenCalled())
      await waitFor(() =>
        expect(config).toHaveBeenCalledWith(
          expect.objectContaining({ interval: 'INTERVAL_30_DAY' })
        )
      )
    })
  })

  describe('with no trend in the url', () => {
    beforeEach(() => {
      setup()
    })

    it('called the legacy repo coverage with the correct body when no trend is set', async () => {
      renderHook(() => useRepoCoverageTimeseries({ branch: 'c3' }), {
        wrapper: wrapper(''),
      })

      await waitFor(() => expect(config).toHaveBeenCalled())
      await waitFor(() =>
        expect(config).toHaveBeenCalledWith(
          expect.objectContaining({
            interval: 'INTERVAL_7_DAY',
          })
        )
      )
    })
  })

  describe('with null coverage data', () => {
    it('returns measurements with 0 for coverage', async () => {
      setup({ noCoverageData: true })
      const { result } = renderHook(
        () => useRepoCoverageTimeseries({ branch: 'c3' }),
        { wrapper: wrapper('') }
      )

      await waitFor(() =>
        expect(result.current.data?.measurements).toEqual([
          { coverage: 0, date: new Date('2023-01-01T00:00:00.000Z') },
          { coverage: 0, date: new Date('2023-01-02T00:00:00.000Z') },
        ])
      )
    })
  })

  describe('there is coverage data', () => {
    it('returns the coverage data', async () => {
      setup()
      const { result } = renderHook(
        () => useRepoCoverageTimeseries({ branch: 'c3' }),
        { wrapper: wrapper('') }
      )

      await waitFor(() =>
        expect(result.current.data?.measurements).toEqual([
          { coverage: 85, date: new Date('2023-01-01T00:00:00.000Z') },
          { coverage: 80, date: new Date('2023-01-02T00:00:00.000Z') },
          { coverage: 90, date: new Date('2023-01-03T00:00:00.000Z') },
          { coverage: 100, date: new Date('2023-01-04T00:00:00.000Z') },
        ])
      )
    })

    it('returns the coverage change', async () => {
      setup()
      const { result } = renderHook(
        () => useRepoCoverageTimeseries({ branch: 'c3' }),
        { wrapper: wrapper('') }
      )

      await waitFor(() =>
        expect(result.current.data?.coverageChange).toEqual(15)
      )
    })
  })
})
