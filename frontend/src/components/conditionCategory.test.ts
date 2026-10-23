import { describe, expect, it } from 'vitest';
import { classifyCondition } from './conditionCategory';

describe('classifyCondition', () => {
  it.each([
    ['Thundery Showers', 'thunderstorm'],
    ['Heavy Thunderstorm', 'thunderstorm'],
    ['Moderate Rain', 'rain'],
    ['Passing Showers', 'rain'],
    ['Snow Flurries', 'snow'],
    ['Light Sleet', 'snow'],
    ['Fair and Clear', 'clear'],
    ['Sunny', 'clear'],
    ['Cloudy', 'cloudy'],
    ['Overcast', 'cloudy'],
  ])('classifies "%s" as %s', (condition, expected) => {
    expect(classifyCondition(condition)).toBe(expected);
  });

  it('defaults to cloudy for null, undefined, or empty input', () => {
    expect(classifyCondition(null)).toBe('cloudy');
    expect(classifyCondition(undefined)).toBe('cloudy');
    expect(classifyCondition('')).toBe('cloudy');
  });
});
