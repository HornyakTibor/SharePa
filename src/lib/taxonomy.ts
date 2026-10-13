// Activity categories and the name-based suggestions from the SharePa prototype.

export const TAXONOMY = [
  { name: "Sport", icon: "S", hint: "Clubs, training, matches", activities: ["Swimming", "Soccer", "Basketball", "Tennis", "Gymnastics", "Judo", "Handball"] },
  { name: "Music", icon: "M", hint: "Lessons, choir, band", activities: ["Piano", "Guitar", "Violin", "Drums", "Choir", "Flute"] },
  { name: "Art", icon: "A", hint: "Art school, crafts, drama", activities: ["Drawing", "Painting", "Ceramics", "Drama", "Photography"] },
  { name: "Dance", icon: "D", hint: "Classes and rehearsals", activities: ["Ballet", "Hip-hop", "Folk dance", "Jazz dance", "Ballroom"] },
  { name: "Private teacher", icon: "T", hint: "Tutoring and exam prep", activities: ["Maths", "English", "Hungarian", "Physics", "Exam prep"] },
  { name: "Languages", icon: "L", hint: "Language school", activities: ["English", "German", "French", "Spanish", "Italian"] },
] as const;

const SUGGEST: [RegExp, string, string | null][] = [
  [/swim/, "Sport", "Swimming"], [/football|soccer/, "Sport", "Soccer"], [/basketball/, "Sport", "Basketball"], [/tennis/, "Sport", "Tennis"],
  [/gymnast/, "Sport", "Gymnastics"], [/judo/, "Sport", "Judo"], [/handball/, "Sport", "Handball"],
  [/piano/, "Music", "Piano"], [/guitar/, "Music", "Guitar"], [/violin/, "Music", "Violin"], [/drum/, "Music", "Drums"], [/choir|singing/, "Music", "Choir"], [/flute/, "Music", "Flute"],
  [/art school|drawing/, "Art", "Drawing"], [/painting/, "Art", "Painting"], [/ceramic|pottery/, "Art", "Ceramics"], [/drama|theat/, "Art", "Drama"], [/photo/, "Art", "Photography"],
  [/ballet/, "Dance", "Ballet"], [/hip.?hop/, "Dance", "Hip-hop"], [/folk/, "Dance", "Folk dance"], [/jazz/, "Dance", "Jazz dance"], [/ballroom/, "Dance", "Ballroom"],
  [/english/, "Languages", "English"], [/german/, "Languages", "German"], [/french/, "Languages", "French"], [/spanish/, "Languages", "Spanish"], [/italian/, "Languages", "Italian"],
  [/math/, "Private teacher", "Maths"], [/physics/, "Private teacher", "Physics"], [/hungarian/, "Private teacher", "Hungarian"], [/exam/, "Private teacher", "Exam prep"],
  [/tutor/, "Private teacher", null], [/dance/, "Dance", null], [/music|lesson/, "Music", null], [/\bart\b/, "Art", null], [/practice|training|match|club/, "Sport", null],
];

export type Suggestion = { category: string; activity: string | null; word: string };

/** "Swimming practice" → Sport · Swimming (because it contains "swim"). */
export function suggestCategory(title: string): Suggestion | null {
  const t = title.toLowerCase();
  for (const [re, category, activity] of SUGGEST) {
    const m = t.match(re);
    if (m) return { category, activity, word: m[0] };
  }
  return null;
}

/** A best guess for imported events: anything that looks like an activity is a kids' event. */
export function guessKind(title: string): "child" | "family" | "personal" {
  if (suggestCategory(title)) return "child";
  if (/family|grandma|grandpa|birthday|nagymama|nagypapa/i.test(title)) return "family";
  return "personal";
}
