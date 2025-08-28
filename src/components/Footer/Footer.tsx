import { footerData } from './mockdata'
import { useTranslation } from 'react-i18next'

const Footer = () => {
  const { t } = useTranslation()
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-info">
            <h4>{t('contact.companyName')}</h4>
            <p>{t('contact.address')}</p>
            <p>{t('contact.phone')}: {t('contact.phoneNumber')}</p>
          </div>
          <div className="social-media">
            {footerData.socialLinks.map((link, index) => (
              <a key={index} href={link.href} target="_blank" rel="noopener noreferrer">
                <span className={link.icon} aria-hidden="true"></span>
              </a>
            ))}
          </div>
        </div>
        <p className="white">{footerData.copyright}</p>
      </div>
    </footer>
  )
}

export default Footer
