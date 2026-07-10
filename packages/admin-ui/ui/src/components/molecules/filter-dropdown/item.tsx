import * as RadixCollapsible from "@radix-ui/react-collapsible"
import * as RadixPopover from "@radix-ui/react-popover"

import { useEffect, useMemo, useState } from "react"
import { addHours, atMidnight, dateToUnixTimestamp } from "../../../utils/time"

import clsx from "clsx"
import moment from "moment"
import { DateFilters } from "../../../utils/filters"
import { CalendarComponent } from "../../atoms/date-picker/date-picker"
import NumberScroller from "../../atoms/number-scroller"
import Spinner from "../../atoms/spinner"
import ArrowRightIcon from "../../fundamentals/icons/arrow-right-icon"
import CheckIcon from "../../fundamentals/icons/check-icon"
import ChevronUpIcon from "../../fundamentals/icons/chevron-up"
import InputField from "../input"

const DAY_IN_SECONDS = 86400
const HOURS = [...Array(24).keys()]
const MINUTES = [...Array(60).keys()]

// Returns "YYYY-MM-DD" for a Date in Ontario timezone.
function getTorontoDateStr(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(date)
}

// Converts a Unix timestamp (seconds) to "HH:MM" in Ontario timezone.
function utcToTorontoTime(unixTs: string | number): string {
  const d = new Date(Number(unixTs) * 1000)
  const rawHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Toronto",
      hour: "numeric",
      hour12: false,
    }).format(d),
    10,
  )
  const hour = Math.min(23, Math.max(0, isNaN(rawHour) ? 0 : ((rawHour % 24) + 24) % 24))
  const rawMinute = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Toronto",
      minute: "2-digit",
    }).format(d),
    10,
  )
  const minute = Math.min(59, Math.max(0, isNaN(rawMinute) ? 0 : rawMinute))
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

// Converts a date + time string (HH:MM) treated as Ontario (America/Toronto) local time
// into a Unix timestamp in seconds (UTC). Handles DST automatically by trying EDT (UTC-4)
// and EST (UTC-5) and picking the one that round-trips correctly.
function torontoDateTimeToUnix(date: Date | null, timeStr: string): number | null {
  if (!date) return null
  const parts = timeStr.split(":").map(Number)
  const hours = Math.min(23, Math.max(0, isNaN(parts[0]) ? 0 : parts[0]))
  const minutes = Math.min(59, Math.max(0, isNaN(parts[1] ?? NaN) ? 0 : (parts[1] ?? 0)))
  if (isNaN(hours) || isNaN(minutes)) return null
  const [y, m, d] = moment(date).format("YYYY-MM-DD").split("-").map(Number)
  for (const off of [4, 5]) {
    const candidate = new Date(Date.UTC(y, m - 1, d, hours + off, minutes, 0, 0))
    const torontoHour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Toronto",
        hour: "2-digit",
        hour12: false,
      }).format(candidate),
      10,
    )
    if (torontoHour === hours) return Math.floor(candidate.getTime() / 1000)
  }
  return Math.floor(new Date(Date.UTC(y, m - 1, d, hours + 5, minutes, 0, 0)).getTime() / 1000)
}

/**
 * @deprecated Use `FilterMenu` instead
 */
