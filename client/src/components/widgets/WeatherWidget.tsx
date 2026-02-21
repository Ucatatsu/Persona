import { useState, useEffect } from 'react'
import { MapPin, RefreshCw } from 'lucide-react'

export default function WeatherWidget() {
  const [weather, setWeather] = useState({
    temp: 0,
    condition: 'Загрузка...',
    city: 'Загрузка...',
    icon: '🌤️'
  })
  const [loading, setLoading] = useState(true)

  const fetchWeather = async (lat: number, lon: number, city: string) => {
    try {
      // Используем бесплатный API Open-Meteo (не требует ключа)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
      )
      const data = await response.json()
      
      if (data.current_weather) {
        const temp = Math.round(data.current_weather.temperature)
        const weatherCode = data.current_weather.weathercode
        
        // Определяем условие и иконку по коду погоды
        let condition = 'Ясно'
        let icon = '☀️'
        
        if (weatherCode === 0) {
          condition = 'Ясно'
          icon = '☀️'
        } else if (weatherCode <= 3) {
          condition = 'Облачно'
          icon = '⛅'
        } else if (weatherCode <= 67) {
          condition = 'Дождь'
          icon = '🌧️'
        } else if (weatherCode <= 77) {
          condition = 'Снег'
          icon = '❄️'
        } else if (weatherCode <= 82) {
          condition = 'Ливень'
          icon = '⛈️'
        } else {
          condition = 'Гроза'
          icon = '⚡'
        }
        
        setWeather({
          temp,
          condition,
          city,
          icon
        })
      }
      setLoading(false)
    } catch (error) {
      console.error('Ошибка загрузки погоды:', error)
      setWeather(prev => ({ ...prev, condition: 'Ошибка', city }))
      setLoading(false)
    }
  }

  useEffect(() => {
    const detectCityAndWeather = async () => {
      try {
        // Проверяем сохранённые данные
        const savedCity = localStorage.getItem('weather-city')
        const savedLat = localStorage.getItem('weather-lat')
        const savedLon = localStorage.getItem('weather-lon')
        
        if (savedCity && savedLat && savedLon) {
          await fetchWeather(parseFloat(savedLat), parseFloat(savedLon), savedCity)
          return
        }

        // Получаем геолокацию
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const lat = position.coords.latitude
              const lon = position.coords.longitude
              
              try {
                // Определяем город
                const geoResponse = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru`
                )
                const geoData = await geoResponse.json()
                const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Ваш город'
                
                // Сохраняем
                localStorage.setItem('weather-city', city)
                localStorage.setItem('weather-lat', lat.toString())
                localStorage.setItem('weather-lon', lon.toString())
                
                // Загружаем погоду
                await fetchWeather(lat, lon, city)
              } catch (error) {
                console.error('Ошибка геокодирования:', error)
                setWeather({ temp: 0, condition: 'Ошибка', city: 'Неизвестно', icon: '❓' })
                setLoading(false)
              }
            },
            (error) => {
              console.error('Ошибка геолокации:', error)
              setWeather({ temp: 0, condition: 'Нет доступа', city: 'Разрешите геолокацию', icon: '📍' })
              setLoading(false)
            }
          )
        } else {
          setWeather({ temp: 0, condition: 'Недоступно', city: 'Геолокация не поддерживается', icon: '❌' })
          setLoading(false)
        }
      } catch (error) {
        console.error('Ошибка:', error)
        setLoading(false)
      }
    }

    detectCityAndWeather()
  }, [])

  const handleRefresh = () => {
    const lat = localStorage.getItem('weather-lat')
    const lon = localStorage.getItem('weather-lon')
    const city = localStorage.getItem('weather-city')
    
    if (lat && lon && city) {
      setLoading(true)
      fetchWeather(parseFloat(lat), parseFloat(lon), city)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center h-full min-h-[200px] relative group">
      {/* Кнопка обновления */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="absolute top-2 right-2 p-1 glass-hover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
        title="Обновить погоду"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
      
      <div className="text-4xl mb-2">{weather.icon}</div>
      <div className="text-3xl font-bold text-accent mb-1">
        {weather.temp > 0 ? '+' : ''}{weather.temp}°C
      </div>
      <div className="text-sm text-white/80 mb-1">{weather.condition}</div>
      <div className="text-xs text-white/60 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        {weather.city}
      </div>
    </div>
  )
}
