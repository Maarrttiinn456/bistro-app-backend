export const getStartDate = (date: string) => new Date(`${date}T00:00:00.000Z`)

export const getExclusiveEndDate = (date: string) => {
  const endDate = getStartDate(date)
  endDate.setUTCDate(endDate.getUTCDate() + 1)

  return endDate
}

export const getDateRange = (from: string, to: string) => {
  const dates: string[] = []
  const current = getStartDate(from)
  const last = getStartDate(to)

  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}
