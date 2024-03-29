// in miliseconds
const units = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: (24 * 60 * 60 * 1000 * 365) / 12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
} as const;

var rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

var getRelativeTime = (d1: Date, d2 = new Date()) => {
  var elapsed = (d1 as any) - (d2 as any);

  // "Math.abs" accounts for both "past" & "future" scenarios
  for (var u in units)
    if (Math.abs(elapsed) > units[u as keyof typeof units] || u == "second")
      return rtf.format(
        Math.round(elapsed / units[u as keyof typeof units]),
        u as keyof typeof units
      );
};

export default getRelativeTime;
