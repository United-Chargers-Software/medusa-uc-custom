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

/**
 * The format is: [gt]=number|option
 * e.g: [gt]=2|days
 * @param {*} value
 */

export const relativeDateFormatToTimestamp = (value) => {
  const [count, option] = value.split("|")

  // relative days are always subtract
  let date = moment()

  date.subtract(parseInt(count), option)
  date = atMidnight(date)

  const result = `${date.format("X")}`

  return result
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
