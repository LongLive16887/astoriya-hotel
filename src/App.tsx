import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
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

const router = createBrowserRouter([
  {
    path: '/admin/*',
    element: (
      <Suspense fallback={<Splash />}>
        <AdminApp />
      </Suspense>
    ),
  },
  {
    element: (
      <ContentProvider>
        <SiteLayout />
      </ContentProvider>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'rooms/:roomId', element: <RoomPage /> },
      { path: 'news', element: <NewsPage /> },
      { path: 'news/:postId', element: <PostPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
