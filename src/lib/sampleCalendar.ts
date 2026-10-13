// A sample family calendar (from the prototype) for people trying SharePa without a calendar export.
export const SAMPLE_CALENDAR: {
  title: string;
  place: string;
  lat: number;
  lng: number;
  weekday: number;
  time: string;
  kind: "child" | "family" | "personal";
}[] = [
  { title: "Dentist (me)", weekday: 0, time: "08:00", place: "Dr. Kerekes, Bartók B. út", lat: 47.476, lng: 19.043, kind: "personal" },
  { title: "Swimming practice", weekday: 0, time: "16:30", place: "Komjádi pool", lat: 47.5256, lng: 19.0378, kind: "child" },
  { title: "Yoga class", weekday: 0, time: "19:00", place: "Flow studio", lat: 47.479, lng: 19.048, kind: "personal" },
  { title: "Team meeting", weekday: 1, time: "09:30", place: "Office, Váci út", lat: 47.532, lng: 19.068, kind: "personal" },
  { title: "Piano lesson", weekday: 1, time: "17:00", place: "Music school, Villányi út", lat: 47.4802, lng: 19.035, kind: "child" },
  { title: "Art school", weekday: 2, time: "15:30", place: "Kisrajzolók studio", lat: 47.466, lng: 19.028, kind: "child" },
  { title: "Dinner at grandma’s", weekday: 2, time: "19:00", place: "Grandma’s, Budaörs", lat: 47.4615, lng: 18.958, kind: "family" },
  { title: "Maths tutor", weekday: 3, time: "16:00", place: "Mrs. Fehér, Etele út", lat: 47.463, lng: 19.021, kind: "child" },
  { title: "Book club", weekday: 3, time: "20:00", place: "Café Madách", lat: 47.4985, lng: 19.062, kind: "personal" },
  { title: "Judo", weekday: 4, time: "16:30", place: "MOM Sport", lat: 47.4935, lng: 19.0215, kind: "child" },
  { title: "Dinner with friends", weekday: 4, time: "19:30", place: "Bistro Kelenföld", lat: 47.464, lng: 19.025, kind: "personal" },
  { title: "Football match", weekday: 5, time: "09:00", place: "BVSC field", lat: 47.5263, lng: 19.1003, kind: "child" },
  { title: "Grandma’s birthday lunch", weekday: 5, time: "12:00", place: "Grandma’s, Budaörs", lat: 47.4615, lng: 18.958, kind: "family" },
  { title: "Family hike", weekday: 6, time: "10:00", place: "Normafa", lat: 47.505, lng: 18.964, kind: "family" },
  { title: "Choir rehearsal", weekday: 6, time: "17:00", place: "Kelenföld Primary", lat: 47.4655, lng: 19.03, kind: "child" },
];
