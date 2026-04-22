import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import FeatureToggle from '../../../../components/fundamentals/feature-toggle';
import ImagePlaceholder from '../../../../components/fundamentals/image-placeholder';
import InputField from '../../../../components/molecules/input';
import { LineItem } from '@medusajs/medusa';
import clsx from 'clsx';
import { useAdminVariantsInventory } from 'medusa-react';
import { useFeatureFlag } from '../../../../providers/feature-flag-provider';

const SERIAL_CODE_METADATA_KEY = '_serial_code';

export const getSerialCodePrefixes = (item: LineItem): string[] => {
  const productMetadata = (item as LineItem & { variant?: { product?: { metadata?: Record<string, unknown> } } }).variant?.product?.metadata;
  const raw = productMetadata?.[SERIAL_CODE_METADATA_KEY];
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
};

export const validateSerialValue = (
  value: string,
  allowedPrefixes: string[],
  serialRequiredByCollection: boolean,
): 'required' | 'invalid' | null => {
  const trimmed = value.trim();
  const mustRequireSerial = serialRequiredByCollection || allowedPrefixes.length > 0;
  if (!mustRequireSerial) return null;
  if (!trimmed) return 'required';
  if (allowedPrefixes.length > 0) {
    const ok = allowedPrefixes.some(prefix => trimmed.startsWith(prefix));
    return ok ? null : 'invalid';
  }
  return null;
};

const SERIAL_COLLECTION_HANDLES = ['grizzl-e', 'grizzl-e-club', 'commercial', 'used'] as const;
const ACCESSORY_MID_CODES = new Set(['accessories', 'big_accessories']);

export const isItemFromSerialRequiredCollection = (item: LineItem): boolean => {
  const handle = (item as LineItem & { variant?: { product?: { collection?: { handle?: string } } } }).variant?.product?.collection?.handle;
  if (typeof handle === 'string' && (SERIAL_COLLECTION_HANDLES as readonly string[]).includes(handle)) {
    return true;
  }
  return false;
};

export const isClubStationItem = (item: LineItem): boolean => {
  const product = (item as LineItem & { variant?: { product?: { collection?: { handle?: string }; mid_code?: string | null } } }).variant?.product;
  const handle = product?.collection?.handle;
  const midCode = String(product?.mid_code ?? '').trim().toLowerCase();
  const isAccessory = ACCESSORY_MID_CODES.has(midCode);
  return handle === 'grizzl-e-club' && !isAccessory;
};

export const getFulfillableQuantity = (item: LineItem): number => {
  return item.quantity - (item.fulfilled_quantity || 0) - (item.returned_quantity || 0);
};

const CreateFulfillmentItemsTable = ({
  items,
  quantities,
  setQuantities,
  locationId,
  setErrors,
  serialNumbers,
  setSerialNumbers,
  serialValidationErrors,
  setSerialValidationErrors,
}: {
  items: LineItem[];
  quantities: Record<string, number>;
  setQuantities: (quantities: Record<string, number>) => void;
  locationId?: string;
  setErrors: (errors: React.SetStateAction<{}>) => void;
  serialNumbers: Record<string, string[]>;
  setSerialNumbers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  serialValidationErrors: Record<string, (string | null)[]>;
  setSerialValidationErrors: React.Dispatch<React.SetStateAction<Record<string, (string | null)[]>>>;
}) => {
  const handleQuantityUpdate = React.useCallback(
    (value: number, id: string) => {
      let newQuantities = { ...quantities };

      newQuantities = {
        ...newQuantities,
        [id]: value,
      };

      setQuantities(newQuantities);
    },
    [quantities, setQuantities],
  );

  return (
    <div>
      {items.map((item, idx) => {
        return (
          <FulfillmentLine
            item={item}
            locationId={locationId}
            key={`fulfillmentLine-${idx}`}
            quantities={quantities}
            handleQuantityUpdate={handleQuantityUpdate}
            setErrors={setErrors}
            serialNumbers={serialNumbers}
            setSerialNumbers={setSerialNumbers}
            serialValidationErrors={serialValidationErrors}
            setSerialValidationErrors={setSerialValidationErrors}
          />
        );
      })}
    </div>
  );
};

