import moment from "moment"

export const dateToUnixTimestamp = (date) => {
  if (date instanceof Date) {
    return (date.getTime() / 1000).toFixed(0)
  }
  return null
}

export const atMidnight = (date) => {
  const result = moment(date)
  if (!moment.isMoment(result)) {
    console.log("date is not instance of Moment: ", date)
    return null
  }
  result.hour(0)
  result.minute(0)
  result.second(0)
  result.millisecond(0)

  return result
}

export const addHours = (date, hours) => {
  return moment(date)?.add(hours, "hours")
}

// Returns { year, month, day } for a Date as seen in Ontario (America/Toronto) time.
const getTorontoDateParts = (date) => {
  const parts = {}
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).forEach(({ type, value }) => { parts[type] = value })
  return { year: parseInt(parts.year, 10), month: parseInt(parts.month, 10), day: parseInt(parts.day, 10) }
}

// Converts an Ontario (America/Toronto) calendar date's midnight to a Unix timestamp (seconds).
// Handles DST by trying both possible UTC offsets (EDT -4 / EST -5) and picking the one
// whose Toronto wall-clock hour actually reads back as 0.
const torontoMidnightToUnix = (year, month, day) => {
  for (const offsetHours of [4, 5]) {
    const candidate = new Date(Date.UTC(year, month - 1, day, offsetHours, 0, 0, 0))
    const torontoHour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Toronto",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(candidate),
      10,
    )
    if (torontoHour === 0) {
      return Math.floor(candidate.getTime() / 1000)
    }
  }
  return Math.floor(new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0)).getTime() / 1000)
}

/**
 * The format is: [gt]=number|option
 * e.g: [gt]=2|days
 * Relative to the current calendar day in Ontario (America/Toronto) time, not the browser's
 * local timezone, so the window is the same for every admin regardless of where they are.
 * @param {*} value
 */

export const relativeDateFormatToTimestamp = (value) => {
  const [count, option] = value.split("|")

  const today = getTorontoDateParts(new Date())
  const target = moment({ year: today.year, month: today.month - 1, day: today.day }).subtract(
    parseInt(count, 10),
    option,
  )

  return `${torontoMidnightToUnix(target.year(), target.month() + 1, target.date())}`
}

// Format a date in Ontario (America/Toronto) timezone.
// Returns a string like "9 July 2026 04:37 pm" — matches moment's 'D MMMM YYYY hh:mm a'.
export const formatTorontoLong = (date) => {
  const d = new Date(date)
  const parts = {}
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Toronto',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d).forEach(({ type, value }) => { parts[type] = value })
  return `${parts.day} ${parts.month} ${parts.year} ${parts.hour}:${parts.minute} ${(parts.dayPeriod || '').toLowerCase()}`
}

// Format a date in Ontario (America/Toronto) timezone.
// Returns a string like "09 Jul 2026 04:37" — matches moment's 'DD MMM YYYY hh:mm'.
export const formatTorontoShort = (date) => {
  const d = new Date(date)
  const parts = {}
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d).forEach(({ type, value }) => { parts[type] = value })
  return `${parts.day} ${parts.month} ${parts.year} ${parts.hour}:${parts.minute}`
}

// Format only the date part in Ontario timezone: "09 Jul 2026"
export const formatTorontoDate = (date) => {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Toronto',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

// Takes in a value from the date picker e.g. 42|days or a timestamp
export const formatDateFilter = (filter) => {
  return Object.entries(filter).reduce((acc, [key, value]) => {
    if (value.includes("|")) {
      acc[key] = relativeDateFormatToTimestamp(value)
    } else {
      acc[key] = value
    }
    return acc
  }, {})
}
