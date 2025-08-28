import React from 'react'
import './BookingModal.css'
import { useTranslation } from 'react-i18next'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  
  if (!isOpen) return null

  const handleCall = () => {
    window.location.href = `tel:${t('contact.phoneNumber')}`
  }

  const handleTelegram = () => {
    window.open('https://t.me/astoria_boutique_hotel', '_blank')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <div className="modal-header">
          <h2>{t('booking.title')}</h2>
          <p>{t('booking.description')}</p>
        </div>
        <div className="modal-body">
          <div className="contact-buttons">
            <button className="contact-btn call-btn" onClick={handleCall}>
              <i className="fa fa-phone"></i>
              {t('booking.call')}
            </button>
            <button className="contact-btn telegram-btn" onClick={handleTelegram}>
              <i className="fab fa-telegram"></i>
              {t('booking.telegram')}
            </button>
          </div>
          <div className="contact-info">
            <p><strong>{t('contact.phone')}:</strong> {t('contact.phoneNumber')}</p>
            <p><strong>Telegram:</strong> @astoria_boutique_hotel</p>
            <p><strong>{t('contact.address')}:</strong> {t('contact.address')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingModal
