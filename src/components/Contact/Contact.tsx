import { contactData } from './mockdata'
import { useTranslation } from 'react-i18next'

const Contact = () => {
  const { t } = useTranslation()
  return (
    <div className="more-information-section">
      <div className="container">
        <div className="contact-grid">
          <div className="company-info">
            <h4>{t('contact.companyName')}</h4>
            <a href={`tel:${t('contact.phoneNumber')}`}>
              <span className="fa fa-phone icon" aria-hidden="true"></span>
              {t('contact.phoneNumber')}
            </a>
            {contactData.company.email && (
              <a href={`mailto:${contactData.company.email}`}>
                <span className="fa fa-envelope-o icon" aria-hidden="true"></span>
                {contactData.company.email}
              </a>
            )}
            <p>{t('contact.address')}</p>
            <a href={contactData.company.googleMaps} target="_blank" rel="noopener noreferrer">
              <span className="fa fa-map-marker icon" aria-hidden="true"></span>
              {t('contact.openInMaps')}
            </a>
            <div className="social-links">
              <a href={contactData.company.telegram} target="_blank" rel="noopener noreferrer" className="social-link telegram">
                <span className="fab fa-telegram icon" aria-hidden="true"></span>
                Telegram
              </a>
              <a href={contactData.company.instagram} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                <span className="fab fa-instagram icon" aria-hidden="true"></span>
                Instagram
              </a>
            </div>
          </div>
          <div className="map-embed">
            <iframe
              title="Astoria Boutique & SPA location map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d582.047405863528!2d66.95689191498032!3d39.648261232574924!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f4d19ca3c1a807f%3A0xa07c431e206db8be!2z0KHQsNC80LDRgNC60LDQvdC0INCh0LDRg9C90LA!5e0!3m2!1sru!2s!4v1756221072967!5m2!1sru!2s"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
