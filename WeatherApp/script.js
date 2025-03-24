// API key for OpenWeatherMap (replace with your own API key)
const API_KEY = '82586f559dbebe2987db9fba90163a55'; // Get one from https://openweathermap.org/api

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const weatherIcon = document.getElementById('weather-icon');
const temp = document.getElementById('temp');
const weatherDesc = document.getElementById('weather-desc');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const forecast = document.getElementById('forecast');

// Get current date and format it
function getCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
}

// Update current date display
currentDate.textContent = getCurrentDate();

// Fetch weather data from API
async function fetchWeatherData(city) {
    try {
        // Show loading state
        forecast.innerHTML = '<div class="loader"></div>';
        document.querySelector('.loader').style.display = 'block';
        
        // Fetch current weather
        const currentWeatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch forecast (5 days)
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );
        const forecastData = await forecastResponse.json();
        
        return { current: currentWeatherData, forecast: forecastData };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error fetching weather data. Please try again.');
        return null;
    }
}

// Update UI with weather data
function updateWeatherUI(data) {
    if (!data) return;
    
    const { current, forecast } = data;
    
    // Update current weather
    cityName.textContent = `${current.name}, ${current.sys.country}`;
    temp.textContent = `${Math.round(current.main.temp)}°C`;
    weatherDesc.textContent = current.weather[0].description;
    humidity.textContent = `${current.main.humidity}%`;
    wind.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
    
    // Update forecast
    updateForecastUI(forecast);
}

// Update forecast UI
function updateForecastUI(forecastData) {
    forecast.innerHTML = '';
    
    // Group forecast by day
    const dailyForecast = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        if (!dailyForecast[date]) {
            dailyForecast[date] = {
                temp_max: item.main.temp_max,
                temp_min: item.main.temp_min,
                icon: item.weather[0].icon,
                description: item.weather[0].description
            };
        } else {
            // Update max and min temps for the day
            if (item.main.temp_max > dailyForecast[date].temp_max) {
                dailyForecast[date].temp_max = item.main.temp_max;
            }
            if (item.main.temp_min < dailyForecast[date].temp_min) {
                dailyForecast[date].temp_min = item.main.temp_min;
            }
        }
    });
    
    // Display forecast for next 5 days
    const days = Object.keys(dailyForecast).slice(0, 5);
    days.forEach(day => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        forecastItem.innerHTML = `
            <div class="forecast-day">${day}</div>
            <img src="https://openweathermap.org/img/wn/${dailyForecast[day].icon}.png" alt="${dailyForecast[day].description}">
            <div class="forecast-temp">
                <span class="max-temp">${Math.round(dailyForecast[day].temp_max)}°</span>
                <span class="min-temp">${Math.round(dailyForecast[day].temp_min)}°</span>
            </div>
        `;
        
        forecast.appendChild(forecastItem);
    });
}

// Get weather by city name
async function getWeatherByCity() {
    const city = cityInput.value.trim();
    if (!city) return;
    
    const weatherData = await fetchWeatherData(city);
    updateWeatherUI(weatherData);
    
    // Clear input
    cityInput.value = '';
}

// Get weather by current location
async function getWeatherByLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Show loading state
                forecast.innerHTML = '<div class="loader"></div>';
                document.querySelector('.loader').style.display = 'block';
                
                // Fetch weather by coordinates
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
                );
                
                if (!response.ok) {
                    throw new Error('Location not found');
                }
                
                const data = await response.json();
                const weatherData = await fetchWeatherData(data.name);
                updateWeatherUI(weatherData);
            } catch (error) {
                console.error('Error fetching weather by location:', error);
                alert('Error fetching weather data for your location. Please try again.');
            }
        },
        (error) => {
            console.error('Error getting location:', error);
            alert('Unable to retrieve your location. Please enable location services or search by city name.');
        }
    );
}

// Event listeners
searchBtn.addEventListener('click', getWeatherByCity);
locationBtn.addEventListener('click', getWeatherByLocation);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeatherByCity();
    }
});

// Initialize with a default city
window.addEventListener('load', () => {
    fetchWeatherData('Bharatpur').then(updateWeatherUI);
});