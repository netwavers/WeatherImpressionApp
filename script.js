const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loading = document.getElementById('loading');
const resultCard = document.getElementById('result-card');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Elements to update
const locationNameEl = document.getElementById('location-name');
const weatherIconEl = document.getElementById('weather-icon');
const temperatureEl = document.getElementById('temperature');
const windSpeedEl = document.getElementById('wind-speed');
const humidityEl = document.getElementById('humidity');
const impressionTextEl = document.getElementById('impression-text');
const copyBtn = document.getElementById('copy-btn');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
copyBtn.addEventListener('click', copyImpression);

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    showLoading();
    hideError();
    resultCard.classList.add('hidden');

    try {
        const locationData = await getCoordinates(city);
        if (!locationData) {
            throw new Error('都市が見つかりませんでした。');
        }

        const weatherData = await getWeather(locationData.latitude, locationData.longitude);
        updateUI(locationData, weatherData);
        hideLoading();
        resultCard.classList.remove('hidden');
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

async function getCoordinates(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ja&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return null;
    }
    return data.results[0];
}

async function getWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const response = await fetch(url);
    return await response.json();
}

function updateUI(location, weather) {
    const current = weather.current;

    // Update basic info
    locationNameEl.textContent = `${location.name}, ${location.country || ''}`;
    temperatureEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    windSpeedEl.textContent = `${current.wind_speed_10m} m/s`;
    humidityEl.textContent = `${current.relative_humidity_2m}%`;

    // Update Icon
    const weatherCode = current.weather_code;
    const iconClass = getWeatherIcon(weatherCode);
    weatherIconEl.className = `fa-solid ${iconClass}`;

    // Generate and set impression
    const impression = generateImpression(location.name, current);
    impressionTextEl.value = impression;

    // Reset copy button
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Text';
    copyBtn.classList.remove('copied');
}

function getWeatherIcon(code) {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    if (code === 0) return 'fa-sun'; // Clear sky
    if (code >= 1 && code <= 3) return 'fa-cloud-sun'; // Partly cloudy
    if (code >= 45 && code <= 48) return 'fa-smog'; // Fog
    if (code >= 51 && code <= 55) return 'fa-cloud-rain'; // Drizzle
    if (code >= 61 && code <= 67) return 'fa-umbrella'; // Rain
    if (code >= 71 && code <= 77) return 'fa-snowflake'; // Snow
    if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy'; // Rain showers
    if (code >= 95 && code <= 99) return 'fa-bolt'; // Thunderstorm
    return 'fa-cloud'; // Default
}

function generateImpression(city, current) {
    const temp = Math.round(current.temperature_2m);
    const code = current.weather_code;
    const wind = current.wind_speed_10m;

    let condition = "";
    let feeling = "";

    // Determine condition text
    if (code === 0) condition = "快晴";
    else if (code <= 3) condition = "晴れ間ものぞく空模様";
    else if (code <= 48) condition = "霧がかった天気";
    else if (code <= 67) condition = "雨";
    else if (code <= 77) condition = "雪";
    else if (code <= 99) condition = "荒れ模様";
    else condition = "曇り";

    // Determine feeling based on temp
    if (temp >= 30) feeling = "強烈な暑さです。水分補給を忘れずに！";
    else if (temp >= 25) feeling = "少し暑いですが、夏らしい陽気です。";
    else if (temp >= 15) feeling = "過ごしやすい気温で、お出かけ日和かも。";
    else if (temp >= 10) feeling = "少し肌寒いですね。上着があると安心です。";
    else if (temp >= 0) feeling = "冷え込んでいます。暖かくして過ごしましょう。";
    else feeling = "凍えるような寒さです…。";

    // Add wind comment if strong
    if (wind > 10) feeling += " 風も強いので気をつけて。";

    // Construct sentence
    const templates = [
        `【${city}の天気】現在は${condition}（${temp}℃）。${feeling}`,
        `今の${city}は${temp}℃、${condition}です。${feeling}`,
        `【現在地の天気】${city}：${condition} / ${temp}℃。${feeling}`
    ];

    // Randomly pick a template
    return templates[Math.floor(Math.random() * templates.length)];
}

function copyImpression() {
    const text = impressionTextEl.value;
    navigator.clipboard.writeText(text).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Text';
            copyBtn.classList.remove('copied');
        }, 2000);
    });
}

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(msg) {
    errorText.textContent = msg;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}
