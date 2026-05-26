import { omit } from 'lodash';
import qs from 'qs';
import { useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { relativeDateFormatToTimestamp } from '../../../utils/time';

type OrderDateFilter = null | {
  gt?: string;
  lt?: string;
};

type OdooFilterState = {
  salesOrder: boolean;
  deliveryOrder: boolean;
};

type OrderFilterAction =
  | { type: 'setQuery'; payload: string | null }
  | { type: 'setFilters'; payload: OrderFilterState }
  | { type: 'reset'; payload: OrderFilterState }
  | { type: 'setOffset'; payload: number }
  | { type: 'setDefaults'; payload: OrderDefaultFilters | null }
  | { type: 'setDate'; payload: OrderDateFilter }
  | { type: 'setStatus'; payload: null | string[] | string }
  | { type: 'setFulfillment'; payload: null | string[] | string }
  | { type: 'setPayment'; payload: null | string[] | string }
  | { type: 'setClub'; payload: null | boolean }
  | { type: 'setGa'; payload: null | boolean }
  | { type: 'setRef'; payload: null | boolean }
  | { type: 'setClubMembershipId'; payload: null | string }
  | { type: 'setOdoo'; payload: null | OdooFilterState }
  | { type: 'setIsSyncedWithConnect'; payload: null | boolean };

interface OrderFilterState {
  query?: string | null;
  region: {
    open: boolean;
    filter: null | string[] | string;
  };
  salesChannel: {
    open: boolean;
    filter: null | string[] | string;
  };
  status: {
    open: boolean;
    filter: null | string[] | string;
  };
  fulfillment: {
    open: boolean;
    filter: null | string[] | string;
  };
  payment: {
    open: boolean;
    filter: null | string[] | string;
  };
  date: {
    open: boolean;
    filter: OrderDateFilter;
  };
  club: {
    open: boolean;
    filter: null | boolean;
  };
  ga: {
    open: boolean;
    filter: null | boolean;
  };
  ref: {
    open: boolean;
    filter: null | boolean;
  };
  clubMembershipId: {
    open: boolean;
    filter: null | string;
  };
  odoo: {
    open: boolean;
    filter: null | OdooFilterState;
  };
  isSyncedWithConnect: {
    open: boolean;
    filter: null | boolean;
  };
  limit: number;
  offset: number;
  additionalFilters: OrderDefaultFilters | null;
}

const allowedFilters = [
  'status',
  'region',
  'fulfillment_status',
  'payment_status',
  'created_at',
  'q',
  'offset',
  'limit',
  'club',
  'ga',
  'ref',
  'clubMembership',
  'odoo',
  'isSyncedWithConnect',
];

const DefaultTabs = {
  incomplete: {
    fulfillment_status: ['not_fulfilled', 'fulfilled'],
    payment_status: ['awaiting'],
  },
  complete: {
    fulfillment_status: ['shipped'],
    payment_status: ['captured'],
  },
};

const formatDateFilter = (filter: OrderDateFilter) => {
  if (filter === null) {
    return filter;
  }

  const dateFormatted = Object.entries(filter).reduce((acc: { [key: string]: string }, [key, value]) => {
    if (value.includes('|')) {
      acc[key] = relativeDateFormatToTimestamp(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});

  return dateFormatted;
};

const reducer = (state: OrderFilterState, action: OrderFilterAction): OrderFilterState => {
  switch (action.type) {
    case 'setFilters': {
      const filtersChanged =
        JSON.stringify(state.region) !== JSON.stringify(action.payload.region) ||
        JSON.stringify(state.salesChannel) !== JSON.stringify(action.payload.salesChannel) ||
        JSON.stringify(state.fulfillment) !== JSON.stringify(action.payload.fulfillment) ||
        JSON.stringify(state.payment) !== JSON.stringify(action.payload.payment) ||
        JSON.stringify(state.status) !== JSON.stringify(action.payload.status) ||
        JSON.stringify(state.date) !== JSON.stringify(action.payload.date) ||
        JSON.stringify(state.club) !== JSON.stringify(action.payload.club) ||
        JSON.stringify(state.ga) !== JSON.stringify(action.payload.ga) ||
        JSON.stringify(state.ref) !== JSON.stringify(action.payload.ref) ||
        JSON.stringify(state.clubMembershipId) !== JSON.stringify(action.payload.clubMembershipId) ||
        JSON.stringify(state.odoo) !== JSON.stringify(action.payload.odoo) ||
        JSON.stringify(state.isSyncedWithConnect) !== JSON.stringify(action.payload.isSyncedWithConnect);
      state.query !== action.payload.query;

      const offset = filtersChanged ? 0 : action.payload.offset !== undefined ? action.payload.offset : state.offset;

      return {
        ...state,
        region: action.payload.region,
        salesChannel: action.payload.salesChannel,
        fulfillment: action.payload.fulfillment,
        payment: action.payload.payment,
        status: action.payload.status,
        date: action.payload.date,
        club: action.payload.club,
        ga: action.payload.ga,
        ref: action.payload.ref,
        clubMembershipId: action.payload.clubMembershipId,
        odoo: action.payload.odoo,
        isSyncedWithConnect: action.payload.isSyncedWithConnect,
        query: action?.payload?.query,
        offset,
      };
    }
    case 'setQuery': {
      return {
        ...state,
        offset: 0, // reset offset when query changes
        query: action.payload,
      };
    }
    case 'setDate': {
      const newDateFilters = state.date;
      return {
        ...state,
        date: newDateFilters,
      };
    }
    case 'setOffset': {
      return {
        ...state,
        offset: action.payload,
      };
    }
    case 'reset': {
      return action.payload;
    }
    default: {
      return state;
    }
  }
};

type OrderDefaultFilters = {
  expand?: string;
  fields?: string;
};

const eqSet = (as: Set<string>, bs: Set<string>) => {
  if (as.size !== bs.size) {
    return false;
  }
  for (const a of as) {
    if (!bs.has(a)) {
      return false;
    }
  }
  return true;
};

export const useOrderFilters = (existing?: string, defaultFilters: OrderDefaultFilters | null = null) => {
  const { t } = useTranslation();

  if (existing && existing[0] === '?') {
    existing = existing.substring(1);
  }

  const initial = useMemo(() => parseQueryString(existing, defaultFilters), [existing, defaultFilters]);

  const initialTabs = useMemo(() => {
    const storageString = localStorage.getItem('orders::filters');
    if (storageString) {
      const savedTabs = JSON.parse(storageString);

      if (savedTabs) {
        return Object.entries(savedTabs).map(([key, value]) => {
          return {
            label: key,
            value: key,
            removable: true,
            representationString: value,
          };
        });
      }
    }

    return [];
  }, []);

  const [state, dispatch] = useReducer(reducer, initial);
  const [tabs, setTabs] = useState(initialTabs);

  const setDateFilter = (filter: OrderDateFilter | null) => {
    dispatch({ type: 'setDate', payload: filter });
  };

  const setFulfillmentFilter = (filter: string[] | string | null) => {
    dispatch({ type: 'setFulfillment', payload: filter });
  };

  const setPaymentFilter = (filter: string[] | string | null) => {
    dispatch({ type: 'setPayment', payload: filter });
  };

  const setStatusFilter = (filter: string[] | string | null) => {
    dispatch({ type: 'setStatus', payload: filter });
  };

  const setDefaultFilters = (filters: OrderDefaultFilters | null) => {
    dispatch({ type: 'setDefaults', payload: filters });
  };

  const paginate = (direction: 1 | -1 | number, type?: 'goToPage') => {
    if (type === 'goToPage') {
      const nextOffset = state.limit * direction - state.limit;
      dispatch({ type: 'setOffset', payload: nextOffset });
      return;
    }

    if (direction > 0) {
      const nextOffset = state.offset + state.limit;
      dispatch({ type: 'setOffset', payload: nextOffset });
    } else {
      const nextOffset = Math.max(state.offset - state.limit, 0);
      dispatch({ type: 'setOffset', payload: nextOffset });
    }
  };

  const reset = () => {
    dispatch({
      type: 'setFilters',
      payload: {
        ...state,
        offset: 0,
        region: {
          open: false,
          filter: null,
        },
        payment: {
          open: false,
          filter: null,
        },
        fulfillment: {
          open: false,
          filter: null,
        },
        status: {
          open: false,
          filter: null,
        },
        salesChannel: {
          open: false,
          filter: null,
        },
        date: {
          open: false,
          filter: null,
        },
        club: {
          open: false,
          filter: null,
        },
        ga: {
          open: false,
          filter: null,
        },
        ref: {
          open: false,
          filter: null,
        },
        clubMembershipId: {
          open: false,
          filter: null,
        },
        odoo: {
          open: false,
          filter: null,
        },
        isSyncedWithConnect: {
          open: false,
          filter: null,
        },
        query: null,
      },
    });
  };

  const setFilters = (filters: OrderFilterState) => {
    dispatch({ type: 'setFilters', payload: filters });
  };

  const setQuery = (queryString: string | null) => {
    dispatch({ type: 'setQuery', payload: queryString });
  };

  const getQueryObject = () => {
    const toQuery: any = { ...state.additionalFilters };

    const nullCheckFilters = ['club', 'ga', 'ref', 'clubMembershipId', 'odoo', 'isSyncedWithConnect'];

    for (const [key, value] of Object.entries(state)) {
      if (key === 'query') {
        if (value && typeof value === 'string') {
          toQuery['q'] = value;
        }
      } else if (key === 'offset' || key === 'limit') {
        toQuery[key] = value;
      } else if (value.open && stateFilterMap[key]) {
        if (key === 'date') {
          toQuery[stateFilterMap[key]] = formatDateFilter(value.filter as OrderDateFilter);
        } else if (nullCheckFilters.includes(key)) {
          if (value.filter !== null) {
            toQuery[stateFilterMap[key]] = value.filter;
          }
        } else {
          toQuery[stateFilterMap[key]] = value.filter;
        }
      }
    }

    return toQuery;
  };

  const getQueryString = () => {
    const obj = getQueryObject();
    return qs.stringify(obj, { skipNulls: true });
  };

  const getRepresentationObject = (fromObject?: OrderFilterState) => {
    const objToUse = fromObject ?? state;

    const toQuery: any = {};
    for (const [key, value] of Object.entries(objToUse)) {
      if (key === 'query') {
        if (value && typeof value === 'string') {
          toQuery['q'] = value;
        }
      } else if (key === 'offset' || key === 'limit') {
        toQuery[key] = value;
      } else if (value.open) {
        toQuery[stateFilterMap[key]] = value.filter;
      }
    }

    return toQuery;
  };

  const getRepresentationString = () => {
    const obj = getRepresentationObject();
    return qs.stringify(obj, { skipNulls: true });
  };

  const queryObject = useMemo(() => getQueryObject(), [state]);
  const representationObject = useMemo(() => getRepresentationObject(), [state]);
  const representationString = useMemo(() => getRepresentationString(), [state]);

  const activeFilterTab = useMemo(() => {
    const clean = omit(representationObject, ['limit', 'offset']);
    const stringified = qs.stringify(clean);

    const existsInSaved = tabs.find(el => el.representationString === stringified);
    if (existsInSaved) {
      return existsInSaved.value;
    }

    for (const [tab, conditions] of Object.entries(DefaultTabs)) {
      let match = true;

      if (Object.keys(clean).length !== Object.keys(conditions).length) {
        continue;
      }

      for (const [filter, value] of Object.entries(conditions)) {
        if (filter in clean) {
          if (Array.isArray(value)) {
            match = Array.isArray(clean[filter]) && eqSet(new Set(clean[filter]), new Set(value));
          } else {
            match = clean[filter] === value;
          }
        } else {
          match = false;
        }

        if (!match) {
          break;
        }
      }

      if (match) {
        return tab;
      }
    }

    return null;
  }, [representationObject, tabs]);

  const availableTabs = useMemo(() => {
    return [
      {
        label: t('order-table-filters-complete', 'Complete'),
        value: 'complete',
      },
      {
        label: t('order-table-filters-incomplete', 'Incomplete'),
        value: 'incomplete',
      },
      ...tabs,
    ];
  }, [tabs]);

  const setTab = (tabName: string) => {
    let tabToUse: object | null = null;
    if (tabName in DefaultTabs) {
      tabToUse = (DefaultTabs as any)[tabName];
    } else {
      const tabFound = tabs.find(t => t.value === tabName);
      if (tabFound) {
        tabToUse = qs.parse(tabFound.representationString as string);
      }
    }

    if (tabToUse) {
      const toSubmit = {
        ...state,
        date: {
          open: false,
          filter: null,
        },
        payment: {
          open: false,
          filter: null,
        },
        fulfillment: {
          open: false,
          filter: null,
        },
        status: {
          open: false,
          filter: null,
        },
        club: {
          open: false,
          filter: null,
        },
        ga: {
          open: false,
          filter: null,
        },
        ref: {
          open: false,
          filter: null,
        },
        clubMembershipId: {
          open: false,
          filter: null,
        },
        odoo: {
          open: false,
          filter: null,
        },
        isSyncedWithConnect: {
          open: false,
          filter: null,
        },
      };

      for (const [filter, val] of Object.entries(tabToUse)) {
        const stateKey = filterStateMap[filter] as keyof OrderFilterState;
        if (stateKey && stateKey in toSubmit) {
          (toSubmit as any)[stateKey] = {
            open: true,
            filter: val,
          };
        }
      }
      dispatch({ type: 'setFilters', payload: toSubmit });
    }
  };

  const saveTab = (tabName: string, filters: OrderFilterState) => {
    const repObj = getRepresentationObject({ ...filters });
    const clean = omit(repObj, ['limit', 'offset']);
    const repString = qs.stringify(clean, { skipNulls: true });

    const storedString = localStorage.getItem('orders::filters');

    let existing: { [key: string]: string } | null = null;

    if (storedString) {
      existing = JSON.parse(storedString);
    }

    if (existing) {
      existing[tabName] = repString;
      localStorage.setItem('orders::filters', JSON.stringify(existing));
    } else {
      const newFilters: { [key: string]: string } = {};
      newFilters[tabName] = repString;
      localStorage.setItem('orders::filters', JSON.stringify(newFilters));
    }

    setTabs(prev => {
      return [
        ...prev,
        {
          label: tabName,
          value: tabName,
          representationString: repString,
          removable: true,
        },
      ];
    });

    dispatch({ type: 'setFilters', payload: filters });
  };

  const removeTab = (tabValue: string) => {
    const storedString = localStorage.getItem('orders::filters');

    let existing: { [key: string]: string } | null = null;

    if (storedString) {
      existing = JSON.parse(storedString);
    }

    if (existing) {
      delete existing[tabValue];
      localStorage.setItem('orders::filters', JSON.stringify(existing));
    }

    setTabs(prev => {
      const newTabs = prev.filter(p => p.value !== tabValue);
      return newTabs;
    });
  };

  return {
    ...state,
    filters: {
      ...state,
    },
    removeTab,
    saveTab,
    setTab,
    availableTabs,
    activeFilterTab,
    representationObject,
    representationString,
    queryObject,
    paginate,
    getQueryObject,
    getQueryString,
    setQuery,
    setFilters,
    setDefaultFilters,
    setDateFilter,
    setFulfillmentFilter,
    setPaymentFilter,
    setStatusFilter,
    reset,
  };
};

const filterStateMap: { [key: string]: string } = {
  status: 'status',
  fulfillment_status: 'fulfillment',
  payment_status: 'payment',
  created_at: 'date',
  region_id: 'region',
  sales_channel_id: 'salesChannel',
  club: 'club',
  ga: 'ga',
  ref: 'ref',
  clubMembership: 'clubMembershipId',
  odoo: 'odoo',
  isSyncedWithConnect: 'isSyncedWithConnect',
};

const stateFilterMap: { [key: string]: string } = {
  region: 'region_id',
  salesChannel: 'sales_channel_id',
  status: 'status',
  fulfillment: 'fulfillment_status',
  payment: 'payment_status',
  date: 'created_at',
  club: 'club',
  ga: 'ga',
  ref: 'ref',
  clubMembershipId: 'clubMembership',
  odoo: 'odoo',
  isSyncedWithConnect: 'isSyncedWithConnect',
};

const parseQueryString = (queryString?: string, additionals: OrderDefaultFilters | null = null): OrderFilterState => {
  const defaultVal: OrderFilterState = {
    status: {
      open: false,
      filter: null,
    },
    fulfillment: {
      open: false,
      filter: null,
    },
    region: {
      open: false,
      filter: null,
    },
    salesChannel: {
      open: false,
      filter: null,
    },
    payment: {
      open: false,
      filter: null,
    },
    date: {
      open: false,
      filter: null,
    },
    club: {
      open: false,
      filter: null,
    },
    ga: {
      open: false,
      filter: null,
    },
    ref: {
      open: false,
      filter: null,
    },
    clubMembershipId: {
      open: false,
      filter: null,
    },
    odoo: {
      open: false,
      filter: null,
    },
    isSyncedWithConnect: {
      open: false,
      filter: null,
    },
    offset: 0,
    limit: 15,
    additionalFilters: additionals,
  };

  if (queryString) {
    const filters = qs.parse(queryString);
    for (const [key, value] of Object.entries(filters)) {
      if (allowedFilters.includes(key)) {
        switch (key) {
          case 'offset': {
            if (typeof value === 'string') {
              defaultVal.offset = parseInt(value);
            }
            break;
          }
          case 'limit': {
            if (typeof value === 'string') {
              defaultVal.limit = parseInt(value);
            }
            break;
          }
          case 'q': {
            if (typeof value === 'string') {
              defaultVal.query = value;
            }
            break;
          }
          case 'status': {
            if (typeof value === 'string' || (Array.isArray(value) && value.every(v => typeof v === 'string'))) {
              defaultVal.status = {
                open: true,
                filter: value as string | string[],
              };
            }
            break;
          }
          case 'fulfillment_status': {
            if (typeof value === 'string' || (Array.isArray(value) && value.every(v => typeof v === 'string'))) {
              defaultVal.fulfillment = {
                open: true,
                filter: value as string | string[],
              };
            }
            break;
          }
          case 'region_id': {
            if (typeof value === 'string' || (Array.isArray(value) && value.every(v => typeof v === 'string'))) {
              defaultVal.region = {
                open: true,
                filter: value as string | string[],
              };
            }
            break;
          }
          case 'sales_channel_id': {
            if (typeof value === 'string' || (Array.isArray(value) && value.every(v => typeof v === 'string'))) {
              defaultVal.salesChannel = {
                open: true,
                filter: value as string | string[],
              };
            }
            break;
          }
          case 'payment_status': {
            if (typeof value === 'string' || (Array.isArray(value) && value.every(v => typeof v === 'string'))) {
              defaultVal.payment = {
                open: true,
                filter: value as string | string[],
              };
            }
            break;
          }
          case 'created_at': {
            if (value && (typeof value === 'string' || typeof value === 'object')) {
              defaultVal.date = {
                open: true,
                filter: value as OrderDateFilter,
              };
            }
            break;
          }
          case 'club': {
            if (typeof value === 'string') {
              defaultVal.club = {
                open: true,
                filter: value === 'true',
              };
            }
            break;
          }
          case 'ga': {
            if (typeof value === 'string') {
              defaultVal.ga = {
                open: true,
                filter: value === 'true',
              };
            }
            break;
          }
          case 'ref': {
            if (typeof value === 'string') {
              defaultVal.ref = {
                open: true,
                filter: value === 'true',
              };
            }
            break;
          }
          case 'clubMembership': {
            if (typeof value === 'string') {
              defaultVal.clubMembershipId = {
                open: true,
                filter: value,
              };
            }
            break;
          }
          case 'odoo': {
            if (typeof value === 'object' && value !== null) {
              const odooValue = value as any;
              if ('salesOrder' in odooValue || 'deliveryOrder' in odooValue) {
                defaultVal.odoo = {
                  open: true,
                  filter: {
                    salesOrder: odooValue.salesOrder === 'true',
                    deliveryOrder: odooValue.deliveryOrder === 'true',
                  },
                };
              }
            }
            break;
          }
          case 'isSyncedWithConnect': {
            if (typeof value === 'string') {
              defaultVal.isSyncedWithConnect = {
                open: true,
                filter: value === 'true',
              };
            }
            break;
          }
          default: {
            break;
          }
        }
      }
    }
  }

  return defaultVal;
};
