import { Settings2 } from 'lucide-react'

const VARIABLES = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

/** Shown when the site is built without Firebase settings. */
export function SetupScreen() {
  return (
    <main className="a-auth">
      <div className="a-auth__card a-auth__card--wide">
        <Settings2 className="a-auth__icon" />
        <h1 className="a-auth__title">Подключите Firebase</h1>
        <p>
          Админ-панель хранит данные в Firebase. Сейчас сайт собран без настроек Firebase, поэтому показывает
          тексты по умолчанию, а заявки с сайта не сохраняются.
        </p>
        <div className="a-steps">
          <ol>
            <li>Создайте проект в Firebase Console и веб-приложение в нём.</li>
            <li>
              Скопируйте его настройки в файл <code>.env</code> (образец — <code>.env.example</code>) или в
              переменные окружения хостинга:
            </li>
          </ol>
          <pre className="a-code">{VARIABLES.map((v) => `${v}=…`).join('\n')}</pre>
          <p className="a-hint">
            Затем пересоберите сайт. Пошаговая инструкция — в файле README.md, раздел «Firebase и админ-панель».
          </p>
        </div>
        <a className="a-btn" href="/">
          На сайт
        </a>
      </div>
    </main>
  )
}
