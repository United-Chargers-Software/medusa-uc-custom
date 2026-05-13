import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import BackButton from "../../../components/atoms/back-button"
import PlusIcon from "../../../components/fundamentals/icons/plus-icon"
import RefreshIcon from "../../../components/fundamentals/icons/refresh-icon"
import BodyCard from "../../../components/organisms/body-card"
import PrintersTable from "./table"
import AddPrinterModal from "./add-modal"
import usePrinters from "./use-printer"

const Printers: React.FC = () => {
  const { t } = useTranslation()
  const [shouldRefetch, setShouldRefetch] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)

  const { printers, fetchPrinters, sync, isLoading } = usePrinters()

  const triggerRefetch = () => setShouldRefetch((prev) => prev + 1)

  useEffect(() => {
    setTimeout(() => {
      fetchPrinters()
    }, 500)
  }, [shouldRefetch])

  const handleAddClose = () => {
    triggerRefetch()
    setShowAddModal(false)
  }

  const handleSync = async () => {
    await sync(triggerRefetch)
  }

  const actionables = [
    {
      label: t("printers-sync", "Sync from PrintNode"),
      onClick: handleSync,
      disabled: isLoading,
      icon: (
        <span className="text-grey-90">
          <RefreshIcon size={20} />
        </span>
      ),
    },
    {
      label: t("printers-add", "Add Printer"),
      onClick: () => setShowAddModal(true),
      icon: (
        <span className="text-grey-90">
          <PlusIcon size={20} />
        </span>
      ),
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex w-full grow flex-col">
        <BackButton label={t("back-to-settings", "Back to settings")} className="mb-xsmall" />
        <BodyCard
          title={t("printers-title", "Printers")}
          subtitle={t("printers-subtitle", "Manage printers and default assignments")}
          actionables={actionables}
        >
          <div className="flex grow flex-col justify-between">
            <PrintersTable printers={printers} triggerRefetch={triggerRefetch} />
          </div>
          {showAddModal && <AddPrinterModal onClose={handleAddClose} onSuccess={handleAddClose} />}
        </BodyCard>
      </div>
    </div>
  )
}

export default Printers
