import React from 'react';

export type ReactFCWithChildren<T> = React.FC<React.PropsWithChildren<T>>;

export enum FulfilmentStatuses {
  NOT_FULFILLED = 'not_fulfilled',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  FULFILLED = 'fulfilled',
  PARTIALLY_SHIPPED = 'partially_shipped',
  SHIPPED = 'shipped',
  PARTIALLY_RETURNED = 'partially_returned',
  RETURNED = 'returned',
  CANCELED = 'canceled',
}

export enum PaymentStatuses {
  AWAITING = 'awaiting',
  CANCELED = 'canceled',
  CAPTURED = 'captured',
  PARTIALLY_REFUNDED = 'partially_refunded',
  REFUNDED = 'refunded',
}
