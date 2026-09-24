import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RevealObserver } from '../../components/RevealObserver'
import { Splash } from '../../components/Splash'
import { useContentStatus } from '../../content/context'
import { BookingProvider } from '../booking/BookingProvider'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileActionBar } from './MobileActionBar'
import { ScrollManager } from './ScrollManager'

export function SiteLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const status = useContentStatus()

  if (status === 'loading') return <Splash />

  return (
    <BookingProvider>
      <a href="#main" className="skip-link">
        {t('a11y.skip')}
      </a>
      <Header overlay={pathname === '/'} />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <MobileActionBar />
      <ScrollManager />
      <RevealObserver />
    </BookingProvider>
  )
}
