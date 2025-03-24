import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FilterDropdownContainer from '../../../components/molecules/filter-dropdown/container';
import SortIcon from '../../fundamentals/icons/sort-icon';
import RadioGroup from '../../organisms/radio-group';

export type SortOption = {
  value: string;
  label: string;
};

type CustomerSortProps = {
  sortBy: string | null;
  sortDirection: string | null;
  onSortChange: (sortBy: string | null, sortDirection: string | null) => void;
};

const sortByOptions: SortOption[] = [
  { value: 'created_at', label: 'Date added' },
  { value: 'orders', label: 'Orders' },
];

const sortDirectionOptions: SortOption[] = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

const CustomerSortDropdown = ({ sortBy, sortDirection, onSortChange }: CustomerSortProps) => {
  const { t } = useTranslation();
  const [tempSortBy, setTempSortBy] = useState<string>('created_at');
  const [tempSortDirection, setTempSortDirection] = useState<string>('desc');

  useEffect(() => {
    setTempSortBy(sortBy || 'created_at');
    setTempSortDirection(sortDirection || 'desc');
  }, [sortBy, sortDirection]);

  const handleSubmit = () => {
    onSortChange(tempSortBy, tempSortDirection);
  };

  const handleClear = () => {
    onSortChange(null, null);
    setTempSortBy('created_at');
    setTempSortDirection('desc');
  };

  const getCurrentSortLabel = () => {
    if (!sortBy || !sortDirection) {
      return t('customer-sort-dropdown-sort-by', 'Sort by');
    }

    const field = sortByOptions.find(option => option.value === sortBy);
    const direction = sortDirectionOptions.find(option => option.value === sortDirection);

    if (field && direction) {
      return `${field.label} (${direction.value === 'asc' ? '↑' : '↓'})`;
    }

    return t('customer-sort-dropdown-sort-by', 'Sort by');
  };

  return (
    <FilterDropdownContainer
      submitFilters={handleSubmit}
      clearFilters={handleClear}
      triggerElement={
        <button
          className={clsx(
            'rounded-rounded focus-visible:shadow-input focus-visible:border-violet-60 flex items-center space-x-1 focus-visible:outline-none',
          )}
        >
          <div className="rounded-rounded bg-grey-5 border-grey-20 inter-small-semibold flex h-6 items-center border px-2">
            <SortIcon size={16} className="mr-1" />
            {getCurrentSortLabel()}
          </div>
        </button>
      }
    >
      <div className="w-full">
        <div className="border-grey-20 border-b px-3 py-2 text-xs font-semibold">
          {t('customer-sort-dropdown-sort-by', 'Sort by')}
        </div>
        <div className="py-2">
          <RadioGroup.Root value={tempSortBy} onValueChange={setTempSortBy} className="flex flex-col px-3">
            {sortByOptions.map(option => (
              <RadioGroup.SimpleItem
                key={option.value}
                label={option.label}
                value={option.value}
                indicatorSize="15px"
                textSize="small"
                className="px-3 py-1.5"
              />
            ))}
          </RadioGroup.Root>
        </div>

        <div className="border-grey-20 border-t border-b px-3 py-2 text-xs font-semibold">
          {t('customer-sort-dropdown-direction', 'Direction')}
        </div>
        <div className="py-2">
          <RadioGroup.Root
            value={tempSortDirection}
            onValueChange={setTempSortDirection}
            className="flex flex-col px-3"
          >
            {sortDirectionOptions.map(option => (
              <RadioGroup.SimpleItem
                key={option.value}
                label={option.label}
                value={option.value}
                indicatorSize="15px"
                textSize="small"
                className="px-3 py-1.5"
              />
            ))}
          </RadioGroup.Root>
        </div>
      </div>
    </FilterDropdownContainer>
  );
};

export default CustomerSortDropdown;
