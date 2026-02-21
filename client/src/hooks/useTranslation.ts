import { useLanguageStore } from '../store/languageStore'
import { translations, TranslationKey } from '../i18n/translations'

export function useTranslation() {
  const { language } = useLanguageStore()
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.ru[key] || key
  }
  
  return { t, language }
}
