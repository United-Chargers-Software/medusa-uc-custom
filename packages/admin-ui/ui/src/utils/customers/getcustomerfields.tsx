import { Customer } from '@medusajs/medusa';

export type CustomerFieldsType = {
  id: string;
  name: string;
  sort: number;
  value: any;
  full: boolean;
};

export const customersTypes = [
  { value: '', label: 'Customers' },
  { value: 'partners', label: 'Partners' },
];

const usFirst = (str: string) => {
  return str ? (str.charAt(0)?.toUpperCase() ?? '') + (str.slice(1) ?? '') : str;
};

const getLink = (value: string) => {
  if (value.startsWith('https://') || value.startsWith('http://')) {
    return value;
  } else {
    return `https://${value}`;
  }
};

const getCustomerFields = (customer: Customer | undefined) => {
  let fields = [] as CustomerFieldsType[];

  if (customer) {
    for (let i in customer.metadata) {
      if (customer.metadata[i]) {
        let name = '';
        let value = customer.metadata[i];
        let sort = 1;
        let full = false;

        switch (i) {
          // Type

          case 'type':
            name = 'Customer type on registration';
            value = usFirst(String(value));
            sort = 1;
            break;

          // Fields

          case 'company':
            name = 'Company';
            sort = 2;
            break;
          case 'contact_name':
            name = 'Contact name';
            sort = 3;
            break;
          case 'contact_position':
            name = 'Contact position';
            sort = 4;
            break;
          case 'exempt_number':
            name = 'Exempt number';
            sort = 5;
            break;
          case 'website':
            name = 'Website';
            value = (
              <a href={getLink(String(value))} className="text-blue-60" target="_blank" rel="nofollow">
                {String(value)}
              </a>
            );
            sort = 6;
            break;
          case 'installer_distance':
            name = 'Ability to travel to customer site, km';
            sort = 5;
            break;
          case 'description':
            name = 'Description';
            value = String(value)
              .split('\n')
              .map(v => <div className="break-words">{v ? v : ''}</div>);
            sort = 100;
            full = true;
            break;

          // Exempt file

          case 'exempt_file':
            name = 'Exempt document';
            value = (
              <a href={String(value)} className="text-blue-60" target="_blank" rel="nofollow">
                Download
              </a>
            );
            sort = 6;
            break;

          // License file

          case 'license_file':
            name = 'License document';
            value = (
              <a href={String(value)} className="text-blue-60" target="_blank" rel="nofollow">
                Download
              </a>
            );
            sort = 6;
            break;

          // File

          case 'file':
            name = 'Uploaded document';
            value = (
              <a href={String(value)} className="text-blue-60" target="_blank" rel="nofollow">
                Download
              </a>
            );
            sort = 6;
            break;
        }

        if (name != '')
          fields.push({
            id: i,
            name: name,
            value: value as string,
            sort: sort,
            full: full,
          });
      }
    }
  }

  return fields.sort((a, b) => {
    if (a.sort < b.sort) return -1;
    else if (a.sort > b.sort) return 1;
    else return 0;
  });
};

export default getCustomerFields;
