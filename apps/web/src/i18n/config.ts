import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Define resources
const resources = {
    en: {
        translation: {
            "welcome": "Welcome to Social Media Manager",
            "dashboard": "Dashboard",
            "businesses": "Businesses",
            "brands": "Brands",
            "posts": "Posts",
            "settings": "Settings",
            "lightMode": "Light Mode",
            "darkMode": "Dark Mode",
            "systemMode": "System",
            "language": "Language"
        }
    },
    es: {
        translation: {
            "welcome": "Bienvenido al Gestor de Redes Sociales",
            "dashboard": "Tablero",
            "businesses": "Empresas",
            "brands": "Marcas",
            "posts": "Publicaciones",
            "settings": "Configuración",
            "lightMode": "Modo Claro",
            "darkMode": "Modo Oscuro",
            "systemMode": "Sistema",
            "language": "Idioma"
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en", // default language
        fallbackLng: "en",
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
