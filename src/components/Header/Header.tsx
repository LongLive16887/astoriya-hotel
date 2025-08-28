import { useEffect, useState } from 'react'
import './Header.css'
import { useTranslation } from 'react-i18next'
import BookingModal from '../BookingModal/BookingModal'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const [lang, setLang] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem('lang') || i18n.language : i18n.language))
  const [isLangOpen, setIsLangOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
  }, [lang, i18n])

  const onSelectLang = (newLang: 'uz' | 'ru' | 'en') => {
    setLang(newLang)
    setIsLangOpen(false)
    if (typeof window !== 'undefined') localStorage.setItem('lang', newLang)
  }

  const Flag = ({ code }: { code: 'uz' | 'ru' | 'en' }) => {
    if (code === 'ru') {
      return (
        <svg className="flag" viewBox="0 0 3 2" aria-hidden="true">
          <rect width="3" height="2" fill="#fff"/>
          <rect width="3" height="1.333" y="0.333" fill="#0039A6"/>
          <rect width="3" height="0.667" y="1.333" fill="#D52B1E"/>
        </svg>
      )
    }
    if (code === 'uz') {
      return (
        <svg className="flag" viewBox="0 0 3 2" aria-hidden="true">
          <rect width="3" height="2" fill="#1EB53A"/>
          <rect width="3" height="1.333" fill="#0099B5"/>
          <rect width="3" height="0.133" y="0.933" fill="#fff"/>
          <rect width="3" height="0.133" y="1.067" fill="#CE1126"/>
        </svg>
      )
    }
    // en (use simple UK-inspired blue + red cross)
    return (
      <svg className="flag" viewBox="0 0 3 2" aria-hidden="true">
        <rect width="3" height="2" fill="#00247D"/>
        <rect x="1.2" width="0.6" height="2" fill="#fff"/>
        <rect y="0.7" width="3" height="0.6" fill="#fff"/>
        <rect x="1.3" width="0.4" height="2" fill="#CF142B"/>
        <rect y="0.8" width="3" height="0.4" fill="#CF142B"/>
      </svg>
    )
  }

  return (
    <>
      <div className="navbar" id="navbar">
        <div className="left-navbar" id="left-navbar">
          <div className="logo">
            <a href="#">{t('common.brand')}</a>
          </div>
          <div className={`navbar-option ${isMenuOpen ? 'responsive' : ''}`} id="navbar-option">
            <a href="#main-section">{t('common.nav.home')}</a>
            <a href="#about-section">{t('common.nav.about')}</a>
            <a href="#services">{t('common.nav.services')}</a>
            <a href="#pricing">{t('common.nav.pricing')}</a>
            <a href="#blog-and-news">{t('common.nav.blog')}</a>
          </div>
        </div>
        <div className="right-navbar">
          <a href="#" className="bookNow" onClick={openModal}>{t('common.bookNow')}</a>
          <div className={`lang-switcher ${isLangOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="lang-button"
              aria-haspopup="listbox"
              aria-expanded={isLangOpen}
              onClick={() => setIsLangOpen(!isLangOpen)}
              title="Change language"
            >
              <span className="fa fa-language lang-icon" aria-hidden="true"></span>
              <Flag code={lang as 'uz' | 'ru' | 'en'} />
              <span className="lang-label">{lang.toUpperCase()}</span>
              <span className="chevron">▾</span>
            </button>
            {isLangOpen && (
              <ul className="lang-menu" role="listbox">
                {(['uz','ru','en'] as const).map(code => (
                  <li key={code} role="option" aria-selected={lang === code}>
                    <button type="button" className="lang-item" onClick={() => onSelectLang(code)}>
                      <Flag code={code} />
                      <span className="lang-label">{code.toUpperCase()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <a
            href="javascript:void(0);"
            className="hamburger"
            onClick={toggleMenu}
          >
            <i className="fa fa-bars"></i>
          </a>
        </div>
      </div>
      <BookingModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  )
}

export default Header
