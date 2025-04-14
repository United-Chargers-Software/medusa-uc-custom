import clsx from 'clsx';
import { useAdminCancelReturn, useAdminGetSession, useMedusa } from 'medusa-react';
import React, { useState } from 'react';
import { ReceiveReturnMenu } from '../../../domain/orders/details/receive-return';
import { ReturnEvent } from '../../../hooks/use-build-timeline';
import useToggleState from '../../../hooks/use-toggle-state';
import Button from '../../fundamentals/button';
import AlertIcon from '../../fundamentals/icons/alert-icon';
import CancelIcon from '../../fundamentals/icons/cancel-icon';
import CheckCircleIcon from '../../fundamentals/icons/check-circle-icon';
import TrashIcon from '../../fundamentals/icons/trash-icon';
import DeletePrompt from '../../organisms/delete-prompt';
import { ActionType } from '../actionables';
import EventActionables from './event-actionables';
import EventContainer from './event-container';
import EventItemContainer from './event-item-container';
import { useSendEmailNotification } from '../../../domain/orders/details/receive-return/hooks/useSendEmailNotification';
import Tooltip from '../../atoms/tooltip';

type ReturnRequestedProps = {
  event: ReturnEvent;
  refetch: () => void;
  refetchOrder: () => void;
};

const Return: React.FC<ReturnRequestedProps> = ({ event, refetch, refetchOrder }) => {
  const { client } = useMedusa();
  const { user } = useAdminGetSession();
  const [showCancel, setShowCancel] = useState(false);
  const cancelReturn = useAdminCancelReturn(event.id);
  const { sendRejectRefundRequestEmail } = useSendEmailNotification();

  const { state: showReceiveReturnMenu, close: closeReceiveReturnMenu, open: openReceiveReturnMenu } = useToggleState();

  const handleCancel = () => {
    const returnId = event.raw.id;

    try {
      if (returnId) {
        client.admin.custom.post(`admin/return/update/${returnId}`, {
          metadata: {
            canceled_by: {
              email: user?.email,
              name: user ? `${user?.first_name} ${user?.last_name}` : 'admin',
            },
          },
        });

        setTimeout(() => {
          cancelReturn.mutate(undefined, {
            onSuccess: () => {
              sendRejectRefundRequestEmail(event.order.id);
              refetchOrder();
              refetch();
            },
          });
        }, 5000);
      }
    } catch (error) {
      console.error('Error canceling return:', error);
    }
  };

  const eventContainerArgs = buildReturn(event, handleCancel, openReceiveReturnMenu);

  if (event.raw?.claim_order_id) {
    return null;
  }

  return (
    <>
      <EventContainer {...eventContainerArgs} />
      {showCancel && (
        <DeletePrompt
          handleClose={() => setShowCancel(false)}
          onDelete={async () => handleCancel()}
          heading="Cancel return"
          confirmText="Yes, cancel"
          successText="Canceled return"
          text="Are you sure you want to cancel this return?"
        />
      )}
      {showReceiveReturnMenu && (
        <ReceiveReturnMenu
          onClose={closeReceiveReturnMenu}
          order={event.order}
          returnRequest={event.raw}
          refetchOrder={refetchOrder}
        />
      )}
    </>
  );
};

function buildReturn(event: ReturnEvent, onCancel: () => void, onReceive: () => void) {
  let title: string = 'Return';
  let icon: React.ReactNode;
  let button: React.ReactNode;
  const actions: ActionType[] = [];

  switch (event.status) {
    case 'requested':
      title = 'Return Requested';
      icon = <AlertIcon size={20} className="text-orange-40" />;
      if (event.currentStatus === 'requested') {
        button = event.currentStatus && event.currentStatus === 'requested' && (
          <>
            <Button variant="secondary" size="small" className={clsx('mt-large')} onClick={onReceive}>
              Receive Return
            </Button>
            <div className="mr-2 text-red-500">You need to manually sync all changes to ODOO!</div>
          </>
        );
        actions.push({
          icon: <TrashIcon size={20} />,
          label: 'Cancel return',
          variant: 'danger',
          onClick: onCancel,
        });
      }
      break;
    case 'received':
      title = 'Return Received';
      icon = <CheckCircleIcon size={20} className="text-emerald-40" />;
      break;
    case 'canceled':
      title = 'Return Canceled';
      icon = <CancelIcon size={20} className="text-grey-50" />;
      break;
    case 'requires_action':
      title = 'Return Requires Action';
      icon = <AlertIcon size={20} className="text-rose-50" />;
      break;
    default:
      break;
  }

  return {
    title,
    icon,
    time: event.time,
    topNode: actions.length > 0 && <EventActionables actions={actions} />,
    noNotification: event.noNotification,
    detail: event.status === 'canceled' && event.raw?.metadata?.canceled_by?.name && (
      <div className="mt-3 flex items-center">
        <Tooltip content={event.raw?.metadata?.canceled_by?.email} hidden={!event.raw?.metadata?.canceled_by?.email}>
          <div className="text-grey-50">{`Canceled by ${event.raw?.metadata?.canceled_by?.name}`}</div>
        </Tooltip>
      </div>
    ),
    children:
      event.status === 'requested'
        ? [
            event.items.map((i, index) => {
              return (
                <EventItemContainer
                  key={index}
                  item={i}
                  detail={
                    <div className="mt-3 flex items-center">
                      <div className="text-grey-50">{`Requested by customer`}</div>
                    </div>
                  }
                />
              );
            }),
            React.createElement(React.Fragment, { key: 'button' }, button),
          ]
        : event.status === 'received'
        ? [
            event.items.map((i, index) => (
              <EventItemContainer
                key={index}
                item={{ ...i, quantity: i.receivedQuantity ?? i.quantity }}
                detail={
                  event?.raw?.metadata?.received_by?.name && (
                    <div className="mt-3 flex items-center">
                      <Tooltip
                        content={event?.raw?.metadata?.received_by?.email}
                        hidden={!event?.raw?.metadata?.received_by?.email}
                      >
                        <div className="text-grey-50">{`Received by ${event?.raw?.metadata?.received_by?.name}`}</div>
                      </Tooltip>
                    </div>
                  )
                }
              />
            )),
          ]
        : null,
  };
}

export default Return;
