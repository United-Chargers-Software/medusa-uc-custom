import React, { useCallback, useEffect, useState } from 'react';
import Modal from '../../../components/molecules/modal';
import Button from '../../../components/fundamentals/button';
import { MEDUSA_BACKEND_URL_NOSLASH } from '../../../constants/medusa-backend-url';
import moment from 'moment';
import openUrlNewWindow from '../../../utils/open-link-new-window';
import DatePicker from '../../../components/atoms/date-picker/date-picker';
import ExportCustomerQuickFilters from './export-customer-quick-filters';
import Checkbox from '../../../components/atoms/checkbox';

type ExportModalProps = {
  handleClose: () => void;
  onSubmit?: () => void;
  loading: boolean;
  title: string;
};

const ExportCustomersModal: React.FC<ExportModalProps> = ({ handleClose, title, loading }) => {
  // Init dates

  let now = new Date();

  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [endDate, setEndDate] = useState(now);
  const [urlParams, setUrlParams] = useState('');
  const [onlyResellers, setOnlyResellers] = useState(false);

  // Date select

  type DateSelectType = {
    selectedDate: Date;
    setDate: any;
    filterTitle: string;
  };

  const DateSelect = ({ selectedDate, setDate, filterTitle }: DateSelectType) => {
    return <DatePicker date={selectedDate} onSubmitDate={setDate} label={filterTitle} />;
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOnlyResellers(e.target.checked ? true : false);
  };

  // Get report

  const getUrlParams = () => {
    let params = '?start_date=' + moment(startDate).format('YYYY-MM-DD') + 'T00:00:00';

    params += '&end_date=' + moment(endDate).format('YYYY-MM-DD') + 'T23:59:59';

    return params;
  };

  const getReport = async () => {
    try {
      const url = `${MEDUSA_BACKEND_URL_NOSLASH}/admin/resellers/export${urlParams}&onlyResellers=${onlyResellers}`;
      openUrlNewWindow(url);
    } catch (error) {
      console.log(error);
    }
  };

  const handleStartDateChange = useCallback((date: Date) => {
    setStartDate(date);
  }, []);

  const handleEndDateChange = useCallback((date: Date) => {
    setEndDate(date);
  }, []);

  useEffect(() => {
    setUrlParams(getUrlParams());
  }, [startDate, endDate]);

  return (
    <Modal handleClose={handleClose}>
      <Modal.Body>
        <Modal.Header handleClose={handleClose}>
          <span className="inter-xlarge-semibold">{title}</span>
        </Modal.Header>
        <Modal.Content>
          <div className="flex flex-row items-center justify-start gap-4">
            <div className="basis-1/2">
              <DateSelect selectedDate={startDate} setDate={setStartDate} filterTitle="from date" />
            </div>
            <div className="basis-1/2">
              <DateSelect selectedDate={endDate} setDate={setEndDate} filterTitle="to date" />
            </div>
          </div>
          <ExportCustomerQuickFilters
            handleStartDateChange={handleStartDateChange}
            handleEndDateChange={handleEndDateChange}
          />
          <div className="mb-4 block h-[1px] bg-gray-200" />
          <Checkbox label="Only partners" onChange={handleCheckboxChange} checked={onlyResellers} />
        </Modal.Content>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-4">
            <Button variant="ghost" size="small" onClick={handleClose}>
              Cancel
            </Button>
            <Button loading={loading} disabled={loading} variant="primary" size="small" onClick={getReport}>
              Export
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  );
};

export default ExportCustomersModal;
