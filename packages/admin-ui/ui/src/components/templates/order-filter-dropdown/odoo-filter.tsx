import { useTranslation } from 'react-i18next';
import * as RadixCollapsible from '@radix-ui/react-collapsible';
import ChevronUpIcon from '../../fundamentals/icons/chevron-up';
import CheckIcon from '../../fundamentals/icons/check-icon';
import clsx from 'clsx';

type OdooFilterState = {
  salesOrder: boolean;
  deliveryOrder: boolean;
};

type OdooFilterProps = {
  open: boolean;
  filter: OdooFilterState | null;
  setFilter: (value: { open: boolean; filter: OdooFilterState | null }) => void;
};

const OdooFilter = ({ open, filter, setFilter }: OdooFilterProps) => {
  const { t } = useTranslation();

  const handleCheckboxChange = (type: 'salesOrder' | 'deliveryOrder') => {
    const currentFilter = filter || { salesOrder: false, deliveryOrder: false };
    const newFilter = {
      ...currentFilter,
      [type]: !currentFilter[type],
    };

    const hasAnySelected = newFilter.salesOrder || newFilter.deliveryOrder;

    setFilter({
      open: hasAnySelected,
      filter: hasAnySelected ? newFilter : null,
    });
  };

  const toggleOpen = (isOpen: boolean) => {
    if (!isOpen) {
      setFilter({ open: false, filter: null });
    } else {
      setFilter({
        open: true,
        filter: filter || { salesOrder: false, deliveryOrder: false },
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
      <RadixCollapsible.Root className="w-full" open={open} onOpenChange={toggleOpen}>
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
            <span className="ml-2">{t('order-filter-dropdown-odoo', 'Odoo')}</span>
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
              'inter-small-semibold': filter?.salesOrder,
              'inter-small-regular': !filter?.salesOrder,
            })}
            onClick={() => handleCheckboxChange('salesOrder')}
          >
            <div
              className={`text-grey-0 border-grey-30 rounded-base mr-2 flex h-5 w-5 justify-center border ${
                filter?.salesOrder && 'bg-violet-60'
              }`}
            >
              <span className="self-center">{filter?.salesOrder && <CheckIcon size={16} />}</span>
            </div>
            <input
              type="checkbox"
              className="hidden"
              name="odoo-sales-order"
              checked={filter?.salesOrder || false}
              readOnly
            />
            <span>Sales Order</span>
          </div>

          <div
            className={clsx('hover:bg-grey-20 my-1 flex w-full items-center rounded py-1.5 pl-6', {
              'inter-small-semibold': filter?.deliveryOrder,
              'inter-small-regular': !filter?.deliveryOrder,
            })}
            onClick={() => handleCheckboxChange('deliveryOrder')}
          >
            <div
              className={`text-grey-0 border-grey-30 rounded-base mr-2 flex h-5 w-5 justify-center border ${
                filter?.deliveryOrder && 'bg-violet-60'
              }`}
            >
              <span className="self-center">{filter?.deliveryOrder && <CheckIcon size={16} />}</span>
            </div>
            <input
              type="checkbox"
              className="hidden"
              name="odoo-delivery-order"
              checked={filter?.deliveryOrder || false}
              readOnly
            />
            <span>Delivery Order</span>
          </div>
        </RadixCollapsible.Content>
      </RadixCollapsible.Root>
    </div>
  );
};

export default OdooFilter;
