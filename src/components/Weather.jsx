import React, { useEffect, useRef, useState } from 'react';
import './Weather.css';
import search_icon from '../assets/search.png';
import clear_icon from '../assets/clear.png';
import cloud_icon from '../assets/cloud.png';
import drizzle_icon from '../assets/drizzle.png';
import humidity_icon from '../assets/humidity.png';
import rain_icon from '../assets/rain.png';
import snow_icon from '../assets/snow.png';
import wind_icon from '../assets/wind.png';
import pressure_icon from '../assets/pressure.png';
import sunrise_icon from '../assets/sunrise.png';
import sunset_icon from '../assets/sunset.png';
import visibility_icon from '../assets/visibility.png';

const Weather = () => {
const inputRef = useRef();
const [weatherData, setWeatherData] = useState(null);
const [forecast, setForecast] = useState([]);
const [history, setHistory] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const allIcons = {
    "01d": clear_icon,
    "01n": clear_icon,
    "02d": cloud_icon,
    "02n": cloud_icon,
    "03d": cloud_icon,
    "03n": cloud_icon,
    "04d": drizzle_icon,
    "04n": drizzle_icon,
    "09d": rain_icon,
    "09n": rain_icon,
    "10d": rain_icon,
    "10n": rain_icon,
    "13d": snow_icon,
    "13n": snow_icon
};

const search = async (city) => {
    if (!city || city.trim() === "") {
        setError("Please enter a city name");
        return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;

        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error(currentData.message || "City not found");
        }

        const icon = allIcons[currentData.weather[0].icon] || clear_icon;
        setWeatherData({
            humidity: currentData.main.humidity,
            windSpeed: currentData.wind.speed,
            temperature: Math.floor(currentData.main.temp),
            location: currentData.name,
            icon: icon,
            description: currentData.weather[0].description,
            feelsLike: Math.floor(currentData.main.feels_like),
            pressure: currentData.main.pressure,
            visibility: currentData.visibility / 1000, 
            sunrise: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString(),
            sunset: new Date(currentData.sys.sunset * 1000).toLocaleTimeString()
        });


        const dailyForecast = forecastData.list.reduce((acc, item) => {
            const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            if (!acc[date]) {
                acc[date] = {
                    date: date,
                    items: []
                };
            }
            acc[date].items.push(item);
            return acc;
        }, {});

        const forecastDays = Object.values(dailyForecast)
            .slice(1, 6)
            .map(day => {
                const avgTemp = Math.floor(
                    day.items.reduce((sum, item) => sum + item.main.temp, 0) / day.items.length
                );
                const weatherCount = {};
                day.items.forEach(item => {
                    const condition = item.weather[0].main;
                    weatherCount[condition] = (weatherCount[condition] || 0) + 1;
                });
                const dominantWeather = Object.keys(weatherCount).reduce((a, b) => 
                    weatherCount[a] > weatherCount[b] ? a : b
                );
                
                return {
                    date: day.date,
                    temperature: avgTemp,
                    icon: allIcons[day.items[0].weather[0].icon] || clear_icon,
                    condition: dominantWeather,
                    minTemp: Math.floor(Math.min(...day.items.map(item => item.main.temp_min))),
                    maxTemp: Math.floor(Math.max(...day.items.map(item => item.main.temp_max)))
                };
            });

        setForecast(forecastDays);
        setHistory(prev => [...new Set([city, ...prev].slice(0, 5))]);

    } catch (err) {
        setError(err.message);
        setWeatherData(null);
    } finally {
        setLoading(false);
    }
};

const clearHistory = () => {
    setHistory([]);
};

const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
        search(inputRef.current.value);
    }
};

