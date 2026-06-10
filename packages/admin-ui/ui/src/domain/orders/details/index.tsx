import { Address, ClaimOrder, Fulfillment, FulfillmentStatus, LineItem, Swap } from '@medusajs/medusa';
import Medusa from '../../../services/api';
import {
  useAdminCapturePayment,
  useAdminGetSession,
  useAdminOrder,
  useAdminRegion,
  useAdminReservations,
  useAdminUpdateOrder,
  useMedusa,
} from 'medusa-react';
import { useNavigate, useParams } from 'react-router-dom';
import OrderEditProvider, { OrderEditContext } from '../edit/context';
import {
  DisplayTotal,
  FormattedAddress,
  FormattedFulfillment,
  FulfillmentStatusComponent,
  OrderStatusComponent,
  PaymentActionables,
  PaymentStatusComponent,
  RefundDepositButton,
} from './templates';

import { capitalize, update } from 'lodash';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import Avatar from '../../../components/atoms/avatar';
import BackButton from '../../../components/atoms/back-button';
import Spacer from '../../../components/atoms/spacer';
import Spinner from '../../../components/atoms/spinner';
import Tooltip from '../../../components/atoms/tooltip';
import WidgetContainer from '../../../components/extensions/widget-container';
import Button from '../../../components/fundamentals/button';
import DetailsIcon from '../../../components/fundamentals/details-icon';
import CancelIcon from '../../../components/fundamentals/icons/cancel-icon';
import ClipboardCopyIcon from '../../../components/fundamentals/icons/clipboard-copy-icon';
import EditIcon from '../../../components/fundamentals/icons/edit-icon';
import CheckIcon from '../../../components/fundamentals/icons/check-icon';
import CornerDownRightIcon from '../../../components/fundamentals/icons/corner-down-right-icon';
import DollarSignIcon from '../../../components/fundamentals/icons/dollar-sign-icon';
import MailIcon from '../../../components/fundamentals/icons/mail-icon';
import RefreshIcon from '../../../components/fundamentals/icons/refresh-icon';
import TruckIcon from '../../../components/fundamentals/icons/truck-icon';
import Actionables, { ActionType } from '../../../components/molecules/actionables';
import Input from '../../../components/atoms/text-input';
import JSONView from '../../../components/molecules/json-view';
import BodyCard from '../../../components/organisms/body-card';
import RawJSON from '../../../components/organisms/raw-json';
import Timeline from '../../../components/organisms/timeline';
import { AddressType } from '../../../components/templates/address-form';
import TransferOrdersModal from '../../../components/templates/transfer-orders-modal';
import useClipboard from '../../../hooks/use-clipboard';
import useImperativeDialog from '../../../hooks/use-imperative-dialog';
import useNotification from '../../../hooks/use-notification';
import useToggleState from '../../../hooks/use-toggle-state';
import { useFeatureFlag } from '../../../providers/feature-flag-provider';
import { useWidgets } from '../../../providers/widget-provider';
import { isoAlpha2Countries } from '../../../utils/countries';
import { getErrorNotificationText, getErrorMessage } from '../../../utils/error-messages';
import extractCustomerName from '../../../utils/extract-customer-name';
import { formatAmountWithSymbol } from '../../../utils/prices';
import OrderEditModal from '../edit/modal';
import AddressModal from './address-modal';
import CreateFulfillmentModal from './create-fulfillment';
import useEffectivePrinter from './use-effective-printer';
import usePrinters from '../../settings/printers/use-printer';
import {
  getSerialCodePrefixes,
  isClubStationItem,
  isItemFromSerialRequiredCollection,
  validateSerialValue,
} from './create-fulfillment/item-table';
import SummaryCard from './detail-cards/summary';
import EmailModal from './email-modal';
import MarkShippedModal from './mark-shipped';
import CreateRefundModal from './refund';
import { MEDUSA_BACKEND_URL_NOSLASH } from '../../../constants/medusa-backend-url';
import DownloadIcon from '../../../components/fundamentals/icons/download-icon';
import openUrlNewWindow from '../../../utils/open-link-new-window';
import { useAccess } from '../../../providers/access-provider';
import StatusDot from '../../../components/fundamentals/status-indicator';
import useChangeStatus from './hooks/useChangeStatus';
import useOrdersExpandParam from './utils/use-admin-expand-paramter';
import { FulfilmentStatuses, PaymentStatuses } from '../../../types/utils';

type OrderDetailFulfillment = {
  title: string;
  type: string;
  fulfillment: Fulfillment;
  swap?: Swap;
  claim?: ClaimOrder;
};

const MEXICO_COUNTRY_CODE = 'MX';

const gatherAllFulfillments = order => {
  if (!order) {
    return [];
  }

  const all: OrderDetailFulfillment[] = [];

  order.fulfillments.forEach((f, index) => {
    all.push({
      title: `Fulfillment #${index + 1}`,
      type: 'default',
      fulfillment: f,
    });
  });

  if (order.claims?.length) {
    order.claims.forEach(claim => {
      if (claim.fulfillment_status !== 'not_fulfilled') {
        claim.fulfillments.forEach((fulfillment, index) => {
          all.push({
            title: `Claim fulfillment #${index + 1}`,
            type: 'claim',
            fulfillment,
            claim,
          });
        });
      }
    });
  }

  if (order.swaps?.length) {
    order.swaps.forEach(swap => {
      if (swap.fulfillment_status !== 'not_fulfilled') {
        swap.fulfillments.forEach((fulfillment, index) => {
          all.push({
            title: `Swap fulfillment #${index + 1}`,
            type: 'swap',
            fulfillment,
            swap,
          });
        });
      }
    });
  }

  return all;
};

type DeliveredItemRow = { itemId: string; title: string; serial: string; quantity: number };

function getStationSerialsByItem(
  raw: string | Record<string, string> | undefined
): Record<string, string[]> | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed ? { __single: [trimmed] } : null;
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const result: Record<string, string[]> = {};
    for (const [itemId, value] of Object.entries(raw)) {
      result[itemId] =
        typeof value === 'string'
          ? value.split(',').map(s => s.trim()).filter(Boolean)
          : [];
    }
    return Object.keys(result).length ? result : null;
  }
  return null;
}

