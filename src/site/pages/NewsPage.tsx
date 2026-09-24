import { useTranslation } from 'react-i18next'
import { usePosts } from '../../content/usePosts'
import { PostCard } from '../sections/PostCard'
import { useDocumentMeta } from '../useDocumentMeta'
import './pages.css'

export function NewsPage() {
  const { t } = useTranslation()
  const posts = usePosts()
  useDocumentMeta(t('news.pageTitle'), t('news.pageSubtitle'))

  return (
    <section className="page news-page" aria-labelledby="news-page-title">
      <div className="container">
        <header className="page-header">
          <p className="eyebrow">{t('news.eyebrow')}</p>
          <h1 id="news-page-title" className="h-section">
            {t('news.pageTitle')}
          </h1>
          <p className="lead">{t('news.pageSubtitle')}</p>
        </header>
        {posts === null ? (
          <div className="posts-grid" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton skeleton--card" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="news-page__empty">{t('news.empty')}</p>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
