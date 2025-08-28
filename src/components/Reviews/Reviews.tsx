import { reviewsData } from './mockdata'
import { useTranslation } from 'react-i18next'

const Reviews = () => {
  const { t } = useTranslation()
  return (
    <div className="reviews-section" id="reviews">
      <div className="container">
        <div className="section-title" data-aos="fade-up">
          <h3>{t('reviews.title')}</h3>
        </div>
        <div className="review">
          <div className="image-review" data-aos="fade-down">
            <img src={reviewsData.image} alt="views" />
          </div>
          <div className="review-box" data-aos="fade-down">
            <div className="arrow-buttons">
              <a href="#">
                <span className="material-icons-outlined">navigate_before</span>
              </a>
              <a href="#">
                <span className="material-icons-outlined">navigate_next</span>
              </a>
            </div>
            <div className="review-information">
              <div className="content-review">
                <span className="fa fa-quote-left" aria-hidden="true"></span>
                <p className="italic">{t('reviews.content')}</p>
              </div>
              <div className="reviewer">
                <img
                  className="rounded-image"
                  src={reviewsData.review.reviewer.image}
                  alt="reviewer"
                />
                <div className="reviewer-profile">
                  <h4 className="reviewer-name">{t('reviews.reviewerName')}</h4>
                  <p>{t('reviews.reviewerTitle')}</p>
                </div>
              </div>
            </div>
            <div className="clear"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reviews
