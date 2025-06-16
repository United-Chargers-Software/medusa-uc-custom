import React, { useEffect, useState } from 'react';
import Modal from '../../../components/molecules/modal';
import Button from '../../../components/fundamentals/button';
import { MEDUSA_BACKEND_URL_NOSLASH } from '../../../constants/medusa-backend-url';
import moment from 'moment';
import openUrlNewWindow from '../../../utils/open-link-new-window';
import DatePicker from '../../../components/atoms/date-picker/date-picker';

type ExportModalProps = {
  handleClose: () => void;
  onSubmit?: () => void;
  loading: boolean;
  title: string;
};

const SalesReportModal: React.FC<ExportModalProps> = ({ handleClose, title, loading }) => {
  // Init dates

  let now = new Date();

  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [endDate, setEndDate] = useState(now);
  const [urlParams, setUrlParams] = useState('');

  // Date select

  type DateSelectType = {
    selectedDate: Date;
    setDate: any;
    filterTitle: string;
  };

  const DateSelect = ({ selectedDate, setDate, filterTitle }: DateSelectType) => {
    return <DatePicker date={selectedDate} onSubmitDate={setDate} label={filterTitle} />;
  };

  // Get report

  const getUrlParams = () => {
    let params = '?start_date=' + moment(startDate).format('YYYY-MM-DD') + 'T00:00:00';

    params += '&end_date=' + moment(endDate).format('YYYY-MM-DD') + 'T23:59:59';

    return params;
  };

  const getReport = (type: string) => {
    let reportUrl = MEDUSA_BACKEND_URL_NOSLASH + '/admin/' + type + '/' + urlParams;
    openUrlNewWindow(reportUrl);
  };

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
              <DateSelect selectedDate={startDate} setDate={setStartDate} filterTitle="From date" />
            </div>
            <div className="basis-1/2">
              <DateSelect selectedDate={endDate} setDate={setEndDate} filterTitle="To date" />
            </div>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <div className="column flex w-full items-start justify-center gap-2">
            {/* <Button
              variant="ghost"
              size="small"
              onClick={handleClose}
            >
              Cancel
            </Button> */}
            <div className="mb-2 flex flex-col gap-2">
              <Button
                loading={loading}
                disabled={loading}
                variant="primary"
                size="small"
                onClick={() => getReport('sales-report')}
              >
                Sales report
              </Button>
              <Button
                loading={loading}
                disabled={loading}
                variant="primary"
                size="small"
                onClick={() => getReport('sales-report-canada')}
              >
                Sales report by Canadian provinces
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                loading={loading}
                disabled={loading}
                variant="primary"
                size="small"
                onClick={() => getReport('shipping-report')}
              >
                Shipping report
              </Button>
              <Button
                loading={loading}
                disabled={loading}
                variant="primary"
                size="small"
                onClick={() => getReport('referrals-report')}
              >
                Referrals report
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  );
};

export default SalesReportModal;
