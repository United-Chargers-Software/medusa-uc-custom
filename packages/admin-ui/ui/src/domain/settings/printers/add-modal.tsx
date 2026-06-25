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
  printnode_options_json: string
}

const AddPrinterModal = ({ onClose, onSuccess }: Props) => {
  const { t } = useTranslation()
  const { create, isLoading } = usePrinters()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ defaultValues: { printnode_id: "", name: "", description: "", printnode_options_json: "" } })

  const onReset = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit((data) => {
    let printnode_options: Record<string, unknown> | null = null
    if (data.printnode_options_json.trim()) {
      printnode_options = JSON.parse(data.printnode_options_json)
    }
    create(
      {
        printnode_id: parseInt(data.printnode_id, 10),
        name: data.name,
        description: data.description || undefined,
        printnode_options,
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
            <div className="flex flex-col gap-y-1">
              <label className="inter-small-semibold text-grey-50">
                {t("printers-printnode-options", "PrintNode Options (JSON)")}
              </label>
              <textarea
                className="inter-small-regular w-full rounded-rounded border border-grey-20 bg-grey-5 px-3 py-2 font-mono text-xs focus:border-violet-60 focus:outline-none"
                rows={5}
                placeholder={'{\n  "fit_to_page": false,\n  "paper": "4x6",\n  "rotate": 180\n}'}
                {...register("printnode_options_json", {
                  validate: (v) => {
                    if (!v.trim()) return true
                    try {
                      JSON.parse(v)
                      return true
                    } catch {
                      return "Invalid JSON"
                    }
                  },
                })}
              />
              {errors.printnode_options_json && (
                <p className="inter-small-regular text-rose-50">
                  {errors.printnode_options_json.message}
                </p>
              )}
              <p className="inter-small-regular text-grey-40">
                {t("printers-printnode-options-hint", "Leave empty to use defaults. These options override the default PrintNode print job settings.")}
              </p>
            </div>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-x-2">
            <Button size="small" variant="secondary" type="button" onClick={onReset}>
              {t("printers-cancel", "Cancel")}
            </Button>
            <Button size="small" variant="primary" type="button" onClick={onSubmit} loading={isLoading}>
              {t("printers-add-button", "Add")}
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}

export default AddPrinterModal
