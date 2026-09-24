import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Splash } from './components/Splash'
import { ContentProvider } from './content/ContentProvider'
import { SiteLayout } from './site/layout/SiteLayout'
import { HomePage } from './site/pages/HomePage'
import { NewsPage } from './site/pages/NewsPage'
import { NotFoundPage } from './site/pages/NotFoundPage'
import { PostPage } from './site/pages/PostPage'
import { RoomPage } from './site/pages/RoomPage'

// The admin panel (and the Firebase SDKs it needs) is downloaded only when someone opens /admin.
const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<Splash />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route
          element={
            <ContentProvider>
              <SiteLayout />
            </ContentProvider>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="rooms/:roomId" element={<RoomPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:postId" element={<PostPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
