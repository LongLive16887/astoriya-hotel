import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { Img } from '../../components/Img'
import { LogoMark } from '../../components/Logo'
import { tr } from '../../content/localized'
import type { Post } from '../../content/types'
import { useLang } from '../../i18n/useLang'
import { formatDate } from '../../lib/format'
import './PostCard.css'

/** `headingLevel` 2 on the news page, where the cards come right under the page title. */
export function PostCard({ post, headingLevel = 3 }: { post: Post; headingLevel?: 2 | 3 }) {
  const { t } = useTranslation()
  const lang = useLang()
  const excerpt = tr(post.excerpt, lang)
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <article className="post-card reveal">
      <div className="post-card__media">
        {post.image ? (
          <Img src={post.image} alt="" sizes="(max-width: 720px) 92vw, 400px" />
        ) : (
          <span className="post-card__placeholder">
            <LogoMark />
          </span>
        )}
      </div>
      <div className="post-card__body">
        {post.date && (
          <time className="post-card__date" dateTime={post.date}>
            {formatDate(post.date, lang)}
          </time>
        )}
        <Heading className="post-card__title">
          <Link to={`/news/${post.id}`} className="post-card__link">
            {tr(post.title, lang)}
          </Link>
        </Heading>
        {excerpt && <p className="post-card__excerpt">{excerpt}</p>}
        <span className="post-card__more" aria-hidden="true">
          {t('actions.readMore')}
          <ArrowRight size={16} />
        </span>
      </div>
    </article>
  )
}
