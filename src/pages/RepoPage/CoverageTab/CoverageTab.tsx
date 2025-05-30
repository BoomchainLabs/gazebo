import { Suspense } from 'react'
import { Switch, useParams } from 'react-router-dom'

import { SentryRoute } from 'sentry'

import { useRepoSettingsTeam } from 'services/repo'
import { useIsTeamPlan } from 'services/useIsTeamPlan'
import LoadingLogo from 'ui/LoadingLogo'

import ComponentsTab from './ComponentsTab'
import { CoverageTabNavigator } from './CoverageTabNavigator'
import FlagsTab from './FlagsTab'
import OverviewTab from './OverviewTab'

const path = '/:provider/:owner/:repo'

const Loader = () => (
  <div className="flex flex-1 items-center justify-center pt-16">
    <LoadingLogo />
  </div>
)

interface URLParams {
  provider: string
  owner: string
}

function CoverageTab() {
  const { provider, owner } = useParams<URLParams>()
  const { data: isTeamPlan } = useIsTeamPlan({
    owner,
    provider,
  })
  const { data: repoSettings } = useRepoSettingsTeam()

  const hideNavigator = isTeamPlan && repoSettings?.repository?.private

  return (
    <div className="flex flex-col gap-2 divide-y">
      {hideNavigator ? null : <CoverageTabNavigator />}
      <Suspense fallback={<Loader />}>
        <Switch>
          <SentryRoute
            path={[
              '/:provider/:owner/:repo/flags',
              '/:provider/:owner/:repo/flags/:branch',
            ]}
            exact
          >
            <FlagsTab />
          </SentryRoute>
          <SentryRoute
            path={[
              '/:provider/:owner/:repo/components',
              '/:provider/:owner/:repo/components/:branch',
            ]}
            exact
          >
            <ComponentsTab />
          </SentryRoute>
          <SentryRoute
            path={[
              path,
              `${path}/blob/:ref/:path+`,
              `${path}/tree/:branch`,
              `${path}/tree/:branch/:path+`,
            ]}
            exact
          >
            <OverviewTab />
          </SentryRoute>
        </Switch>
      </Suspense>
    </div>
  )
}

export default CoverageTab
