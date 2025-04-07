import React from 'react';
import { ItemsFulfilledEvent } from '../../../hooks/use-build-timeline';
import PackageIcon from '../../fundamentals/icons/package-icon';
import EventContainer from './event-container';
import EventItemContainer from './event-item-container';
import { useAdminOrder } from 'medusa-react';
import Tooltip from '../../atoms/tooltip';

type ItemsFulfilledProps = {
  event: ItemsFulfilledEvent;
};

const ItemsFulfilled: React.FC<ItemsFulfilledProps> = ({ event }) => {
  const { order } = useAdminOrder(event.orderId);

  const title =
    event.sourceType === 'claim'
      ? 'Replacement Items Fulfilled'
      : event.sourceType === 'exchange'
      ? 'Exchange Items Fulfilled'
      : 'Items Fulfilled';

  const fulfillmentItem = order?.fulfillments.find(f => f.id === event.id);

  const detail = fulfillmentItem?.metadata?.fulfilled_by?.name && (
    <div className="flex w-full flex-col items-start gap-2">
      <Tooltip
        content={fulfillmentItem?.metadata?.fulfilled_by?.email}
        hidden={!fulfillmentItem?.metadata?.fulfilled_by?.email}
      >
        <div className="text-grey-50">{`Fulfilled by ${fulfillmentItem?.metadata?.fulfilled_by?.name}`}</div>
      </Tooltip>

      {event.locationName && `Shipping from ${event.locationName}`}
    </div>
  );

  const args = {
    icon: <PackageIcon size={20} />,
    time: event.time,
    title: title,
    children: event.items.map((item, index) => <EventItemContainer item={item} key={index} />),
    noNotification: event.noNotification,
    isFirst: event.first,
    detail,
  };

  return <EventContainer {...args} />;
};

export default ItemsFulfilled;
