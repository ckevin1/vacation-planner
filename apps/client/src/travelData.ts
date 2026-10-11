export const airports = [
  {
    code: "ATL",
    city: "Atlanta",
    name: "Hartsfield-Jackson Atlanta International Airport",
    timeZone: "America/New_York",
  },
  {
    code: "BOS",
    city: "Boston",
    name: "Boston Logan International Airport",
    timeZone: "America/New_York",
  },
  {
    code: "CDG",
    city: "Paris",
    name: "Charles de Gaulle Airport",
    timeZone: "Europe/Paris",
  },
  {
    code: "DEN",
    city: "Denver",
    name: "Denver International Airport",
    timeZone: "America/Denver",
  },
  {
    code: "DFW",
    city: "Dallas-Fort Worth",
    name: "Dallas Fort Worth International Airport",
    timeZone: "America/Chicago",
  },
  {
    code: "JFK",
    city: "New York",
    name: "John F. Kennedy International Airport",
    timeZone: "America/New_York",
  },
  {
    code: "LAS",
    city: "Las Vegas",
    name: "Harry Reid International Airport",
    timeZone: "America/Los_Angeles",
  },
  {
    code: "LAX",
    city: "Los Angeles",
    name: "Los Angeles International Airport",
    timeZone: "America/Los_Angeles",
  },
  {
    code: "LHR",
    city: "London",
    name: "Heathrow Airport",
    timeZone: "Europe/London",
  },
  {
    code: "MCO",
    city: "Orlando",
    name: "Orlando International Airport",
    timeZone: "America/New_York",
  },
  {
    code: "MIA",
    city: "Miami",
    name: "Miami International Airport",
    timeZone: "America/New_York",
  },
  {
    code: "ORD",
    city: "Chicago",
    name: "O'Hare International Airport",
    timeZone: "America/Chicago",
  },
    {
      code: 'OKC',
      city: 'Oklahoma City',
      name: 'Will Rogers World Airport',
      timeZone: 'America/Chicago',
    },
  {
    code: "SEA",
    city: "Seattle",
    name: "Seattle-Tacoma International Airport",
    timeZone: "America/Los_Angeles",
  },
  {
    code: "SFO",
    city: "San Francisco",
    name: "San Francisco International Airport",
    timeZone: "America/Los_Angeles",
  },
  {
    code: "YVR",
    city: "Vancouver",
    name: "Vancouver International Airport",
    timeZone: "America/Vancouver",
  },
] as const;

export function findAirport(code: string) {
  return airports.find((airport) => airport.code === code.toUpperCase());
}

export function airportLabel(code: string, city?: string) {
  const airport = findAirport(code);
  return airport
    ? `${airport.city} (${airport.code})`
    : city
      ? `${city} (${code || "???"})`
      : code;
}
