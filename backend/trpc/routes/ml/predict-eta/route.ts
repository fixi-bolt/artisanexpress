import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

interface TrafficData {
  level: 'low' | 'medium' | 'high';
  delayMinutes: number;
}

interface WeatherData {
  condition: 'clear' | 'rain' | 'snow' | 'storm';
  impactMinutes: number;
}

export const predictEtaProcedure = protectedProcedure
  .input(
    z.object({
      artisanLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      clientLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
      dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
    })
  )
  .query(async ({ input }) => {
    console.log("[ML] Predicting ETA with input:", input);

    const distance = calculateDistance(
      input.artisanLocation.latitude,
      input.artisanLocation.longitude,
      input.clientLocation.latitude,
      input.clientLocation.longitude
    );

    const trafficData = await getTrafficData(input.artisanLocation, input.clientLocation);
    const weatherData = await getWeatherData(input.clientLocation);
    
    const currentHour = new Date().getHours();
    const timeOfDay = input.timeOfDay || getTimeOfDay(currentHour);
    const dayOfWeek = input.dayOfWeek || getDayOfWeek();

    const baseTime = distance * 3;

    const trafficMultiplier = getTrafficMultiplier(trafficData.level, timeOfDay);
    const weatherImpact = weatherData.impactMinutes;
    const peakHourImpact = getPeakHourImpact(timeOfDay, dayOfWeek);

    const predictedMinutes = Math.round(
      baseTime * trafficMultiplier + weatherImpact + peakHourImpact + trafficData.delayMinutes
    );

    const confidenceScore = calculateConfidence(distance, trafficData, weatherData);

    const estimatedArrival = new Date();
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + predictedMinutes);

    console.log("[ML] ETA prediction:", {
      baseTime,
      trafficMultiplier,
      weatherImpact,
      peakHourImpact,
      predictedMinutes,
      confidenceScore,
    });

    return {
      etaMinutes: predictedMinutes,
      estimatedArrival: estimatedArrival.toISOString(),
      confidence: confidenceScore,
      breakdown: {
        baseDistance: Math.round(distance),
        baseTime: Math.round(baseTime),
        trafficDelay: trafficData.delayMinutes,
        weatherImpact,
        peakHourImpact,
      },
      factors: {
        traffic: trafficData.level,
        weather: weatherData.condition,
        timeOfDay,
        dayOfWeek,
      },
    };
  });

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

async function getTrafficData(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): Promise<TrafficData> {
  const hour = new Date().getHours();
  
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return { level: 'high', delayMinutes: Math.floor(Math.random() * 15) + 10 };
  } else if ((hour >= 10 && hour <= 16) || (hour >= 20 && hour <= 22)) {
    return { level: 'medium', delayMinutes: Math.floor(Math.random() * 10) + 3 };
  } else {
    return { level: 'low', delayMinutes: Math.floor(Math.random() * 5) };
  }
}

async function getWeatherData(location: { latitude: number; longitude: number }): Promise<WeatherData> {
  const conditions: WeatherData['condition'][] = ['clear', 'rain', 'snow', 'storm'];
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  
  const impactMap: Record<WeatherData['condition'], number> = {
    clear: 0,
    rain: 5,
    snow: 15,
    storm: 25,
  };
  
  return {
    condition: randomCondition,
    impactMinutes: impactMap[randomCondition],
  };
}

function getTrafficMultiplier(level: TrafficData['level'], timeOfDay: string): number {
  const multipliers = {
    low: 1.0,
    medium: 1.3,
    high: 1.7,
  };
  
  const peakMultiplier = (timeOfDay === 'morning' || timeOfDay === 'evening') ? 1.2 : 1.0;
  
  return multipliers[level] * peakMultiplier;
}

function getPeakHourImpact(timeOfDay: string, dayOfWeek: string): number {
  const isWeekday = !['saturday', 'sunday'].includes(dayOfWeek);
  const isPeakHour = timeOfDay === 'morning' || timeOfDay === 'evening';
  
  if (isWeekday && isPeakHour) {
    return 10;
  } else if (isWeekday) {
    return 3;
  }
  return 0;
}

function calculateConfidence(distance: number, traffic: TrafficData, weather: WeatherData): number {
  let confidence = 0.95;
  
  if (distance > 20) confidence -= 0.15;
  else if (distance > 10) confidence -= 0.08;
  
  if (traffic.level === 'high') confidence -= 0.12;
  else if (traffic.level === 'medium') confidence -= 0.06;
  
  if (weather.condition === 'storm') confidence -= 0.15;
  else if (weather.condition === 'snow') confidence -= 0.10;
  else if (weather.condition === 'rain') confidence -= 0.05;
  
  return Math.max(0.5, Math.min(0.99, confidence));
}

function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function getDayOfWeek(): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  return days[new Date().getDay()];
}
