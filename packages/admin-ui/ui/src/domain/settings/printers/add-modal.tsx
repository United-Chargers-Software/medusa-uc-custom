import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import Button from "../../../components/fundamentals/button"
import Modal from "../../../components/molecules/modal"
import InputField from "../../../components/molecules/input"
import usePrinters from "./use-printer"

type Props = {
  onClose: () => void
  onSuccess: () => void
}

type FormValues = {
  printnode_id: string
  name: string
  description: string
}

const AddPrinterModal = ({ onClose, onSuccess }: Props) => {
  const { t } = useTranslation()
  const { create, isLoading } = usePrinters()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ defaultValues: { printnode_id: "", name: "", description: "" } })

  const onReset = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit((data) => {
    create(
      {
        printnode_id: parseInt(data.printnode_id, 10),
        name: data.name,
        description: data.description || undefined,
      },
      onSuccess
    )
  })

  return (
    <Modal handleClose={onReset}>
      <Modal.Body>
        <Modal.Header handleClose={onReset}>
          <h1 className="inter-xlarge-semibold m-0">{t("printers-add-title", "Add Printer")}</h1>
        </Modal.Header>
        <form onSubmit={onSubmit}>
          <Modal.Content>
            <div className="flex flex-col gap-y-4">
              <InputField
                label={t("printers-printnode-id", "PrintNode ID")}
                placeholder="12345"
                required
                type="number"
                {...register("printnode_id", { required: "PrintNode ID is required" })}
                errors={errors}
              />
              <InputField
                label={t("printers-name", "Name")}
                placeholder="Burnaby - Main"
                required
                {...register("name", { required: "Name is required" })}
                errors={errors}
              />
              <InputField
                label={t("printers-description", "Description")}
                placeholder="HP LaserJet in room A"
                {...register("description")}
                errors={errors}
              />
            </div>
          </Modal.Content>
          <Modal.Footer>
            <div className="flex w-full justify-end gap-x-2">
              <Button size="small" variant="secondary" type="button" onClick={onReset}>
                {t("printers-cancel", "Cancel")}
              </Button>
              <Button size="small" variant="primary" type="submit" disabled={!isDirty} loading={isLoading}>
                {t("printers-add-button", "Add")}
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal.Body>
    </Modal>
  )
}

export default AddPrinterModal
