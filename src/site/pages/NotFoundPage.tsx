import { useTranslation } from 'react-i18next'
import { useDocumentMeta } from '../useDocumentMeta'
import { NotFoundView } from './NotFoundView'

export function NotFoundPage() {
  const { t } = useTranslation()
  useDocumentMeta(t('notFound.title'))
  return <NotFoundView title={t('notFound.title')} text={t('notFound.text')} />
}
