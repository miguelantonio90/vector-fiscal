/**
 * Misma regla que el backend: la fecha del vector (medianoche UTC) conserva su día,
 * y un instante con hora se lee en el calendario de Cuba.
 */
export function calendarParts(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && value.length <= 10) {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number)
    return { y, m, d }
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const midnightUtc = date.getUTCHours() === 0
    && date.getUTCMinutes() === 0
    && date.getUTCSeconds() === 0
    && date.getUTCMilliseconds() === 0
  if (midnightUtc) {
    return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() }
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Havana',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)
  const get = (type) => Number(parts.find((p) => p.type === type).value)
  return { y: get('year'), m: get('month'), d: get('day') }
}

export function countBusinessDays(dueDate, asOf = new Date()) {
  const due = calendarParts(dueDate)
  const end = calendarParts(asOf)
  if (!due || !end) return 0

  const startUtc = Date.UTC(due.y, due.m - 1, due.d)
  const endUtc = Date.UTC(end.y, end.m - 1, end.d)
  if (endUtc <= startUtc) return 0

  let count = 0
  for (let t = startUtc + 86400000; t <= endUtc; t += 86400000) {
    const dow = new Date(t).getUTCDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
}

export function calculateLateFee(principal, dueDate, asOf = new Date()) {
  if (!principal || principal <= 0 || !dueDate) return null
  const lateDays = countBusinessDays(dueDate, asOf)
  if (lateDays <= 0) return null

  let rate
  let desc
  if (lateDays <= 30) {
    rate = 0.02
    desc = `${lateDays} días hábiles de mora - 2% del principal`
  } else if (lateDays <= 60) {
    rate = 0.05
    desc = `${lateDays} días hábiles de mora - 5% del principal`
  } else {
    rate = Math.min(0.001 * lateDays, 0.40)
    desc = `${lateDays} días hábiles de mora - 0.1%/día (${(rate * 100).toFixed(1)}%, tope 40%)`
  }

  return {
    lateDays,
    rate,
    amount: Math.round(principal * rate * 100) / 100,
    desc
  }
}
