import { Label, RadioGroup } from '@medusajs/ui';
import { useState } from 'react';
import Button from '../../../components/fundamentals/button';
import clsx from 'clsx';

const filters = [
  {
    name: 'All time',
    value: 'all',
  },
  {
    name: 'Last year',
    value: 'year',
  },
  {
    name: 'Last month',
    value: 'month',
  },
  {
    name: 'Last Week',
    value: 'week',
  },
];

type ExportCustomerQuickFiltersProps = {
  handleStartDateChange: (date: Date) => void;
  handleEndDateChange: (date: Date) => void;
};

const ExportCustomerQuickFilters: React.FC<ExportCustomerQuickFiltersProps> = ({
  handleStartDateChange,
  handleEndDateChange,
}) => {
  const [selected, setSelected] = useState('');

  const handleQuickFilters = (filter: string) => {
    switch (filter) {
      case 'all': {
        const firstDay2023UTC = new Date(Date.UTC(2023, 0, 1));
        const date = new Date();

        handleStartDateChange(firstDay2023UTC);
        handleEndDateChange(date);
        break;
      }
      case 'year': {
        const firstDay = new Date(Date.UTC(new Date().getFullYear() - 1, 0, 1));
        const lastDay = new Date(Date.UTC(new Date().getFullYear() - 1, 11, 31));

        handleStartDateChange(firstDay);
        handleEndDateChange(lastDay);
        break;
      }
      case 'month': {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);

        handleStartDateChange(firstDay);
        handleEndDateChange(lastDay);
        break;
      }
      case 'week': {
        const now = new Date();
        const dayOfWeek = now.getDay();

        const firstDay = new Date(now);
        firstDay.setDate(now.getDate() - dayOfWeek - 6);

        const lastDay = new Date(now);
        lastDay.setDate(now.getDate() - dayOfWeek);

        handleStartDateChange(firstDay);
        handleEndDateChange(lastDay);
        break;
      }
      default:
        break;
    }

    setSelected(filter);
  };

  return (
    <>
      <RadioGroup value={selected} onValueChange={setSelected} className="py-4">
        <Label weight="plus">Quick filters:</Label>

        <div className="flex gap-x-2">
          {filters.map((filter, index) => (
            <Button variant="secondary" size="small" key={index} onClick={() => handleQuickFilters(filter.value)}>
              <Label
                htmlFor={filter.value}
                weight="regular"
                className={clsx('text-sm', 'cursor-pointer', {
                  'text-[#7c3aed]': selected === filter.value,
                })}
              >
                {filter.name}
              </Label>
            </Button>
          ))}
        </div>
      </RadioGroup>
    </>
  );
};

export default ExportCustomerQuickFilters;
