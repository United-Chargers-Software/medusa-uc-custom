import { useTranslation } from 'react-i18next';
import * as RadixCollapsible from '@radix-ui/react-collapsible';
import ChevronUpIcon from '../../fundamentals/icons/chevron-up';
import CheckIcon from '../../fundamentals/icons/check-icon';
import clsx from 'clsx';

type GaFilterProps = {
  open: boolean;
  filter: boolean | null;
  setFilter: (value: { open: boolean; filter: boolean | null }) => void;
};

const GaFilter = ({ open, filter, setFilter }: GaFilterProps) => {
  const { t } = useTranslation();

  const handleRadioChange = (value: boolean | null) => {
    setFilter({
      open: value !== null,
      filter: value,
    });
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
        onOpenChange={isOpen => setFilter({ open: isOpen, filter })}
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
            <span className="ml-2">{t('order-filter-dropdown-ga', 'Google Ads')}</span>
          </div>
          {open && (
            <span className="text-grey-50 self-end">
              <ChevronUpIcon size={20} />
            </span>
          )}
        </RadixCollapsible.Trigger>

        <RadixCollapsible.Content className="w-full">
          <div
            className={clsx('hover:bg-grey-20 my-1 flex w-full items-center rounded py-1.5 pl-6', {
              'inter-small-semibold': filter === true,
              'inter-small-regular': filter !== true,
            })}
            onClick={() => handleRadioChange(true)}
          >
            <div
              className={`rounded-circle mr-2 flex h-[15px] w-[15px] shrink-0 items-center justify-center shadow-[0_0_0_1px] shadow-[#D1D5DB] ${
                filter === true && 'shadow-violet-60'
              }`}
            >
              {filter === true && <div className="bg-violet-60 rounded-circle h-[9px] w-[9px]"></div>}
            </div>
            <input type="radio" className="hidden" name="ga-filter" checked={filter === true} readOnly />
            <span>With Google Ads</span>
          </div>

          <div
            className={clsx('hover:bg-grey-20 my-1 flex w-full items-center rounded py-1.5 pl-6', {
              'inter-small-semibold': filter === false,
              'inter-small-regular': filter !== false,
            })}
            onClick={() => handleRadioChange(false)}
          >
            <div
              className={`rounded-circle mr-2 flex h-[15px] w-[15px] shrink-0 items-center justify-center shadow-[0_0_0_1px] shadow-[#D1D5DB] ${
                filter === false && 'shadow-violet-60'
              }`}
            >
              {filter === false && <div className="bg-violet-60 rounded-circle h-[9px] w-[9px]"></div>}
            </div>
            <input type="radio" className="hidden" name="ga-filter" checked={filter === false} readOnly />
            <span>Without Google Ads</span>
          </div>
        </RadixCollapsible.Content>
      </RadixCollapsible.Root>
    </div>
  );
};

export default GaFilter;
