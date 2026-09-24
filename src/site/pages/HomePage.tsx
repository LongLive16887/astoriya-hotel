import { About } from '../sections/About'
import { BookingBar } from '../sections/BookingBar'
import { Gallery } from '../sections/Gallery'
import { Hero } from '../sections/Hero'
import { Location } from '../sections/Location'
import { News } from '../sections/News'
import { Reviews } from '../sections/Reviews'
import { Rooms } from '../sections/Rooms'
import { Spa } from '../sections/Spa'
import { useDocumentMeta } from '../useDocumentMeta'

export function HomePage() {
  useDocumentMeta()
  return (
    <>
      <Hero />
      <BookingBar />
      <About />
      <Rooms />
      <Spa />
      <Gallery />
      <Reviews />
      <News />
      <Location />
    </>
  )
}
