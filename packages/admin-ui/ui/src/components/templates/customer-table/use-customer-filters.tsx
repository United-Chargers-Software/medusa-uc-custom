import qs from 'qs';
import { useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { omit } from 'lodash';

type CustomerFilterAction =
  | { type: 'setQuery'; payload: string | null }
  | { type: 'setFilters'; payload: CustomerFilterState }
  | { type: 'reset'; payload: CustomerFilterState }
  | { type: 'setOffset'; payload: number }
  | { type: 'setDefaults'; payload: CustomerDefaultFilters | null }
  | { type: 'setGroups'; payload: null | string[] | string }
  | { type: 'setCountryCode'; payload: null | string[] | string };
// | { type: 'setEmail'; payload: null | string }
// | { type: 'setCity'; payload: null | string }
// | { type: 'setName'; payload: null | string };

interface CustomerFilterState {
  query?: string | null;
  limit: number;
  offset: number;
  groups: {
    open: boolean;
    filter: null | string[] | string;
  };
  countryCode: {
    open: boolean;
    filter: null | string[] | string;
  };
  // email: {
  //   open: boolean;
  //   filter: null | string;
  // };
  // city: {
  //   open: boolean;
  //   filter: null | string;
  // };
  // name: {
  //   open: boolean;
  //   filter: null | string;
  // };
  additionalFilters: CustomerDefaultFilters | null;
}

const allowedFilters = [
  'q',
  'offset',
  'limit',
  'groups',
  'countryCode',
  // , 'email', 'city', 'name'
];

const reducer = (state: CustomerFilterState, action: CustomerFilterAction): CustomerFilterState => {
  switch (action.type) {
    case 'setFilters': {
      return {
        ...state,
        query: action?.payload?.query,
        groups: action?.payload?.groups || state.groups,
        countryCode: action?.payload?.countryCode || state.countryCode,
        // email: action?.payload?.email || state.email,
        // city: action?.payload?.city || state.city,
        // name: action?.payload?.name || state.name,
      };
    }
    case 'setQuery': {
      return {
        ...state,
        offset: 0, // reset offset when query changes
        query: action.payload,
      };
    }
    case 'setOffset': {
      return {
        ...state,
        offset: action.payload,
      };
    }
    case 'setGroups': {
      const groups = state.groups;
      groups.filter = action.payload;
      groups.open = action.payload !== null;
      return {
        ...state,
        groups,
      };
    }
    case 'setCountryCode': {
      const countryCode = state.countryCode;
      countryCode.filter = action.payload;
      countryCode.open = action.payload !== null;
      return {
        ...state,
        countryCode,
      };
    }
    // case 'setEmail': {
    //   const email = state.email;
    //   email.filter = action.payload;
    //   email.open = action.payload !== null;
    //   return {
    //     ...state,
    //     email,
    //   };
    // }
    // case 'setCity': {
    //   const city = state.city;
    //   city.filter = action.payload;
    //   city.open = action.payload !== null;
    //   return {
    //     ...state,
    //     city,
    //   };
    // }
    // case 'setName': {
    //   const name = state.name;
    //   name.filter = action.payload;
    //   name.open = action.payload !== null;
    //   return {
    //     ...state,
    //     name,
    //   };
    // }
    case 'reset': {
      return action.payload;
    }
    default: {
      return state;
    }
  }
};

type CustomerDefaultFilters = {
  expand?: string;
  fields?: string;
};

export const useCustomerFilters = (existing?: string, defaultFilters: CustomerDefaultFilters | null = null) => {
  const { t } = useTranslation();

  if (existing && existing[0] === '?') {
    existing = existing.substring(1);
  }

  const initial = useMemo(() => parseQueryString(existing, defaultFilters), [existing, defaultFilters]);

  const [state, dispatch] = useReducer(reducer, initial);

  const initialTabs = useMemo(() => {
    const storageString = localStorage.getItem('customers::filters');
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

  const [tabs, setTabs] = useState(initialTabs);

  const setGroupsFilter = (filter: string[] | string | null) => {
    dispatch({ type: 'setGroups', payload: filter });
  };

  const setCountryCodeFilter = (filter: string[] | string | null) => {
    dispatch({ type: 'setCountryCode', payload: filter });
  };

  // const setEmailFilter = (filter: string | null) => {
  //   dispatch({ type: 'setEmail', payload: filter });
  // };

  // const setCityFilter = (filter: string | null) => {
  //   dispatch({ type: 'setCity', payload: filter });
  // };

  // const setNameFilter = (filter: string | null) => {
  //   dispatch({ type: 'setName', payload: filter });
  // };

  const setDefaultFilters = (filters: CustomerDefaultFilters | null) => {
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
        query: null,
        groups: {
          open: false,
          filter: null,
        },
        countryCode: {
          open: false,
          filter: null,
        },
        // email: {
        //   open: false,
        //   filter: null,
        // },
        // city: {
        //   open: false,
        //   filter: null,
        // },
        // name: {
        //   open: false,
        //   filter: null,
        // },
      },
    });
  };

  const setFilters = (filters: CustomerFilterState) => {
    dispatch({ type: 'setFilters', payload: filters });
  };

  const setQuery = (queryString: string | null) => {
    dispatch({ type: 'setQuery', payload: queryString });
  };

  const stateFilterMap = {
    groups: 'groups',
    countryCode: 'billing_address.country_code',
    // email: 'email',
    // city: 'billing_address.city',
    // name: 'q',
  };

  const getQueryObject = () => {
    const toQuery: any = { ...state.additionalFilters };

    if (state.query && typeof state.query === 'string') {
      toQuery['q'] = state.query;
    }

    // if (state.name?.open && state.name?.filter) {
    //   toQuery['q'] = state.name.filter;
    // } else if (state.query && typeof state.query === 'string') {
    //   toQuery['q'] = state.query;
    // }

    // if (state.email?.open && state.email?.filter) {
    //   toQuery['email'] = state.email.filter;
    // }

    if (state.groups?.open && state.groups?.filter) {
      toQuery['groups'] = state.groups.filter;
    }

    if (state.countryCode?.open && state.countryCode?.filter) {
      toQuery['countryCode'] = state.countryCode.filter;
    }

    // if (state.city?.open && state.city?.filter) {
    //   toQuery['city'] = state.city.filter;
    // }

    toQuery['offset'] = state.offset;
    toQuery['limit'] = state.limit;

    return toQuery;
  };

  const getRepresentationObject = (fromObject?: CustomerFilterState) => {
    const objToUse = fromObject ?? state;

    const toQuery: any = {};
    for (const [key, value] of Object.entries(objToUse)) {
      if (key === 'query') {
        if (value && typeof value === 'string') {
          toQuery['q'] = value;
        }
      } else if (key === 'offset' || key === 'limit') {
        toQuery[key] = value;
      } else if (key in stateFilterMap && value?.open && value?.filter) {
        toQuery[stateFilterMap[key]] = value.filter;
      }
    }

    return toQuery;
  };

  const getQueryString = () => {
    const obj = getQueryObject();
    return qs.stringify(obj, { skipNulls: true });
  };

  const getRepresentationString = () => {
    const obj = getRepresentationObject();
    return qs.stringify(obj, { skipNulls: true });
  };

  const saveTab = (tabName: string, filters: CustomerFilterState) => {
    const repObj = getRepresentationObject({ ...filters });
    const clean = omit(repObj, ['limit', 'offset']);
    const repString = qs.stringify(clean, { skipNulls: true });

    const storedString = localStorage.getItem('customers::filters');

    let existing: null | object = null;

    if (storedString) {
      existing = JSON.parse(storedString);
    }

    if (existing) {
      existing[tabName] = repString;
      localStorage.setItem('customers::filters', JSON.stringify(existing));
    } else {
      const newFilters = {};
      newFilters[tabName] = repString;
      localStorage.setItem('customers::filters', JSON.stringify(newFilters));
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
    const storedString = localStorage.getItem('customers::filters');

    let existing: null | object = null;

    if (storedString) {
      existing = JSON.parse(storedString);
    }

    if (existing) {
      delete existing[tabValue];
      localStorage.setItem('customers::filters', JSON.stringify(existing));
    }

    setTabs(prev => {
      const newTabs = prev.filter(p => p.value !== tabValue);
      return newTabs;
    });
  };

  const setTab = (tabName: string) => {
    const tabFound = tabs.find(t => t.value === tabName);
    if (tabFound) {
      const tabToUse = qs.parse(tabFound.representationString);
      const toSubmit = {
        ...state,
        groups: {
          open: false,
          filter: null,
        },
        countryCode: {
          open: false,
          filter: null,
        },
        // email: {
        //   open: false,
        //   filter: null,
        // },
        // city: {
        //   open: false,
        //   filter: null,
        // },
        // name: {
        //   open: false,
        //   filter: null,
        // },
      };

      if (tabToUse.groups) {
        toSubmit.groups = {
          open: true,
          filter: tabToUse.groups,
        };
      }

      if (tabToUse.countryCode) {
        toSubmit.countryCode = {
          open: true,
          filter: tabToUse.countryCode,
        };
      }

      // if (tabToUse.email) {
      //   toSubmit.email = {
      //     open: true,
      //     filter: tabToUse.email as string,
      //   };
      // }

      // if (tabToUse.city) {
      //   toSubmit.city = {
      //     open: true,
      //     filter: tabToUse.city as string,
      //   };
      // }

      // if (tabToUse.name) {
      //   toSubmit.name = {
      //     open: true,
      //     filter: tabToUse.name as string,
      //   };
      // }

      if (tabToUse.q) {
        toSubmit.query = tabToUse.q as string;
      }

      dispatch({ type: 'setFilters', payload: toSubmit });
    }
  };

  const queryObject = useMemo(() => getQueryObject(), [state]);
  const representationObject = useMemo(() => getRepresentationObject(), [state]);
  const representationString = useMemo(() => getRepresentationString(), [state]);

  const availableTabs = useMemo(() => {
    return [...tabs];
  }, [tabs]);

  const activeFilterTab = useMemo(() => {
    const clean = omit(representationObject, ['limit', 'offset']);
    const stringified = qs.stringify(clean);

    const existsInSaved = tabs.find(el => el.representationString === stringified);
    if (existsInSaved) {
      return existsInSaved.value;
    }

    return null;
  }, [representationObject, tabs]);

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
    setGroupsFilter,
    setCountryCodeFilter,
    // setEmailFilter,
    // setCityFilter,
    // setNameFilter,
    reset,
  };
};

