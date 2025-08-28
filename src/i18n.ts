import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('lang') : null

export const resources = {
  uz: {
    translation: {
      common: {
        brand: 'Astoria Boutique & SPA',
        bookNow: 'HOZIR BAND QILISH',
        nav: {
          home: 'Bosh sahifa',
          about: 'Biz haqimizda',
          services: 'Xizmatlar',
          pricing: 'Narxlar',
          blog: 'Blog'
        }
      },
      hero: {
        headlines: ['Bir marta qoling,', 'xotiralarni olib yuring', 'Abadiy.'],
        description: 'Mehmonxonamizda qulaylik va yuksak xizmat bilan unutilmas dam oling.'
      },
      about: {
        title: "Astoria Boutique & SPA — qulaylik va nafislik uygʻunligi",
        description: "Shinam xonalar, eʼtiborli xizmat va shahar markaziga yaqin joylashuv.",
        subtitle: "Har bir mehmon — bizning qadriyatimiz",
        longDescription: "Biz siz uchun sokin dam olish muhitini, zamonaviy infratuzilmani va mayin dizaynni birlashtirdik."
      },
      services: {
        title: 'Xizmatlarimiz',
        description: 'Siz uchun eng foydali va qulay xizmatlar toʻplami.',
        items: {
          food: 'Sifatli taomlar',
          security: 'Sauna va xammom',
          quick: 'Tezkor xizmat',
          alert24: '24 soat xizmat'
        }
      },
      rooms: {
        title: 'Eng yaxshi xonalar rejalari',
        description: 'Har bir did va byudjet uchun mos variantlar.',
        tripleDeluxe: 'Uch kishilik deluks',
        familyRoom: 'Oilaviy xona',
        doubleDeluxe: 'Ikki kishilik deluks',
        perNight: 'kechasi',
        features: {
          wifi: 'Bepul WiFi',
          breakfast: 'Nonushta',
          threeBeds: 'Xonada 3 ta yotoq',
          fourPeople: 'Xonada 4 kishi',
          twoBeds: 'Xonada 2 ta yotoq',
          threePeople: 'Xonada 3 kishi',
          twoPeople: 'Xonada 2 kishi'
        },
        select: 'Paketni tanlash'
      },
      blog: {
        title: 'So‘nggi blog va yangiliklar',
        description: 'Eng soʻnggi yangiliklar va foydali maqolalar.',
        author: 'MUALLIF TOMONIDAN',
        post1: 'Xonalar tozaligi — bizning ustuvorligimiz!',
        post2: 'Ajoyib terrasa shahar manzarasi bilan',
        post1Content: 'Biz har bir xonada tozalik va gigiyenaga alohida eʼtibor beramiz.',
        post2Content: 'Bizning terrasa — shahar manzarasi bilan dam olish uchun ajoyib joy.'
      },
      reviews: {
        title: 'Mamnun sayohatchilar sharhlari',
        content: "«Mehmonxonaning xodimlari juda javobgar. Oilaviy xona bizning ikki farzandli oilamiz uchun ideal edi. Juda toza, sokin. Ajoyib spa zona va hovuz. Nonushta ajoyib edi. Rahmat...»",
        reviewerTitle: 'Finlandiyadan sayohatchi',
        reviewerName: 'Anastasiya'
      },
      contact: {
        companyName: 'Astoria Boutique & SPA',
        legal: {
          title: 'Yuridik',
          terms: 'Foydalanish shartlari',
          privacy: 'Maxfiylik siyosati',
          cookies: 'Cookie siyosati'
        },
        resources: {
          title: 'Resurslar',
          how: 'Qanday ishlaydi',
          feature: 'Imkoniyatlar',
          contacts: 'Aloqa'
        },
        newsletter: {
          title: 'Yangiliklar byulleteni',
          description: 'Soʻnggi yangiliklar va takliflardan xabardor boʻling',
          placeholder: 'Email manzilini kiriting',
          send: 'Yuborish'
        },
        address: 'Abdurahmon Jomiy koʻchasi 98, Samarqand, Samarqand viloyati',
        phone: 'Telefon',
        phoneNumber: '+998557050010',
        email: '',
        openInMaps: 'Google Maps da ochish'
      },
      booking: {
        title: 'Xonani band qilish',
        description: 'Band qilish uchun aloqa usulini tanlang',
        call: 'Qo\'ng\'iroq qilish',
        telegram: 'Telegram orqali yozish'
      }
    }
  },
  ru: {
    translation: {
      common: {
        brand: 'Astoria Boutique & SPA',
        bookNow: 'ЗАБРОНИРОВАТЬ',
        nav: {
          home: 'Главная',
          about: 'О нас',
          services: 'Услуги',
          pricing: 'Цены',
          blog: 'Блог'
        }
      },
      hero: {
        headlines: ['Остановись однажды,', 'унеси воспоминания', 'Навсегда.'],
        description: 'Отдохните с комфортом и высоким сервисом в нашей гостинице.'
      },
      about: {
        title: 'Astoria Boutique & SPA — гармония уюта и элегантности',
        description: 'Уютные номера, внимательный сервис и удобное расположение в центре.',
        subtitle: 'Каждый гость — наша ценность',
        longDescription: 'Мы объединили спокойствие, современную инфраструктуру и изящный дизайн.'
      },
      services: {
        title: 'Наши услуги',
        description: 'Подборка самых полезных и удобных сервисов для вас.',
        items: {
          food: 'Качественная еда',
          security: 'Сауна и хаммам',
          quick: 'Быстрый сервис',
          alert24: '24 часа на связи'
        }
      },
      rooms: {
        title: 'Лучшие варианты номеров',
        description: 'Подойдут для любого вкуса и бюджета.',
        tripleDeluxe: 'Трехместный делюкс',
        familyRoom: 'Семейный номер',
        doubleDeluxe: 'Двухместный делюкс',
        perNight: 'за ночь',
        features: {
          wifi: 'Бесплатный WiFi',
          breakfast: 'Завтрак',
          threeBeds: '3 кровати в номере',
          fourPeople: '4 человека в номере',
          twoBeds: '2 кровати в номере',
          threePeople: '3 человека в номере',
          twoPeople: '2 человека в номере'
        },
        select: 'Выбрать пакет'
      },
      blog: {
        title: 'Наш блог и новости',
        description: 'Самые свежие новости и полезные статьи.',
        author: 'ОТ АВТОРА',
        post1: 'Чистота комнат - наш приоритет!',
        post2: 'Прекрасная терраса с видом на город',
        post1Content: 'Мы уделяем особое внимание чистоте и гигиене в каждом номере.',
        post2Content: 'Наша терраса - идеальное место для отдыха с видом на город.'
      },
      reviews: {
        title: 'Отзыв довольного путешественника',
        content: '«Очень отзывчивый персонал отеля. Комфортный семейный номер идеален был для нашей семьи с двумя детьми. Очень чисто, тихо. Прекрасная зона спа с бассейном. Завтрак был великолепный. Благодарим...»',
        reviewerTitle: 'Путешественница из Финляндии',
        reviewerName: 'Анастасия'
      },
      contact: {
        companyName: 'Astoria Boutique & SPA',
        legal: {
          title: 'Юридическое',
          terms: 'Условия и положения',
          privacy: 'Политика конфиденциальности',
          cookies: 'Политика Cookie'
        },
        resources: {
          title: 'Ресурсы',
          how: 'Как это работает',
          feature: 'Возможности',
          contacts: 'Контакты'
        },
        newsletter: {
          title: 'Рассылка',
          description: 'Подпишитесь на новости и предложения от разных отелей',
          placeholder: 'Введите email',
          send: 'Отправить'
        },
        address: 'Abdurahmon Jomiy ko\'chasi 98, Samarqand, Samarqand viloyati',
        phone: 'Телефон',
        phoneNumber: '+998557050010',
        email: '',
        openInMaps: 'Открыть в Google Maps'
      },
      booking: {
        title: 'Забронировать номер',
        description: 'Выберите способ связи для бронирования',
        call: 'Позвонить',
        telegram: 'Написать в Telegram'
      }
    }
  },
  en: {
    translation: {
      common: {
        brand: 'Astoria Boutique & SPA',
        bookNow: 'BOOK NOW',
        nav: {
          home: 'Home',
          about: 'About',
          services: 'Services',
          pricing: 'Pricing',
          blog: 'Blog'
        }
      },
      hero: {
        headlines: ['Stay once,', 'carry memories', 'Forever.'],
        description: 'Enjoy unforgettable rest with comfort and top-notch service.'
      },
      about: {
        title: 'Astoria Boutique & SPA — where comfort meets elegance',
        description: 'Cozy rooms, attentive service, and a central location.',
        subtitle: 'Every guest matters',
        longDescription: 'We combine serenity, modern amenities, and refined design.'
      },
      services: {
        title: 'See Our Services',
        description: 'A selection of the most useful and convenient services.',
        items: {
          food: 'Quality Food',
          security: 'Sauna & Hammam',
          quick: 'Quick Service',
          alert24: '24 Hours Alert'
        }
      },
      rooms: {
        title: 'Our Best Room Plans',
        description: 'Options that fit every taste and budget.',
        tripleDeluxe: 'Triple Deluxe',
        familyRoom: 'Family Room',
        doubleDeluxe: 'Double Deluxe',
        perNight: 'per night',
        features: {
          wifi: 'Free WiFi',
          breakfast: 'Breakfast',
          threeBeds: '3 beds in room',
          fourPeople: '4 people in room',
          twoBeds: '2 beds in room',
          threePeople: '3 people in room',
          twoPeople: '2 people in room'
        },
        select: 'Select Package'
      },
      blog: {
        title: 'Our Latest Blog & News',
        description: 'The latest news and helpful articles.',
        author: 'BY CREATOR',
        post1: 'Room cleanliness - our priority!',
        post2: 'Beautiful terrace with city view',
        post1Content: 'We pay special attention to cleanliness and hygiene in every room.',
        post2Content: 'Our terrace is the perfect place to relax with city view.'
      },
      reviews: {
        title: 'See Satisfied Traveler Reviews',
        content: "«Very responsive hotel staff. Comfortable family room was ideal for our family with two children. Very clean, quiet. Wonderful spa area with pool. Breakfast was excellent. Thank you...»",
        reviewerTitle: 'Traveler from Finland',
        reviewerName: 'Anastasia'
      },
      contact: {
        companyName: 'Astoria Boutique & SPA',
        legal: {
          title: 'Legal',
          terms: 'Terms & Conditions',
          privacy: 'Privacy Policy',
          cookies: 'Cookies Policy'
        },
        resources: {
          title: 'Resources',
          how: 'How It Works',
          feature: 'Feature',
          contacts: 'Contacts'
        },
        newsletter: {
          title: 'Newsletter',
          description: 'Sign up for the latest news and offers from various hotels',
          placeholder: 'Enter email address',
          send: 'Send'
        },
        address: 'Abdurahmon Jomiy ko\'chasi 98, Samarqand, Samarqand viloyati',
        phone: 'Phone',
        phoneNumber: '+998557050010',
        email: '',
        openInMaps: 'Open in Google Maps'
      },
      booking: {
        title: 'Book a Room',
        description: 'Choose a contact method for booking',
        call: 'Call',
        telegram: 'Write in Telegram'
      }
    }
  }
}

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang || 'uz',
    fallbackLng: 'uz',
    interpolation: { escapeValue: false }
  })

export default i18next


