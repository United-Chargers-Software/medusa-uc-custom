import clsx from 'clsx';
import { useAdminRegions, useAdminSalesChannels } from 'medusa-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FilterDropdownContainer from '../../../components/molecules/filter-dropdown/container';
import FilterDropdownItem from '../../../components/molecules/filter-dropdown/item';
import SaveFilterItem from '../../../components/molecules/filter-dropdown/save-field';
import TabFilter from '../../../components/molecules/filter-tab';
import PlusIcon from '../../fundamentals/icons/plus-icon';
import { useFeatureFlag } from '../../../providers/feature-flag-provider';
import ClubFilter from './club-filter';
import GaFilter from './ga-filter';
import RefFilter from './ref-filter';
import ClubMembershipIdFilter from './club-membership-id-filter';
import OdooFilter from './odoo-filter';
import SyncedWithConnectFilter from './SyncedWithConnectFilter';

const REGION_PAGE_SIZE = 15;
const CHANNEL_PAGE_SIZE = 15;

const statusFilters = ['completed', 'pending', 'canceled', 'archived', 'requires_action'];
const paymentFilters = [
  'awaiting',
  'captured',
  'refunded',
  'canceled',
  'partially_refunded',
  'requires_action',
  'not_paid',
];
const fulfillmentFilters = [
  'fulfilled',
  'not_fulfilled',
  'partially_fulfilled',
  'returned',
  'partially_returned',
  'shipped',
  'partially_shipped',
  'requires_action',
  'canceled',
];

const dateFilters = ['is in the last', 'is older than', 'is between', 'is after', 'is before', 'is equal to'];

