import clsx from 'clsx';
import { useAdminCustomerGroups } from 'medusa-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FilterDropdownContainer from '../../../components/molecules/filter-dropdown/container';
import FilterDropdownItem from '../../../components/molecules/filter-dropdown/item';
import SaveFilterItem from '../../../components/molecules/filter-dropdown/save-field';
import TabFilter from '../../../components/molecules/filter-tab';
import PlusIcon from '../../fundamentals/icons/plus-icon';
import { useFeatureFlag } from '../../../providers/feature-flag-provider';
import InputField from '../../molecules/input';

const GROUP_PAGE_SIZE = 10;
const countryCodeOptions = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
];

const CustomerFilters = ({
  tabs,
  activeTab,
  onTabClick,
  onSaveTab,
  onRemoveTab,
  filters,
  submitFilters,
  clearFilters,
}) => {
  const { t } = useTranslation();
  const [tempState, setTempState] = useState(filters);
  // const [name, setName] = useState('');
  // const [emailFilter, setEmailFilter] = useState(filters.email?.filter || '');
  // const [cityFilter, setCityFilter] = useState(filters.city?.filter || '');
  // const [nameFilter, setNameFilter] = useState(filters.name?.filter || '');

  const { isFeatureEnabled } = useFeatureFlag();

  const handleRemoveTab = val => {
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
    // setEmailFilter(filters.email?.filter || '');
    // setCityFilter(filters.city?.filter || '');
    // setNameFilter(filters.name?.filter || '');
  }, [filters]);

  const onSubmit = () => {
    console.log('tempState', tempState);

    submitFilters(tempState);
  };

  const onClear = () => {
    clearFilters();
  };

  const setSingleFilter = (filterKey, filterVal) => {
    setTempState(prevState => ({
      ...prevState,
      [filterKey]: filterVal,
    }));
  };

  // const handleEmailFilterChange = email => {
  //   setEmailFilter(email);
  //   if (email && email.trim().length > 0) {
  //     setSingleFilter('email', {
  //       open: true,
  //       filter: email.trim(),
  //     });
  //   } else {
  //     setSingleFilter('email', {
  //       open: false,
  //       filter: null,
  //     });
  //   }
  // };

  // const handleCityFilterChange = city => {
  //   setCityFilter(city);
  //   if (city && city.trim().length > 0) {
  //     setSingleFilter('city', {
  //       open: true,
  //       filter: city.trim(),
  //     });
  //   } else {
  //     setSingleFilter('city', {
  //       open: false,
  //       filter: null,
  //     });
  //   }
  // };

  // const handleNameFilterChange = name => {
  //   setNameFilter(name);
  //   if (name && name.trim().length > 0) {
  //     setSingleFilter('name', {
  //       open: true,
  //       filter: name.trim(),
  //     });
  //   } else {
  //     setSingleFilter('name', {
  //       open: false,
  //       filter: null,
  //     });
  //   }
  // };

  const numberOfFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value?.open) {
      acc = acc + 1;
    }
    return acc;
  }, 0);

  const [groupsPagination, setGroupsPagination] = useState({
    offset: 0,
    limit: GROUP_PAGE_SIZE,
  });

  const { customer_groups, count, isLoading: isLoadingGroups } = useAdminCustomerGroups(groupsPagination);

  const handlePaginateGroups = direction => {
    if (direction > 0) {
      setGroupsPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    } else if (direction < 0) {
      setGroupsPagination(prev => ({
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
              {t('customer-filters-filters', 'Filters')}
              <div className="text-grey-40 ml-1 flex items-center rounded">
                <span className="text-violet-60 inter-small-semibold">{numberOfFilters ? numberOfFilters : '0'}</span>
              </div>
            </div>
            {/* <div className="rounded-rounded bg-grey-5 border-grey-20 inter-small-semibold flex items-center border p-1">
              <PlusIcon size={14} />
            </div> */}
          </button>
        }
      >
        <FilterDropdownItem
          filterTitle={t('customer-filters-groups', 'Customer Groups')}
          options={
            customer_groups?.map(group => ({
              value: group.name,
              label: group.name,
            })) || []
          }
          isLoading={isLoadingGroups}
          hasPrev={groupsPagination.offset > 0}
          hasMore={groupsPagination.offset + groupsPagination.limit < (count ?? 0)}
          onShowPrev={() => handlePaginateGroups(-1)}
          onShowNext={() => handlePaginateGroups(1)}
          filters={tempState.groups.filter}
          open={tempState.groups.open}
          setFilter={v => setSingleFilter('groups', v)}
        />
        <FilterDropdownItem
          filterTitle={t('customer-filters-country', 'Country')}
          options={
            countryCodeOptions?.map(countryCode => ({
              value: countryCode.value,
              label: countryCode.label,
            })) || []
          }
          isLoading={false}
          hasPrev={false}
          hasMore={false}
          onShowPrev={() => {}}
          onShowNext={() => {}}
          filters={tempState.countryCode.filter}
          open={tempState.countryCode.open}
          setFilter={v => setSingleFilter('countryCode', v)}
        />
        {/* <div className="flex w-full flex-col pb-2">
          <div className="inter-small-semibold px-3 py-1.5">{t('customer-filters-email', 'Email')}</div>
          <div className="px-3 py-1">
            <InputField
              small
              type="text"
              value={emailFilter}
              onChange={e => handleEmailFilterChange(e.target.value)}
              placeholder={t('customer-filters-search-by-email', 'Search by email')}
            />
          </div>
        </div>
        <div className="flex w-full flex-col pb-2">
          <div className="inter-small-semibold px-3 py-1.5">{t('customer-filters-city', 'City')}</div>
          <div className="px-3 py-1">
            <InputField
              small
              type="text"
              value={cityFilter}
              onChange={e => handleCityFilterChange(e.target.value)}
              placeholder={t('customer-filters-search-by-city', 'Search by city')}
            />
          </div>
        </div>
        <div className="flex w-full flex-col pb-2">
          <div className="inter-small-semibold px-3 py-1.5">{t('customer-filters-name', 'Name')}</div>
          <div className="px-3 py-1">
            <InputField
              small
              type="text"
              value={nameFilter}
              onChange={e => handleNameFilterChange(e.target.value)}
              placeholder={t('customer-filters-search-by-name', 'Search by name')}
            />
          </div>
        </div>
        <SaveFilterItem saveFilter={handleSaveTab} name={name} setName={setName} /> */}
      </FilterDropdownContainer>
      {tabs &&
        tabs.map(t => (
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

export default CustomerFilters;
