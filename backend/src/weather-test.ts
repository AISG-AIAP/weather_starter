import { SingaporeWeatherClient } from './weather';

const client = new SingaporeWeatherClient({});
client.getCurrentWeather(1.296, 103.847).then(res => console.log("Success:", res)).catch(err => console.error("Error:", err));