const FulfillmentLine = ({
  item,
  locationId,
  quantities,
  handleQuantityUpdate,
  setErrors,
  serialNumbers,
  setSerialNumbers,
  serialValidationErrors,
  setSerialValidationErrors,
}: {
  locationId?: string;
  item: LineItem;
  quantities: Record<string, number>;
  handleQuantityUpdate: (value: number, id: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  serialNumbers: Record<string, string[]>;
  setSerialNumbers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  serialValidationErrors: Record<string, (string | null)[]>;
  setSerialValidationErrors: React.Dispatch<React.SetStateAction<Record<string, (string | null)[]>>>;
}) => {
  const { t } = useTranslation();
  const { isFeatureEnabled } = useFeatureFlag();
  const isLocationFulfillmentEnabled = isFeatureEnabled('inventoryService') && isFeatureEnabled('stockLocationService');

  const { variant, isLoading, refetch } = useAdminVariantsInventory(item.variant_id as string, {
    enabled: isLocationFulfillmentEnabled,
  });

  // Disable inventory check
  const hasInventoryItem = false; //!!variant?.inventory.length

  React.useEffect(() => {
    if (isLocationFulfillmentEnabled) {
      refetch();
    }
  }, [isLocationFulfillmentEnabled, refetch]);

  const { availableQuantity, inStockQuantity } = useMemo(() => {
    if (!isLocationFulfillmentEnabled) {
      return {
        availableQuantity: item.variant.inventory_quantity,
        inStockQuantity: item.variant.inventory_quantity,
      };
    }

    if (isLoading || !locationId || !variant) {
      return {};
    }

    const { inventory } = variant;

    const locationInventory = inventory[0]?.location_levels?.find(inv => inv.location_id === locationId);

    if (!locationInventory) {
      return {};
    }

    return {
      availableQuantity: locationInventory.available_quantity,
      inStockQuantity: locationInventory.stocked_quantity,
    };
  }, [isLoading, locationId, variant, item.variant, isLocationFulfillmentEnabled]);

  // Disable quantity check
  const validQuantity = true; /*
    !locationId ||
    (locationId &&
      (!availableQuantity || quantities[item.id] <= availableQuantity))*/

  React.useEffect(() => {
    setErrors(errors => {
      if (validQuantity) {
        delete errors[item.id];
        return errors;
      }

      errors[item.id] = t('create-fulfillment-quantity-is-not-valid', 'Quantity is not valid');
      return errors;
    });
  }, [validQuantity, setErrors, item.id]);

  React.useEffect(() => {
    if (!availableQuantity && hasInventoryItem) {
      handleQuantityUpdate(0, item.id);
    } else {
      handleQuantityUpdate(
        Math.min(getFulfillableQuantity(item), ...[hasInventoryItem ? availableQuantity : Number.MAX_VALUE]),
        item.id,
      );
    }
    // Note: we can't add handleQuantityUpdate to the dependency array as it will cause an infinite loop
  }, [availableQuantity, item, item.id]);

  const updateSerialNumber = (index: number, value: string) => {
    setSerialNumbers(prev => {
      const current = prev[item.id] || [];
      const qty = quantities[item.id] || 0;
      const next = Array.from({ length: Math.max(current.length, qty, index + 1) }, (_, i) =>
        i === index ? value : current[i] ?? '',
      );
      return { ...prev, [item.id]: next };
    });
  };

  const fulfillQty = quantities[item.id] || 0;
  const isFromSerialRequiredCollection = isItemFromSerialRequiredCollection(item);
  const showSerialInputs = fulfillQty > 0 && isFromSerialRequiredCollection;
  const serialsForItem = useMemo(() => {
    if (!showSerialInputs) return [];
    const current = serialNumbers[item.id] || [];
    return Array.from({ length: fulfillQty }, (_, i) => current[i] ?? '');
  }, [showSerialInputs, fulfillQty, serialNumbers[item.id], item.id]);

  const allowedPrefixes = useMemo(() => getSerialCodePrefixes(item), [(item as any).variant?.product?.metadata]);

  useEffect(() => {
    if (!showSerialInputs) {
      setSerialValidationErrors(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      return;
    }
    const errors: (string | null)[] = serialsForItem.map(value => {
      const result = validateSerialValue(value, allowedPrefixes, isFromSerialRequiredCollection);
      return result === 'required' || result === 'invalid' ? result : null;
    });
    setSerialValidationErrors(prev => ({ ...prev, [item.id]: errors }));
  }, [showSerialInputs, serialsForItem, allowedPrefixes, isFromSerialRequiredCollection, item.id, setSerialValidationErrors]);

  const serialErrorsForItem = serialValidationErrors[item.id] || [];

  if (getFulfillableQuantity(item) <= 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div
        className={clsx('rounded-rounded hover:bg-grey-5 mx-[-5px] mb-1 flex h-[64px] justify-between py-2 px-[5px]', {
          'pointer-events-none opacity-50':
            (!availableQuantity && hasInventoryItem) || (!locationId && isLocationFulfillmentEnabled),
        })}
      >
        <div className="flex justify-center space-x-4">
          <div className="rounded-rounded flex h-[48px] w-[36px] overflow-hidden">
            {item.thumbnail ? <img src={item.thumbnail} className="object-cover" /> : <ImagePlaceholder />}
          </div>
          <div className="flex max-w-[185px] flex-col justify-center">
            <span className="inter-small-regular text-grey-90 truncate">{item.title}</span>
            {item?.variant && (
              <span className="inter-small-regular text-grey-50 truncate">
                {`${item.variant.title}${item.variant.sku ? ` (${item.variant.sku})` : ''}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <FeatureToggle featureFlag="inventoryService">
            {hasInventoryItem && (
              <div className="inter-base-regular text-grey-50 mr-6 flex flex-col items-end whitespace-nowrap">
                <p>{availableQuantity || 0} available</p>
                <p>({inStockQuantity || 0} in stock)</p>
              </div>
            )}
          </FeatureToggle>
          <InputField
            type="number"
            name={`quantity`}
            defaultValue={getFulfillableQuantity(item)}
            min={0}
            suffix={
              <span className="flex">
                {'/'}
                <span className="pl-1">{getFulfillableQuantity(item)}</span>
              </span>
            }
            value={quantities[item.id]}
            max={Math.min(
              getFulfillableQuantity(item),
              ...[hasInventoryItem ? availableQuantity || 0 : Number.MAX_VALUE],
            )}
            onChange={e => handleQuantityUpdate(e.target.valueAsNumber, item.id)}
            errors={
              validQuantity
                ? undefined
                : {
                    quantity: t('create-fulfillment-quantity-is-not-valid', 'Quantity is not valid'),
                  }
            }
          />
        </div>
      </div>
      {showSerialInputs && (
        <div className="ml-10 mt-2 flex flex-col gap-2">
          <span className="inter-small-semibold text-grey-70">
            {t('create-fulfillment-serial-numbers', 'Serial number(s)')}
            <span className="text-rose-50 ml-0.5">*</span>
          </span>
          <span className="inter-small-regular text-grey-50">
            {t('create-fulfillment-serial-required-for-stations', 'Required for station products.')}
          </span>
          {serialsForItem.map((serial, index) => (
            <InputField
              key={`${item.id}-serial-${index}`}
              name="serial"
              label={serialsForItem.length > 1 ? `${t('create-fulfillment-serial-number', 'Serial number')} ${index + 1}` : undefined}
              required={allowedPrefixes.length > 0 || isFromSerialRequiredCollection}
              value={serial}
              onChange={e => updateSerialNumber(index, e.target.value)}
              placeholder={t('create-fulfillment-serial-placeholder', 'Enter serial number')}
              errors={
                serialErrorsForItem[index]
                  ? {
                      serial:
                        serialErrorsForItem[index] === 'required'
                          ? t('create-fulfillment-serial-required', 'Please enter serial number')
                          : t('create-fulfillment-serial-does-not-match-product-code', 'Does not match the serial code specified in the product'),
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default CreateFulfillmentItemsTable;
