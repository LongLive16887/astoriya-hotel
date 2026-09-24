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

export function PostCard({ post }: { post: Post }) {
  const { t } = useTranslation()
  const lang = useLang()
  const excerpt = tr(post.excerpt, lang)

  return (
    <article className="post-card reveal">
      <div className="post-card__media">
        {post.image ? (
          <Img src={post.image} alt="" />
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
        <h3 className="post-card__title">
          <Link to={`/news/${post.id}`} className="post-card__link">
            {tr(post.title, lang)}
          </Link>
        </h3>
        {excerpt && <p className="post-card__excerpt">{excerpt}</p>}
        <span className="post-card__more" aria-hidden="true">
          {t('actions.readMore')}
          <ArrowRight size={16} />
        </span>
      </div>
    </article>
  )
}
