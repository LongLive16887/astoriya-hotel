import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Save } from 'lucide-react'
import { emptyLocalized, tr } from '../../content/localized'
import type { Post } from '../../content/types'
import { todayIso } from '../../lib/format'
import { uniqueId } from '../../lib/ids'
import { errorMessage, useToast } from '../components/feedback'
import { ImageField } from '../components/ImageFields'
import { Field, LocalizedField } from '../components/LocalizedField'
import { PageHeader, Spinner } from '../components/PageHeader'
import { SaveBar } from '../components/SaveBar'
import { Switch } from '../components/Switch'
import { useUnsavedChanges } from '../components/useUnsavedChanges'
import { savePost, useAdminPosts } from '../lib/posts'

const emptyPost = (): Post => ({
  id: '',
  published: false,
  date: todayIso(),
  title: emptyLocalized(),
  excerpt: emptyLocalized(),
  body: emptyLocalized(),
  image: '',
})

export function PostEditorPage() {
  const { postId = 'new' } = useParams()
  const { posts, loading } = useAdminPosts()
  if (loading) return <Spinner />
  const isNew = postId === 'new'
  const existing = posts.find((p) => p.id === postId)
  if (!isNew && !existing) {
    return (
      <div className="a-page a-page--narrow">
        <PageHeader title="Новость не найдена" back={<BackLink />} />
      </div>
    )
  }
  return <PostEditor key={postId} initial={existing ?? emptyPost()} isNew={isNew} takenIds={posts.map((p) => p.id)} />
}

function BackLink() {
  return (
    <Link to="/admin/news" className="a-back">
      <ArrowLeft size={16} /> Все новости
    </Link>
  )
}

function PostEditor({ initial, isNew, takenIds }: { initial: Post; isNew: boolean; takenIds: string[] }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [post, setPost] = useState(initial)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(post) !== JSON.stringify(initial)
  const { allowLeave } = useUnsavedChanges(dirty)
  const set = <K extends keyof Post>(key: K, value: Post[K]) => setPost((p) => ({ ...p, [key]: value }))

  const save = async () => {
    const title = post.title.en || post.title.ru || post.title.uz
    if (!title.trim()) {
      toast.error('Укажите заголовок хотя бы на одном языке')
      return
    }
    setSaving(true)
    try {
      const id = isNew ? uniqueId(title, takenIds) : post.id
      await savePost({ ...post, id })
      toast.success(post.published ? 'Новость опубликована' : 'Черновик сохранён')
      allowLeave()
      navigate('/admin/news')
    } catch (error) {
      toast.error(errorMessage(error))
      setSaving(false)
    }
  }

  return (
    <div className="a-page a-page--narrow">
      <PageHeader
        back={<BackLink />}
        title={isNew ? 'Новая новость' : tr(initial.title, 'ru') || 'Новость'}
        actions={
          <>
            {!isNew && initial.published && (
              <a className="a-btn" href={`/news/${initial.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} /> На сайте
              </a>
            )}
            <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={saving || (!dirty && !isNew)}>
              <Save size={16} /> {saving ? 'Сохраняем…' : 'Сохранить'}
            </button>
          </>
        }
      />
      <div className="a-form">
        <section className="a-card">
          <LocalizedField label="Заголовок" value={post.title} onChange={(v) => set('title', v)} maxLength={120} />
          <LocalizedField
            label="Анонс"
            value={post.excerpt}
            onChange={(v) => set('excerpt', v)}
            multiline
            rows={2}
            maxLength={260}
            hint="Пара предложений для карточки новости."
          />
          <LocalizedField label="Текст" value={post.body} onChange={(v) => set('body', v)} multiline rows={12} hint="Абзацы разделяйте пустой строкой." />
        </section>
        <section className="a-card">
          <div className="a-grid-2">
            <ImageField label="Обложка" value={post.image} onChange={(v) => set('image', v)} optional />
            <Field label="Дата" hint="Новости на сайте сортируются по дате.">
              <input className="a-input" type="date" value={post.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
          </div>
          <Switch
            checked={post.published}
            onChange={(v) => set('published', v)}
            label={post.published ? 'Опубликована — видна на сайте' : 'Черновик — не видна на сайте'}
          />
        </section>
      </div>
      {dirty && <SaveBar saving={saving} onSave={save} onReset={() => setPost(initial)} />}
    </div>
  )
}