function buildDeliveredItemsRows(
  allFulfillments: OrderDetailFulfillment[],
  orderItems: LineItem[],
  stationSerials: Record<string, string[]> | null
): DeliveredItemRow[] {
  const rows: DeliveredItemRow[] = [];
  let singleSerialUsed = false;

  for (const { fulfillment } of allFulfillments) {
    const items = fulfillment?.items ?? [];
    for (const fi of items) {
      const itemId = fi.item_id ?? (fi as { item?: LineItem }).item?.id;
      if (!itemId) continue;
      const quantity = fi.quantity ?? 0;
      const orderItem = orderItems.find(i => i.id === itemId);
      const lineItem = orderItem ?? (fi as { item?: LineItem }).item;
      const title =
        lineItem?.variant?.title ?? lineItem?.title ?? (fi as { item?: LineItem }).item?.title ?? '—';
      const serials = stationSerials?.__single
        ? stationSerials.__single
        : stationSerials?.[itemId] ?? [];

      for (let i = 0; i < quantity; i++) {
        let serial = '—';
        if (stationSerials?.__single) {
          if (!singleSerialUsed && serials[0]) {
            serial = serials[0];
            singleSerialUsed = true;
          }
        } else {
          serial = serials[i] ?? '—';
        }
        rows.push({ itemId, title, serial, quantity: 1 });
      }
    }
  }
  return rows;
}

interface IMembershipView {
  membership: any;
}

const MembershipView = ({ membership }: IMembershipView) => {
  const [membershipId, membershipNumber] = String(membership).split('-');
  return <>{membershipNumber ?? membershipId ?? '-'}</>;
};

