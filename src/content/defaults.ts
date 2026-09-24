import type { Post, SiteContent } from './types'

// Content shown until it is edited in the admin panel (and whenever Firebase is not configured).
// Facts are taken from the previous version of the site; edit them in the admin panel.

const ALL_ROOM_AMENITIES = [
  'wifi',
  'breakfast',
  'ac',
  'tv',
  'fridge',
  'kettle',
  'safe',
  'wardrobe',
  'shower',
  'toiletries',
] as const

export const DEFAULT_CONTENT: SiteContent = {
  settings: {
    hotelName: 'Astoria Boutique & SPA',
    phone: '+998 55 705 00 10',
    phone2: '',
    email: '',
    telegram: 'astoria_boutique_hotel',
    instagram: 'astoria_boutique_hotel_',
    whatsapp: '',
    address: {
      uz: 'Abdurahmon Jomiy koʻchasi, 98, Samarqand',
      ru: 'ул. Абдурахмана Джами, 98, Самарканд',
      en: '98 Abdurakhmon Jomiy St, Samarkand',
    },
    mapUrl: 'https://maps.app.goo.gl/zL2AGGtjT5wM5M6HA',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d582.047405863528!2d66.95689191498032!3d39.648261232574924!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f4d19ca3c1a807f%3A0xa07c431e206db8be!2z0KHQsNC80LDRgNC60LDQvdC0INCh0LDRg9C90LA!5e0!3m2!1sru!2s!4v1756221072967!5m2!1sru!2s',
    location: { lat: 39.648261, lng: 66.956892 },
    checkIn: '14:00',
    checkOut: '12:00',
    hero: {
      title: {
        uz: 'Bir marta qoling,\nxotiralar qoladi\nabadiy',
        ru: 'Остановитесь однажды —\nвоспоминания останутся\nнавсегда',
        en: 'Stay once,\ncarry the memories\nforever',
      },
      subtitle: {
        uz: 'Samarqand markazidagi butik-mehmonxona: nafis xonalar, yopiq basseyn, sauna va hammom hamda shahar manzarasiga ega terrasa.',
        ru: 'Бутик-отель в центре Самарканда: элегантные номера, крытый бассейн, сауна и хаммам, терраса с видом на город.',
        en: 'A boutique hotel in the centre of Samarkand: elegant rooms, an indoor pool, a sauna and hammam, and a terrace with city views.',
      },
      image: '/images/facade.webp',
      secondaryImage: '/images/pool.webp',
    },
    about: {
      title: {
        uz: 'Qulaylik va nafislik uygʻunligi',
        ru: 'Гармония уюта и элегантности',
        en: 'Where comfort meets elegance',
      },
      text: {
        uz: 'Astoria Boutique & SPA — Samarqanddagi bogʻ, umumiy launj, terrasa va restoranga ega mehmonxona. Mehmonlar uchun 24 soatlik qabulxona, taom va ichimliklarni yetkazib berish hamda valyuta ayirboshlash xizmatlari mavjud.\n\nXonalarda konditsioner, yassi ekranli televizor, seyf, kiyim javoni, choynak va muzlatgich, shuningdek dush va bepul gigiyena vositalari bilan jihozlangan shaxsiy hammom bor. Har kuni ertalab “shved stoli” nonushtasi tortiladi, shahar boʻylab sayrdan soʻng esa yopiq basseyn va saunada hordiq chiqarishingiz mumkin.',
        ru: 'Astoria Boutique & SPA — отель в Самарканде с садом, общим лаунджем, террасой и рестораном. Для гостей работают круглосуточная стойка регистрации, доставка еды и напитков и обмен валют.\n\nВ номерах есть кондиционер, телевизор с плоским экраном, сейф, платяной шкаф, чайник и холодильник, а также собственная ванная комната с душем и бесплатными туалетно-косметическими принадлежностями. По утрам подают завтрак «шведский стол», а после прогулок по городу можно отдохнуть в крытом бассейне и сауне.',
        en: 'Astoria Boutique & SPA is a hotel in Samarkand with a garden, a shared lounge, a terrace and a restaurant. Guests enjoy a 24-hour front desk, food and drink delivery and currency exchange.\n\nRooms feature air conditioning, a flat-screen TV, a safe, a wardrobe, a kettle and a fridge, plus a private bathroom with a shower and free toiletries. A buffet breakfast is served every morning, and after a day in the city you can unwind in the indoor pool and sauna.',
      },
      image: '/images/room-twin.webp',
      secondaryImage: '/images/terrace.webp',
    },
    spa: {
      title: {
        uz: 'Yopiq basseynli SPA',
        ru: 'SPA с крытым бассейном',
        en: 'A SPA with an indoor pool',
      },
      text: {
        uz: 'Samarqand boʻylab sayrdan soʻng SPA zonamizda hordiq chiqaring: mehmonxona mehmonlari uchun yopiq basseyn, sauna va hammom ishlaydi.',
        ru: 'После прогулок по Самарканду отдохните в нашей SPA-зоне: для гостей отеля работают крытый бассейн, сауна и хаммам.',
        en: 'After a day exploring Samarkand, unwind in our wellness area: an indoor pool, a sauna and a hammam are open to hotel guests.',
      },
      image: '/images/pool.webp',
    },
    highlights: [
      {
        value: '24/7',
        label: { uz: 'qabulxona', ru: 'стойка регистрации', en: 'front desk' },
      },
      {
        value: '8',
        label: { uz: 'km — aeroportgacha', ru: 'км до аэропорта', en: 'km to the airport' },
      },
      {
        value: 'SPA',
        label: { uz: 'basseyn, sauna, hammom', ru: 'бассейн, сауна, хаммам', en: 'pool, sauna, hammam' },
      },
      {
        value: '3',
        label: { uz: 'xona toifasi', ru: 'категории номеров', en: 'room categories' },
      },
    ],
  },

  rooms: [
    {
      id: 'double-deluxe',
      visible: true,
      name: { uz: 'Ikki kishilik deluks', ru: 'Двухместный делюкс', en: 'Double Deluxe' },
      summary: {
        uz: 'Juftliklar, doʻstlar yoki ish safari uchun yorugʻ va shinam xona',
        ru: 'Светлый уютный номер для пары, друзей или деловой поездки',
        en: 'A bright, cosy room for couples, friends or business trips',
      },
      description: {
        uz: 'Ikkita bir kishilik karavotli yorugʻ va shinam xona — juftliklar, doʻstlar yoki ish safari uchun qulay.\n\nXonada konditsioner, yassi ekranli televizor, kiyim javoni, mini-muzlatgich, choynak va seyf, shuningdek dush va bepul gigiyena vositalari bilan shaxsiy hammom mavjud. “Shved stoli” nonushtasi narxga kiritilgan.',
        ru: 'Светлый уютный номер с двумя односпальными кроватями — для пары, друзей или деловой поездки.\n\nВ номере есть кондиционер, телевизор с плоским экраном, платяной шкаф, мини-холодильник, чайник и сейф, а также собственная ванная комната с душем и бесплатными туалетно-косметическими принадлежностями. Завтрак «шведский стол» включён в стоимость.',
        en: 'A bright, cosy room with two single beds — ideal for couples, friends or business travellers.\n\nThe room has air conditioning, a flat-screen TV, a wardrobe, a mini-fridge, a kettle and a safe, plus a private bathroom with a shower and free toiletries. Buffet breakfast is included in the rate.',
      },
      priceUzs: 1_300_000,
      priceUsd: 100,
      guests: 2,
      beds: {
        uz: '2 ta bir kishilik karavot',
        ru: '2 односпальные кровати',
        en: '2 single beds',
      },
      area: 0,
      amenities: [...ALL_ROOM_AMENITIES],
      images: ['/images/room-double.webp'],
    },
    {
      id: 'triple-deluxe',
      visible: true,
      name: { uz: 'Uch kishilik deluks', ru: 'Трёхместный делюкс', en: 'Triple Deluxe' },
      summary: {
        uz: 'Doʻstlar yoki oila uchun uchta alohida karavotli keng xona',
        ru: 'Просторный номер с тремя кроватями для друзей или семьи',
        en: 'A spacious room with three beds for friends or family',
      },
      description: {
        uz: 'Uchta alohida karavotli keng xona — birga sayohat qilayotgan doʻstlar yoki oʻsmir farzandli oila uchun ajoyib tanlov.\n\nKonditsioner, yassi ekranli televizor, katta kiyim javoni, mini-muzlatgich, choynak va seyf; dush va bepul gigiyena vositalari bilan shaxsiy hammom. “Shved stoli” nonushtasi narxga kiritilgan.',
        ru: 'Просторный номер с тремя отдельными кроватями — отличный выбор для друзей или семьи с подростком.\n\nКондиционер, телевизор с плоским экраном, большой шкаф, мини-холодильник, чайник и сейф; собственная ванная комната с душем и бесплатными туалетно-косметическими принадлежностями. Завтрак «шведский стол» включён в стоимость.',
        en: 'A spacious room with three separate beds — a great choice for friends travelling together or a family with a teenager.\n\nAir conditioning, a flat-screen TV, a large wardrobe, a mini-fridge, a kettle and a safe; private bathroom with a shower and free toiletries. Buffet breakfast is included in the rate.',
      },
      priceUzs: 1_700_000,
      priceUsd: 130,
      guests: 3,
      beds: {
        uz: '3 ta bir kishilik karavot',
        ru: '3 односпальные кровати',
        en: '3 single beds',
      },
      area: 0,
      amenities: [...ALL_ROOM_AMENITIES],
      images: ['/images/room-triple.webp'],
    },
    {
      id: 'family-room',
      visible: true,
      name: { uz: 'Oilaviy xona', ru: 'Семейный номер', en: 'Family Room' },
      summary: {
        uz: 'Toʻrt kishigacha oila uchun yotoqxona va yashash xonasi',
        ru: 'Спальня и гостиная зона для семьи до четырёх человек',
        en: 'A bedroom and a lounge area for a family of up to four',
      },
      description: {
        uz: 'Shisha eshiklar bilan ajratilgan ikki qism: yotoqxona hamda qoʻshimcha karavot va kreslolar joylashgan yashash xonasi. Toʻrt kishigacha boʻlgan oila uchun qulay.\n\nKonditsioner, yassi ekranli televizor, kiyim javoni, mini-muzlatgich, choynak va seyf; dush va bepul gigiyena vositalari bilan shaxsiy hammom. “Shved stoli” nonushtasi narxga kiritilgan.',
        ru: 'Два пространства, разделённые стеклянными дверями: спальня и гостиная зона с дополнительной кроватью и креслами. Удобно для семьи до четырёх человек.\n\nКондиционер, телевизор с плоским экраном, шкаф, мини-холодильник, чайник и сейф; собственная ванная комната с душем и бесплатными туалетно-косметическими принадлежностями. Завтрак «шведский стол» включён в стоимость.',
        en: 'Two spaces separated by glass doors: a bedroom and a lounge area with an extra bed and armchairs. Comfortable for a family of up to four.\n\nAir conditioning, a flat-screen TV, a wardrobe, a mini-fridge, a kettle and a safe; private bathroom with a shower and free toiletries. Buffet breakfast is included in the rate.',
      },
      priceUzs: 2_130_000,
      priceUsd: 163,
      guests: 4,
      beds: { uz: '3 ta karavot', ru: '3 кровати', en: '3 beds' },
      area: 0,
      amenities: [...ALL_ROOM_AMENITIES],
      images: ['/images/room-family-bedroom.webp', '/images/room-family-lounge.webp'],
    },
  ],

  services: [
    {
      id: 'pool',
      visible: true,
      icon: 'waves',
      title: { uz: 'Yopiq basseyn', ru: 'Крытый бассейн', en: 'Indoor pool' },
      text: {
        uz: 'Yilning istalgan faslida suzish uchun.',
        ru: 'Плавайте в любое время года.',
        en: 'Swim at any time of year.',
      },
    },
    {
      id: 'sauna',
      visible: true,
      icon: 'flame',
      title: { uz: 'Sauna va hammom', ru: 'Сауна и хаммам', en: 'Sauna & hammam' },
      text: {
        uz: 'Ekskursiyalardan soʻng isinib, dam oling.',
        ru: 'Прогрейтесь и расслабьтесь после экскурсий.',
        en: 'Warm up and relax after sightseeing.',
      },
    },
    {
      id: 'restaurant',
      visible: true,
      icon: 'utensils',
      title: { uz: 'Restoran va nonushta', ru: 'Ресторан и завтрак', en: 'Restaurant & breakfast' },
      text: {
        uz: 'Har kuni ertalab “shved stoli” nonushtasi.',
        ru: 'Каждое утро — завтрак «шведский стол».',
        en: 'A buffet breakfast every morning.',
      },
    },
    {
      id: 'terrace',
      visible: true,
      icon: 'sunset',
      title: { uz: 'Manzarali terrasa', ru: 'Терраса с видом', en: 'Terrace with a view' },
      text: {
        uz: 'Shahar manzarasi bilan kechki choy uchun ajoyib joy.',
        ru: 'Идеальное место для вечернего чая с видом на город.',
        en: 'The perfect spot for evening tea with a city view.',
      },
    },
    {
      id: 'room-service',
      visible: true,
      icon: 'concierge',
      title: { uz: 'Xonaga yetkazib berish', ru: 'Доставка в номер', en: 'Room service' },
      text: {
        uz: 'Taom va ichimliklarni xonangizga yetkazamiz.',
        ru: 'Еда и напитки с доставкой в номер.',
        en: 'Food and drinks delivered to your room.',
      },
    },
    {
      id: 'reception',
      visible: true,
      icon: 'clock',
      title: { uz: '24/7 qabulxona', ru: 'Ресепшн 24/7', en: '24/7 front desk' },
      text: {
        uz: 'Kecha-kunduz xizmatingizdamiz.',
        ru: 'Мы на связи в любое время суток.',
        en: 'We are here for you day and night.',
      },
    },
    {
      id: 'exchange',
      visible: true,
      icon: 'currency',
      title: { uz: 'Valyuta ayirboshlash', ru: 'Обмен валют', en: 'Currency exchange' },
      text: {
        uz: 'Valyutani mehmonxonaning oʻzida almashtiring.',
        ru: 'Обменяйте валюту прямо в отеле.',
        en: 'Exchange money right at the hotel.',
      },
    },
    {
      id: 'wifi',
      visible: true,
      icon: 'wifi',
      title: { uz: 'Bepul Wi‑Fi', ru: 'Бесплатный Wi‑Fi', en: 'Free Wi‑Fi' },
      text: {
        uz: 'Barcha mehmonlar uchun simsiz internet.',
        ru: 'Беспроводной интернет для всех гостей.',
        en: 'Wireless internet for all guests.',
      },
    },
  ],

  gallery: [
    {
      id: 'facade',
      src: '/images/facade.webp',
      category: 'exterior',
      caption: { uz: 'Mehmonxona fasadi', ru: 'Фасад отеля', en: 'The hotel facade' },
    },
    {
      id: 'room-family-bedroom',
      src: '/images/room-family-bedroom.webp',
      category: 'rooms',
      caption: {
        uz: 'Oilaviy xona — yotoqxona',
        ru: 'Семейный номер — спальня',
        en: 'Family Room — bedroom',
      },
    },
    {
      id: 'pool',
      src: '/images/pool.webp',
      category: 'spa',
      caption: { uz: 'Yopiq basseyn', ru: 'Крытый бассейн', en: 'Indoor pool' },
    },
    {
      id: 'terrace',
      src: '/images/terrace.webp',
      category: 'terrace',
      caption: {
        uz: 'Shahar manzarali terrasa',
        ru: 'Терраса с видом на город',
        en: 'Terrace with a city view',
      },
    },
    {
      id: 'room-triple',
      src: '/images/room-triple.webp',
      category: 'rooms',
      caption: { uz: 'Uch kishilik deluks', ru: 'Трёхместный делюкс', en: 'Triple Deluxe' },
    },
    {
      id: 'rooftop',
      src: '/images/rooftop.webp',
      category: 'exterior',
      caption: { uz: 'Tomdagi terrasa', ru: 'Терраса на крыше', en: 'Rooftop terrace' },
    },
    {
      id: 'room-double',
      src: '/images/room-double.webp',
      category: 'rooms',
      caption: { uz: 'Ikki kishilik deluks', ru: 'Двухместный делюкс', en: 'Double Deluxe' },
    },
    {
      id: 'room-family-lounge',
      src: '/images/room-family-lounge.webp',
      category: 'rooms',
      caption: {
        uz: 'Oilaviy xona — yashash xonasi',
        ru: 'Семейный номер — гостиная',
        en: 'Family Room — lounge',
      },
    },
    {
      id: 'room-twin',
      src: '/images/room-twin.webp',
      category: 'rooms',
      caption: { uz: 'Keng xona', ru: 'Просторный номер', en: 'A spacious room' },
    },
  ],

  reviews: [
    {
      id: 'anastasia',
      visible: true,
      author: { uz: 'Anastasiya', ru: 'Анастасия', en: 'Anastasia' },
      origin: {
        uz: 'Finlandiyadan sayohatchi',
        ru: 'Путешественница из Финляндии',
        en: 'Traveller from Finland',
      },
      text: {
        uz: 'Mehmonxona xodimlari juda eʼtiborli. Oilaviy xona ikki farzandli oilamiz uchun ideal boʻldi. Juda toza va sokin. Ajoyib SPA zonasi va basseyn. Nonushta ham aʼlo edi. Rahmat!',
        ru: 'Очень отзывчивый персонал отеля. Комфортный семейный номер был идеален для нашей семьи с двумя детьми. Очень чисто и тихо. Прекрасная SPA-зона с бассейном. Завтрак был великолепный. Благодарим!',
        en: 'Very responsive hotel staff. The comfortable family room was ideal for our family with two children. Very clean and quiet. A wonderful spa area with a pool. Breakfast was excellent. Thank you!',
      },
      rating: 0,
      source: '',
      date: '',
    },
  ],
}