return (
    <div className='weather-app-container'>
        <div className='weather-app'>
            <div className='search-container'>
                <div className='search-bar'>
                    <input 
                        ref={inputRef} 
                        type="text" 
                        placeholder='Enter city name...' 
                        onKeyPress={handleKeyPress}
                    />
                    <button onClick={() => search(inputRef.current.value)}>
                        <img src={search_icon} alt="search" />
                        <span>Search</span>
                    </button>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                {history.length > 0 && (
                    <div className='history-section'>
                        <div className="history-header">
                            <h3>Recent Searches</h3>
                            <button onClick={clearHistory}>Clear All</button>
                        </div>
                        <div className="history-items">
                            {history.map((city, index) => (
                                <div 
                                    key={index} 
                                    className="history-item"
                                    onClick={() => search(city)}
                                >
                                    {city}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Loading weather data...</p>
                </div>
            )}

            {weatherData && (
                <div className='weather-display'>
                    <div className='current-weather-card'>
                        <div className="weather-header">
                            <h2>{weatherData.location}</h2>
                            <p className="weather-description">{weatherData.description}</p>
                        </div>
                        
                        <div className="weather-main">
                            <div className="temperature-section">
                                <img src={weatherData.icon} alt="weather icon" className='weather-icon' />
                                <div>
                                    <p className='temperature'>{weatherData.temperature}<span>°C</span></p>
                                    <p className="feels-like">Feels like {weatherData.feelsLike}°C</p>
                                </div>
                            </div>
                            
                            <div className="weather-stats-grid">
                                <div className="stat-item">
                                    <img src={humidity_icon} alt="humidity" />
                                    <div>
                                        <p className="stat-value">{weatherData.humidity}%</p>
                                        <p className="stat-label">Humidity</p>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <img src={wind_icon} alt="wind" />
                                    <div>
                                        <p className="stat-value">{weatherData.windSpeed} km/h</p>
                                        <p className="stat-label">Wind Speed</p>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <i className="fas fa-tachometer-alt"></i>
                                    <img src={pressure_icon} alt="pressure" />
                                    <div>
                                        <p className="stat-value">{weatherData.pressure} hPa</p>
                                        <p className="stat-label">Pressure</p>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <i className="fas fa-eye"></i>
                                    <img src={visibility_icon} alt="visibility" />
                                    <div>
                                        <p className="stat-value">{weatherData.visibility} km</p>
                                        <p className="stat-label">Visibility</p>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <i className="fas fa-sun"></i>
                                    <img src={sunrise_icon} alt="sunrise" />
                                    <div>
                                        <p className="stat-value">{weatherData.sunrise}</p>
                                        <p className="stat-label">Sunrise</p>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <i className="fas fa-moon"></i>
                                    <img src={sunset_icon} alt="sunset" />
                                    <div>
                                        <p className="stat-value">{weatherData.sunset}</p>
                                        <p className="stat-label">Sunset</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='forecast-section'>
                        <h3>5-Day Forecast</h3>
                        <div className='forecast-container'>
                            {forecast.map((day, index) => (
                                <div key={index} className='forecast-card'>
                                    <p className="forecast-date">{day.date}</p>
                                    <img src={day.icon} alt="forecast icon" className='forecast-icon' />
                                    <p className="forecast-condition">{day.condition}</p>
                                    {/* <div className="temp-range">
                                        <span className="max-temp">{day.maxTemp}°</span>
                                        <span className="min-temp">{day.minTemp}°</span>
                                    </div> */}
                                    <p className="forecast-temp">{day.temperature}°C</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            

            {!weatherData && !loading && (
                <div className="welcome-screen">
                    <h2>Weather Forecast</h2>
                    <p>Search for a city to view current weather and 5-day forecast</p>
                    <div className="weather-icons-preview">
                        <div className="icon-preview">
                            <img src={clear_icon} alt="Clear" />
                            <span>Sunny</span>
                        </div>
                        <div className="icon-preview">
                            <img src={cloud_icon} alt="Cloudy" />
                            <span>Cloudy</span>
                        </div>
                        <div className="icon-preview">
                            <img src={rain_icon} alt="Rain" />
                            <span>Rainy</span>
                        </div>
                        <div className="icon-preview">
                            <img src={snow_icon} alt="Snow" />
                            <span>Snowy</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
);
};

export default Weather;