const FilterDropdownItem = ({
  filterTitle,
  options,
  filters,
  open,
  setFilter,
  isLoading,
  hasMore,
  hasPrev,
  onShowNext,
  onShowPrev,
}) => {
  const prefilled = useMemo(() => {
    try {
      const toReturn = filters.reduce((acc, f) => {
        acc[f] = true
        return acc
      }, {})
      return toReturn
    } catch (e) {
      return {}
    }
  }, [filters])

  const [checked, setChecked] = useState(prefilled)

  const handlePrev = () => {
    if (onShowPrev) {
      onShowPrev()
    }
  }

  const handleNext = () => {
    if (onShowNext) {
      onShowNext()
    }
  }

  useEffect(() => {
    if (!open) {
      setChecked({})
    }
  }, [open])

  const onCheck = (filter) => {
    const checkedState = checked

    if (!checkedState[filter]) {
      checkedState[filter] = true
    } else {
      checkedState[filter] = false
    }

    const newFilter = Object.entries(checkedState).reduce(
      (acc, [key, value]) => {
        if (value === true) {
          acc.push(key)
        }
        return acc
      },
      []
    )

    setChecked(checkedState)

    setFilter({ open: open, filter: newFilter })
  }

  return (
    <div
      className={clsx("w-full cursor-pointer py-2 px-4 ", {
        "inter-small-semibold": open,
        "inter-small-regular": !open,
      })}
    >
      <RadixCollapsible.Root
        className="w-full"
        open={open}
        onOpenChange={(open) => setFilter({ filter: filters, open })}
      >
        <RadixCollapsible.Trigger
          className={clsx(
            "hover:bg-grey-5 flex w-full items-center justify-between rounded py-1.5 px-3",
            {
              "inter-small-semibold": open,
              "inter-small-regular": !open,
            }
          )}
        >
          <div className="flex items-center">
            <div
              className={`text-grey-0 border-grey-30 rounded-base flex h-5 w-5 justify-center border ${
                open && "bg-violet-60"
              }`}
            >
              <span className="self-center">
                {open && <CheckIcon size={16} />}
              </span>
            </div>
            <input
              id={filterTitle}
              className="hidden"
              checked={open}
              readOnly
              type="checkbox"
            />
            <span className="ml-2">{filterTitle}</span>
          </div>
          {open && (
            <span className="text-grey-50 self-end">
              <ChevronUpIcon size={20} />
            </span>
          )}
        </RadixCollapsible.Trigger>
        <RadixCollapsible.Content className="w-full">
          {hasPrev && (
            <div className="flex py-2 pl-6">
              <button
                onClick={handlePrev}
                className="hover:text-violet-60 text-grey-90 font-semibold"
              >
                Back
              </button>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-1">
              <Spinner size={"large"} variant={"secondary"} />
            </div>
          ) : filterTitle === "Date" ? (
            <DateFilter
              options={options}
              open={open}
              setFilter={setFilter}
              existingDate={filters}
              filterTitle={filterTitle}
            />
          ) : (
            options.map((el, i) => {
              let value: string
              let label: string

              if (typeof el === "string") {
                value = el
                label = el
              } else {
                value = el.value
                label = el.label
              }

              return (
                <div
                  className={clsx(
                    "hover:bg-grey-20 my-1 flex w-full items-center rounded py-1.5 pl-6",
                    {
                      "inter-small-semibold": checked[value],
                      "inter-small-regular": !checked[value],
                    }
                  )}
                  key={i}
                  onClick={() => onCheck(value)}
                >
                  <div
                    className={`text-grey-0 border-grey-30 rounded-base mr-2 flex h-5 w-5 justify-center border ${
                      checked[value] === true && "bg-violet-60"
                    }`}
                  >
                    <span className="self-center">
                      {checked[value] === true && <CheckIcon size={16} />}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    id={value}
                    name={label}
                    value={value}
                    checked={checked[value] === true}
                    readOnly
                    style={{ marginRight: "5px" }}
                  />
                  {label}
                </div>
              )
            })
          )}
          {hasMore && (
            <div className="flex py-2 pl-6">
              <button
                onClick={handleNext}
                className="hover:text-violet-60 text-grey-90 font-semibold"
              >
                Show more
              </button>
            </div>
          )}
        </RadixCollapsible.Content>
      </RadixCollapsible.Root>
    </div>
  )
}

export default FilterDropdownItem