const parseQueryString = (
  queryString?: string,
  additionals: CustomerDefaultFilters | null = null,
): CustomerFilterState => {
  const defaultVal: CustomerFilterState = {
    offset: 0,
    limit: 15,
    groups: {
      open: false,
      filter: null,
    },
    countryCode: {
      open: false,
      filter: null,
    },
    // email: {
    //   open: false,
    //   filter: null,
    // },
    // city: {
    //   open: false,
    //   filter: null,
    // },
    // name: {
    //   open: false,
    //   filter: null,
    // },
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
          case 'groups': {
            if (typeof value === 'string' || Array.isArray(value)) {
              defaultVal.groups = {
                open: true,
                filter: value,
              };
            }
            break;
          }
          case 'countryCode': {
            if (typeof value === 'string' || Array.isArray(value)) {
              defaultVal.countryCode = {
                open: true,
                filter: value,
              };
            }
            break;
          }
          // case 'email': {
          //   if (typeof value === 'string') {
          //     defaultVal.email = {
          //       open: true,
          //       filter: value,
          //     };
          //   }
          //   break;
          // }
          // case 'city': {
          //   if (typeof value === 'string') {
          //     defaultVal.city = {
          //       open: true,
          //       filter: value,
          //     };
          //   }
          //   break;
          // }
          // case 'name': {
          //   if (typeof value === 'string') {
          //     defaultVal.name = {
          //       open: true,
          //       filter: value,
          //     };
          //   }
          //   break;
          // }
          default: {
            break;
          }
        }
      }
    }
  }

  return defaultVal;
};
