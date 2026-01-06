import { useEffect, useState } from 'react';
import { Order } from '@medusajs/medusa';
import medusaRequest from '../utils/request';

type OdooFilterState = {
  salesOrder: boolean;
  deliveryOrder: boolean;
};

type OrderStatus = 'pending' | 'completed' | 'archived' | 'canceled' | 'requires_action';
type PaymentStatus = 'not_paid' | 'awaiting' | 'captured' | 'refunded' | 'canceled' | 'requires_action';
type FulfillmentStatus =
  | 'not_fulfilled'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'partially_shipped'
  | 'shipped'
  | 'partially_returned'
  | 'returned'
  | 'canceled'
  | 'requires_action';

type useOrdersByGroupProps = {
  sortBy: string;
  sortDirection: 'asc' | 'desc' | string;
  offset: number;
  limit: number;
  q?: string;
  status?: OrderStatus | OrderStatus[];
  paymentStatus?: PaymentStatus | PaymentStatus[];
  fulfillmentStatus?: FulfillmentStatus | FulfillmentStatus[];
  salesChannelId?: string | string[];
  regionId?: string | string[];
  club?: boolean | null;
  ga?: boolean | null;
  ref?: boolean | null;
  clubMembership?: string | null;
  odoo?: OdooFilterState | null;
  created_at?: {
    lt?: string;
    gt?: string;
  };
};

type useOrdersByGroupReturn = {
  orders: Order[];
  total: number;
  isLoading: boolean;
};

const useOrdersByGroup = ({
  sortBy,
  sortDirection,
  offset,
  limit,
  q,
  status,
  paymentStatus,
  fulfillmentStatus,
  salesChannelId,
  regionId,
  club,
  ga,
  ref,
  clubMembership,
  odoo,
  created_at,
}: useOrdersByGroupProps) => {
  const [ordersData, setOrdersData] = useState<useOrdersByGroupReturn>({
    orders: [],
    total: 0,
    isLoading: true,
  });

  const fetchOrders = async () => {
    try {
      const path = `/admin/sorted-orders`;
      const res = await medusaRequest('POST', path, {
        sortBy,
        sortDirection,
        offset,
        limit,
        q,
        status,
        paymentStatus,
        fulfillmentStatus,
        salesChannelId,
        regionId,
        club,
        ga,
        ref,
        clubMembership,
        odoo,
        created_at,
      });

      if (!res?.data) {
        return { orders: [], total: 0, isLoading: false };
      }

      return { ...res?.data, isLoading: false };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { orders: [], total: 0, isLoading: false };
    }
  };

  useEffect(() => {
    setOrdersData(prev => ({ ...prev, isLoading: true }));
    fetchOrders().then(data => {
      setOrdersData(data);
    });
  }, [
    sortBy,
    sortDirection,
    offset,
    limit,
    q,
    status,
    paymentStatus,
    fulfillmentStatus,
    salesChannelId,
    regionId,
    club,
    ga,
    ref,
    clubMembership,
    odoo,
    created_at,
  ]);

  return { ordersData };
};

export default useOrdersByGroup;
