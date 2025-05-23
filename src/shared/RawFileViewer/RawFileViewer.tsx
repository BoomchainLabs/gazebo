// need to import from root lodash for this type
// eslint-disable-next-line no-restricted-imports
import { type Dictionary } from 'lodash'
import qs from 'qs'
import { useLocation, useParams } from 'react-router-dom'

import NotFound from 'pages/NotFound'
import { useCommitBasedCoverageForFileViewer } from 'services/file/useCommitBasedCoverageForFileViewer'
import { useOwner } from 'services/user'
import { unsupportedExtensionsMapper } from 'shared/utils/unsupportedExtensionsMapper'
import { getFilenameFromFilePath } from 'shared/utils/url'
import A from 'ui/A'
import CodeRendererProgressHeader from 'ui/CodeRenderer/CodeRendererProgressHeader'
import ToggleHeader from 'ui/FileViewer/ToggleHeader'
import Title from 'ui/FileViewer/ToggleHeader/Title'
import { VirtualFileRenderer } from 'ui/VirtualRenderers'

function ErrorDisplayMessage() {
  const location = useLocation()
  return (
    <p className="border border-solid border-ds-gray-tertiary p-4">
      There was a problem getting the source code from your provider. Unable to
      show line by line coverage.
      <br />
      <span>
        If you continue to experience this issue, please try{' '}
        <A
          to={{ pageName: 'login', options: { to: location.pathname } }}
          hook={undefined}
          isExternal={undefined}
        >
          logging in
        </A>{' '}
        again to refresh your credentials.
      </span>
    </p>
  )
}

interface FileTitleProps {
  title: string | React.ReactNode
  sticky: boolean
  withKey: boolean
  showFlagsSelect: boolean
  showComponentsSelect: boolean
}

function FileTitle({
  title,
  sticky,
  withKey,
  showFlagsSelect,
  showComponentsSelect,
}: FileTitleProps) {
  if (withKey) {
    return (
      <ToggleHeader
        title={title}
        sticky={sticky}
        showFlagsSelect={showFlagsSelect}
        showComponentsSelect={showComponentsSelect}
      />
    )
  }
  return <Title title={title} sticky={sticky} />
}

interface CodeRendererContentProps {
  isUnsupportedFileType: boolean
  content?: string | null
  path: string
  coverageData?: Dictionary<'H' | 'M' | 'P'>
}

function CodeRendererContent({
  isUnsupportedFileType,
  content,
  path,
  coverageData,
}: CodeRendererContentProps) {
  if (isUnsupportedFileType) {
    return (
      <div className="border border-solid border-ds-gray-tertiary p-2">
        Unable to display contents of binary file included in coverage reports.
      </div>
    )
  }

  if (content) {
    return (
      <VirtualFileRenderer
        code={content}
        coverage={coverageData}
        fileName={getFilenameFromFilePath(path)}
      />
    )
  }

  return <ErrorDisplayMessage />
}

interface URLParams {
  provider: string
  owner: string
  repo: string
  path: string
}

interface RawFileViewerProps {
  title: string | React.ReactNode
  sticky?: boolean
  withKey?: boolean
  commit: string
  showFlagsSelect?: boolean
  showComponentsSelect?: boolean
}

// Note: This component is both used in the standalone file viewer page and in the overview page. Changing this
// component will affect both places
function RawFileViewer({
  title,
  sticky = false,
  withKey = true,
  commit,
  showFlagsSelect = false,
  showComponentsSelect = false,
}: RawFileViewerProps) {
  const { owner, repo, provider, path: urlPath } = useParams<URLParams>()
  const location = useLocation()
  const path = decodeURIComponent(urlPath)
  const { data: ownerData } = useOwner({ username: owner })

  const params = qs.parse(location.search, {
    ignoreQueryPrefix: true,
    depth: 1,
  })
  // with our move to TS router we will be able remove these casts
  const flags = (params?.flags as string[]) ?? []
  const components = (params?.components as string[]) ?? []

  const isUnsupportedFileType = unsupportedExtensionsMapper({ path })

  // TODO: This hook needs revision/enhancement
  const {
    content,
    totals: fileCoverage,
    coverage: coverageData,
  } = useCommitBasedCoverageForFileViewer({
    owner,
    repo,
    provider,
    commit,
    path,
    selectedFlags: flags,
    selectedComponents: components,
    opts: {
      enabled: !isUnsupportedFileType,
    },
  })

  if (!ownerData) {
    return <NotFound />
  }

  return (
    <div className="flex flex-col gap-3 py-3" data-testid="file-viewer-wrapper">
      <FileTitle
        withKey={withKey}
        title={title}
        sticky={sticky}
        showFlagsSelect={showFlagsSelect}
        showComponentsSelect={showComponentsSelect}
      />
      <div id={path} className="target:ring">
        <CodeRendererProgressHeader path={path} fileCoverage={fileCoverage} />
        <CodeRendererContent
          isUnsupportedFileType={isUnsupportedFileType}
          content={content}
          path={path}
          coverageData={coverageData}
        />
      </div>
    </div>
  )
}

export default RawFileViewer
