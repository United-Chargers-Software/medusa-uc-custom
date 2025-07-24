import clsx from 'clsx';
import { isEmpty } from 'lodash';
import qs from 'qs';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePagination, useTable } from 'react-table';
import { useAnalytics } from '../../../providers/analytics-provider';
import { useFeatureFlag } from '../../../providers/feature-flag-provider';
import Table from '../../molecules/table';
import TableContainer from '../../organisms/table-container';
import OrderFilters from '../order-filter-dropdown';
import OrderSortDropdown from '../order-sort-dropdown';
import useOrderTableColums from './use-order-column';
import { useOrderFilters } from './use-order-filters';
import useOrdersByGroup from '../../../hooks/use-orders-by-group';

const DEFAULT_PAGE_SIZE = 15;

const defaultQueryProps = {
  expand: 'customer,shipping_address,cart',
  fields: 'id,status,display_id,created_at,email,fulfillment_status,payment_status,total,currency_code,metadata',
};

type OrderTableProps = {
  setContextFilters: (filters: Record<string, { filter: string[] }>) => void;
};

const OrderTable = ({ setContextFilters }: OrderTableProps) => {
  const location = useLocation();

  const { isFeatureEnabled } = useFeatureFlag();
  const { trackNumberOfOrders } = useAnalytics();

  const [sortBy, setSortBy] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<string | null>('desc');

  let hiddenColumns = ['sales_channel'];
  if (isFeatureEnabled('sales_channels')) {
    if (!defaultQueryProps.expand.includes('sales_channel')) {
      defaultQueryProps.expand = defaultQueryProps.expand + ',shipping_address,sales_channel,items';
    }
    hiddenColumns = [];
  }

  const {
    removeTab,
    setTab,
    saveTab,
    availableTabs: filterTabs,
    activeFilterTab,
    reset,
    paginate,
    setFilters,
    filters,
    setQuery: setFreeText,
    queryObject,
    representationObject,
  } = useOrderFilters(location.search, defaultQueryProps);
  const filtersOnLoad = queryObject;

  const offs = parseInt(queryObject?.offset) || 0;
  const lim = parseInt(queryObject.limit) || DEFAULT_PAGE_SIZE;

  const [query, setQuery] = useState(filtersOnLoad?.query || filtersOnLoad?.q);
  const [numPages, setNumPages] = useState(0);

  const { ordersData } = useOrdersByGroup({
    sortBy: sortBy || 'created_at',
    sortDirection: sortDirection || 'desc',
    offset: queryObject.offset || 0,
    limit: queryObject.limit || DEFAULT_PAGE_SIZE,
    q: query || queryObject.query || queryObject.q,
    status: queryObject.status,
    paymentStatus: queryObject.payment_status,
    fulfillmentStatus: queryObject.fulfillment_status,
    salesChannelId: queryObject.sales_channel_id,
    regionId: queryObject.region_id,
    club: filters.club?.open ? filters.club.filter : null,
    ga: filters.ga?.open ? filters.ga.filter : null,
    ref: filters.ref?.open ? filters.ref.filter : null,
    odoo: filters.odoo?.open ? filters.odoo.filter : null,
    created_at: queryObject.created_at,
  });

  useEffect(() => {
    if (ordersData.total) {
      trackNumberOfOrders({
        count: ordersData.total,
      });
    }
  }, [ordersData.total]);

  const handleSortChange = (newSortBy: string | null, newSortDirection: string | null) => {
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
    gotoPage(0); // Reset to first page when sorting changes
  };

  useEffect(() => {
    if (typeof ordersData.total !== 'undefined') {
      const controlledPageCount = Math.ceil(ordersData.total / queryObject.limit);
      setNumPages(controlledPageCount);
    }
  }, [ordersData.total, queryObject.limit]);

  useEffect(() => {
    setContextFilters(filters as {});
  }, [filters]);

  // Reset page when search query changes
  useEffect(() => {
    if (query !== filtersOnLoad?.query && query !== filtersOnLoad?.q) {
      gotoPage(0);
    }
  }, [query]);

  const [columns] = useOrderTableColums();

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
      data: ordersData.orders || [],
      manualPagination: true,
      initialState: {
        pageSize: lim,
        pageIndex: offs / lim,
        hiddenColumns,
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
    }, 1000);

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
    window.history.replaceState(`/a/orders`, '', `${`?${stringified}`}`);
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
    setSortBy('created_at');
    setSortDirection('desc');
    gotoPage(0); // Reset to first page when clearing filters
  };

  useEffect(() => {
    refreshWithFilters();
  }, [representationObject]);

  return (
    <div>
      <TableContainer
        isLoading={ordersData.isLoading}
        hasPagination
        numberOfRows={lim}
        pagingState={{
          count: ordersData.total || 0,
          offset: queryObject.offset,
          pageSize: queryObject.offset + rows.length,
          title: 'Orders',
          currentPage: pageIndex + 1,
          pageCount: pageCount,
          nextPage: handleNext,
          prevPage: handlePrev,
          hasNext: canNextPage,
          hasPrev: canPreviousPage,
          gotoPage: handlePageInput,
        }}
      >
        <Table
          filteringOptions={
            <div className="flex items-center gap-2">
              <OrderFilters
                filters={filters}
                submitFilters={setFilters}
                clearFilters={clearFilters}
                tabs={filterTabs}
                onTabClick={setTab}
                activeTab={activeFilterTab}
                onRemoveTab={removeTab}
                onSaveTab={saveTab}
              />
              <OrderSortDropdown sortBy={sortBy} sortDirection={sortDirection} onSortChange={handleSortChange} />
            </div>
          }
          enableSearch
          handleSearch={setQuery}
          searchValue={query}
          {...getTableProps()}
          className={clsx({ ['relative']: false })}
        >
          <Table.Head>
            {headerGroups?.map((headerGroup, index) => (
              <Table.HeadRow {...headerGroup.getHeaderGroupProps()} key={index}>
                {headerGroup.headers.map((col, idx) => (
                  <Table.HeadCell {...col.getHeaderProps()} key={idx}>
                    {col.render('Header')}
                  </Table.HeadCell>
                ))}
              </Table.HeadRow>
            ))}
          </Table.Head>
          <Table.Body {...getTableBodyProps()}>
            {rows.map((row, index) => {
              prepareRow(row);
              return (
                <Table.Row
                  color={'inherit'}
                  linkTo={`/a/orders/${(row.original as any).id}`}
                  {...row.getRowProps()}
                  className="group"
                  key={index}
                >
                  {row.cells.map((cell, idx) => {
                    return (
                      <Table.Cell {...cell.getCellProps()} key={idx}>
                        {cell.render('Cell')}
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </TableContainer>
    </div>
  );
};

export default React.memo(OrderTable);
