import { useTranslation } from 'react-i18next'
import { useContent } from '../../content/context'
import { RoomCard } from './RoomCard'
import { SectionHeading } from './SectionHeading'
import './Rooms.css'

export function Rooms() {
  const { t } = useTranslation()
  const { rooms, settings } = useContent()
  const visible = rooms.filter((room) => room.visible)

  return (
    <section id="rooms" className="section section--sand" aria-labelledby="rooms-title">
      <div className="container">
        <SectionHeading
          id="rooms-title"
          center
          eyebrow={t('rooms.eyebrow')}
          title={t('rooms.title')}
          subtitle={t('rooms.subtitle')}
        />
        {visible.length > 0 ? (
          <div className="rooms-grid">
            {visible.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <p className="rooms-empty">{t('rooms.empty')}</p>
        )}
        <p className="rooms-note">
          {t('rooms.note', { checkIn: settings.checkIn, checkOut: settings.checkOut })}
        </p>
      </div>
    </section>
  )
}
