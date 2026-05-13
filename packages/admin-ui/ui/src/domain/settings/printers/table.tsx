import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import EditIcon from "../../../components/fundamentals/icons/edit-icon"
import Table from "../../../components/molecules/table"
import usePrinters, { PrinterType } from "./use-printer"
import EditPrinterModal from "./edit-modal"

type PrintersTableProps = {
  printers: PrinterType[]
  triggerRefetch: () => void
}

type ListElement = {
  entity: PrinterType
  tableElement: JSX.Element
}

const PrintersTable: React.FC<PrintersTableProps> = ({ printers, triggerRefetch }) => {
  const { t } = useTranslation()
  const [elements, setElements] = useState<ListElement[]>([])
  const [shownElements, setShownElements] = useState<ListElement[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterType | null>(null)

  useEffect(() => {
    setElements(
      printers.map((printer, i) => ({
        entity: printer,
        tableElement: getTableRow(printer, i),
      }))
    )
  }, [printers])

  useEffect(() => {
    setShownElements(elements)
  }, [elements])

  const handleClose = () => setSelectedPrinter(null)

  const handleSuccess = () => {
    handleClose()
    triggerRefetch()
  }

  const handleSearch = (term: string) => {
    setShownElements(
      elements.filter((e) =>
        e.entity.name.toLowerCase().includes(term.toLowerCase())
      )
    )
  }

  const getTableRow = (printer: PrinterType, index: number) => (
    <Table.Row
      key={`printer-${index}`}
      color="inherit"
      actions={[
        {
          label: t("printers-edit", "Edit"),
          onClick: () => setSelectedPrinter(printer),
          icon: <EditIcon size={20} />,
        },
      ]}
      forceDropdown
    >
      <Table.Cell className="w-64">{printer.name}</Table.Cell>
      <Table.Cell className="w-32 text-grey-50">{printer.printnode_id}</Table.Cell>
      <Table.Cell className="w-64 text-grey-50">{printer.description ?? "—"}</Table.Cell>
      <Table.Cell>
        <span
          className={`inter-small-semibold ${
            printer.is_active ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {printer.is_active ? t("printers-active", "Active") : t("printers-inactive", "Inactive")}
        </span>
      </Table.Cell>
    </Table.Row>
  )

  if (!printers.length) {
    return <div className="inter-small-regular text-grey-50 py-4">{t("printers-empty", "No printers added yet.")}</div>
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <Table enableSearch handleSearch={handleSearch}>
        <Table.Head>
          <Table.HeadRow>
            <Table.HeadCell>{t("printers-col-name", "Name")}</Table.HeadCell>
            <Table.HeadCell>{t("printers-col-id", "PrintNode ID")}</Table.HeadCell>
            <Table.HeadCell>{t("printers-col-description", "Description")}</Table.HeadCell>
            <Table.HeadCell>{t("printers-col-status", "Status")}</Table.HeadCell>
          </Table.HeadRow>
        </Table.Head>
        <Table.Body>{shownElements.map((e) => e.tableElement)}</Table.Body>
      </Table>
      {selectedPrinter && (
        <EditPrinterModal
          printer={selectedPrinter}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

export default PrintersTable
