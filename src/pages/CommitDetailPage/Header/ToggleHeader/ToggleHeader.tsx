import cs from 'classnames'
import { useParams } from 'react-router-dom'

import ComponentsSelector from 'pages/CommitDetailPage/CommitCoverage/routes/ComponentsSelector'
import { useRepoOverview } from 'services/repo'
import { useIsTeamPlan } from 'services/useIsTeamPlan'
import { LINE_STATE } from 'shared/utils/fileviewer'
import {
  TitleCoverage,
  TitleFlags,
  TitleHitCount,
} from 'ui/FileViewer/ToggleHeader/Title/Title'

interface URLParams {
  provider: string
  owner: string
  repo: string
}

function ToggleHeader({ showHitCount = true, noBottomBorder = false }) {
  const { provider, owner, repo } = useParams<URLParams>()

  const { data: overview } = useRepoOverview({ provider, owner, repo })

  const { data: isTeamPlan } = useIsTeamPlan({ provider, owner })
  const showTeamPlan = isTeamPlan && overview?.private

  const containerClasses = cs(
    'flex w-full flex-1 flex-wrap items-start gap-2 bg-ds-container sm:flex-row sm:items-center md:mb-1 lg:w-auto lg:flex-none',
    'border-ds-gray-tertiary',
    {
      'border-b-0 pb-1': noBottomBorder,
      'border-b pb-2': !noBottomBorder,
    }
  )

  return (
    <div className={containerClasses}>
      <div className="flex gap-2 pt-2">
        <TitleHitCount showHitCount={showHitCount} />
        <TitleCoverage coverage={LINE_STATE.UNCOVERED} />
        <TitleCoverage coverage={LINE_STATE.PARTIAL} />
        <TitleCoverage coverage={LINE_STATE.COVERED} />
      </div>
      <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 md:mt-2 md:w-auto">
        {!showTeamPlan && (
          <>
            <TitleFlags commitDetailView={true} />
            <ComponentsSelector />
          </>
        )}
      </div>
    </div>
  )
}

export default ToggleHeader
