import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Img } from '../../components/Img'
import { paragraphs, tr } from '../../content/localized'
import type { Post } from '../../content/types'
import { usePosts } from '../../content/usePosts'
import { useLang } from '../../i18n/useLang'
import { isFirebaseConfigured } from '../../lib/firebase'
import { formatDate } from '../../lib/format'
import { fetchPost } from '../../lib/publicDb'
import { PostCard } from '../sections/PostCard'
import { useDocumentMeta } from '../useDocumentMeta'
import { NotFoundView } from './NotFoundView'
import './pages.css'

/** Looks the post up in the loaded list first; older posts are fetched one by one. */
function usePost(id: string): Post | null | undefined {
  const posts = usePosts()
  const fromList = posts?.find((p) => p.id === id)
  const [fetched, setFetched] = useState<{ id: string; post: Post | null } | null>(null)
  const listLoaded = posts !== null

  useEffect(() => {
    if (fromList || !listLoaded || !isFirebaseConfigured) return
    let active = true
    fetchPost(id)
      .catch(() => null)
      .then((post) => {
        if (active) setFetched({ id, post })
      })
    return () => {
      active = false
    }
  }, [id, fromList, listLoaded])

  if (fromList) return fromList
  if (!listLoaded) return undefined
  if (!isFirebaseConfigured) return null
  return fetched?.id === id ? fetched.post : undefined
}

export function PostPage() {
  const { postId = '' } = useParams()
  const { t } = useTranslation()
  const lang = useLang()
  const post = usePost(postId)
  const posts = usePosts()

  useDocumentMeta(
    post ? tr(post.title, lang) : post === null ? t('news.notFound') : undefined,
    post ? tr(post.excerpt, lang) : undefined,
  )

  if (post === undefined) {
    return (
      <div className="page post-page" aria-busy="true">
        <div className="container post-page__inner">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--cover" />
        </div>
      </div>
    )
  }

  if (post === null) {
    return <NotFoundView title={t('news.notFound')} text={t('news.notFoundText')} />
  }

  const others = (posts ?? []).filter((p) => p.id !== post.id).slice(0, 3)

  return (
    <article className="page post-page">
      <div className="container post-page__inner">
        <Link to="/news" className="post-page__back">
          <ArrowLeft size={16} />
          {t('news.pageTitle')}
        </Link>
        <header className="post-page__header">
          {post.date && (
            <time className="post-card__date" dateTime={post.date}>
              {formatDate(post.date, lang)}
            </time>
          )}
          <h1 className="h-section">{tr(post.title, lang)}</h1>
          {tr(post.excerpt, lang) && <p className="lead">{tr(post.excerpt, lang)}</p>}
        </header>
        {post.image && (
          <div className="post-page__cover">
            <Img src={post.image} alt="" loading="eager" />
          </div>
        )}
        <div className="prose post-page__body">
          {paragraphs(tr(post.body, lang)).map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
      </div>

      {others.length > 0 && (
        <section className="section section--sand post-page__others" aria-labelledby="other-posts">
          <div className="container">
            <h2 id="other-posts" className="h-section post-page__others-title">
              {t('news.other')}
            </h2>
            <div className="posts-grid">
              {others.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
