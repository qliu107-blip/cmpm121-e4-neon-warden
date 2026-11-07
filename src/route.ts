export type EnemyKind = "drone" | "dart" | "turret" | "lancer";
export interface Wave {
  at: number;
  kind: EnemyKind;
  count: number;
  x: number;
  formation: "line" | "vee" | "column" | "pincer";
}
export interface Sector {
  name: string;
  subtitle: string;
  length: number;
  waves: readonly Wave[];
}

/** Array order preserves creation order for enemies sharing a tick. */
export const SECTORS: readonly Sector[] = [
  {
    name: "Outer Drift",
    subtitle: "Scouts ahead",
    length: 1560,
    waves: [
      { at: 60, kind: "drone", count: 4, x: 240, formation: "line" },
      { at: 360, kind: "drone", count: 5, x: 168, formation: "vee" },
      { at: 660, kind: "drone", count: 5, x: 312, formation: "vee" },
      { at: 960, kind: "drone", count: 6, x: 240, formation: "line" },
      { at: 1200, kind: "drone", count: 4, x: 120, formation: "column" },
      { at: 1260, kind: "drone", count: 4, x: 360, formation: "column" },
    ],
  },
  {
    name: "Shatter Belt",
    subtitle: "Divers incoming",
    length: 1800,
    waves: [
      { at: 60, kind: "drone", count: 6, x: 240, formation: "vee" },
      { at: 300, kind: "dart", count: 4, x: 240, formation: "line" },
      { at: 600, kind: "dart", count: 5, x: 144, formation: "column" },
      { at: 720, kind: "dart", count: 5, x: 336, formation: "column" },
      { at: 1020, kind: "drone", count: 7, x: 240, formation: "line" },
      { at: 1140, kind: "dart", count: 5, x: 240, formation: "vee" },
      { at: 1440, kind: "dart", count: 6, x: 240, formation: "line" },
    ],
  },
  {
    name: "Gun Lanes",
    subtitle: "Turrets online",
    length: 1920,
    waves: [
      { at: 60, kind: "turret", count: 1, x: 240, formation: "line" },
      { at: 240, kind: "drone", count: 6, x: 240, formation: "vee" },
      { at: 540, kind: "turret", count: 2, x: 240, formation: "line" },
      { at: 840, kind: "dart", count: 6, x: 240, formation: "column" },
      { at: 1080, kind: "turret", count: 2, x: 240, formation: "line" },
      { at: 1140, kind: "drone", count: 6, x: 240, formation: "line" },
      { at: 1500, kind: "turret", count: 3, x: 240, formation: "line" },
    ],
  },
  {
    name: "Lancer Gate",
    subtitle: "Crossfire",
    length: 1920,
    waves: [
      { at: 60, kind: "lancer", count: 4, x: 240, formation: "pincer" },
      { at: 360, kind: "dart", count: 6, x: 240, formation: "vee" },
      { at: 600, kind: "lancer", count: 6, x: 240, formation: "pincer" },
      { at: 780, kind: "turret", count: 2, x: 240, formation: "line" },
      { at: 1140, kind: "lancer", count: 6, x: 240, formation: "pincer" },
      { at: 1260, kind: "drone", count: 8, x: 240, formation: "vee" },
      { at: 1560, kind: "dart", count: 8, x: 240, formation: "line" },
    ],
  },
  {
    name: "Last Approach",
    subtitle: "Everything they have",
    length: 2040,
    waves: [
      { at: 60, kind: "turret", count: 3, x: 240, formation: "line" },
      { at: 180, kind: "lancer", count: 6, x: 240, formation: "pincer" },
      { at: 540, kind: "dart", count: 6, x: 120, formation: "column" },
      { at: 540, kind: "dart", count: 6, x: 360, formation: "column" },
      { at: 900, kind: "drone", count: 9, x: 240, formation: "vee" },
      { at: 1020, kind: "turret", count: 2, x: 240, formation: "line" },
      { at: 1320, kind: "lancer", count: 8, x: 240, formation: "pincer" },
      { at: 1560, kind: "dart", count: 8, x: 240, formation: "vee" },
    ],
  },
];

export const WARDEN = {
  name: "The Warden",
  warning: "WARNING",
  subtitle: "The Warden approaches",
};

export const ENEMIES = {
  drone: { hp: 2, score: 100, radius: 13, dropChance: 0.015, shoots: true },
  dart: { hp: 1, score: 150, radius: 12, dropChance: 0.015, shoots: false },
  turret: { hp: 12, score: 400, radius: 19, dropChance: 0.3, shoots: true },
  lancer: { hp: 4, score: 250, radius: 15, dropChance: 0.06, shoots: true },
};
