import { useState, type ImgHTMLAttributes } from 'react'

/** <img> that fades in once loaded instead of popping in line by line. */
export function Img({ className = '', onLoad, loading = 'lazy', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      decoding="async"
      loading={loading}
      {...props}
      className={`img ${loaded ? 'is-loaded' : ''} ${className}`}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
    />
  )
}
