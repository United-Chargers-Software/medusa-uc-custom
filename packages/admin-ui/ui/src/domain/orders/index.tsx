import { useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAdminCreateBatchJob } from 'medusa-react';
import Spacer from '../../components/atoms/spacer';
import RouteContainer from '../../components/extensions/route-container';
import WidgetContainer from '../../components/extensions/widget-container';
import Button from '../../components/fundamentals/button';
import ExportIcon from '../../components/fundamentals/icons/export-icon';
import BodyCard from '../../components/organisms/body-card';
import TableViewHeader from '../../components/organisms/custom-table-header';
import ExportModal from '../../components/organisms/export-modal';
import OrderTable from '../../components/templates/order-table';
import useNotification from '../../hooks/use-notification';
import useToggleState from '../../hooks/use-toggle-state';
import { usePolling } from '../../providers/polling-provider';
import { useRoutes } from '../../providers/route-provider';
import { useWidgets } from '../../providers/widget-provider';
import { getErrorMessage } from '../../utils/error-messages';
import medusaRequest from '../../utils/request';
import Details from './details';
import { transformFiltersAsExportContext } from './utils';
import SalesReportModal from './sales-report';
import CashIcon from '../../components/fundamentals/icons/cash-icon';
import PackingSlipsReportModal, { PackingSlipsPayload } from './packing-slips-report';

const VIEWS = ['orders', 'drafts'];

const getFilenameFromContentDisposition = (contentDisposition: string | null) => {
  if (!contentDisposition) {
    return 'packing-slips.zip';
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return 'packing-slips.zip';
};

const getErrorMessageFromBlob = async (blob: Blob): Promise<string | null> => {
  try {
    const text = await blob.text();
    if (!text) {
      return null;
    }

    const parsed = JSON.parse(text) as { message?: string };
    if (parsed?.message) {
      return parsed.message;
    }

    return text;
  } catch {
    return null;
  }
};

const getPackingSlipsRequestErrorMessage = async (error: unknown): Promise<string | null> => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const errorRecord = error as { response?: { status?: number; data?: unknown } };
  const response = errorRecord.response;

  if (!response || response.status !== 404) {
    return null;
  }

  if (response.data instanceof Blob) {
    return getErrorMessageFromBlob(response.data);
  }

  if (response.data && typeof response.data === 'object') {
    const dataRecord = response.data as { message?: unknown };
    if (typeof dataRecord.message === 'string' && dataRecord.message.trim().length > 0) {
      return dataRecord.message;
    }
  }

  return null;
};

const OrderIndex = () => {
  const view = 'orders';

  const { t } = useTranslation();
  const { resetInterval } = usePolling();
  const navigate = useNavigate();
  const createBatchJob = useAdminCreateBatchJob();
  const notification = useNotification();

  const [contextFilters, setContextFilters] = useState<Record<string, { filter: string[] }>>();

  const { open: openExportModal, close: closeExportModal, state: exportModalOpen } = useToggleState(false);

  const {
    open: openSalesReportModal,
    close: closeSalesReportModal,
    state: salesReportModalOpen,
  } = useToggleState(false);
  const {
    open: openPackingSlipsModal,
    close: closePackingSlipsModal,
    state: packingSlipsModalOpen,
  } = useToggleState(false);
  const [packingSlipsLoading, setPackingSlipsLoading] = useState(false);

  const { getWidgets } = useWidgets();

  const handlePackingSlipsSubmit = async (payload: PackingSlipsPayload) => {
    try {
      setPackingSlipsLoading(true);

      const response = await medusaRequest('POST', '/admin/packing-slips', payload, {
        responseType: 'blob',
      });

      const filename = getFilenameFromContentDisposition(response.headers?.['content-disposition'] ?? null);
      const zipBlob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notification(
        t('orders-success', 'Success'),
        t('orders-packing-slips-report-downloaded', 'Packing slips report downloaded'),
        'success',
      );
      closePackingSlipsModal();
    } catch (err) {
      const packingSlipsMessage = await getPackingSlipsRequestErrorMessage(err);
      notification(
        t('orders-error', 'Error'),
        packingSlipsMessage || getErrorMessage(err),
        'error',
      );
    } finally {
      setPackingSlipsLoading(false);
    }
  };

  const actions = useMemo(() => {
    return [
      <div className="flex space-x-2">
        <Button key="sales-report" variant="secondary" size="small" onClick={() => openSalesReportModal()}>
          <CashIcon size={20} />
          Orders Reports
        </Button>
        {/* <Button key="packing-slips-report" variant="secondary" size="small" onClick={() => openPackingSlipsModal()}>
          <CashIcon size={20} />
          Packing slips download
        </Button> */}
        <Button key="export-orders" variant="secondary" size="small" onClick={() => openExportModal()}>
          <ExportIcon size={20} />
          Export Orders
        </Button>
      </div>,
    ];
  }, [view, openExportModal, openPackingSlipsModal, openSalesReportModal]);

  const handleCreateExport = () => {
    const reqObj = {
      dry_run: false,
      type: 'order-export',
      context: contextFilters ? transformFiltersAsExportContext(contextFilters) : {},
    };

    createBatchJob.mutate(reqObj, {
      onSuccess: () => {
        resetInterval();
        notification(
          t('orders-success', 'Success'),
          t('orders-successfully-initiated-export', 'Successfully initiated export'),
          'success',
        );
      },
      onError: err => {
        notification(t('orders-error', 'Error'), getErrorMessage(err), 'error');
      },
    });

    closeExportModal();
  };

  return (
    <>
      <div className="gap-y-xsmall flex h-full grow flex-col">
        {getWidgets('order.list.before').map((w, i) => {
          return <WidgetContainer key={i} injectionZone={'order.list.before'} widget={w} entity={undefined} />;
        })}

        <div className="flex w-full grow flex-col">
          <BodyCard
            customHeader={
              <TableViewHeader
                views={VIEWS}
                setActiveView={v => {
                  if (v === 'drafts') {
                    navigate(`/a/draft-orders`);
                  }
                }}
                activeView={view}
              />
            }
            className="h-fit"
            customActionable={actions}
          >
            <OrderTable setContextFilters={setContextFilters} />
          </BodyCard>
        </div>
        {getWidgets('order.list.after').map((w, i) => {
          return <WidgetContainer key={i} injectionZone={'order.list.after'} widget={w} entity={undefined} />;
        })}
        <Spacer />
      </div>
      {exportModalOpen && (
        <ExportModal
          title={t('orders-export-orders', 'Export Orders')}
          handleClose={() => closeExportModal()}
          onSubmit={handleCreateExport}
          loading={createBatchJob.isLoading}
        />
      )}
      {salesReportModalOpen && (
        <SalesReportModal title="Orders Reports" handleClose={() => closeSalesReportModal()} loading={false} />
      )}
      {packingSlipsModalOpen && (
        <PackingSlipsReportModal
          title="Packing slips report"
          handleClose={() => closePackingSlipsModal()}
          loading={packingSlipsLoading}
          onSubmit={handlePackingSlipsSubmit}
        />
      )}
    </>
  );
};

const Orders = () => {
  const { getNestedRoutes } = useRoutes();

  const nestedRoutes = getNestedRoutes('/products');

  return (
    <Routes>
      <Route index element={<OrderIndex />} />
      <Route path="/:id" element={<Details />} />
      {nestedRoutes.map((r, i) => {
        return <Route path={r.path} key={i} element={<RouteContainer route={r} previousPath={'/orders'} />} />;
      })}
    </Routes>
  );
};

export default Orders;
