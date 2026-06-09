import { LineItem } from '@medusajs/medusa';
import Button from '../../../../components/fundamentals/button';
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
  };
};

export const RefundDepositButton = ({ order }: RefundDepositButtonProps) => {
  const membership = String(order.cart?.context?.club_membership ?? '');
  const membershipId = membership.split('-')[1] ?? membership;
  const hasClubItem = order.items.some(item => isClubStationItem(item));
  const depositRefunded = false; // TODO: add logic to check if deposit has been refunded

  if (!membershipId || !hasClubItem || depositRefunded) return null;

  const handleClick = () => {
    const rawSerials = order.cart?.context?.metadata?.stationSerialNumber;
    const clubItem = order.items.find(item => isClubStationItem(item));
    console.log({
      membershipId,
      order_number: order.display_id,
      station_serial_number: extractClubStationSerial(rawSerials, clubItem?.id),
    });
  };

  return (
    <Button variant="secondary" size="small" onClick={handleClick} className="min-w-[130px]">
      Refund Deposit
    </Button>
  );
};
