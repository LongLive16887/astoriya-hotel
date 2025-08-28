import { blogData } from './mockdata'
import { useTranslation } from 'react-i18next'

const Blog = () => {
  const { t } = useTranslation()
  return (
    <div className="blog-and-news" id="blog-and-news">
      <div className="container">
        <div className="heading-blog" data-aos="fade-up">
          <h2>{t('blog.title')}</h2>
          <div className="blog-container">
            <p>{t('blog.description')}</p>
          </div>
        </div>
        <div className="blog-contents">
          {blogData.posts.map((post, index) => (
            <div key={index} className={`blog ${index === 1 ? 'second' : ''}`} data-aos={index === 0 ? "fade-down" : "fade-up"}>
              <img src={post.image} alt={post.title} />
              <div className="blog-info">
                <div className="time-posted">
                  <div className="rounded">
                    <span className="fa fa-calendar" aria-hidden="true"></span>
                  </div>
                  <h4>{post.date}</h4>
                </div>
                <div className="blog-author">
                  <div className="rounded">
                    <span className="fa fa-user" aria-hidden="true"></span>
                  </div>
                  <h4>{t('blog.author')}</h4>
                </div>
              </div>
              <div className="blog-content">
                <h4>{index === 0 ? t('blog.post1') : t('blog.post2')}</h4>
                <p>{index === 0 ? t('blog.post1Content') : t('blog.post2Content')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Blog
