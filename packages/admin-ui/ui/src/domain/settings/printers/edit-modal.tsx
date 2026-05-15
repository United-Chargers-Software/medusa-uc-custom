import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import Button from "../../../components/fundamentals/button"
import Modal from "../../../components/molecules/modal"
import InputField from "../../../components/molecules/input"
import usePrinters, { PrinterType } from "./use-printer"

type Props = {
  printer: PrinterType
  onClose: () => void
  onSuccess: () => void
}

type FormValues = {
  name: string
  description: string
  is_active: boolean
}

const EditPrinterModal = ({ printer, onClose, onSuccess }: Props) => {
  const { t } = useTranslation()
  const { update, isLoading } = usePrinters()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>()

  useEffect(() => {
    reset({
      name: printer.name,
      description: printer.description ?? "",
      is_active: printer.is_active,
    })
  }, [printer])

  const onReset = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit((data) => {
    update(
      printer.id,
      {
        name: data.name,
        description: data.description || undefined,
        is_active: data.is_active,
      },
      onSuccess
    )
  })

  return (
    <Modal handleClose={onReset}>
      <Modal.Body>
        <Modal.Header handleClose={onReset}>
          <h1 className="inter-xlarge-semibold m-0">{t("printers-edit-title", "Edit Printer")}</h1>
        </Modal.Header>
        <Modal.Content>
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center gap-x-2">
              <span className="inter-small-regular text-grey-50">PrintNode ID:</span>
              <span className="inter-small-semibold">{printer.printnode_id}</span>
            </div>
            <InputField
              label={t("printers-name", "Name")}
              required
              {...register("name", { required: "Name is required" })}
              errors={errors}
            />
            <InputField
              label={t("printers-description", "Description")}
              {...register("description")}
              errors={errors}
            />
            <div className="flex items-center gap-x-2">
              <input
                type="checkbox"
                id="is_active"
                className="h-4 w-4"
                {...register("is_active")}
              />
              <label htmlFor="is_active" className="inter-small-regular">
                {t("printers-active", "Active")}
              </label>
            </div>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-x-2">
            <Button size="small" variant="secondary" type="button" onClick={onReset}>
              {t("printers-cancel", "Cancel")}
            </Button>
            <Button size="small" variant="primary" type="button" onClick={onSubmit} loading={isLoading}>
              {t("printers-save-button", "Save")}
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}

export default EditPrinterModal
