import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ value, label = 'Скопировать' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="a-btn a-btn--sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1800)
        } catch {
          window.prompt('Скопируйте значение:', value)
        }
      }}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? 'Скопировано' : label}
    </button>
  )
}
