import { useEffect } from 'react'
import Header from './components/Header/Header'
import Hero from './components/Hero/Hero'
import About from './components/About/About'
import Services from './components/Services/Services'
import Rooms from './components/Rooms/Rooms'
import Blog from './components/Blog/Blog'
import Reviews from './components/Reviews/Reviews'
import Contact from './components/Contact/Contact'
import Footer from './components/Footer/Footer'

function App() {
  useEffect(() => {
    // Initialize AOS
    if (typeof window !== 'undefined' && window.AOS) {
      window.AOS.init()
    }
  }, [])

  return (
    <div className="App">
      <Header />
      <Hero />
      <About />
      <Services />
      <Rooms />
      <Blog />
      <Reviews />
      <Contact />
      <Footer />
    </div>
  )
}

export default App
