import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { usePosts } from '../../content/usePosts'
import { PostCard } from './PostCard'
import { SectionHeading } from './SectionHeading'

const HOME_COUNT = 3

export function News() {
  const { t } = useTranslation()
  const posts = usePosts()
  if (!posts || posts.length === 0) return null

  return (
    <section id="news" className="section news" aria-labelledby="news-title">
      <div className="container">
        <div className="section-row">
          <SectionHeading id="news-title" eyebrow={t('news.eyebrow')} title={t('news.title')} />
          {posts.length > HOME_COUNT && (
            <Link to="/news" className="link-arrow reveal">
              {t('actions.allNews')}
              <ArrowRight />
            </Link>
          )}
        </div>
        <div className="posts-grid">
          {posts.slice(0, HOME_COUNT).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
