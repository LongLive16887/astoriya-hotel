import { aboutData } from './mockdata'
import { useTranslation } from 'react-i18next'

const About = () => {
  const { t } = useTranslation()
  return (
    <div className="about-section" id="about-section">
      <div className="container">
        <div className="about-contents">
          <div className="image-about" data-aos="fade-up">
            <img src={aboutData.image} alt="resort" />
          </div>
          <div className="box-about" data-aos="fade-down">
            <div className="box-contents">
              <h2>{t('about.title')}</h2>
              <p>{t('about.description')}</p>
              <h5>{t('about.subtitle')}</h5>
              <p>{t('about.longDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
