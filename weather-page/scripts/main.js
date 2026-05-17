let days = [];

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

async function loadWeather() {
	const response = await fetch(
		'https://api.open-meteo.com/v1/forecast?latitude=48.2082&longitude=16.3738&past_days=1&forecast_days=7&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m&timezone=auto'
	);

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
	renderCards();
}

function renderHourly(day) {
	console.log(day.hours);
}

function getWeatherIconClass(code) {
	if (code === 0) return 'weather-icon--sun';
	if ([1, 2, 3].includes(code)) return 'weather-icon--partly-rain';
	if ([51, 53, 55, 61, 63, 65].includes(code)) return 'weather-icon--rain';
	if ([71, 73, 75].includes(code)) return 'weather-icon--snow';

	return 'weather-icon--cloud';
}

let activeIndex = 1;

const cards = document.querySelectorAll('.daily-card');

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
		card.querySelector('.temp-step--low').textContent = day.min;
		card.querySelector('.temp-step--high').textContent = day.max;

        const icon = card.querySelector('.weather-icon');
	    icon.className = 'weather-icon ' + getWeatherIconClass(day.code);


		card.classList.toggle('daily-card--active', index === 1);
	});
}

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

			return;
		}

		if (index === 0) {
			activeIndex--;
		}

		if (index === 2) {
			activeIndex++;
		}

		renderCards();
        renderHourly(days[activeIndex]);

	});
    
});



loadWeather();