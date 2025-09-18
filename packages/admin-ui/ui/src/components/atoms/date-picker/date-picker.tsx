import 'react-datepicker/dist/react-datepicker.css';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import React, { useEffect, useState } from 'react';

import ArrowDownIcon from '../../fundamentals/icons/arrow-down-icon';
import Button from '../../fundamentals/button';
import CustomHeader from './custom-header';
import { DateTimePickerProps } from './types';
import InputContainer from '../../fundamentals/input-container';
import InputHeader from '../../fundamentals/input-header';
import ReactDatePicker from 'react-datepicker';
import clsx from 'clsx';
import moment from 'moment';

const getDateClassname = (d: Date, tempDate: Date | null, greyPastDates: boolean = true): string => {
  const classes: string[] = ['date'];
  if (tempDate && moment(d).format('YY,MM,DD') === moment(tempDate).format('YY,MM,DD')) {
    classes.push('chosen');
  } else if (greyPastDates && moment(d).format('YY,MM,DD') < moment(new Date()).format('YY,MM,DD')) {
    classes.push('past');
  }
  return classes.join(' ');
};

const DatePicker: React.FC<DateTimePickerProps> = ({
  date,
  onSubmitDate,
  label = 'start date',
  required = false,
  tooltipContent,
  tooltip,
}) => {
  const [tempDate, setTempDate] = useState<Date | null>(date || null);
  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => setTempDate(date), [isOpen]);

  const handlePickedDate = (date: Date | null) => {
    // if(!tempDate || !date) {
    if (!date) {
      return;
    }

    setTempDate(date);

    // Submit date immediately on selection
    if (!date) {
      onSubmitDate(null);
      setIsOpen(false);
      return;
    }

    // update only date, month and year
    const newDate = new Date(date.getTime());
    if (date) {
      newDate.setUTCDate(date.getUTCDate());
      newDate.setUTCMonth(date.getUTCMonth());
      newDate.setUTCFullYear(date.getUTCFullYear());
    }

    onSubmitDate(newDate);
    setIsOpen(false);
  };

  const submitDate = () => {
    if (!tempDate || !date) {
      onSubmitDate(null);
      setIsOpen(false);
      return;
    }

    // update only date, month and year
    const newDate = new Date(date.getTime());
    newDate.setUTCDate(tempDate.getUTCDate());
    newDate.setUTCMonth(tempDate.getUTCMonth());
    newDate.setUTCFullYear(tempDate.getUTCFullYear());

    onSubmitDate(newDate);
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            className={clsx('rounded-rounded w-full border ', {
              'shadow-input border-violet-60': isOpen,
              'border-grey-20': !isOpen,
            })}
            type="button"
          >
            <InputContainer className="shadown-none border-0 focus-within:shadow-none">
              <div className="text-grey-50 flex w-full justify-between pr-0.5">
                {label && (
                  <InputHeader
                    {...{
                      label,
                      required,
                      tooltipContent,
                      tooltip,
                    }}
                  />
                )}
                <ArrowDownIcon size={16} />
              </div>
              <label className="w-full text-left">
                {date ? moment(date).format('ddd, DD MMM YYYY') : '---, -- -- ----'}
              </label>
            </InputContainer>
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Content
          side="top"
          sideOffset={windowWidth > 1024 ? 0 : -90}
          avoidCollisions={true}
          className="rounded-rounded border-grey-20 bg-grey-0 shadow-dropdown z-50 w-full border px-2"
        >
          <CalendarComponent date={tempDate} onChange={date => handlePickedDate(date)} />
          {/* 
          <div className="mb-8 mt-5 flex w-full">
            <Button
              variant="ghost"
              size="medium"
              onClick={() => setIsOpen(false)}
              className="border-grey-20 mr-2 flex w-1/3 justify-center border"
            >
              Cancel
            </Button>
            <Button
              size="medium"
              variant="primary"
              onClick={() => submitDate()}
              className="flex w-2/3 justify-center"
            >{`Set ${label}`}</Button>
          </div>
          */}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Root>
    </div>
  );
};

type CalendarComponentProps = {
  date: Date | null;
  onChange: (date: Date | null, event: React.SyntheticEvent<any, Event> | undefined) => void;
  greyPastDates?: boolean;
};

export const CalendarComponent = ({ date, onChange, greyPastDates = true }: CalendarComponentProps) => (
  <ReactDatePicker
    selected={date}
    inline
    adjustDateOnChange
    onChange={onChange}
    calendarClassName="date-picker"
    dayClassName={d => getDateClassname(d, date, greyPastDates)}
    renderCustomHeader={({ ...props }) => <CustomHeader {...props} />}
  />
);

export default DatePicker;
