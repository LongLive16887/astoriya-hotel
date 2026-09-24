import { Link } from 'react-router-dom'
import { ExternalLink, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react'
import { tr } from '../../content/localized'
import type { Post } from '../../content/types'
import { formatDate } from '../../lib/format'
import { errorMessage, useConfirm, useToast } from '../components/feedback'
import { EmptyState, PageHeader, Spinner } from '../components/PageHeader'
import { deletePost, useAdminPosts } from '../lib/posts'

export function NewsPage() {
  const { posts, loading, error } = useAdminPosts()
  const toast = useToast()
  const confirm = useConfirm()

  const remove = async (post: Post) => {
    const ok = await confirm({ title: `Удалить «${tr(post.title, 'ru')}»?`, text: 'Новость будет удалена безвозвратно.', confirmLabel: 'Удалить', danger: true })
    if (!ok) return
    try {
      await deletePost(post.id)
      toast.success('Новость удалена')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className="a-page a-page--narrow">
      <PageHeader
        title="Новости и предложения"
        description="Опубликованные новости видны на главной странице (три последних) и в разделе «Новости». Черновики видите только вы."
        actions={
          <Link to="/admin/news/new" className="a-btn a-btn--primary">
            <Plus size={16} /> Написать новость
          </Link>
        }
      />
      {error && <p className="a-alert a-alert--danger">{error}</p>}
      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <EmptyState icon={<Newspaper />} title="Новостей пока нет" text="Расскажите гостям о сезонных предложениях, событиях и обновлениях отеля." />
      ) : (
        <ul className="a-list">
          {posts.map((post) => (
            <li key={post.id} className="a-row">
              <div className="a-row__thumb">{post.image && <img src={post.image} alt="" />}</div>
              <div className="a-row__main">
                <Link to={`/admin/news/${post.id}`} className="a-row__title">
                  {tr(post.title, 'ru') || 'Без заголовка'}
                </Link>
                <span className="a-row__meta">{post.date ? formatDate(post.date, 'ru') : 'Без даты'}</span>
              </div>
              <div className="a-row__actions">
                <span className={`a-badge ${post.published ? 'a-badge--published' : 'a-badge--draft'}`}>{post.published ? 'Опубликовано' : 'Черновик'}</span>
                {post.published && (
                  <a className="a-icon-btn" href={`/news/${post.id}`} target="_blank" rel="noopener noreferrer" aria-label="Открыть на сайте" title="Открыть на сайте">
                    <ExternalLink size={18} />
                  </a>
                )}
                <Link to={`/admin/news/${post.id}`} className="a-icon-btn" aria-label="Редактировать">
                  <Pencil size={18} />
                </Link>
                <button type="button" className="a-icon-btn a-icon-btn--danger" onClick={() => remove(post)} aria-label="Удалить">
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
