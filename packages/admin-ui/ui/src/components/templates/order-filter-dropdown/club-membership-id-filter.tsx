import { useTranslation } from 'react-i18next';
import * as RadixCollapsible from '@radix-ui/react-collapsible';
import ChevronUpIcon from '../../fundamentals/icons/chevron-up';
import CheckIcon from '../../fundamentals/icons/check-icon';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import InputField from '../../molecules/input';

type ClubMembershipIdFilterProps = {
  open: boolean;
  filter: string | null;
  setFilter: (value: { open: boolean; filter: string | null }) => void;
};

const ClubMembershipIdFilter = ({ open, filter, setFilter }: ClubMembershipIdFilterProps) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState<string>(filter || '');

  useEffect(() => {
    setSearchValue(filter || '');
  }, [filter]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    const trimmedValue = value.trim();
    if (trimmedValue) {
      setFilter({
        open: true,
        filter: trimmedValue,
      });
    } else {
      setFilter({
        open: open,
        filter: null,
      });
    }
  };

  return (
    <div
      className={clsx('w-full cursor-pointer py-2 px-4', {
        'inter-small-semibold': open,
        'inter-small-regular': !open,
      })}
    >
      <RadixCollapsible.Root
        className="w-full"
        open={open}
        onOpenChange={isOpen => {
          if (isOpen || !searchValue.trim()) {
            const trimmedValue = searchValue.trim();
            setFilter({ open: isOpen, filter: trimmedValue || null });
          }
        }}
      >
        <RadixCollapsible.Trigger
          className={clsx('hover:bg-grey-5 flex w-full items-center justify-between rounded py-1.5 px-3', {
            'inter-small-semibold': open,
            'inter-small-regular': !open,
          })}
        >
          <div className="flex items-center">
            <div
              className={`text-grey-0 border-grey-30 rounded-base flex h-5 w-5 justify-center border ${
                open && 'bg-violet-60'
              }`}
            >
              <span className="self-center">{open && <CheckIcon size={16} />}</span>
            </div>
            <input className="hidden" checked={open} readOnly type="checkbox" />
            <span className="ml-2">{t('order-filter-dropdown-club-membership-id', 'Club Membership ID')}</span>
          </div>
          {open && (
            <span className="text-grey-50 self-end">
              <ChevronUpIcon size={20} />
            </span>
          )}
        </RadixCollapsible.Trigger>

        <RadixCollapsible.Content className="w-full">
          <div className="px-3 py-2">
            <InputField
              placeholder={t('order-filter-dropdown-club-membership-id-placeholder', 'Enter Club Membership ID') || 'Enter Club Membership ID'}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              small
            />
          </div>
        </RadixCollapsible.Content>
      </RadixCollapsible.Root>
    </div>
  );
};

export default ClubMembershipIdFilter;