const OrderFilters = ({
  tabs,
  activeTab,
  onTabClick,
  onSaveTab,
  onRemoveTab,
  filters,
  submitFilters,
  clearFilters,
}: {
  tabs: any;
  activeTab: any;
  onTabClick: any;
  onSaveTab: any;
  onRemoveTab: any;
  filters: any;
  submitFilters: any;
  clearFilters: any;
}) => {
  const { t } = useTranslation();
  const [tempState, setTempState] = useState(filters);
  const [name, setName] = useState('');

  const { isFeatureEnabled } = useFeatureFlag();
  const isSalesChannelsEnabled = isFeatureEnabled('sales_channels');

  const handleRemoveTab = (val: any) => {
    if (onRemoveTab) {
      onRemoveTab(val);
    }
  };

  const handleSaveTab = () => {
    if (onSaveTab) {
      onSaveTab(name, tempState);
    }
  };

  const handleTabClick = (tabName: string) => {
    if (onTabClick) {
      onTabClick(tabName);
    }
  };

  useEffect(() => {
    setTempState(filters);
  }, [filters]);

  const onSubmit = () => {
    submitFilters(tempState);
  };

  const onClear = () => {
    clearFilters();
  };

  const setSingleFilter = (filterKey: any, filterVal: any) => {
    setTempState((prevState: any) => ({
      ...prevState,
      [filterKey]: filterVal,
    }));
  };

  const numberOfFilters = Object.entries(filters).reduce((acc, [key, value]: [string, any]) => {
    if (value?.open) {
      acc = acc + 1;
    }
    return acc;
  }, 0);

  const [regionsPagination, setRegionsPagination] = useState({
    offset: 0,
    limit: REGION_PAGE_SIZE,
  });

  const { regions, count, isLoading: isLoadingRegions } = useAdminRegions(regionsPagination);

  const { sales_channels, isLoading: isLoadingSalesChannels } = useAdminSalesChannels(
    { limit: CHANNEL_PAGE_SIZE },
    { enabled: isSalesChannelsEnabled },
  );

  const handlePaginateRegions = (direction: number) => {
    if (direction > 0) {
      setRegionsPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    } else if (direction < 0) {
      setRegionsPagination(prev => ({
        ...prev,
        offset: Math.max(prev.offset - prev.limit, 0),
      }));
    }
  };

  return (
    <div className="flex space-x-1">
      <FilterDropdownContainer
        submitFilters={onSubmit}
        clearFilters={onClear}
        triggerElement={
          <button
            className={clsx(
              'rounded-rounded focus-visible:shadow-input focus-visible:border-violet-60 flex items-center space-x-1 focus-visible:outline-none',
            )}
          >
            <div className="rounded-rounded bg-grey-5 border-grey-20 inter-small-semibold flex h-6 items-center border px-2">
              {t('order-filter-dropdown-filters', 'Filters')}
              <div className="text-grey-40 ml-1 flex items-center rounded">
                <span className="text-violet-60 inter-small-semibold">{numberOfFilters ? numberOfFilters : '0'}</span>
              </div>
            </div>
            <div className="rounded-rounded bg-grey-5 border-grey-20 inter-small-semibold flex items-center border p-1">
              <PlusIcon size={14} />
            </div>
          </button>
        }
      >
        <FilterDropdownItem
          filterTitle={t('order-filter-dropdown-status', 'Status')}
          options={statusFilters}
          filters={tempState.status.filter}
          open={tempState.status.open}
          isLoading={false}
          hasMore={false}
          hasPrev={false}
          onShowNext={() => {}}
          onShowPrev={() => {}}
          setFilter={(val: any) => setSingleFilter('status', val)}
        />
        <FilterDropdownItem
          filterTitle={t('order-filter-dropdown-payment-status', 'Payment Status')}
          options={paymentFilters}
          filters={tempState.payment.filter}
          open={tempState.payment.open}
          isLoading={false}
          hasMore={false}
          hasPrev={false}
          onShowNext={() => {}}
          onShowPrev={() => {}}
          setFilter={(val: any) => setSingleFilter('payment', val)}
        />
        <FilterDropdownItem
          filterTitle={t('order-filter-dropdown-fulfillment-status', 'Fulfillment Status')}
          options={fulfillmentFilters}
          filters={tempState.fulfillment.filter}
          open={tempState.fulfillment.open}
          isLoading={false}
          hasMore={false}
          hasPrev={false}
          onShowNext={() => {}}
          onShowPrev={() => {}}
          setFilter={(val: any) => setSingleFilter('fulfillment', val)}
        />
        <FilterDropdownItem
          filterTitle={t('order-filter-dropdown-regions', 'Regions')}
          options={
            regions?.map(region => ({
              value: region.id,
              label: region.name,
            })) || []
          }
          isLoading={isLoadingRegions}
          hasPrev={regionsPagination.offset > 0}
          hasMore={regionsPagination.offset + regionsPagination.limit < (count ?? 0)}
          onShowPrev={() => handlePaginateRegions(-1)}
          onShowNext={() => handlePaginateRegions(1)}
          filters={tempState.region.filter}
          open={tempState.region.open}
          setFilter={(v: any) => setSingleFilter('region', v)}
        />
        {isSalesChannelsEnabled && (
          <FilterDropdownItem
            filterTitle={t('order-filter-dropdown-sales-channel', 'Sales Channel')}
            options={
              sales_channels?.map(salesChannel => ({
                value: salesChannel.id,
                label: salesChannel.name,
              })) || []
            }
            isLoading={isLoadingSalesChannels}
            hasMore={false}
            hasPrev={false}
            onShowNext={() => {}}
            onShowPrev={() => {}}
            filters={tempState.salesChannel.filter}
            open={tempState.salesChannel.open}
            setFilter={(v: any) => setSingleFilter('salesChannel', v)}
          />
        )}
        <FilterDropdownItem
          filterTitle={t('order-filter-dropdown-date', 'Date')}
          options={dateFilters}
          filters={tempState.date.filter}
          open={tempState.date.open}
          isLoading={false}
          hasMore={false}
          hasPrev={false}
          onShowNext={() => {}}
          onShowPrev={() => {}}
          setFilter={(val: any) => setSingleFilter('date', val)}
        />
        <ClubFilter
          open={tempState.club.open}
          filter={tempState.club.filter}
          setFilter={val => setSingleFilter('club', val)}
        />
        <GaFilter open={tempState.ga.open} filter={tempState.ga.filter} setFilter={val => setSingleFilter('ga', val)} />
        <RefFilter
          open={tempState.ref.open}
          filter={tempState.ref.filter}
          setFilter={val => setSingleFilter('ref', val)}
        />
        <ClubMembershipIdFilter
          open={tempState.clubMembershipId.open}
          filter={tempState.clubMembershipId.filter}
          setFilter={val => setSingleFilter('clubMembershipId', val)}
        />
        <OdooFilter
          open={tempState.odoo.open}
          filter={tempState.odoo.filter}
          setFilter={val => setSingleFilter('odoo', val)}
        />
        <SyncedWithConnectFilter
          open={tempState.isSyncedWithConnect.open}
          filter={tempState.isSyncedWithConnect.filter}
          setFilter={val => setSingleFilter('isSyncedWithConnect', val)}
        />
        <SaveFilterItem saveFilter={handleSaveTab} name={name} setName={setName} />
      </FilterDropdownContainer>
      {tabs &&
        tabs.map((t: any) => (
          <TabFilter
            key={t.value}
            onClick={() => handleTabClick(t.value)}
            label={t.label}
            isActive={activeTab === t.value}
            removable={!!t.removable}
            onRemove={() => handleRemoveTab(t.value)}
          />
        ))}
    </div>
  );
};

export default OrderFilters;
