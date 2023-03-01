interface CalendarDay {
    date: Date
    position: number
    firstDay: boolean
    lastDay: boolean
    today: boolean
}

enum Action {
    select,
    delete
}

interface Calendar {
    containerElement: HTMLElement
    inputElement: HTMLInputElement
    numberOfMonths: number
    selectedDates: Set<string>
    rangeSelecting: boolean
    dateRange: {
        start: string
        end: string
    }
    holdTimeout: any
    holding: boolean
    action: Action
}

interface CalendarOptions {
    containerElement: HTMLElement
    inputElement: HTMLInputElement
    numberOfMonths: number
    selectedDates: Set<string>
}

const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = today.getMonth()

const months = Array.from(Array(12), (_, i) => i)
const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
]
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

class Calendar {
    constructor(opts: CalendarOptions) {
        this.containerElement = opts.containerElement
        this.inputElement = opts.inputElement
        this.numberOfMonths = opts.numberOfMonths
        this.selectedDates = opts.selectedDates ?? new Set<string>()
        this.rangeSelecting = false
        this.dateRange = {
            start: '',
            end: ''
        }
        this.holdTimeout = null
        this.holding = false
        this.action = Action.select

        this.containerElement.classList.add('cals-grid')

        this.containerElement.addEventListener('mousedown', (e: any) => {
            this.beginSelection(e)
        })

        this.containerElement.addEventListener('mouseup', (e: any) => {
            if (this.holding) {
                this.dateRange.end = e.target?.dataset.date

                this.updateSelection(this.dateRange.start, this.dateRange.end)

                this.updateInputElement()
            }

            this.clearSelection()
        })

        this.containerElement.addEventListener('mouseleave', () => {
            this.clearSelection()
        })

        this.containerElement.addEventListener('mousemove', (e: any) => {
            if (!this.holding) return

            this.highlightPreselection(e)
            window?.getSelection()?.removeAllRanges()
        })

        this.renderCalendars(this.numberOfMonths)

        if (this.selectedDates.size > 0) {
            this.selectedDates.forEach((date) => {
                const day = document.querySelector(`[data-date="${date}"]`)
                day?.classList.add('cal-day--selected')
            })
        }

        this.updateInputElement()
    }

    renderCalendars(num: number) {
        for (let i = 0; i < num; i++) {
            const date = new Date()
            date.setMonth(date.getMonth() + i)
            this.createMonthCalendar(date.getFullYear(), date.getMonth())
        }
    }

    createMonthCalendar(year: number, month: number) {
        const days = daysInMonth(year, month)
        const daysArray = Array.from(Array(days), (_, i) => i + 1)
        const monthName = monthNames[month]
        const calDays: Array<CalendarDay> = []

        console.log(monthName)
        console.log(daysArray)

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

        console.log(calDays)

        const calMonth = document.createElement('div')
        calMonth.classList.add('cal-month')

        const calTitle = document.createElement('div')
        calTitle.classList.add('cal-month-name')
        calTitle.innerHTML = `${monthName} ${year}`

        const calDayNames = document.createElement('div')
        calDayNames.classList.add('cal-day-names')

        dayNames.forEach((dayName, i) => {
            const position = i == dayNames.length - 1 ? '0' : (i + 1).toString()
            const calDayName = document.createElement('div')
            calDayName.classList.add('cal-day-name')
            calDayName.dataset.position = position
            calDayName.innerHTML = dayName
            calDayName.addEventListener('click', () => {
                this.toggleColumnSelection(calDayName)
            })
            calDayNames.appendChild(calDayName)
        })

        const calGrid = document.createElement('div')
        calGrid.classList.add('cal-grid')

        calDays.forEach((calDay) => {
            const calDayEl = document.createElement('div')
            calDayEl.classList.add('cal-day')
            calDayEl.innerHTML = calDay.date.getDate().toString()
            let date = calDay.date.toISOString().split('T')[0]

            if (calDay.today) {
                calDayEl.classList.add('cal-day--today')
            }

            if (calDay.firstDay) {
                let colStart =
                    calDay.position == 0 ? '7' : calDay.position.toString()

                calDayEl.classList.add('cal-day--first')
                calDayEl.style.gridColumnStart = colStart
            }

            if (calDay.lastDay) {
                calDayEl.classList.add('cal-day--last')
            }

            if (
                calDay.date.setHours(0, 0, 0, 0) >= today.setHours(0, 0, 0, 0)
            ) {
                calDayEl.dataset.date = date
                calDayEl.dataset.position = calDay.position.toString()
            } else {
                calDayEl.classList.add('cal-day--disabled')
            }

            calDayEl.addEventListener('click', this.handleDayClick)

            calGrid.appendChild(calDayEl)
        })

        calMonth.appendChild(calTitle)
        calMonth.appendChild(calDayNames)
        calMonth.appendChild(calGrid)
        this.containerElement.appendChild(calMonth)
    }

    handleDayClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        const date = target.dataset.date as string
        if (this.selectedDates.has(date)) {
            this.selectedDates.delete(date)
            target.classList.remove('cal-day--selected')
        } else {
            this.selectedDates.add(date)
            target.classList.add('cal-day--selected')
        }
        this.updateInputElement()
    }

    updateSelection(startDate: string, endDate: string) {
        const formattedStartDate = new Date(startDate)
        const formattedEndDate = new Date(endDate)

        const dateRange = getDatesInRange(formattedStartDate, formattedEndDate)
        dateRange.forEach((date) => {
            const day = document.querySelector(`[data-date="${date}"]`)

            if (this.action === Action.delete) {
                day?.classList.remove('cal-day--selected')
                this.selectedDates.delete(date)
            } else {
                day?.classList.add('cal-day--selected')
                this.selectedDates.add(date)
            }
        })
    }

    highlightPreselection = (e: any) => {
        this.clearPreselection()

        const target = e.target as HTMLElement
        const activeclass =
            this.action === Action.delete
                ? 'cal-day--deleting'
                : 'cal-day--preselecting'

        getDatesInRange(
            new Date(this.dateRange.start as string),
            new Date(target.dataset.date as string)
        ).forEach((date) => {
            const day = document.querySelector(`[data-date="${date}"]`)
            day?.classList.add(activeclass)
        })
    }

    clearPreselection = () => {
        document.querySelectorAll(`[data-date]`).forEach((day) => {
            day.classList.remove('cal-day--preselecting', 'cal-day--deleting')
        })
    }

    getSelectedDates() {
        return [...this.selectedDates].sort()
    }

    updateInputElement() {
        this.inputElement.value = this.getSelectedDates().join(',')
    }

    beginSelection(e: any) {
        this.holdTimeout = setTimeout(() => {
            this.holding = true
            if (e.target.classList.contains('cal-day')) {
                const date = e.target.dataset.date
                this.dateRange.start = date

                if (this.selectedDates.has(date)) {
                    this.action = Action.delete
                } else {
                    this.action = Action.select
                }

                this.highlightPreselection(e)
            }
        }, 150)
    }

    clearSelection() {
        clearInterval(this.holdTimeout)
        this.clearPreselection()
        this.holding = false
    }

    toggleColumnSelection(element: HTMLElement) {
        const daysInColumn =
            element.parentElement?.parentElement?.querySelectorAll(
                `.cal-day[data-position="${element.dataset.position}"]`
            ) as any
        let columnAction = ''

        if (daysInColumn?.length) {
            const firstDate = daysInColumn[0].dataset.date
            if (this.selectedDates.has(firstDate)) {
                columnAction = 'remove'
            } else {
                columnAction = 'add'
            }
        }

        daysInColumn?.forEach((day: any) => {
            const date = day.dataset.date

            if (columnAction === 'remove') {
                this.selectedDates.delete(date)
                day.classList.remove('cal-day--selected')
            } else {
                this.selectedDates.add(date)
                day.classList.add('cal-day--selected')
            }
        })

        this.updateInputElement()
    }
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
