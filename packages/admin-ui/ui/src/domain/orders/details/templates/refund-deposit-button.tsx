import { LineItem, Refund } from '@medusajs/medusa';
import { useMedusa } from 'medusa-react';
import { useState } from 'react';
import Button from '../../../../components/fundamentals/button';
import useNotification from '../../../../hooks/use-notification';
import { isClubStationItem } from '../create-fulfillment/item-table';

function extractClubStationSerial(
  rawSerials: string | Record<string, string> | undefined,
  clubItemId: string | undefined,
): string {
  if (!rawSerials) return '';
  if (typeof rawSerials === 'string') return rawSerials.split(',')[0].trim();
  const val = clubItemId ? rawSerials[clubItemId] : Object.values(rawSerials)[0];
  return typeof val === 'string' ? val.split(',')[0].trim() : '';
}

type CartContext = {
  metadata?: {
    stationSerialNumber?: string | Record<string, string>;
    [key: string]: unknown;
  };
  club_membership?: string;
};

type RefundDepositButtonProps = {
  order: {
    display_id: number;
    items: LineItem[];
    cart?: { context?: CartContext } | null;
    metadata?: Record<string, unknown> | null;
    refunds?: Refund[];
  };
};

export const RefundDepositButton = ({ order }: RefundDepositButtonProps) => {
  const { client } = useMedusa();
  const notification = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const membership = String(order.cart?.context?.club_membership ?? '');
  const membershipId = membership.split('-')[0] ?? membership;
  const hasClubItem = order.items.some(item => isClubStationItem(item));
  const depositRefunded = order.refunds && order.refunds.length > 0;

  if (!membershipId || !hasClubItem || depositRefunded) return null;

  const handleClick = async () => {
    const rawSerials = order.cart?.context?.metadata?.stationSerialNumber;
    const clubItem = order.items.find(item => isClubStationItem(item));
    const station_serial_number = extractClubStationSerial(rawSerials, clubItem?.id);

    setIsLoading(true);
    try {
      await client.admin.custom.post('admin/connect/deposit-refunds', {
        membership_id: membershipId,
        order_number: order.display_id,
        station_serial_number,
      });
      notification('Success', 'Deposit refund processed successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong, please try again.';
      notification('Error', message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="secondary" size="small" onClick={handleClick} loading={isLoading} className="min-w-[130px]">
      Refund Deposit
    </Button>
  );
};
