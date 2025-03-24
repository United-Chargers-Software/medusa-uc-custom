import { useEffect, useState } from 'react';
import { Customer } from '@medusajs/medusa';
import medusaRequest from '../utils/request';

type CountryCode = 'us' | 'ca' | 'mx';

type useCustomersByGroupProps = {
  groupName: string[] | 'all';
  sortBy: string;
  sortDirection: 'asc' | 'desc' | string;
  offset: number;
  limit: number;
  q?: string;
  countryCode?: CountryCode | CountryCode[];
};

type useCustomersByGroupReturn = {
  customers: Customer[];
  total: number;
};

const useCustomersByGroup = ({
  groupName = 'all',
  sortBy,
  sortDirection,
  offset,
  limit,
  q,
  countryCode,
}: useCustomersByGroupProps) => {
  const [customersData, setCustomersData] = useState<useCustomersByGroupReturn>({ customers: [], total: 0 });

  const fetchCustomers = async () => {
    try {
      const path = `/admin/sorted-customers`;
      const res = await medusaRequest('POST', path, {
        groupName,
        sortBy,
        sortDirection,
        offset,
        limit,
        q,
        countryCode,
      });

      if (!res?.data) {
        return [];
      }

      return res?.data;
    } catch (error) {}
  };

  useEffect(() => {
    fetchCustomers().then(data => {
      setCustomersData(data);
    });
  }, [groupName, sortBy, sortDirection, offset, limit, q, countryCode]);

  return { customersData };
};

export default useCustomersByGroup;