const parseDateFilter = (filter) => {
  if (!filter) {
    return {}
  }
  const dateEntries = Object.entries(filter)

  /**
   * From a query object we need to figure out which date filter that is
   * being used of the following:
   *
   * InTheLast: { gt: "x|[days|months]" }
   * OlderThan: { lt: "x|[days|months]" }
   * Between: { lt: [ts], gt: [ts] }
   * After: { gt: [ts] }
   * Before: { lt: [ts] },
   * EqualTo: { lt: [midnight], gt: [morning] }
   *
   */

  const flags = {
    sawGt: false,
    sawLt: false,
    sawGtRelative: false,
    sawLtRelative: false,
  }

  for (const [key, value] of dateEntries) {
    switch (key) {
      case "gt": {
        flags.sawGt = true
        flags.sawGtRelative = value.includes("|")
        break
      }
      case "lt": {
        flags.sawLt = true
        flags.sawLtRelative = value.includes("|")
        break
      }
      default: {
        break
      }
    }
  }

  if (flags.sawGt && flags.sawGtRelative) {
    const [amount, daysMonths] = filter.gt.split("|")
    return {
      filterType: DateFilters.InTheLast,
      daysMonthsValue: daysMonths,
      relativeAmount: amount,
      value: null,
    }
  }

  if (flags.sawLt && flags.sawLtRelative) {
    const [amount, daysMonths] = filter.lt.split("|")
    return {
      filterType: DateFilters.OlderThan,
      daysMonthsValue: daysMonths,
      relativeAmount: amount,
      value: null,
    }
  }

  if (flags.sawLt && flags.sawGt) {
    const startTs = filter.gt
    const endTs = filter.lt
    const startDate = new Date(Number(startTs) * 1000)
    const endDate = new Date(Number(endTs) * 1000)

    // Detect EqualTo: both timestamps fall on the same Ontario calendar day
    if (getTorontoDateStr(startDate) === getTorontoDateStr(endDate)) {
      return {
        filterType: DateFilters.EqualTo,
        value: startDate,
        startTime: utcToTorontoTime(startTs),
        endTime: utcToTorontoTime(endTs),
      }
    }

    return {
      filterType: DateFilters.Between,
      value: startDate,
      endValue: endDate,
      startTime: utcToTorontoTime(startTs),
      endTime: utcToTorontoTime(endTs),
    }
  }

  if (flags.sawLt) {
    return {
      filterType: DateFilters.Before,
      value: new Date(Number(filter.lt) * 1000),
      startTime: utcToTorontoTime(filter.lt),
    }
  }

  if (flags.sawGt) {
    return {
      filterType: DateFilters.After,
      value: new Date(Number(filter.gt) * 1000),
      startTime: utcToTorontoTime(filter.gt),
    }
  }

  return {}
}

