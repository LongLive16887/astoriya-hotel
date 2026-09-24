import { LogoMark } from './Logo'
import './Splash.css'

/** Shown while the first content loads; matches the static splash in index.html. */
export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Loading">
      <LogoMark className="splash__mark" />
    </div>
  )
}
