import { useMedusa } from "medusa-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "../../fundamentals/button"
import Modal from "../../molecules/modal"
import { PrinterType } from "../../../domain/settings/printers/use-printer"

type Props = {
  printers: PrinterType[]
  currentPrintnodeId: number | null
  onSelect: () => void
}

const PrinterSelectionModal = ({ printers, currentPrintnodeId, onSelect }: Props) => {
  const { t } = useTranslation()
  const { client } = useMedusa()
  const [selected, setSelected] = useState<number | null>(currentPrintnodeId)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (selected === null) return
    setIsLoading(true)
    try {
      await client.admin.custom.post("admin/printer/session", { printnode_id: selected })
      onSelect()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal>
      <Modal.Body>
        <Modal.Header>
          <h1 className="inter-xlarge-semibold m-0">
            {t("printer-selection-title", "Select your printer")}
          </h1>
        </Modal.Header>
        <Modal.Content>
          <p className="inter-small-regular text-grey-50 mb-4">
            {t("printer-selection-subtitle", "Choose the printer you will use for this session.")}
          </p>
          <div className="flex flex-col gap-y-2">
            {printers.map((printer) => (
              <label
                key={printer.id}
                className={`flex cursor-pointer items-center gap-x-3 rounded-rounded border p-3 transition-colors ${
                  selected === printer.printnode_id
                    ? "border-violet-60 bg-violet-5"
                    : "border-grey-20 hover:border-grey-40"
                }`}
              >
                <input
                  type="radio"
                  name="printer"
                  value={printer.printnode_id}
                  checked={selected === printer.printnode_id}
                  onChange={() => setSelected(printer.printnode_id)}
                  className="h-4 w-4"
                />
                <div>
                  <p className="inter-small-semibold">{printer.name}</p>
                  {printer.description && (
                    <p className="inter-small-regular text-grey-50">{printer.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </Modal.Content>
        <Modal.Footer>
          <div className="flex w-full justify-end">
            <Button
              size="small"
              variant="primary"
              onClick={handleConfirm}
              disabled={selected === null}
              loading={isLoading}
            >
              {t("printer-selection-confirm", "Start session")}
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}

export default PrinterSelectionModal
