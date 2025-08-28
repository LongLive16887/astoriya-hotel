import { useTranslation } from 'react-i18next'

const Hero = () => {
  const { t } = useTranslation()
  return (
    <div className="main-section" id="main-section">
      <div className="main-contents">
        <div className="main-text">
          <div className="container-main">
            {(t('hero.headlines', { returnObjects: true }) as string[]).map((headline, index) => (
              <h1 key={index}>{headline}</h1>
            ))}
            <p className="main">{t('hero.description')}</p>
          </div>
        </div>
        <div className="main-image"></div>
      </div>
    </div>
  )
}

export default Hero
