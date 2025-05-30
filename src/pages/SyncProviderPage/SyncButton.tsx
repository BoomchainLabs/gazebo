import qs from 'qs'

import { eventTracker } from 'services/events/events'
import { useLocationParams } from 'services/navigation/useLocationParams'
import { useNavLinks } from 'services/navigation/useNavLinks'
import { Provider } from 'shared/api/helpers'
import { loginProviderImage } from 'shared/utils/loginProviders'
import { providerToName } from 'shared/utils/provider'

interface SyncButtonProps {
  provider: Provider
}

const SyncButton: React.FC<SyncButtonProps> = ({ provider }) => {
  const { signIn } = useNavLinks()
  const { params } = useLocationParams()

  const providerName = providerToName(provider)
  // @ts-expect-error useLocationParams needs to be typed
  const queryString = qs.stringify({ to: params?.to }, { addQueryPrefix: true })
  const to = `${window.location.protocol}//${window.location.host}/${provider}${queryString}`

  return (
    <div className="flex h-14 items-center rounded-sm border border-ds-gray-quaternary bg-ds-gray-primary text-left shadow">
      <a
        className="flex h-full grow items-center font-semibold hover:bg-ds-gray-secondary"
        href={signIn.path({ to, provider })}
        data-cy={'login-button'}
        onClick={() => {
          eventTracker().track({
            type: 'Button Clicked',
            properties: {
              buttonName: 'Sync',
              buttonLocation: 'Sync Provider Page',
              loginProvider: providerName,
            },
          })
        }}
      >
        <img
          alt={`Logo of ${providerName}`}
          className="mx-4 block size-6"
          src={loginProviderImage(provider)}
        />
        Sync with {providerName}
      </a>
    </div>
  )
}

export default SyncButton
