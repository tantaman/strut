const seeds: string[] = [
  `INSERT OR IGNORE INTO "theme"
    ("id", "name", "bg_colorset", "fg_colorset", "fontset")
  VALUES (1, 'default', 'default', 'default', 'default');`,
  `INSERT OR IGNORE INTO "presenter"
    ("name", "available_transitions", "picked_transition")
  VALUES ('impress', '["custom"]', 'custom');`,
];

export default seeds;
