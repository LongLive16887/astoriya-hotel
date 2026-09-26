interface SaveBarProps {
  saving: boolean
  onSave: () => void
  onReset: () => void
}

/** Sticky bar reminding that the form has unsaved changes. */
export function SaveBar({ saving, onSave, onReset }: SaveBarProps) {
  return (
    <div className="a-savebar" role="region" aria-label="Несохранённые изменения">
      <span>Есть несохранённые изменения</span>
      <div className="a-savebar__actions">
        <button type="button" className="a-btn a-btn--sm" onClick={onReset} disabled={saving}>
          Отменить
        </button>
        <button type="button" className="a-btn a-btn--sm a-btn--primary" onClick={onSave} disabled={saving}>
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}
