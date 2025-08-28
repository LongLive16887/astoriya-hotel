import { roomsData } from './mockdata'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import BookingModal from '../BookingModal/BookingModal'

const Rooms = () => {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const getFeatureTranslation = (featureKey: string) => {
    return t(`rooms.features.${featureKey}`)
  }

  const getRoomNameTranslation = (nameKey: string) => {
    return t(nameKey)
  }

  return (
    <>
      <div className="best-plans" id="pricing" data-aos="fade-up">
        <div className="container">
          <div className="heading-blog">
            <h2>{t('rooms.title')}</h2>
            <div className="blog-container">
              <p>{t('rooms.description')}</p>
            </div>
          </div>
          <div className="plan-contents">
            {roomsData.rooms.map((room, index) => (
              <div key={index} className="plan-card" data-aos={index === 0 ? "fade-down" : "fade-up"}>
                <img src={room.image} alt={room.name} />
                <div className="plan-content">
                  <h4>{getRoomNameTranslation(room.nameKey)}</h4>
                  <div className="price">
                    <p><span>${room.price}</span> {t('rooms.perNight')}</p>
                    <p className="price-uzs"><span>{room.priceUZS} сум</span></p>
                    <p className="price-rub"><span>{room.priceRUB} ₽</span></p>
                  </div>
                  <div className="features">
                    {room.features.map((feature, featureIndex) => (
                      <p key={featureIndex}>{getFeatureTranslation(feature)}</p>
                    ))}
                  </div>
                  <div className="select-package">
                    <a href="#" onClick={openModal}>{t('rooms.select')}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BookingModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  )
}

export default Rooms
