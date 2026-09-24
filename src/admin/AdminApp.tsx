import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { isFirebaseConfigured } from '../lib/firebaseConfig'
import { AuthProvider } from './auth/AuthProvider'
import { useAuthState } from './auth/context'
import { LoginPage } from './auth/LoginPage'
import { NoAccess } from './auth/NoAccess'
import { SetupScreen } from './auth/SetupScreen'
import { FeedbackProvider } from './components/FeedbackProvider'
import { EditLangProvider } from './components/LocalizedField'
import { Spinner } from './components/PageHeader'
import { AdminLayout } from './layout/AdminLayout'
import { BookingsPage } from './pages/BookingsPage'
import { DashboardPage } from './pages/DashboardPage'
import { GalleryPage } from './pages/GalleryPage'
import { NewsPage } from './pages/NewsPage'
import { PostEditorPage } from './pages/PostEditorPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { RoomEditorPage } from './pages/RoomEditorPage'
import { RoomsPage } from './pages/RoomsPage'
import { ServicesPage } from './pages/ServicesPage'
import { SettingsPage } from './pages/SettingsPage'
import './admin.css'

export default function AdminApp() {
  // Keep the admin panel out of search results.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    document.documentElement.lang = 'ru'
    return () => meta.remove()
  }, [])

  return (
    <div className="admin">
      {isFirebaseConfigured ? (
        <AuthProvider>
          <FeedbackProvider>
            <EditLangProvider>
              <AdminGate />
            </EditLangProvider>
          </FeedbackProvider>
        </AuthProvider>
      ) : (
        <SetupScreen />
      )}
    </div>
  )
}

function AdminGate() {
  const auth = useAuthState()
  if (auth.status === 'loading') {
    return (
      <div className="a-auth">
        <Spinner />
      </div>
    )
  }
  if (auth.status === 'signed-out') return <LoginPage />
  if (!auth.isAdmin) return <NoAccess user={auth.user} />

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="rooms/:roomId" element={<RoomEditorPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:postId" element={<PostEditorPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
