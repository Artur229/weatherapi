let days = [];
let activeIndex = 1;
let currentLocation = {
	name: 'Vienna',
	country: 'Austria',
	admin1: 'Vienna',
	latitude: 48.2082,
	longitude: 16.3738,
};
let currentUnit = 'celsius';
let suggestionTimer = null;
let latestSuggestions = [];

const cards = document.querySelectorAll('.daily-card');
const searchForm = document.querySelector('.site-header__search');
const searchInput = document.querySelector('#location-search');
const searchStatus = document.querySelector('.site-header__search-status');
const suggestionsList = document.querySelector('.site-header__suggestions');
const unitsWrap = document.querySelector('.site-header__units-wrap');
const unitsButton = document.querySelector('.site-header__units');
const unitsLabel = document.querySelector('.site-header__units-label');
const unitOptions = document.querySelectorAll('.site-header__units-menu button');
const bubble = document.querySelector('.weather-hero__bubble');
const bubbleClose = document.querySelector('.weather-hero__bubble-close');
const heroMeta = document.querySelector('.weather-hero__meta');
const heroTitle = document.querySelector('.weather-hero__title');
const sectionTitle = document.querySelector('#today-heading');
const temperatureTitle = document.querySelector('.metric-row__title');

const hourTimes = document.querySelectorAll('.hour-time');
const hourTemps = document.querySelectorAll('.hour-temp');
const hourIcons = document.querySelectorAll('.hourly-panel__icons .mini-weather');
const hourWinds = document.querySelectorAll('.hour-wind');
const hourGusts = document.querySelectorAll('.hour-gust');
const hourPrecipitations = document.querySelectorAll('.hour-precip');

function formatDay(dateString) {
	const date = new Date(dateString);

	return date.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	});
}

function getDayLabel(index) {
	if (index === 0) return 'Yesterday';
	if (index === 1) return 'Today';
	if (index === 2) return 'Tomorrow';

	return '';
}

function getWeatherDescription(code) {
	if (code === 0) return 'Clear sky';
	if ([1, 2].includes(code)) return 'Partly cloudy';
	if (code === 3) return 'Cloudy';
	if ([45, 48].includes(code)) return 'Foggy';
	if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
	if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rainy';
	if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snowy';
	if ([95, 96, 99].includes(code)) return 'Stormy';

	return 'Weather';
}

function getWeatherIconSrc(code) {
	if (code === 0) return 'assets/img/icon/sun.png';
	if (code === 1) return 'assets/img/icon/partly-cloudy.png';
	if (code === 2) return 'assets/img/icon/partly-cloudy.png';
	if (code === 3) return 'assets/img/icon/cloudy.png';
	if ([51, 53, 55, 61, 63, 65].includes(code)) {
		return 'assets/img/icon/rain.png';
	}
	if ([71, 73, 75].includes(code)) {
		return 'assets/img/icon/snow.png';
	}

	return 'assets/img/icon/cloudy.png';
}

