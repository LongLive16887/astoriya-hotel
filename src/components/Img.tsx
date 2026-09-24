import { useState, type ImgHTMLAttributes } from 'react'
import { builtinSrcSet } from '../content/builtinImages'

/**
 * <img> that fades in once loaded instead of popping in line by line.
 * With `sizes`, built-in photos also offer their smaller copy to phones.
 */
export function Img({ className = '', onLoad, loading = 'lazy', src, sizes, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false)
  const srcSet = sizes && src ? builtinSrcSet(src) : undefined
  return (
    <img
      decoding="async"
      loading={loading}
      {...props}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      className={`img ${loaded ? 'is-loaded' : ''} ${className}`}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
    />
  )
}
