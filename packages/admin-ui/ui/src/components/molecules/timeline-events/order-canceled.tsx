import React from 'react';
import { TimelineEvent } from '../../../hooks/use-build-timeline';
import CancelIcon from '../../fundamentals/icons/cancel-icon';
import EventContainer, { EventIconColor } from './event-container';
import { useAdminOrder } from 'medusa-react';
import Tooltip from '../../atoms/tooltip';

type OrderCanceledProps = {
  event: TimelineEvent;
};

const OrderCanceled: React.FC<OrderCanceledProps> = ({ event }) => {
  const { order } = useAdminOrder(event.orderId);

  const args = {
    icon: <CancelIcon size={20} />,
    iconColor: EventIconColor.RED,
    time: event.time,
    title: 'Order Canceled',
    detail: order?.metadata?.order_canceled_by?.name && (
      <div className="flex w-full flex-col items-start gap-2">
        <Tooltip
          content={order?.metadata?.order_canceled_by?.email}
          hidden={!order?.metadata?.order_canceled_by?.email}
        >
          <div className="text-grey-50">{`Canceled by ${order?.metadata?.order_canceled_by?.name}`}</div>
        </Tooltip>
      </div>
    ),
  };
  return <EventContainer {...args} />;
};

export default OrderCanceled;