/** News shown when Firebase is not configured. With Firebase, posts live in the `posts` collection. */
export const DEFAULT_POSTS: Post[] = [
  {
    id: 'terrace',
    published: true,
    date: '2025-07-21',
    image: '/images/terrace.webp',
    title: {
      uz: 'Shahar manzarasiga ega ajoyib terrasa',
      ru: 'Прекрасная терраса с видом на город',
      en: 'A beautiful terrace with a city view',
    },
    excerpt: {
      uz: 'Terrasamiz — Samarqand manzarasi bilan dam olish uchun ajoyib joy.',
      ru: 'Наша терраса — идеальное место для отдыха с видом на Самарканд.',
      en: 'Our terrace is the perfect place to relax with a view of Samarkand.',
    },
    body: {
      uz: 'Terrasamiz — tarixiy Samarqand manzarasidan bahramand boʻlish va dam olish uchun ideal joy.\n\nBu yerda shinam muhitda unutilmas oqshomlarni oʻtkazishingiz mumkin: kechki choy, suhbatlar va shahar ustidagi quyosh botishi.',
      ru: 'Наша терраса — идеальное место для отдыха и наслаждения прекрасным видом на исторический Самарканд.\n\nЗдесь можно провести незабываемые вечера в уютной атмосфере: вечерний чай, неспешные разговоры и закат над городом.',
      en: 'Our terrace is the ideal place to relax and enjoy the view of historic Samarkand.\n\nSpend unforgettable evenings here in a cosy atmosphere: evening tea, unhurried conversations and the sunset over the city.',
    },
  },
  {
    id: 'clean-rooms',
    published: true,
    date: '2025-07-21',
    image: '/images/room-twin.webp',
    title: {
      uz: 'Xonalar tozaligi — bizning ustuvor vazifamiz',
      ru: 'Чистота номеров — наш приоритет',
      en: 'Room cleanliness is our priority',
    },
    excerpt: {
      uz: 'Har bir xonada tozalik va gigiyenaga alohida eʼtibor beramiz.',
      ru: 'Мы уделяем особое внимание чистоте и гигиене в каждом номере.',
      en: 'We pay special attention to cleanliness and hygiene in every room.',
    },
    body: {
      uz: 'Har bir xonada tozalik va gigiyenaga alohida eʼtibor beramiz.\n\nXizmat koʻrsatuvchi xodimlarimiz mehmonlarimiz uchun benuqson tozalik va qulaylikni taʼminlash maqsadida har kuni ishlaydi.',
      ru: 'Мы уделяем особое внимание чистоте и гигиене в каждом номере.\n\nНаша команда горничных работает каждый день, чтобы обеспечить безупречную чистоту и комфорт для наших гостей.',
      en: 'We pay special attention to cleanliness and hygiene in every room.\n\nOur housekeeping team works every day to keep everything spotless and comfortable for our guests.',
    },
  },
]
