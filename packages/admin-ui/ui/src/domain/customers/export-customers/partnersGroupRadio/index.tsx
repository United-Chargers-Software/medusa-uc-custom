import * as RadioGroup from '@radix-ui/react-radio-group';
import { useEffect } from 'react';

export enum PartnersGroupEnum {
  ALL = 'all',
  PARTNERS_ACCEPTED = 'partners',
  PARTNERS_REQUEST = 'partners_request',
  PARTNERS_DENIED = 'partners_denied',
}

type PartnersGroupRadioProps = {
  setPartnersGroup: (value: PartnersGroupEnum) => void;
};

const items = [
  { id: PartnersGroupEnum.ALL, value: 'All partners' },
  { id: PartnersGroupEnum.PARTNERS_ACCEPTED, value: 'Partners accepted' },
  { id: PartnersGroupEnum.PARTNERS_REQUEST, value: 'Partners request' },
  { id: PartnersGroupEnum.PARTNERS_DENIED, value: 'Partners denied' },
];

export const PartnersGroupRadio = ({ setPartnersGroup }: PartnersGroupRadioProps) => {
  useEffect(() => {
    return () => setPartnersGroup(PartnersGroupEnum.ALL);
  }, [setPartnersGroup]);

  return (
    <div className="mt-4">
      <RadioGroup.Root className="flex flex-col" defaultValue="all">
        {items.map(item => (
          <div className="flex items-center gap-2">
            <RadioGroup.Item
              id={item.id}
              value={item.id}
              className="h-5 w-5 rounded-full border border-gray-300 p-[2px]"
              onClick={() => setPartnersGroup(item.id as PartnersGroupEnum)}
            >
              <RadioGroup.Indicator className="bg-violet-60 flex h-full w-full items-center justify-center rounded-full" />
            </RadioGroup.Item>
            <label htmlFor={item.id} className="inter-base-regular cursor-pointer">
              {item.value}
            </label>
          </div>
        ))}
      </RadioGroup.Root>
    </div>
  );
};
