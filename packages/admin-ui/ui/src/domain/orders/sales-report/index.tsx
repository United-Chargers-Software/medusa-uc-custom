import React, { useEffect, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import clsx from 'clsx';
import Modal from '../../../components/molecules/modal';
import Button from '../../../components/fundamentals/button';
import { MEDUSA_BACKEND_URL_NOSLASH } from '../../../constants/medusa-backend-url';
import moment from 'moment';
import openUrlNewWindow from '../../../utils/open-link-new-window';
import { CalendarComponent } from '../../../components/atoms/date-picker/date-picker';
import NumberScroller from '../../../components/atoms/number-scroller';
import ArrowDownIcon from '../../../components/fundamentals/icons/arrow-down-icon';
import ClockIcon from '../../../components/fundamentals/icons/clock-icon';
import InputContainer from '../../../components/fundamentals/input-container';
import InputHeader from '../../../components/fundamentals/input-header';

const HOURS = [...Array(24).keys()];
const MINUTES = [...Array(60).keys()];

type DateSelectType = {
  selectedDate: Date;
  setDate: (d: Date) => void;
  filterTitle: string;
  time: string;
  setTime: React.Dispatch<React.SetStateAction<string>>;
};

// A single popover combining the calendar and an hour/minute scroller, so a date
// and its time are picked in one place instead of two separate controls.
const DateSelect = ({ selectedDate, setDate, filterTitle, time, setTime }: DateSelectType) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, minute] = time.split(':').map(v => parseInt(v, 10) || 0);

  return (
    <div className="w-full">
      <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            className={clsx('rounded-rounded w-full border', {
              'shadow-input border-violet-60': isOpen,
              'border-grey-20': !isOpen,
            })}
            type="button"
          >
            <InputContainer className="shadow-none border-0 focus-within:shadow-none">
              <div className="text-grey-50 flex w-full justify-between pr-0.5">
                <InputHeader label={filterTitle} />
                <ArrowDownIcon size={16} />
              </div>
              <div className="text-grey-90 flex w-full items-center justify-between text-left">
                <span>{moment(selectedDate).format('ddd, DD MMM YYYY')}</span>
                <span className="text-grey-40 flex items-center gap-1">
                  <ClockIcon size={16} />
                  {time}
                </span>
              </div>
            </InputContainer>
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Content
          side="top"
          sideOffset={8}
          avoidCollisions={true}
          className="rounded-rounded border-grey-20 bg-grey-0 shadow-dropdown z-50 flex items-start border p-2"
        >
          <CalendarComponent date={selectedDate} onChange={d => d && setDate(d)} />
          <div className="border-grey-20 ml-1 flex items-center justify-center gap-2 border-l pl-2">
            <NumberScroller
              numbers={HOURS}
              selected={hour}
              onSelect={h =>
                setTime(prev => `${String(h).padStart(2, '0')}:${prev.split(':')[1] ?? '00'}`)
              }
              style={{ height: 280 }}
            />
            <span className="inter-base-semibold text-grey-40">:</span>
            <NumberScroller
              numbers={MINUTES}
              selected={minute}
              onSelect={m =>
                setTime(prev => `${prev.split(':')[0] ?? '00'}:${String(m).padStart(2, '0')}`)
              }
              style={{ height: 280 }}
            />
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Root>
    </div>
  );
};

type ExportModalProps = {
  handleClose: () => void;
  onSubmit?: () => void;
  loading: boolean;
  title: string;
};

const SalesReportModal: React.FC<ExportModalProps> = ({ handleClose, title, loading }) => {
  let now = new Date();

  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [endDate, setEndDate] = useState(now);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [urlParams, setUrlParams] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getUrlParams = () => {
    const start = moment(startDate).format('YYYY-MM-DD') + 'T' + startTime + ':00';
    const end = moment(endDate).format('YYYY-MM-DD') + 'T' + endTime + ':00';
    return '?start_date=' + start + '&end_date=' + end;
  };

  const getReport = (type: string) => {
    openUrlNewWindow(MEDUSA_BACKEND_URL_NOSLASH + '/admin/' + type + '/' + urlParams);
  };

  useEffect(() => {
    setUrlParams(getUrlParams());
  }, [startDate, endDate, startTime, endTime]);

  return (
    <Modal handleClose={handleClose} isLargeModal={windowWidth > 1024 ? true : false}>
      <Modal.Body>
        <Modal.Header handleClose={handleClose}>
          <span className="inter-xlarge-semibold">{title}</span>
        </Modal.Header>
        <Modal.Content>
          <p className="inter-small-regular text-grey-50 mb-3">Ontario timezone (Canada)</p>
          <div className="medium:flex-row medium:gap-4 flex flex-col items-start justify-start gap-2">
            <div className="w-full basis-1/2">
              <DateSelect
                selectedDate={startDate}
                setDate={setStartDate}
                filterTitle="From date"
                time={startTime}
                setTime={setStartTime}
              />
            </div>
            <div className="w-full basis-1/2">
              <DateSelect
                selectedDate={endDate}
                setDate={setEndDate}
                filterTitle="To date"
                time={endTime}
                setTime={setEndTime}
              />
            </div>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <div className="medium:flex-row flex w-full flex-col items-start justify-center gap-2">
            <div className="mb-2 flex w-full flex-col gap-2">
              <Button
                loading={loading}
                disabled={loading}
                variant="primary"
                size="small"
                onClick={() => getReport('sales-report')}
              >
                Sales report
              </Button>
              <Button
                loading={loading}
                disabled={loading}
                variant="primary"
                size="small"
                onClick={() => getReport('sales-report-canada')}
              >
                Sales report by Canadian provinces
              </Button>
            </div>

            <div className="mb-2 flex w-full flex-col gap-2">
              <Button
                loading={loading}
                disabled={loading}
                variant="primary"
                size="small"
                onClick={() => getReport('shipping-report')}
              >
                Shipping report
              </Button>
              <Button
                loading={loading}
                disabled={loading}
                variant="primary"
                size="small"
                onClick={() => getReport('shipping-report-v2')}
              >
                Shipping report v2
              </Button>
            </div>

            <div className="flex w-full flex-col gap-2">
              <Button
                loading={loading}
                disabled={loading}
                variant="primary"
                size="small"
                onClick={() => getReport('referrals-report')}
              >
                Referrals report
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  );
};

export default SalesReportModal;
