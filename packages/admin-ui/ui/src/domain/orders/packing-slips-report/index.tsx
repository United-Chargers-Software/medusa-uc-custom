import React, { useEffect, useState } from 'react';
import { useAdminRegions } from 'medusa-react';
import Modal from '../../../components/molecules/modal';
import Button from '../../../components/fundamentals/button';
import InputField from '../../../components/molecules/input';
import Checkbox from '../../../components/atoms/checkbox';
import { NextSelect } from '../../../components/molecules/select/next-select';

type FulfillmentStatus =
  | 'fulfilled'
  | 'not_fulfilled'
  | 'partially_fulfilled'
  | 'returned'
  | 'partially_returned'
  | 'shipped'
  | 'partially_shipped'
  | 'requires_action'
  | 'canceled';

type PaymentStatus =
  | 'awaiting'
  | 'captured'
  | 'refunded'
  | 'canceled'
  | 'partially_refunded'
  | 'requires_action'
  | 'not_paid';

export type PackingSlipsPayload = {
  medusaOrderNumberFrom: number;
  medusaOrderNumberTo: number;
  fulfillmentStatus: FulfillmentStatus[];
  paymentStatus: PaymentStatus[];
  regionId: string[];
  offset: number;
  limit: number;
};

type PackingSlipsReportModalProps = {
  handleClose: () => void;
  onSubmit: (payload: PackingSlipsPayload) => void;
  loading: boolean;
  title: string;
};

const fulfillmentOptions: FulfillmentStatus[] = [
  'fulfilled',
  'not_fulfilled',
  'partially_fulfilled',
  'returned',
  'partially_returned',
  'shipped',
  'partially_shipped',
  'requires_action',
  'canceled',
];

const paymentOptions: PaymentStatus[] = [
  'awaiting',
  'captured',
  'refunded',
  'canceled',
  'partially_refunded',
  'requires_action',
  'not_paid',
];

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

const formatStatusLabel = (value: string) => value.replaceAll('_', ' ');

const fulfillmentSelectOptions: SelectOption<FulfillmentStatus>[] = fulfillmentOptions.map(option => ({
  value: option,
  label: formatStatusLabel(option),
}));

const paymentSelectOptions: SelectOption<PaymentStatus>[] = paymentOptions.map(option => ({
  value: option,
  label: formatStatusLabel(option),
}));

const parseNumber = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const PackingSlipsReportModal: React.FC<PackingSlipsReportModalProps> = ({
  handleClose,
  onSubmit,
  loading,
  title,
}) => {
  const { regions, isLoading: isLoadingRegions } = useAdminRegions({ limit: 200 });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [medusaOrderNumberFrom, setMedusaOrderNumberFrom] = useState('');
  const [medusaOrderNumberTo, setMedusaOrderNumberTo] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus[]>([]);
  const [regionId, setRegionId] = useState<string[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const submit = () => {
    onSubmit({
      medusaOrderNumberFrom: parseNumber(medusaOrderNumberFrom, 0),
      medusaOrderNumberTo: parseNumber(medusaOrderNumberTo, 0),
      fulfillmentStatus,
      paymentStatus,
      regionId,
      offset: 0,
      limit: 500,
    });
  };

  return (
    <Modal handleClose={handleClose} isLargeModal={windowWidth > 1024}>
      <Modal.Body>
        <Modal.Header handleClose={handleClose}>
          <span className="inter-xlarge-semibold">{title}</span>
        </Modal.Header>
        <Modal.Content>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                type="number"
                min={0}
                label="Medusa order number from"
                value={medusaOrderNumberFrom}
                placeholder="e.g. 1000"
                onChange={e => setMedusaOrderNumberFrom(e.target.value)}
              />
              <InputField
                type="number"
                min={0}
                label="Medusa order number to"
                value={medusaOrderNumberTo}
                placeholder="e.g. 2000"
                onChange={e => setMedusaOrderNumberTo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NextSelect
                label="Fulfillment status"
                placeholder="Choose fulfillment statuses"
                isMulti
                selectAll={false}
                value={fulfillmentSelectOptions.filter(option => fulfillmentStatus.includes(option.value))}
                onChange={selected =>
                  setFulfillmentStatus(Array.isArray(selected) ? selected.map(option => option.value) : [])
                }
                options={fulfillmentSelectOptions}
              />
              <NextSelect
                label="Payment status"
                placeholder="Choose payment statuses"
                isMulti
                selectAll={false}
                value={paymentSelectOptions.filter(option => paymentStatus.includes(option.value))}
                onChange={selected => setPaymentStatus(Array.isArray(selected) ? selected.map(option => option.value) : [])}
                options={paymentSelectOptions}
              />
            </div>

            <div className="rounded-rounded border border-grey-20 p-3">
              <div className="inter-small-semibold mb-2">Regions</div>
              {isLoadingRegions ? (
                <div className="inter-small-regular text-grey-50">Loading regions...</div>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {(regions || []).map(region => (
                    <Checkbox
                      key={region.id}
                      id={`packing-region-${region.id}`}
                      checked={regionId.includes(region.id)}
                      onChange={() =>
                        setRegionId(prev =>
                          prev.includes(region.id) ? prev.filter(id => id !== region.id) : [...prev, region.id],
                        )
                      }
                      label={<span className="inter-small-regular">{region.name}</span>}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" size="small" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" size="small" onClick={submit} loading={loading} disabled={loading}>
              Download packing slips
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  );
};

export default PackingSlipsReportModal;