const DateFilter = ({
  options,
  open,
  setFilter,
  existingDate,
  existingFilter,
}) => {
  const initialVals = useMemo(() => {
    const parsed = parseDateFilter(existingDate)
    return {
      filterType: options[0],
      value: null,
      endValue: null,
      relativeAmount: undefined,
      daysMonthsValue: "days",
      startTime: "00:00",
      endTime: "23:59",
      ...parsed,
    }
  }, [existingDate])

  const [currentFilter, setCurrentFilter] = useState(initialVals.filterType)
  const [relativeAmount, setRelativeAmount] = useState(
    initialVals.relativeAmount
  )
  const [daysMonthsValue, setDaysMonthsValue] = useState(
    initialVals.daysMonthsValue
  )
  const [startDate, setStartDate] = useState(initialVals.value)
  const [endDate, setEndDate] = useState(initialVals.endValue)
  const [startTime, setStartTime] = useState(initialVals.startTime)
  const [endTime, setEndTime] = useState(initialVals.endTime)

  const clampHour = (v: number) => Math.min(23, Math.max(0, isNaN(v) ? 0 : v))
  const clampMinute = (v: number) => Math.min(59, Math.max(0, isNaN(v) ? 0 : v))
  const [rawStartHour, rawStartMinute] = startTime.split(":").map(v => parseInt(v, 10))
  const [rawEndHour, rawEndMinute] = endTime.split(":").map(v => parseInt(v, 10))
  const startHour = clampHour(rawStartHour)
  const startMinute = clampMinute(rawStartMinute)
  const endHour = clampHour(rawEndHour)
  const endMinute = clampMinute(rawEndMinute)

  useEffect(() => {
    switch (currentFilter) {
      case DateFilters.InTheLast:
      case DateFilters.OlderThan:
        setFilter({
          open: true,
          filter: handleDateFormat(relativeAmount),
        })
        break
      case DateFilters.Between:
      case DateFilters.EqualTo:
        setFilter({
          open: true,
          filter: handleDateFormat(startDate),
        })
        break
      default:
        setFilter({
          open: true,
          filter: handleDateFormat(startDate),
        })
    }
  }, [currentFilter, relativeAmount, daysMonthsValue, startDate, endDate, startTime, endTime])

  const handleDateFormat = (value: string | null) => {
    switch (currentFilter) {
      case DateFilters.InTheLast: {
        // Relative date
        return { gt: `${value}|${daysMonthsValue}` }
      }

      case DateFilters.OlderThan: {
        // Relative date:
        return { lt: `${value}|${daysMonthsValue}` }
      }

      case DateFilters.EqualTo: {
        const ts = torontoDateTimeToUnix(startDate, startTime)
        const tsEnd = torontoDateTimeToUnix(startDate, endTime)
        return ts !== null && tsEnd !== null
          ? { gt: String(ts), lt: String(tsEnd) }
          : {}
      }

      case DateFilters.Between: {
        const ts1 = torontoDateTimeToUnix(startDate, startTime)
        const ts2 = torontoDateTimeToUnix(endDate, endTime)
        return ts1 !== null && ts2 !== null
          ? { gt: String(ts1), lt: String(ts2) }
          : {}
      }

      case DateFilters.After: {
        const ts = torontoDateTimeToUnix(startDate, startTime)
        return ts !== null ? { gt: String(ts) } : {}
      }

      case DateFilters.Before: {
        const ts = torontoDateTimeToUnix(startDate, startTime)
        return ts !== null ? { lt: String(ts) } : {}
      }

      default: {
        return {}
      }
    }
  }

  const handleFilterContent = () => {
    switch (currentFilter) {
      case DateFilters.InTheLast:
      case DateFilters.OlderThan:
        return (
          <div className="flex w-full flex-col">
            <InputField
              className="pt-0 pb-1"
              type="number"
              placeholder="2"
              min="1"
              value={relativeAmount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val) && val >= 1) setRelativeAmount(String(val))
              }}
            />
            <RightPopover
              trigger={
                <div className="bg-grey-5 border-grey-20 inter-small-semibold text-grey-90 flex w-full items-center justify-between rounded border px-3 py-1.5">
                  <label>{daysMonthsValue}</label>
                  <span className="text-grey-50">
                    <ArrowRightIcon size={16} />
                  </span>
                </div>
              }
            >
              <PopoverOptions
                options={["days", "months"]}
                onClick={setDaysMonthsValue}
                selectedItem={daysMonthsValue}
              />
            </RightPopover>
          </div>
        )
      case DateFilters.Between:
        return (
          <div className="flex w-full flex-col gap-1">
            <RightPopover
              trigger={
                <div className="bg-grey-5 border-grey-20 inter-small-semibold text-grey-90 flex w-full items-center justify-between rounded border px-3 py-1.5">
                  <label>
                    {startDate
                      ? moment(startDate).format("MM.DD.YYYY") + " " + startTime
                      : "Start date"}
                  </label>
                  <span className="text-grey-50">
                    <ArrowRightIcon size={16} />
                  </span>
                </div>
              }
            >
              <div className="flex items-start">
                <CalendarComponent
                  date={startDate}
                  onChange={(date) => setStartDate(date)}
                />
                <div className="border-grey-20 ml-1 flex items-center justify-center gap-2 border-l pl-2">
                  <NumberScroller
                    numbers={HOURS}
                    selected={startHour}
                    onSelect={(h) =>
                      setStartTime(
                        (prev) =>
                          `${String(h).padStart(2, "0")}:${prev.split(":")[1] ?? "00"}`
                      )
                    }
                    style={{ height: 200 }}
                  />
                  <span className="inter-base-semibold text-grey-40">:</span>
                  <NumberScroller
                    numbers={MINUTES}
                    selected={startMinute}
                    onSelect={(m) =>
                      setStartTime(
                        (prev) =>
                          `${prev.split(":")[0] ?? "00"}:${String(m).padStart(2, "0")}`
                      )
                    }
                    style={{ height: 200 }}
                  />
                </div>
              </div>
            </RightPopover>
            <RightPopover
              trigger={
                <div className="bg-grey-5 border-grey-20 inter-small-semibold text-grey-90 flex w-full items-center justify-between rounded border px-3 py-1.5">
                  <label>
                    {endDate
                      ? moment(endDate).format("MM.DD.YYYY") + " " + endTime
                      : "End date"}
                  </label>
                  <span className="text-grey-50">
                    <ArrowRightIcon size={16} />
                  </span>
                </div>
              }
            >
              <div className="flex items-start">
                <CalendarComponent
                  date={endDate}
                  onChange={(date) => setEndDate(date)}
                />
                <div className="border-grey-20 ml-1 flex items-center justify-center gap-2 border-l pl-2">
                  <NumberScroller
                    numbers={HOURS}
                    selected={endHour}
                    onSelect={(h) =>
                      setEndTime(
                        (prev) =>
                          `${String(h).padStart(2, "0")}:${prev.split(":")[1] ?? "00"}`
                      )
                    }
                    style={{ height: 200 }}
                  />
                  <span className="inter-base-semibold text-grey-40">:</span>
                  <NumberScroller
                    numbers={MINUTES}
                    selected={endMinute}
                    onSelect={(m) =>
                      setEndTime(
                        (prev) =>
                          `${prev.split(":")[0] ?? "00"}:${String(m).padStart(2, "0")}`
                      )
                    }
                    style={{ height: 200 }}
                  />
                </div>
              </div>
            </RightPopover>
          </div>
        )
      case DateFilters.EqualTo:
        return (
          <div className="flex w-full flex-col">
            <RightPopover
              trigger={
                <div className="bg-grey-5 border-grey-20 inter-small-semibold text-grey-90 flex w-full items-center justify-between rounded border px-3 py-1.5">
                  <label>
                    {startDate
                      ? moment(startDate).format("MM.DD.YYYY") +
                        " " +
                        startTime +
                        "–" +
                        endTime
                      : "-"}
                  </label>
                  <span className="text-grey-50">
                    <ArrowRightIcon size={16} />
                  </span>
                </div>
              }
            >
              <div className="flex items-start">
                <CalendarComponent
                  date={startDate}
                  onChange={(date) => setStartDate(date)}
                />
                <div className="border-grey-20 ml-1 flex flex-col gap-2 border-l pl-2">
                  <span className="inter-xsmall-regular text-grey-50">From</span>
                  <div className="flex items-center gap-2">
                    <NumberScroller
                      numbers={HOURS}
                      selected={startHour}
                      onSelect={(h) =>
                        setStartTime(
                          (prev) =>
                            `${String(h).padStart(2, "0")}:${prev.split(":")[1] ?? "00"}`
                        )
                      }
                      style={{ height: 130 }}
                    />
                    <span className="inter-base-semibold text-grey-40">:</span>
                    <NumberScroller
                      numbers={MINUTES}
                      selected={startMinute}
                      onSelect={(m) =>
                        setStartTime(
                          (prev) =>
                            `${prev.split(":")[0] ?? "00"}:${String(m).padStart(2, "0")}`
                        )
                      }
                      style={{ height: 130 }}
                    />
                  </div>
                  <span className="inter-xsmall-regular text-grey-50">To</span>
                  <div className="flex items-center gap-2">
                    <NumberScroller
                      numbers={HOURS}
                      selected={endHour}
                      onSelect={(h) =>
                        setEndTime(
                          (prev) =>
                            `${String(h).padStart(2, "0")}:${prev.split(":")[1] ?? "00"}`
                        )
                      }
                      style={{ height: 130 }}
                    />
                    <span className="inter-base-semibold text-grey-40">:</span>
                    <NumberScroller
                      numbers={MINUTES}
                      selected={endMinute}
                      onSelect={(m) =>
                        setEndTime(
                          (prev) =>
                            `${prev.split(":")[0] ?? "00"}:${String(m).padStart(2, "0")}`
                        )
                      }
                      style={{ height: 130 }}
                    />
                  </div>
                </div>
              </div>
            </RightPopover>
          </div>
        )
      case DateFilters.After:
      case DateFilters.Before:
        return (
          <div className="flex w-full flex-col">
            <RightPopover
              trigger={
                <div className="bg-grey-5 border-grey-20 inter-small-semibold text-grey-90 flex w-full items-center justify-between rounded border px-3 py-1.5">
                  <label>
                    {startDate
                      ? moment(startDate).format("MM.DD.YYYY") + " " + startTime
                      : "-"}
                  </label>
                  <span className="text-grey-50">
                    <ArrowRightIcon size={16} />
                  </span>
                </div>
              }
            >
              <div className="flex items-start">
                <CalendarComponent
                  date={startDate}
                  onChange={(date) => setStartDate(date)}
                />
                <div className="border-grey-20 ml-1 flex items-center justify-center gap-2 border-l pl-2">
                  <NumberScroller
                    numbers={HOURS}
                    selected={startHour}
                    onSelect={(h) =>
                      setStartTime(
                        (prev) =>
                          `${String(h).padStart(2, "0")}:${prev.split(":")[1] ?? "00"}`
                      )
                    }
                    style={{ height: 200 }}
                  />
                  <span className="inter-base-semibold text-grey-40">:</span>
                  <NumberScroller
                    numbers={MINUTES}
                    selected={startMinute}
                    onSelect={(m) =>
                      setStartTime(
                        (prev) =>
                          `${prev.split(":")[0] ?? "00"}:${String(m).padStart(2, "0")}`
                      )
                    }
                    style={{ height: 200 }}
                  />
                </div>
              </div>
            </RightPopover>
          </div>
        )
    }
  }
  return (
    <div className="pl-9">
      <RightPopover
        trigger={
          <div className="bg-grey-5 border-grey-20 inter-small-semibold text-grey-90 flex w-full items-center justify-between rounded border px-3 py-1.5">
            <label>{currentFilter}</label>
            <span className="text-grey-50">
              <ArrowRightIcon size={16} />
            </span>
          </div>
        }
      >
        <PopoverOptions
          options={options}
          onClick={(filter) => setCurrentFilter(filter)}
          selectedItem={currentFilter}
        />
      </RightPopover>
      {currentFilter && <div className="w-full">{handleFilterContent()}</div>}
    </div>
  )
}

