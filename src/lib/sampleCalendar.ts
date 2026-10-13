// A sample family calendar (from the prototype) for people trying SharePa without a calendar export.
export const SAMPLE_CALENDAR: { title: string; place: string; weekday: number; time: string; kind: "child" | "family" | "personal" }[] = [
  { title: "Dentist (me)", weekday: 0, time: "08:00", place: "Dr. Kerekes, Bartók B. út", kind: "personal" },
  { title: "Swimming practice", weekday: 0, time: "16:30", place: "Komjádi pool", kind: "child" },
  { title: "Yoga class", weekday: 0, time: "19:00", place: "Flow studio", kind: "personal" },
  { title: "Team meeting", weekday: 1, time: "09:30", place: "Office, Váci út", kind: "personal" },
  { title: "Piano lesson", weekday: 1, time: "17:00", place: "Music school, Villányi út", kind: "child" },
  { title: "Art school", weekday: 2, time: "15:30", place: "Kisrajzolók studio", kind: "child" },
  { title: "Dinner at grandma’s", weekday: 2, time: "19:00", place: "Grandma’s, Budaörs", kind: "family" },
  { title: "Maths tutor", weekday: 3, time: "16:00", place: "Mrs. Fehér, Etele út", kind: "child" },
  { title: "Book club", weekday: 3, time: "20:00", place: "Café Madách", kind: "personal" },
  { title: "Judo", weekday: 4, time: "16:30", place: "MOM Sport", kind: "child" },
  { title: "Dinner with friends", weekday: 4, time: "19:30", place: "Bistro Kelenföld", kind: "personal" },
  { title: "Football match", weekday: 5, time: "09:00", place: "BVSC field", kind: "child" },
  { title: "Grandma’s birthday lunch", weekday: 5, time: "12:00", place: "Grandma’s, Budaörs", kind: "family" },
  { title: "Family hike", weekday: 6, time: "10:00", place: "Normafa", kind: "family" },
  { title: "Choir rehearsal", weekday: 6, time: "17:00", place: "Kelenföld Primary", kind: "child" },
];
