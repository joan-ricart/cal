interface CalendarDay {
  date: Date
  position: number
  firstDay: boolean
  lastDay: boolean
  today: boolean
}

const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = today.getMonth()

const months = Array.from(Array(12), (_, i) => i)
const days = Array.from(Array(7), (_, i) => i)
const dayNames = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
]

const cal = document.getElementById('cal')

const createMonthCalendar = (year: number, month: number) => {
  const days = daysInMonth(year, month)
  const daysArray = Array.from(Array(days), (_, i) => i + 1)
  const monthName = new Date(year, month).toLocaleString('default', {
    month: 'long'
  })
  const calDays: Array<CalendarDay> = []

  daysArray.forEach((day, i) => {
    const date = new Date(Date.UTC(year, month, day))
    calDays.push({
      date: date,
      position: date.getDay(),
      firstDay: i === 0,
      lastDay: i === daysArray.length - 1,
      today: date.toDateString() === today.toDateString()
    })
  })

  const calMonth = document.createElement('div')
  calMonth.classList.add('cal-month')

  const calTitle = document.createElement('div')
  calTitle.classList.add('cal-month-name')
  calTitle.innerHTML = `${monthName} ${year}`

  const calDayNames = document.createElement('div')
  calDayNames.classList.add('cal-day-names')

  dayNames.forEach((dayName) => {
    const calDayName = document.createElement('div')
    calDayName.classList.add('cal-day-name')
    calDayName.innerHTML = dayName
    calDayNames.appendChild(calDayName)
  })

  const calGrid = document.createElement('div')
  calGrid.classList.add('cal-grid')

  calDays.forEach((calDay) => {
    const calDayEl = document.createElement('div')
    calDayEl.classList.add('cal-day')
    calDayEl.innerHTML = calDay.date.getDate().toString()
    calDayEl.dataset.date = calDay.date.toISOString().split('T')[0]

    if (calDay.today) {
      calDayEl.classList.add('cal-day--today')
    }

    if (calDay.firstDay) {
      calDayEl.classList.add('cal-day--first')
      calDayEl.style.gridColumnStart = calDays[0].position.toString()
    }

    if (calDay.lastDay) {
      calDayEl.classList.add('cal-day--last')
    }

    calDayEl.addEventListener('click', handleDayClick)

    calGrid.appendChild(calDayEl)
  })

  calMonth.appendChild(calTitle)
  calMonth.appendChild(calDayNames)
  calMonth.appendChild(calGrid)
  cal?.appendChild(calMonth)
}

let state = {
  rangeSelecting: false,
  dateRange: {
    start: '',
    end: ''
  },
  selectedDates: new Set<string>()
}

function initCalendars(num: number) {
  for (let i = 0; i < num; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() + i)
    createMonthCalendar(date.getFullYear(), date.getMonth())
  }
}

function handleDayClick(e: MouseEvent) {
  const beginRangeSelection = e.ctrlKey
  const target = e.target as HTMLElement
  const date = target.dataset.date as string

  document
    .querySelector('.cal-day--preselected')
    ?.classList.remove('cal-day--preselected')

  if (beginRangeSelection) {
    state.rangeSelecting = true
    state.dateRange.start = date
    document.querySelectorAll('[data-date]').forEach((day) => {
      day.addEventListener('mouseover', highlightPreselection)
    })
    target.classList.add('cal-day--preselected')
    return
  }

  if (state.rangeSelecting) {
    state.rangeSelecting = false
    state.dateRange.end = date
    document.querySelectorAll('[data-date]').forEach((day) => {
      day.removeEventListener('mouseover', highlightPreselection)
      day.classList.remove('cal-day--preselected')
    })
    getCalendarDaysInBetween(state.dateRange.start, state.dateRange.end)
    return
  }

  if (state.selectedDates.has(date)) {
    state.selectedDates.delete(date)
    target.classList.remove('cal-day--selected')
  } else {
    state.selectedDates.add(date)
    target.classList.add('cal-day--selected')
  }

  console.log(state.selectedDates)
}

const getCalendarDaysInBetween = (startDate: string, endDate: string) => {
  const formattedStartDate = new Date(startDate)
  const formattedEndDate = new Date(endDate)

  const dateRange = getDatesInRange(formattedStartDate, formattedEndDate)
  dateRange.forEach((date) => {
    const day = document.querySelector(`[data-date="${date}"]`)
    day?.classList.add('cal-day--selected')
    state.selectedDates.add(date)
  })
}

function highlightPreselection(e: any) {
  document.querySelectorAll(`[data-date]`).forEach((day) => {
    day.classList.remove('cal-day--preselected')
  })

  const target = e.target as HTMLElement

  getDatesInRange(
    new Date(state.dateRange.start as string),
    new Date(target.dataset.date as string)
  ).forEach((date) => {
    const day = document.querySelector(`[data-date="${date}"]`)
    day?.classList.add('cal-day--preselected')
  })
}

function daysInMonth(year: number, month: number): number {
  return 32 - new Date(year, month, 32).getDate()
}

function getDatesInRange(startDate: Date, endDate: Date) {
  const defStartDate = endDate < startDate ? endDate : startDate
  const defEndDate = endDate < startDate ? startDate : endDate

  const date = new Date(defStartDate.getTime())
  const dates = []

  while (date <= defEndDate) {
    dates.push(new Date(date).toISOString().split('T')[0])
    date.setDate(date.getDate() + 1)
  }

  return dates
}

initCalendars(12)
