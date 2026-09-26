import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { Img } from '../../components/Img'
import { useContent } from '../../content/context'
import { paragraphs, tr } from '../../content/localized'
import { useLang } from '../../i18n/useLang'
import { sectionLink } from '../layout/nav'
import './About.css'

export function About() {
  const { t } = useTranslation()
  const lang = useLang()
  const { settings } = useContent()
  const { about, highlights } = settings

  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="container about__inner">
        <div className="about__media reveal">
          <div className="about__main frame">
            <Img src={about.image} alt="" width={1024} height={768} sizes="(max-width: 900px) 90vw, 480px" />
          </div>
          {about.secondaryImage && (
            <div className="about__second arch">
              <Img src={about.secondaryImage} alt="" />
            </div>
          )}
        </div>

        <div className="about__content">
          <p className="eyebrow reveal">{t('about.eyebrow')}</p>
          <h2 id="about-title" className="h-section reveal">
            {tr(about.title, lang)}
          </h2>
          <div className="about__text reveal">
            {paragraphs(tr(about.text, lang)).map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
          {highlights.length > 0 && (
            <ul className="about__highlights reveal">
              {highlights.map((item, i) => (
                <li key={i}>
                  <strong>{item.value}</strong>
                  <span>{tr(item.label, lang)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to={sectionLink('rooms')} className="link-arrow reveal">
            {t('about.cta')}
            <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  )
}
