import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'

import FileEntry from './FileEntry'

import { displayTypeParameter } from '../../constants'

const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <MemoryRouter initialEntries={['/gh/codecov/test-repo']}>
    <Route path="/:provider/:owner/:repo/">{children}</Route>
  </MemoryRouter>
)

describe('FileEntry', () => {
  describe('checking properties on list display', () => {
    it('displays the file path', () => {
      render(
        <FileEntry
          linkRef="main"
          path="dir/file.js"
          name="file.js"
          urlPath="dir"
          displayType={displayTypeParameter.list}
        />,
        { wrapper }
      )

      expect(screen.getByText('dir/file.js')).toBeInTheDocument()
    })
  })

  describe('checking properties on tree display', () => {
    it('displays the file name', () => {
      render(
        <FileEntry
          linkRef="main"
          path="dir/file.js"
          name="file.js"
          urlPath="dir"
          displayType={displayTypeParameter.tree}
        />,
        { wrapper }
      )

      expect(screen.getByText('file.js')).toBeInTheDocument()
    })

    it('does not display the file name', () => {
      render(
        <FileEntry
          linkRef="main"
          path="dir/file.js"
          name="file.js"
          urlPath="dir"
          displayType={displayTypeParameter.tree}
        />,
        { wrapper }
      )

      expect(screen.queryByText('dir/file.js')).not.toBeInTheDocument()
    })
  })

  describe('is displaying a list', () => {
    it('displays the file path label', () => {
      render(
        <FileEntry
          linkRef="main"
          path="dir/file.js"
          name="file.js"
          urlPath="dir"
          displayType={displayTypeParameter.list}
        />,
        { wrapper }
      )

      expect(screen.getByText('dir/file.js')).toBeInTheDocument()
    })
  })

  describe('prefetches data', () => {
    it('fires the prefetch function on hover', async () => {
      const runPrefetchMock = vi.fn()
      const user = userEvent.setup()
      render(
        <FileEntry
          linkRef="main"
          path="dir/file.js"
          name="file.js"
          urlPath="dir"
          displayType={displayTypeParameter.tree}
          runPrefetch={runPrefetchMock}
        />,
        { wrapper }
      )

      await user.hover(screen.getByText('file.js'))

      await waitFor(() => expect(runPrefetchMock).toHaveBeenCalled())
    })
  })

  describe('passed pageName commit props', () => {
    it('sets the correct href', () => {
      render(
        <FileEntry
          path="dir/file.js"
          name="file.js"
          urlPath="dir"
          commitSha="coolCommitSha"
          displayType={displayTypeParameter.tree}
          pageName="commitFileDiff"
        />,
        { wrapper }
      )

      const fileEntry = screen.getByRole('link')
      expect(fileEntry).toHaveAttribute(
        'href',
        '/gh/codecov/test-repo/commit/coolCommitSha/blob/dir/file.js'
      )
    })
  })

  describe('passed queryParams prop', () => {
    it('sets the correct href', () => {
      render(
        <FileEntry
          linkRef="main"
          path="dir/file.js"
          name="file.js"
          urlPath="dir"
          displayType={displayTypeParameter.list}
          queryParams={{ flags: ['flag-1'] }}
        />,
        { wrapper }
      )

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute(
        'href',
        '/gh/codecov/test-repo/blob/main/dir%2Ffile.js?flags%5B0%5D=flag-1'
      )
    })
  })
})