const PopoverOptions = ({ options, onClick, selectedItem }) => {
  return (
    <>
      {options.map((item) => (
        <div
          onClick={(e) => {
            e.stopPropagation()
            onClick(item)
          }}
          className={clsx(
            "hover:bg-grey-5 my-1 flex cursor-pointer items-center rounded px-3 py-1.5",
            {
              "inter-small-semibold": item === selectedItem,
              "inter-small-regular": item !== selectedItem,
            }
          )}
        >
          <div
            className={clsx(
              "mr-2 flex h-4 w-4 items-center justify-center rounded-full",
              {
                "border-violet-60 border-2": item === selectedItem,
                "border-grey-30 border ": item !== selectedItem,
              }
            )}
          >
            {item === selectedItem && (
              <div className="bg-violet-60 h-2 w-2 rounded-full" />
            )}
          </div>
          {item}
        </div>
      ))}
    </>
  )
}

const RightPopover = ({ trigger, children }) => (
  <RadixPopover.Root>
    <RadixPopover.Trigger className="my-1 w-full">
      {trigger}
    </RadixPopover.Trigger>
    <RadixPopover.Content
      side="right"
      align="start"
      alignOffset={-8}
      sideOffset={20}
      className="bg-grey-0 rounded-rounded shadow-dropdown top-2/4 flex flex-col p-2"
    >
      {children}
    </RadixPopover.Content>
  </RadixPopover.Root>
)