function formatDateTime(date) {
	return date.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatHour(timeString) {
	const date = new Date(timeString);
	return date.getHours() + ':00';
}

function formatTemp(value) {
	const rounded = Math.round(value);
	return rounded > 0 ? `+${rounded}` : String(rounded);
}

function getUnitSymbol() {
	return currentUnit === 'fahrenheit' ? '°F' : '°C';
}

function getForecastUnitParam() {
	return currentUnit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
}

function getWindDirection(degrees) {
	if (degrees >= 337.5 || degrees < 22.5) return 'N';
	if (degrees >= 22.5 && degrees < 67.5) return 'NE';
	if (degrees >= 67.5 && degrees < 112.5) return 'E';
	if (degrees >= 112.5 && degrees < 157.5) return 'SE';
	if (degrees >= 157.5 && degrees < 202.5) return 'S';
	if (degrees >= 202.5 && degrees < 247.5) return 'SW';
	if (degrees >= 247.5 && degrees < 292.5) return 'W';
	return 'NW';
}

function getWindArrow(degrees) {
	if (degrees >= 337.5 || degrees < 22.5) return '↓';
	if (degrees >= 22.5 && degrees < 67.5) return '↙';
	if (degrees >= 67.5 && degrees < 112.5) return '←';
	if (degrees >= 112.5 && degrees < 157.5) return '↖';
	if (degrees >= 157.5 && degrees < 202.5) return '↑';
	if (degrees >= 202.5 && degrees < 247.5) return '↗';
	if (degrees >= 247.5 && degrees < 292.5) return '→';
	return '↘';
}

function getLevel(temp, min, max) {
	if (max === min) return 5;
	return Math.max(1, Math.round(((temp - min) / (max - min)) * 10));
}

function getRainHeight(precipitation) {
	return `${Math.min(84, Math.max(3, precipitation * 18))}%`;
}

function getLocationLabel(location) {
	return [location.country, location.admin1 || location.admin2 || location.name]
		.filter(Boolean)
		.join(' / ');
}

function getSuggestionLabel(location) {
	return [location.name, location.admin1 || location.admin2, location.country]
		.filter(Boolean)
		.join(', ');
}

function setSearchStatus(message, isError = false) {
	searchStatus.textContent = message;
	searchStatus.classList.toggle('site-header__search-status--error', isError);
}

function setLoading(isLoading) {
	searchInput.disabled = isLoading;
	searchForm.classList.toggle('site-header__search--loading', isLoading);
}

function hideSuggestions() {
	suggestionsList.classList.remove('site-header__suggestions--open');
	suggestionsList.innerHTML = '';
}

function renderSuggestions(locations) {
	latestSuggestions = locations;
	suggestionsList.innerHTML = '';

	if (locations.length === 0) {
		hideSuggestions();
		return;
	}

	locations.forEach((location) => {
		const item = document.createElement('li');
		const button = document.createElement('button');

		button.type = 'button';
		button.textContent = getSuggestionLabel(location);
		button.addEventListener('click', () => {
			hideSuggestions();
			loadWeather(location);
		});

		item.append(button);
		suggestionsList.append(item);
	});

	suggestionsList.classList.add('site-header__suggestions--open');
}

async function searchLocations(query, count = 5) {
	const response = await fetch(
		`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`
	);

	if (!response.ok) {
		throw new Error('Location request failed');
	}

	const data = await response.json();

	if (!data.results || data.results.length === 0) {
		throw new Error('Location not found');
	}

	return data.results;
}

async function findLocation(query) {
	const locations = await searchLocations(query, 1);
	return locations[0];
}

function updatePageHeader(data) {
	const currentTemp = data.current ? formatTemp(data.current.temperature_2m) : formatTemp(days[activeIndex].max);
	const currentCode = data.current ? data.current.weather_code : days[activeIndex].code;
	const description = getWeatherDescription(currentCode);
	const locationLabel = getLocationLabel(currentLocation);
	const locationMeta = document.createElement('span');

	locationMeta.textContent = locationLabel;
	heroMeta.textContent = formatDateTime(new Date());
	heroMeta.append(locationMeta);
	heroTitle.textContent = `${description} in ${currentLocation.name}, ${currentTemp}${getUnitSymbol()}`;
	sectionTitle.textContent = `Weather in ${currentLocation.name} today`;
	temperatureTitle.textContent = `Air temperature, ${getUnitSymbol()}`;
	unitsLabel.textContent = getUnitSymbol();
	document.title = `Weather in ${currentLocation.name}`;
}

async function loadWeather(location = currentLocation) {
	try {
		setLoading(true);
		setSearchStatus('Loading forecast...');

		const response = await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&past_days=1&forecast_days=7&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=ms&timezone=auto${getForecastUnitParam()}`
		);

		if (!response.ok) {
			throw new Error('Weather request failed');
		}

		const data = await response.json();

		days = data.daily.time.map((date, index) => {
			const hoursForThisDay = data.hourly.time
				.map((time, hourIndex) => {
					return {
						time,
						temp: data.hourly.temperature_2m[hourIndex],
						code: data.hourly.weather_code[hourIndex],
						precipitation: data.hourly.precipitation[hourIndex],
						windSpeed: data.hourly.wind_speed_10m[hourIndex],
						windDirection: data.hourly.wind_direction_10m[hourIndex],
						windGust: data.hourly.wind_gusts_10m[hourIndex],
					};
				})
				.filter((hour) => hour.time.startsWith(date));

			return {
				date,
				day: formatDay(date),
				label: getDayLabel(index),
				min: Math.round(data.daily.temperature_2m_min[index]),
				max: Math.round(data.daily.temperature_2m_max[index]),
				code: data.daily.weather_code[index],
				hours: hoursForThisDay,
			};
		});

		activeIndex = 1;
		currentLocation = location;
		searchInput.value = currentLocation.name;
		hideSuggestions();
		updatePageHeader(data);
		renderCards();
		setSearchStatus('');
	} catch (error) {
		console.error(error);
		setSearchStatus(error.message === 'Location not found' ? 'Location not found' : 'Could not load weather', true);
	} finally {
		setLoading(false);
	}
}

function renderCards() {
	const visibleDays = [
		days[activeIndex - 1],
		days[activeIndex],
		days[activeIndex + 1],
	];

	cards.forEach((card, index) => {
		const day = visibleDays[index];

		card.querySelector('.daily-card__date').textContent = day.day;
		card.querySelector('.daily-card__label').textContent = day.label;
		card.querySelector('.temp-step--low').textContent = formatTemp(day.min);
		card.querySelector('.temp-step--high').textContent = formatTemp(day.max);

		const icon = card.querySelector('.weather-icon__image');
		icon.src = getWeatherIconSrc(day.code);

		card.classList.toggle('daily-card--active', index === 1);
	});

	renderHourly(days[activeIndex]);
}

function renderHourly(day) {
	const selectedHours = day.hours.filter((hour) => {
		const hourNumber = new Date(hour.time).getHours();

		return [2, 5, 8, 11, 14, 17, 20, 23].includes(hourNumber);
	});

	const temperatures = selectedHours.map((hour) => hour.temp);
	const minTemp = Math.min(...temperatures);
	const maxTemp = Math.max(...temperatures);

	selectedHours.forEach((hour, index) => {
		if (!hourTimes[index] || !hourTemps[index] || !hourWinds[index] || !hourGusts[index] || !hourPrecipitations[index] || !hourIcons[index]) {
			return;
		}

		hourTimes[index].textContent = formatHour(hour.time);
		hourTemps[index].textContent = formatTemp(hour.temp);
		hourTemps[index].dataset.temp = formatTemp(hour.temp);
		hourTemps[index].style.setProperty('--level', getLevel(hour.temp, minTemp, maxTemp));

		hourWinds[index].innerHTML = `<b>${getWindArrow(hour.windDirection)}</b> ${getWindDirection(hour.windDirection)}`;
		hourGusts[index].textContent = Math.round(hour.windGust ?? hour.windSpeed);

		hourPrecipitations[index].textContent = hour.precipitation;
		hourPrecipitations[index].style.setProperty('--rain', getRainHeight(hour.precipitation));

		hourIcons[index].src = getWeatherIconSrc(hour.code);
	});
}

searchInput.addEventListener('input', () => {
	const query = searchInput.value.trim();
	clearTimeout(suggestionTimer);

	if (query.length < 3) {
		hideSuggestions();
		setSearchStatus('');
		return;
	}

	suggestionTimer = setTimeout(async () => {
		try {
			const locations = await searchLocations(query);
			renderSuggestions(locations);
			setSearchStatus('');
		} catch (error) {
			console.error(error);
			hideSuggestions();
			setSearchStatus(error.message === 'Location not found' ? 'No matches' : 'Could not load suggestions', true);
		}
	}, 250);
});

searchInput.addEventListener('focus', () => {
	if (latestSuggestions.length > 0 && searchInput.value.trim().length >= 3) {
		renderSuggestions(latestSuggestions);
	}
});

searchForm.addEventListener('submit', async (event) => {
	event.preventDefault();

	const query = searchInput.value.trim();

	if (!query) {
		setSearchStatus('Enter a city name', true);
		return;
	}

	try {
		setLoading(true);
		setSearchStatus('Searching...');
		const location = latestSuggestions.find((suggestion) => {
			return getSuggestionLabel(suggestion).toLowerCase() === query.toLowerCase();
		}) || await findLocation(query);
		await loadWeather(location);
	} catch (error) {
		console.error(error);
		setSearchStatus(error.message === 'Location not found' ? 'Location not found' : 'Could not find this location', true);
		setLoading(false);
	}
});

bubbleClose.addEventListener('click', () => {
	bubble.hidden = true;
});

unitsButton.addEventListener('click', () => {
	const isOpen = unitsWrap.classList.toggle('site-header__units-wrap--open');
	unitsButton.setAttribute('aria-expanded', String(isOpen));
});

unitOptions.forEach((option) => {
	option.addEventListener('click', async () => {
		const nextUnit = option.dataset.unit;

		if (nextUnit === currentUnit) {
			unitsWrap.classList.remove('site-header__units-wrap--open');
			unitsButton.setAttribute('aria-expanded', 'false');
			return;
		}

		currentUnit = nextUnit;
		unitOptions.forEach((unitOption) => {
			unitOption.setAttribute('aria-checked', String(unitOption.dataset.unit === currentUnit));
		});
		unitsWrap.classList.remove('site-header__units-wrap--open');
		unitsButton.setAttribute('aria-expanded', 'false');
		await loadWeather(currentLocation);
	});
});

document.addEventListener('click', (event) => {
	if (!searchForm.contains(event.target)) {
		hideSuggestions();
	}

	if (!unitsWrap.contains(event.target)) {
		unitsWrap.classList.remove('site-header__units-wrap--open');
		unitsButton.setAttribute('aria-expanded', 'false');
	}
});

cards.forEach((card, index) => {
	card.addEventListener('click', () => {

		const isFirstDay =
			index === 0 && activeIndex === 1;

		const isLastDay =
			index === 2 && activeIndex === days.length - 2;

		if (isFirstDay || isLastDay) {
			cards.forEach(c =>
				c.classList.remove('daily-card--active')
			);

			card.classList.add('daily-card--active');
			renderHourly(days[activeIndex + index - 1]);

			return;
		}

		if (index === 0) {
			activeIndex--;
		}

		if (index === 2) {
			activeIndex++;
		}

		renderCards();
	});
});

loadWeather();
