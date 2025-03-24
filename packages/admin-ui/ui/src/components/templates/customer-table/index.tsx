import { isEmpty } from 'lodash';
import { useAdminCustomers } from 'medusa-react';
import qs from 'qs';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePagination, useTable } from 'react-table';
import DetailsIcon from '../../fundamentals/details-icon';
import EditIcon from '../../fundamentals/icons/edit-icon';
import Table from '../../molecules/table';
import TableContainer from '../../organisms/table-container';
import CustomerFilters from '../customer-filter-dropdown';
import CustomerSortDropdown from '../customer-sort-dropdown';
import { useCustomerColumns } from './use-customer-columns';
import { useCustomerFilters } from './use-customer-filters';
import useCustomersByGroup from '../../../hooks/use-customers-by-group';

const DEFAULT_PAGE_SIZE = 15;

const defaultQueryProps = {
  expand: 'orders,groups,billing_address',
  fields: 'id,email,first_name,last_name,created_at,orders_count',
};

const CustomerTable = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<string | null>(null);

  const {
    reset,
    paginate,
    setQuery: setFreeText,
    queryObject,
    representationObject,
    setFilters,
    filters,
    // setGroupsFilter,
    removeTab,
    setTab,
    saveTab,
    availableTabs: filterTabs,
    activeFilterTab,
  } = useCustomerFilters(location.search, defaultQueryProps);

  const offs = parseInt(queryObject.offset) || 0;
  const lim = parseInt(queryObject.limit) || DEFAULT_PAGE_SIZE;

  // const customersBody = {
  //   limit: queryObject.limit,
  //   offset: queryObject.offset,
  //   expand: queryObject.expand,

  //   // General search query
  //   ...(queryObject.q && !queryObject.email && !queryObject.name && { q: queryObject.q, groups: [] }),

  //   // Email filter
  //   ...(queryObject.email && {
  //     email: queryObject.email,
  //   }),

  //   // Name filter
  //   ...(queryObject.name && {
  //     q: queryObject.name,
  //   }),

  //   // Groups filter
  //   ...(queryObject.groups && { groups: queryObject.groups }),

  //   // Country filter
  //   ...(queryObject.countryCode && { countryCode: queryObject.countryCode }),

  //   // City filter
  //   ...(queryObject.city && {
  //     city: queryObject.city,
  //   }),
  // };

  // const { customers, isLoading, count } = useAdminCustomers(customersBody, {
  //   keepPreviousData: true,
  // });

  const { customersData } = useCustomersByGroup({
    groupName: queryObject?.groups || 'all',
    sortBy: sortBy || 'created_at',
    sortDirection: sortDirection || 'desc',
    offset: queryObject.offset || 0,
    limit: queryObject.limit || DEFAULT_PAGE_SIZE,
    q: queryObject.q,
    countryCode: queryObject.countryCode,
  });

  const [query, setQuery] = useState(queryObject.query);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    if (typeof customersData.total !== 'undefined') {
      const controlledPageCount = Math.ceil(customersData.total / lim);
      setNumPages(controlledPageCount);
    }
  }, [customersData.total]);

  const [columns] = useCustomerColumns();

  const handleSortChange = (newSortBy: string | null, newSortDirection: string | null) => {
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data: customersData.customers || [],
      manualPagination: true,
      initialState: {
        pageSize: lim,
        pageIndex: offs / lim,
      },
      pageCount: numPages,
      autoResetPage: false,
    },
    usePagination,
  );

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        setFreeText(query);
        gotoPage(0);
      } else {
        if (typeof query !== 'undefined') {
          reset();
        }
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleNext = () => {
    if (canNextPage) {
      paginate(1);
      nextPage();
    }
  };

  const handlePrev = () => {
    if (canPreviousPage) {
      paginate(-1);
      previousPage();
    }
  };

  const handlePageInput = (page: number) => {
    if (page >= 1 && page <= numPages) {
      gotoPage(page - 1);
      paginate(page, 'goToPage');
    }
  };

  const updateUrlFromFilter = (obj = {}) => {
    const stringified = qs.stringify(obj);
    window.history.replaceState(`/a/customers`, '', `${`?${stringified}`}`);
  };

  const refreshWithFilters = () => {
    const filterObj = representationObject;

    if (isEmpty(filterObj)) {
      updateUrlFromFilter({ offset: 0, limit: DEFAULT_PAGE_SIZE });
    } else {
      updateUrlFromFilter(filterObj);
    }
  };

  const clearFilters = () => {
    reset();
    setQuery('');
    setSortBy(null);
    setSortDirection(null);
  };

  useEffect(() => {
    refreshWithFilters();
  }, [representationObject]);

  // useEffect(() => {
  //   if (queryObject.q) {
  //     setGroupsFilter(null);
  //     setSortBy(null);
  //     setSortDirection(null);
  //   }
  // }, [queryObject.q]);

  return (
    <TableContainer
      hasPagination
      numberOfRows={queryObject.limit}
      pagingState={{
        count: customersData.total,
        offset: queryObject.offset,
        pageSize: queryObject.offset + rows.length,
        title: t('customer-table-customers', 'Customers'),
        currentPage: pageIndex + 1,
        pageCount: Math.ceil(customersData.total / queryObject.limit),
        nextPage: handleNext,
        prevPage: handlePrev,
        hasNext: canNextPage,
        hasPrev: canPreviousPage,
        gotoPage: handlePageInput,
      }}
      // isLoading={isLoading}
    >
      <Table
        enableSearch
        handleSearch={setQuery}
        searchValue={query}
        filteringOptions={
          <div className="flex items-center gap-2">
            <CustomerFilters
              filters={filters}
              submitFilters={setFilters}
              clearFilters={clearFilters}
              tabs={filterTabs}
              onTabClick={setTab}
              activeTab={activeFilterTab}
              onRemoveTab={removeTab}
              onSaveTab={saveTab}
            />
            <CustomerSortDropdown sortBy={sortBy} sortDirection={sortDirection} onSortChange={handleSortChange} />
          </div>
        }
        {...getTableProps()}
      >
        <Table.Head>
          {headerGroups?.map(headerGroup => (
            <Table.HeadRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(col => (
                <Table.HeadCell className="w-[100px]" {...col.getHeaderProps()}>
                  {col.render('Header')}
                </Table.HeadCell>
              ))}
            </Table.HeadRow>
          ))}
        </Table.Head>
        <Table.Body {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <Table.Row
                color={'inherit'}
                actions={[
                  {
                    label: t('customer-table-edit', 'Edit'),
                    onClick: () => navigate(row.original.id),
                    icon: <EditIcon size={20} />,
                  },
                  {
                    label: t('customer-table-details', 'Details'),
                    onClick: () => navigate(row.original.id),
                    icon: <DetailsIcon size={20} />,
                  },
                ]}
                linkTo={`/a/customers/${row.original.id}`}
                {...row.getRowProps()}
              >
                {row.cells.map((cell, index) => {
                  return <Table.Cell {...cell.getCellProps()}>{cell.render('Cell', { index })}</Table.Cell>;
                })}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </TableContainer>
  );
};

export default CustomerTable;
