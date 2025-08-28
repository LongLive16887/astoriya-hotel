import { servicesData } from './mockdata'
import { useTranslation } from 'react-i18next'

const Services = () => {
  const { t } = useTranslation()
  
  const getServiceTranslation = (serviceName: string) => {
    switch (serviceName) {
      case 'Quality Food':
        return t('services.items.food')
      case 'Sauna & Hammam':
        return t('services.items.security')
      case 'Quick Service':
        return t('services.items.quick')
      case '24 Hours Alert':
        return t('services.items.alert24')
      default:
        return serviceName
    }
  }

  return (
    <div className="our-services" id="services">
      <div className="container">
        <div className="services-contents">
          <div className="box-description" data-aos="fade-up">
            <h2>{t('services.title')}</h2>
            <p>{t('services.description')}</p>
            <div className="services">
              {servicesData.services.map((service, index) => (
                <div key={index} className="services-icon">
                  <h4>
                    <span className={`fa ${service.icon} ${service.color}`} aria-hidden="true"></span>
                    {getServiceTranslation(service.name)}
                  </h4>
                </div>
              ))}
            </div>
          </div>
          <div className="image-services" data-aos="fade-up">
            <img src={servicesData.image} alt="services" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Services