const OrderDetails = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [userTaxId, setUserTaxId] = useState<string | null>(null);
  const { changeFulfillmentStatus, changePaymentStatus } = useChangeStatus(id!);

  const dialog = useImperativeDialog();

  const [addressModal, setAddressModal] = useState<null | {
    address?: Address | null;
    type: AddressType;
  }>(null);

  const [emailModal, setEmailModal] = useState<null | {
    email: string;
  }>(null);

  const { state: showTransferOrderModal, toggle: toggleTransferOrderModal } = useToggleState();

  const [showFulfillment, setShowFulfillment] = useState(false);
  const { client } = useMedusa();
  const { user } = useAdminGetSession();
  const isSuperAdmin = user ? (user as { teamRole?: unknown }).teamRole == null : false;
  const [showRefund, setShowRefund] = useState(false);
  const [fullfilmentToShip, setFullfilmentToShip] = useState(null);

  const { orderRelations } = useOrdersExpandParam();
  const { order, isLoading, refetch } = useAdminOrder(id!, { expand: orderRelations });

  const capturePayment = useAdminCapturePayment(id!);

  const { state: addressModalState, close: closeAddressModal, open: openAddressModal } = useToggleState();

  const { mutate: updateOrder } = useAdminUpdateOrder(id!);

  const { region } = useAdminRegion(order?.region_id!, {
    enabled: !!order?.region_id && isSuperAdmin,
  });
  const { isFeatureEnabled } = useFeatureFlag();
  const effectivePrinter = useEffectivePrinter(order?.region_id);
  const { printers, getPrinters } = usePrinters();
  const [selectedPrinterNodeId, setSelectedPrinterNodeId] = useState<number | null | undefined>(undefined);

  useEffect(() => { getPrinters() }, []);
  useEffect(() => {
    if (effectivePrinter === undefined) return;
    const lastFulfillment = order?.fulfillments?.at(-1);
    const lastPrinterId = lastFulfillment?.metadata?.printer_id;
    if (lastPrinterId != null) {
      setSelectedPrinterNodeId(Number(lastPrinterId));
    } else {
      setSelectedPrinterNodeId(effectivePrinter?.printnode_id ?? null);
    }
  }, [effectivePrinter, order?.fulfillments]);

  const inventoryEnabled = useMemo(() => {
    return isFeatureEnabled('inventoryService');
  }, [isFeatureEnabled]);

  const { reservations, refetch: refetchReservations } = useAdminReservations(
    {
      line_item_id: order?.items.map(item => item.id),
    },
    {
      enabled: inventoryEnabled && isSuperAdmin,
    },
  );

  useEffect(() => {
    if (inventoryEnabled && isSuperAdmin) {
      refetchReservations();
    }
  }, [inventoryEnabled, isSuperAdmin, refetchReservations]);

  useEffect(() => {
    if (
      order?.cart_id &&
      order?.shipping_address?.country_code?.toUpperCase() === MEXICO_COUNTRY_CODE &&
      order?.cart?.context?.metadata?.userTaxId
    ) {
      setUserTaxId(order.cart.context.metadata.userTaxId);
    }
  }, [order?.cart_id]);
  useEffect(() => {
    refetch();
  }, [order]);

  const navigate = useNavigate();
  const notification = useNotification();

  const [, handleCopy] = useClipboard(`${order?.display_id!}`, {
    successDuration: 5500,
    onCopied: () =>
      notification(t('details-success', 'Success'), t('details-order-id-copied', 'Order ID copied'), 'success'),
  });

  const [, handleCopyEmail] = useClipboard(order?.email!, {
    successDuration: 5500,
    onCopied: () => notification(t('details-success', 'Success'), t('details-email-copied', 'Email copied'), 'success'),
  });

  // @ts-ignore
  useHotkeys('esc', () => navigate('/a/orders'));
  useHotkeys('command+i', handleCopy);

  const { getWidgets } = useWidgets();

  const userName =
    user && user?.first_name?.trim().length > 0 && user?.last_name?.trim().length > 0
      ? `${user.first_name.trim()} ${user.last_name.trim()}`
      : 'admin';
  const userEmail = user && user?.email ? user.email : '';

  const fulfilmentStatusActionables: ActionType[] = [
    {
      label: 'Fulfilled',
      icon: <StatusDot variant="warning" />,
      variant: 'normal',
      onClick: () => handleChangeFulfillmentStatus(FulfilmentStatuses.FULFILLED),
    },
    {
      label: 'Not Fulfilled',
      icon: <StatusDot variant="danger" />,
      variant: 'normal',
      onClick: () => handleChangeFulfillmentStatus(FulfilmentStatuses.NOT_FULFILLED),
    },
    {
      label: 'Partially fulfilled',
      icon: <StatusDot variant="warning" />,
      variant: 'normal',
      onClick: () => handleChangeFulfillmentStatus(FulfilmentStatuses.PARTIALLY_FULFILLED),
    },
    {
      label: 'Shipped',
      icon: <StatusDot variant="success" />,
      variant: 'normal',
      onClick: () => handleChangeFulfillmentStatus(FulfilmentStatuses.SHIPPED),
    },
    {
      label: 'Partially Shipped',
      icon: <StatusDot variant="warning" />,
      variant: 'normal',
      onClick: () => handleChangeFulfillmentStatus(FulfilmentStatuses.PARTIALLY_SHIPPED),
    },
    {
      label: 'Partially returned',
      icon: <StatusDot variant="warning" />,
      variant: 'normal',
      onClick: () => handleChangeFulfillmentStatus(FulfilmentStatuses.PARTIALLY_RETURNED),
    },
    {
      label: 'Returned',
      icon: <StatusDot variant="danger" />,
      variant: 'normal',
      onClick: () => handleChangeFulfillmentStatus(FulfilmentStatuses.RETURNED),
    },
    {
      label: 'Canceled',
      icon: <StatusDot variant="danger" />,
      variant: 'normal',
      onClick: () => handleChangeFulfillmentStatus(FulfilmentStatuses.CANCELED),
    },
  ];

  const paymentStatusActionables: ActionType[] = [
    {
      label: 'Awaiting',
      icon: <StatusDot variant="danger" />,
      variant: 'normal',
      onClick: () => handleChangePaymentStatus(PaymentStatuses.AWAITING),
    },
    {
      label: 'Canceled',
      icon: <StatusDot variant="danger" />,
      variant: 'normal',
      onClick: () => handleChangePaymentStatus(PaymentStatuses.CANCELED),
    },
    {
      label: 'Paid',
      icon: <StatusDot variant="success" />,
      variant: 'normal',
      onClick: () => handleChangePaymentStatus(PaymentStatuses.CAPTURED),
    },
    {
      label: 'Partially refunded',
      icon: <StatusDot variant="primary" />,
      variant: 'normal',
      onClick: () => handleChangePaymentStatus(PaymentStatuses.PARTIALLY_REFUNDED),
    },
    {
      label: 'Refunded',
      icon: <StatusDot variant="danger" />,
      variant: 'normal',
      onClick: () => handleChangePaymentStatus(PaymentStatuses.REFUNDED),
    },
  ];

  const handleChangeFulfillmentStatus = async (status: FulfilmentStatuses) => {
    try {
      await changeFulfillmentStatus(status);
      await refetch();
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleChangePaymentStatus = async (status: PaymentStatuses) => {
    try {
      await changePaymentStatus(status);
      await refetch();
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleDeleteOrder = async () => {
    type CancelIntegrationError = {
      integration?: string;
      error?: string;
    };

    type CancelOrderResponse = {
      message?: string;
      has_integration_errors?: boolean;
      integration_errors?: CancelIntegrationError[];
    };

    if (!isSuperAdmin) {
      notification(t('details-error', 'Error'), 'Cancel failed: only superadmins can cancel orders', 'error', {
        duration: Infinity,
      });
      return;
    }

    const nextStatus =
      order?.fulfillment_status === 'shipped' || order?.fulfillment_status === 'fulfilled' ? 'returned' : 'canceled';
    const countryCode = order?.shipping_address?.country_code?.toLowerCase() || '';
    const province = order?.shipping_address?.province?.toUpperCase() || '';
    const isCancellationFeeExempt = countryCode === 'us' && ['AK', 'HI'].includes(province);
    const showRestockingFeeText = ['us', 'ca'].includes(countryCode) && !isCancellationFeeExempt;
    const cancelPreviewText = `New status: ${nextStatus}.${
      showRestockingFeeText ? ' Refund amount: order total - $50 (restocking fee).' : ''
    }`;

    const shouldDelete = await dialog({
      heading: t('details-cancel-order-heading', 'Cancel order'),
      text: `${cancelPreviewText} ${t(
        'details-are-you-sure-you-want-to-cancel-the-order',
        'Are you sure you want to cancel the order?',
      )}`,
      extraConfirmation: false,
      // entityName: t('order-details-display-id', 'order #{{display_id}}', {
      //   display_id: order.display_id,
      // }),
    });

    if (!shouldDelete) {
      return;
    }

    return client.admin.custom
      .post(`/orders/cancel-custom/${order?.id}`, {})
      .then((responseBody: CancelOrderResponse) => {

        client.admin.custom.post(`admin/cancel-order-custom/${order?.id}`, {
          metadata: {
            order_canceled_by: {
              email: userEmail,
              name: userName,
            },
          },
        });

        notification(
          responseBody?.has_integration_errors ? t('details-error', 'Error') : t('details-success', 'Success'),
          responseBody?.has_integration_errors
            ? 'Canceled with errors'
            : t('details-successfully-canceled-order', 'Successfully canceled order'),
          responseBody?.has_integration_errors ? 'warning' : 'success',
          responseBody?.has_integration_errors ? { duration: Infinity } : undefined,
        );

        if (responseBody?.has_integration_errors) {
          const details =
            responseBody.integration_errors
              ?.map(item => {
                const source = item.integration || 'integration';
                const reason = item.error || 'Unknown error';
                return `${source}: ${reason}`;
              })
              .join('; ') || 'Unknown integration error';

          notification(
            t('details-error', 'Error'),
            `Cancellation completed with integration errors: ${details}`,
            'error',
            { duration: Infinity },
          );
        }

        refetch();
      })
      .catch(err => {
        const backendMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        const errorText = backendMessage ? `Cancel failed: ${backendMessage}` : 'Cancel failed';
        notification(t('details-error', 'Error'), errorText, 'error', { duration: Infinity });
      });
  };

  const allFulfillments = gatherAllFulfillments(order);

  const deliveredItemsRows = useMemo(() => {
    if (!order?.items?.length || !allFulfillments.length) return [];
    const metadata = (
      order?.cart as {
        context?: {
          metadata?: {
            stationSerialNumber?: string | Record<string, string>;
            nonClubStationSerialNumber?: string | Record<string, string>;
          };
        };
      }
    )?.context?.metadata;
    const clubSerials = getStationSerialsByItem(metadata?.stationSerialNumber);
    const nonClubSerials = getStationSerialsByItem(metadata?.nonClubStationSerialNumber);
    const merged: Record<string, string[]> | null =
      clubSerials || nonClubSerials
        ? {
            ...(clubSerials ?? {}),
            ...(nonClubSerials ?? {}),
          }
        : null;
    return buildDeliveredItemsRows(allFulfillments, order.items, merged);
  }, [order?.items, order?.cart, allFulfillments.length]);

  const [editingSerialRowIndex, setEditingSerialRowIndex] = useState<number | null>(null);
  const [editingSerialValue, setEditingSerialValue] = useState('');
  const [serialPatches, setSerialPatches] = useState<Record<number, string>>({});

  const saveSerialNumber = (rowIndex: number, newSerial: string) => {
    if (!order?.id || !order?.cart?.id) return;
    const rows = deliveredItemsRows;
    const row = rows[rowIndex];
    if (!row || !order?.items) return;
    const orderItem = order.items.find((i: LineItem) => i.id === row.itemId);
    if (!orderItem) return;

    const isFromSerialRequiredCollection = isItemFromSerialRequiredCollection(orderItem);
    const allowedPrefixes = getSerialCodePrefixes(orderItem);

    if (isFromSerialRequiredCollection && !(newSerial ?? '').trim()) {
      notification(
        t('details-error', 'Error'),
        t('create-fulfillment-serial-required', 'Please enter serial number'),
        'error',
      );
      return;
    }

    if (allowedPrefixes.length > 0) {
      const validation = validateSerialValue(newSerial, allowedPrefixes, isFromSerialRequiredCollection);
      if (validation === 'required') {
        notification(
          t('details-error', 'Error'),
          t('create-fulfillment-serial-required', 'Please enter serial number'),
          'error',
        );
        return;
      }
      if (validation === 'invalid') {
        notification(
          t('details-error', 'Error'),
          t('create-fulfillment-serial-does-not-match-product-code', 'Does not match the serial code specified in the product'),
          'error',
        );
        return;
      }
    }
    const byItem: Record<string, string[]> = {};
    rows.forEach((row, idx) => {
      const serial = idx === rowIndex ? newSerial : serialPatches[idx] ?? row.serial;
      if (!byItem[row.itemId]) byItem[row.itemId] = [];
      byItem[row.itemId].push(serial);
    });
    const stationSerialNumber: Record<string, string> = {};
    const nonClubStationSerialNumber: Record<string, string> = {};
    for (const [itemId, arr] of Object.entries(byItem)) {
      const item = order.items.find((i: LineItem) => i.id === itemId);
      const joined = arr.join(', ');
      if (item && isClubStationItem(item)) {
        stationSerialNumber[itemId] = joined;
      } else {
        nonClubStationSerialNumber[itemId] = joined;
      }
    }

    const cartContext = (order.cart as { context?: Record<string, unknown> })?.context ?? {};
    const existingMetadata = (cartContext as { metadata?: Record<string, unknown> }).metadata ?? {};
    const isClubOrder = !!(
      cartContext.club_membership ??
      (order.metadata as Record<string, unknown>)?.membershipId
    );

    const previousStationSerialNumber = existingMetadata.stationSerialNumber;
    const previousNonClubStationSerialNumber = existingMetadata.nonClubStationSerialNumber;

    const onSuccess = () => {
      setEditingSerialRowIndex(null);
      setEditingSerialValue('');
      setSerialPatches(prev => {
        const next = { ...prev };
        delete next[rowIndex];
        return next;
      });
      refetch();
      notification(t('details-success', 'Success'), t('details-serial-updated', 'Serial number updated'), 'success');

      client.admin.custom
        .post(`/admin/orders/${order.id}/reprint-label`, {})
        .then((res: any) => {
          if (res?.message === 'no_printer' || res?.message === 'no_label_available') return;
          notification(t('details-success', 'Success'), t('details-label-printed', 'Label sent to printer'), 'success');
        })
        .catch(() => {
          notification(
            t('details-warning', 'Warning'),
            t('details-reprint-failed', 'Serial saved, but label could not be printed'),
            'warning'
          );
        });
    };
    const onError = (err: Error) => notification(t('details-error', 'Error'), getErrorNotificationText(err), 'error');

    const revertCartSerials = () => {
      updateOrder(
        {
          cart: {
            context: {
              ...cartContext,
              metadata: {
                ...existingMetadata,
                stationSerialNumber: previousStationSerialNumber,
                nonClubStationSerialNumber: previousNonClubStationSerialNumber,
              },
            },
          },
        },
        { onSettled: () => refetch() }
      );
    };

    const editedItemIsClub = isClubStationItem(orderItem);

    updateOrder(
      {
        cart: {
          context: {
            ...cartContext,
            metadata: {
              ...existingMetadata,
              stationSerialNumber,
              nonClubStationSerialNumber,
            },
          },
        },
      },
      {
        onSuccess: () => {
          if (isClubOrder && editedItemIsClub) {
            client.admin.custom
              .post(`/admin/orders/${order.id}/send-club-station-serials`, { stationSerialNumber })
              .then(() => onSuccess())
              .catch((err: Error) => {
                revertCartSerials();
                onError(err);
              });
          } else {
            onSuccess();
          }
        },
        onError,
      }
    );
  };

  const customerActionables: ActionType[] = [];

  const { checkAccess, loaded: accessLoaded } = useAccess();
  const [customersAccess, setCustomersAccess] = useState(false);

  useEffect(() => {
    setCustomersAccess(checkAccess('/customers'));
  }, [accessLoaded]);

  if (customersAccess) {
    customerActionables.push(
      {
        label: t('details-go-to-customer', 'Go to Customer'),
        icon: <DetailsIcon size={'20'} />,
        onClick: () => navigate(`/a/customers/${order?.customer.id}`),
      },
      {
        label: t('details-transfer-ownership', 'Transfer ownership'),
        icon: <RefreshIcon size={'20'} />,
        onClick: () => toggleTransferOrderModal(),
      },
    );
  }

  customerActionables.push({
    label: t('details-edit-shipping-address', 'Edit Shipping Address'),
    icon: <TruckIcon size={'20'} />,
    onClick: () => {
      setAddressModal({
        address: order?.shipping_address,
        type: AddressType.SHIPPING,
      });
      openAddressModal();
    },
  });

  customerActionables.push({
    label: t('details-edit-billing-address', 'Edit Billing Address'),
    icon: <DollarSignIcon size={'20'} />,
    onClick: () => {
      setAddressModal({
        address: order?.billing_address,
        type: AddressType.BILLING,
      });
      openAddressModal();
    },
  });

  if (order?.email) {
    customerActionables.push({
      label: t('details-edit-email-address', 'Edit Email Address'),
      icon: <MailIcon size={'20'} />,
      onClick: () => {
        setEmailModal({
          email: order?.email,
        });
      },
    });
  }

  if (!order && isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner size="small" variant="secondary" />
      </div>
    );
  }

  if (!order && !isLoading) {
    navigate('/404');
  }

  const anyItemsToFulfil = order?.items.some((item: LineItem) =>
    item.returned_quantity
      ? item.quantity - (item.fulfilled_quantity ?? 0) - item.returned_quantity > 0
      : item.quantity > (item.fulfilled_quantity ?? 0),
  );
  const cancellation = (order?.metadata as { cancellation?: Record<string, unknown> } | undefined)?.cancellation;
  const isOrderCanceled = order?.status === 'canceled' || !!cancellation;
  const hasCancellation = !!cancellation;
  const isCreateFulfillmentDisabled =
    order?.payment_status === 'refunded' ||
    !anyItemsToFulfil ||
    hasCancellation;

  const invoiceUrl = `${MEDUSA_BACKEND_URL_NOSLASH}/admin/invoice/${order?.id}/invoice-${order?.display_id}.pdf`;
  const packingUrl = `${MEDUSA_BACKEND_URL_NOSLASH}/admin/packing/${order?.id}/packing-slip-${order?.display_id}.pdf`;

  return (
    <div>
      <OrderEditProvider orderId={id!}>
        <div className="items-top flex flex-row justify-between">
          <div>
            <BackButton label={t('details-back-to-orders', 'Back to Orders')} className="mb-xsmall" />
          </div>
          <div className="inline-flex flex-row gap-4">
            {!!invoiceUrl && (
              <div>
                <Button
                  key="invoice"
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    openUrlNewWindow(invoiceUrl);
                  }}
                  className="min-w-[140px]"
                >
                  <DownloadIcon size={20} />
                  Invoice
                </Button>
              </div>
            )}
            {!!packingUrl && (
              <div>
                <Button
                  key="packing-slip"
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    openUrlNewWindow(packingUrl);
                  }}
                  className="min-w-[140px]"
                >
                  <DownloadIcon size={20} />
                  Packing Slip
                </Button>
              </div>
            )}
          </div>
        </div>
        {isLoading || !order ? (
          <BodyCard className="pt-2xlarge flex w-full items-center justify-center">
            <Spinner size={'large'} variant={'secondary'} />
          </BodyCard>
        ) : (
          <>
            <div>
              {getWidgets('order.details.before').map((widget, i) => {
                return (
                  <WidgetContainer key={i} injectionZone={'order.details.before'} widget={widget} entity={order} />
                );
              })}
            </div>
            <div className="flex space-x-4">
              <div className="gap-y-base flex h-full w-7/12 flex-col">
                <BodyCard
                  className={'min-h-[200px] w-full'}
                  customHeader={
                    <Tooltip side="top" content={'Copy ID'}>
                      <button
                        className="inter-xlarge-semibold text-grey-90 active:text-violet-90 flex cursor-pointer items-center gap-x-2"
                        onClick={handleCopy}
                      >
                        #{order.display_id} <ClipboardCopyIcon size={16} />
                      </button>
                    </Tooltip>
                  }
                  subtitle={moment(order.created_at).format('D MMMM YYYY hh:mm a')}
                  status={<OrderStatusComponent status={isOrderCanceled ? 'canceled' : order?.status} />}
                  customActionable={
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={hasCancellation || !isSuperAdmin}
                      onClick={() => handleDeleteOrder()}
                    >
                      <CancelIcon size={20} />
                      {t('details-cancel-order', 'Cancel Order')}
                    </Button>
                  }
                >
                  <div className="mt-6 flex flex-wrap gap-4 divide-x">
                    <div className="flex flex-col">
                      <div className="inter-smaller-regular text-grey-50 mb-1">{t('details-email', 'Email')}</div>
                      <button
                        className="text-grey-90 active:text-violet-90 flex cursor-pointer items-center gap-x-1"
                        onClick={handleCopyEmail}
                      >
                        {order.email}
                        <ClipboardCopyIcon size={12} />
                      </button>
                    </div>
                    <div className="flex flex-col pl-6">
                      <div className="inter-smaller-regular text-grey-50 mb-1">{t('details-phone', 'Phone')}</div>
                      <div>{order.shipping_address?.phone || 'N/A'}</div>
                    </div>
                    <div className="flex flex-col pl-6">
                      <div className="inter-smaller-regular text-grey-50 mb-1">{t('details-payment', 'Payment')}</div>
                      <div>{order.payments?.map(p => capitalize(p.provider_id)).join(', ')}</div>
                    </div>
                    {!!order?.cart?.context?.referral_code && (
                      <div className="flex flex-col pl-6">
                        <div className="inter-smaller-regular text-grey-50 mb-1">Referral</div>
                        <div className="text-green-600">
                          <>{order.cart.context.referral_code}</>
                        </div>
                      </div>
                    )}
                    {!!order?.cart?.context?.club_membership && (
                      <div className="flex flex-col pl-6">
                        <div className="inter-smaller-regular text-grey-50 mb-1">Club Membership ID</div>
                        <div className="text-green-600">
                          <MembershipView membership={order.cart.context.club_membership} />
                        </div>
                      </div>
                    )}
                  </div>
                </BodyCard>

                <SummaryCard order={order} reservations={reservations || []} />

                <BodyCard
                  className={'h-auto min-h-0 w-full'}
                  title={t('details-payment', 'Payment')}
                  status={<PaymentStatusComponent status={order.payment_status} />}
                  customActionable={
                    <div className="flex items-center gap-2">
                      <RefundDepositButton order={order} refetchOrder={refetch} />
                      <PaymentActionables
                        order={order}
                        capturePayment={capturePayment}
                        showRefundMenu={() => setShowRefund(true)}
                      />
                      <Actionables actions={paymentStatusActionables} />
                    </div>
                  }
                >
                  <div className="mt-6">
                    {(() => {
                      const lastRefund = order.refunded_total && order.refunds && order.refunds.length > 0
                        ? order.refunds.reduce((latest, refund) => {
                            const refundDate = new Date(refund.created_at)
                            const latestDate = new Date(latest.created_at)
                            return refundDate > latestDate ? refund : latest
                          }, order.refunds[0])
                        : null
                      return (
                        <>
                          {order.payments.map(payment => (
                            <div className="flex flex-col" key={payment.id}>
                        <DisplayTotal
                          currency={order.currency_code}
                          totalAmount={payment.amount}
                          totalTitle={payment.id}
                          subtitle={`${moment(payment.created_at).format('DD MMM YYYY hh:mm')}`}
                        />
                        {!!payment.amount_refunded && (
                          <div className="mt-4 flex justify-between">
                            <div className="flex">
                              <div className="text-grey-40 mr-2">
                                <CornerDownRightIcon />
                              </div>
                              <div className="inter-small-regular text-grey-90">
                                {t('details-refunded', 'Refunded')}
                              </div>
                            </div>
                            <div className="flex">
                              <div className="inter-small-regular text-grey-90 mr-3">
                                -
                                {formatAmountWithSymbol({
                                  amount: payment.amount_refunded,
                                  currency: order.currency_code,
                                })}
                              </div>
                              <div className="inter-small-regular text-grey-50">
                                {order.currency_code.toUpperCase()}
                              </div>
                            </div>
                          </div>
                            )}
                            </div>
                          ))}
                          <div className="mt-4 flex justify-between">
                            <div className="inter-small-semibold text-grey-90">{t('details-total-paid', 'Total Paid')}</div>
                            <div className="flex">
                              <div className="inter-small-semibold text-grey-90 mr-3">
                                {formatAmountWithSymbol({
                                  amount: order.paid_total - order.refunded_total,
                                  currency: order.currency_code,
                                })}
                              </div>
                              <div className="inter-small-regular text-grey-50">{order.currency_code.toUpperCase()}</div>
                            </div>
                          </div>
                          {lastRefund && (
                            <div className="mt-4 flex justify-between">
                              <div className="flex flex-col">
                                <div className="inter-small-semibold text-grey-90">{t('details-last-refund', 'Last refund')}</div>
                                <div className="inter-small-regular text-grey-50 mt-1">
                                  {moment(lastRefund.created_at).format('DD MMM YYYY hh:mm')}
                                </div>
                              </div>
                              <div className="flex">
                                <div className="inter-small-semibold text-grey-90 mr-3">
                                  {formatAmountWithSymbol({
                                    amount: lastRefund.amount,
                                    currency: order.currency_code,
                                  })}
                                </div>
                                <div className="inter-small-regular text-grey-50">{order.currency_code.toUpperCase()}</div>
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </BodyCard>
                <BodyCard
                  className={'h-auto min-h-0 w-full'}
                  title={t('details-fulfillment', 'Fulfillment')}
                  status={<FulfillmentStatusComponent status={order.fulfillment_status} />}
                  forceDropdown={true}
                  customActionable={
                    order.status !== 'canceled' && (
                      <div className="flex items-center gap-2">
                        {effectivePrinter !== undefined && (
                          <select
                            className="inter-small-regular text-grey-50 rounded border border-grey-20 bg-white px-2 py-1 text-xs focus:outline-none"
                            value={selectedPrinterNodeId ?? ''}
                            onChange={(e) =>
                              setSelectedPrinterNodeId(e.target.value ? Number(e.target.value) : null)
                            }
                          >
                            <option value="">{t('details-no-printer', 'No printer')}</option>
                            {printers.map((p) => (
                              <option key={p.printnode_id} value={p.printnode_id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {hasCancellation ? (
                          <Tooltip content="Fulfillment is unavailable: order was manually canceled.">
                            <div>
                              <Button variant="secondary" size="small" disabled={isCreateFulfillmentDisabled}>
                                {t('details-create-fulfillment', 'Create Fulfillment')}
                              </Button>
                            </div>
                          </Tooltip>
                        ) : (
                          <Button
                            variant="secondary"
                            size="small"
                            disabled={isCreateFulfillmentDisabled}
                            onClick={() => setShowFulfillment(true)}
                          >
                            {t('details-create-fulfillment', 'Create Fulfillment')}
                          </Button>
                        )}
                        <Actionables actions={fulfilmentStatusActionables} />
                      </div>
                    )
                  }
                >
                  <div className="mt-6">
                    {order.shipping_methods.map((method, methodIndex) => (
                      <div className="flex flex-col" key={method.id}>
                        <span className="inter-small-regular text-grey-50">
                          {t('details-shipping-method', 'Shipping Method')}
                        </span>
                        <span className="inter-small-regular text-grey-90 mt-2">
                          {method?.shipping_option?.name || ''}
                        </span>
                        <div className="mt-4 flex w-full flex-grow flex-col items-stretch">
                          {allFulfillments.length > 0 &&
                          deliveredItemsRows.length > 0 &&
                          methodIndex === 0 &&
                          deliveredItemsRows.some(row => {
                            const orderItem = order?.items?.find((i: LineItem) => i.id === row.itemId);
                            return orderItem ? isItemFromSerialRequiredCollection(orderItem) : false;
                          }) ? (
                            <>
                              <span className="inter-small-regular text-grey-50 mb-2">
                                {t('details-delivered-items', 'Delivered items')}
                              </span>
                              <div className="rounded-rounded border border-grey-20 overflow-hidden">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-grey-5 inter-small-semibold text-grey-50 border-b border-grey-20">
                                      <th className="text-left py-2 px-3">{t('details-item', 'Item')}</th>
                                      <th className="text-left py-2 px-3">{t('details-serial-number', 'Serial number')}</th>
                                      <th className="text-right py-2 px-3">{t('details-quantity', 'Qty')}</th>
                                      <th className="w-[44px] py-2 px-3" />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {deliveredItemsRows
                                      .map((row, idx) => {
                                        const orderItem = order?.items?.find((i: LineItem) => i.id === row.itemId);
                                        const isStationItem = orderItem ? isItemFromSerialRequiredCollection(orderItem) : false;
                                        return { row, idx, isStationItem };
                                      })
                                      .filter(({ isStationItem }) => isStationItem)
                                      .map(({ row, idx }) => {
                                        const isEditing = editingSerialRowIndex === idx;
                                        const displaySerial = serialPatches[idx] ?? row.serial;
                                        return (
                                          <tr key={`${row.itemId}-${idx}`} className="inter-small-regular text-grey-90 border-b border-grey-10 last:border-0">
                                            <td className="py-2 px-3">{row.title}</td>
                                            <td className="py-2 px-3">
                                              {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                  <Input
                                                    value={editingSerialValue}
                                                    onChange={e => setEditingSerialValue(e.target.value)}
                                                    className="max-w-[160px]"
                                                  />
                                                  <Button
                                                    variant="ghost"
                                                    size="small"
                                                    className="p-1"
                                                    onClick={() => saveSerialNumber(idx, editingSerialValue)}
                                                  >
                                                    <CheckIcon size={18} className="text-green-60" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="small"
                                                    className="p-1"
                                                    onClick={() => {
                                                      setEditingSerialRowIndex(null);
                                                      setEditingSerialValue('');
                                                    }}
                                                  >
                                                    <CancelIcon size={18} className="text-grey-50" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <span>{displaySerial}</span>
                                              )}
                                            </td>
                                            <td className="py-2 px-3 text-right">{row.quantity}</td>
                                            <td className="py-2 px-3">
                                              {!isEditing && (
                                                <Tooltip content={t('details-edit-serial', 'Edit serial number')}>
                                                  <Button
                                                    variant="ghost"
                                                    size="small"
                                                    className="p-1 text-grey-50 hover:text-grey-90"
                                                    onClick={() => {
                                                      setEditingSerialRowIndex(idx);
                                                      setEditingSerialValue(displaySerial);
                                                    }}
                                                  >
                                                    <EditIcon size={16} />
                                                  </Button>
                                                </Tooltip>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          ) : (
                            <JSONView data={method?.data} />
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="inter-small-regular mt-6 ">
                      {allFulfillments.map((fulfillmentObj, i) => (
                        <FormattedFulfillment
                          key={i}
                          order={order}
                          fulfillmentObj={fulfillmentObj}
                          setFullfilmentToShip={setFullfilmentToShip}
                        />
                      ))}
                    </div>
                  </div>
                </BodyCard>

                {!!order?.metadata?._techOms_fulfillment &&
                  (order?.metadata?._techOms_fulfillment as any[])?.map((fulfillment, idx) => (
                    <BodyCard
                      key={fulfillment?.salesOrderId || idx}
                      className={'h-auto min-h-0 w-full'}
                      title={t('details-techOms-sync', 'Fulfillment techOMS')!}
                    >
                      <div className="inter-small-regular">
                        <div className="flex flex-col gap-1">
                          {!!fulfillment?.status && (
                            <div>
                              <span className="text-grey-50">Status:</span> {fulfillment.status}
                            </div>
                          )}

                          {!!fulfillment?.created_at && (
                            <div>
                              <span className="text-grey-50">Created at:</span> {fulfillment.created_at}
                            </div>
                          )}

                          {!!fulfillment?.salesOrderId && (
                            <div>
                              <span className="text-grey-50">Sales Order:</span>{' '}
                              <a
                                href={'https://techoms.io/#/SalesOrders/' + fulfillment.salesOrderId}
                                className="text-blue-60"
                                target="_blank"
                                rel="nofollow"
                              >
                                {fulfillment.salesOrder ? fulfillment.salesOrder : 'View'}
                              </a>
                            </div>
                          )}

                          {!!fulfillment?.tracking_number && (
                            <div>
                              <span className="text-grey-50">Tracking number:</span>{' '}
                              <a
                                href={`https://www.ups.com/track?tracknum=${fulfillment.tracking_number}&loc=en_US&requester=ST/trackdetails`}
                                className="text-blue-60"
                                target="_blank"
                                rel="nofollow"
                              >
                                {fulfillment?.tracking_number ? fulfillment.tracking_number : 'View'}
                              </a>
                            </div>
                          )}

                          {!!fulfillment?.shipping_price && (
                            <div>
                              <span className="text-grey-50">Shipping price:</span> {fulfillment.shipping_price}
                            </div>
                          )}
                        </div>
                      </div>
                    </BodyCard>
                  ))}

                <BodyCard
                  className={'h-auto min-h-0 w-full'}
                  title={t('details-customer', 'Customer')}
                  actionables={customerActionables}
                >
                  <div className="mt-6">
                    <div className="flex w-full items-center space-x-4">
                      <div className="flex h-[40px] w-[40px] ">
                        <Avatar user={order.customer} font="inter-large-semibold" color="bg-fuschia-40" />
                      </div>
                      <div>
                        <h1 className="inter-large-semibold text-grey-90">{extractCustomerName(order)}</h1>
                        {order.shipping_address && (
                          <span className="inter-small-regular text-grey-50">
                            {order.shipping_address.city},{' '}
                            {isoAlpha2Countries[order.shipping_address.country_code?.toUpperCase()]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex space-x-6 divide-x">
                      <div className="flex flex-col">
                        <div className="inter-small-regular text-grey-50 mb-1">{t('details-contact', 'Contact')}</div>
                        <div className="inter-small-regular flex flex-col">
                          <span>{order.email}</span>
                          <span>{order.shipping_address?.phone || ''}</span>
                        </div>
                      </div>
                      {userTaxId && (
                        <div className="flex flex-col pl-6">
                          <div className="inter-small-regular text-grey-50 mb-1">Tax ID (RFC)</div>
                          <div className="inter-small-regular flex flex-col break-all">
                            <span>{userTaxId}</span>
                          </div>
                        </div>
                      )}
                      <FormattedAddress title={t('details-shipping', 'Shipping')} addr={order.shipping_address} />
                      <FormattedAddress title={t('details-billing', 'Billing')} addr={order.billing_address} />
                    </div>
                  </div>
                </BodyCard>

                <BodyCard className={'h-auto min-h-0 w-full'} title={t('details-odoo-sync', 'Odoo sync')}>
                  <div className="inter-small-regular">
                    {order.metadata?._odoo_order_create ? (
                      <div className="flex flex-col gap-1">
                        {!!order.metadata?._odoo_order_create?._date && (
                          <div>
                            <span className="text-grey-50">Sync date:</span> {order.metadata._odoo_order_create._date}
                          </div>
                        )}

                        {!!order.metadata?._odoo_order_create?._odoo_order_id && (
                          <div>
                            <span className="text-grey-50">Odoo Sales Order:</span>{' '}
                            <a
                              href={
                                'https://united-chargers-inc.odoo.com/web#model=sale.order&id=' +
                                order.metadata._odoo_order_create._odoo_order_id
                              }
                              className="text-blue-60"
                              target="_blank"
                              rel="nofollow"
                            >
                              {order.metadata._odoo_order_create._odoo_order_name
                                ? order.metadata._odoo_order_create._odoo_order_name
                                : 'View'}
                            </a>
                          </div>
                        )}

                        {!!order.metadata?._odoo_order_create?._odoo_delivery_order_id && (
                          <div>
                            <span className="text-grey-50">Odoo Delivery Order:</span>{' '}
                            <a
                              href={
                                'https://united-chargers-inc.odoo.com/web#model=stock.picking&id=' +
                                order.metadata._odoo_order_create._odoo_delivery_order_id
                              }
                              className="text-blue-60"
                              target="_blank"
                              rel="nofollow"
                            >
                              {order.metadata._odoo_order_create._odoo_delivery_order_name
                                ? order.metadata._odoo_order_create._odoo_delivery_order_name
                                : order.metadata._odoo_order_create._odoo_delivery_order_id}
                            </a>
                          </div>
                        )}

                        {!!order.metadata?._odoo_order_create?._errors?.length && (
                          <div className="mt-2">
                            {order.metadata?._odoo_order_create?._errors?.map(e => (
                              <div className="mt-1">
                                <StatusDot title={e} variant="danger" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>Not synced</div>
                    )}
                  </div>
                </BodyCard>

                {!!order?.cart?.context?.google_ads && (
                  <BodyCard className={'h-auto min-h-0 w-full'} title="Google ads">
                    <div className="inter-small-regular break-all">
                      <span className="text-grey-50">ID:</span> <>{order.cart.context.google_ads}</>
                    </div>
                  </BodyCard>
                )}

                <div>
                  {getWidgets('order.details.after').map((widget, i) => {
                    return (
                      <WidgetContainer key={i} injectionZone={'order.details.after'} widget={widget} entity={order} />
                    );
                  })}
                </div>
                <RawJSON data={order} title={t('details-raw-order', 'Raw order')} />
                <Spacer />
              </div>
              <Timeline orderId={order.id} refetchOrder={refetch} />
            </div>

            <AddressModal
              onClose={closeAddressModal}
              open={addressModalState}
              onSave={updateOrder}
              address={addressModal?.address || undefined}
              type={addressModal?.type}
              allowedCountries={region?.countries}
            />

            {emailModal && (
              <EmailModal handleClose={() => setEmailModal(null)} email={emailModal.email} orderId={order.id} />
            )}
            {showFulfillment && (
              <CreateFulfillmentModal
                orderToFulfill={order as any}
                handleCancel={() => setShowFulfillment(false)}
                orderId={order.id}
                printerNodeId={selectedPrinterNodeId}
                onComplete={() => {
                  setSelectedPrinterNodeId(effectivePrinter?.printnode_id ?? null);
                  if (inventoryEnabled) refetchReservations();
                }}
              />
            )}
            {showRefund && <CreateRefundModal order={order} onDismiss={() => setShowRefund(false)} />}
            {showTransferOrderModal && <TransferOrdersModal order={order} onDismiss={toggleTransferOrderModal} />}
            {fullfilmentToShip && (
              <MarkShippedModal
                handleCancel={() => setFullfilmentToShip(null)}
                fulfillment={fullfilmentToShip}
                orderId={order.id}
              />
            )}
            <OrderEditContext.Consumer>
              {({ isModalVisible }) => isModalVisible && <OrderEditModal order={order} />}
            </OrderEditContext.Consumer>
          </>
        )}
      </OrderEditProvider>
    </div>
  );
};

export default OrderDetails;
