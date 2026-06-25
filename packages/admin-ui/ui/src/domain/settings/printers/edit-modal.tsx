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
  printnode_id: number
  name: string
  description: string
  is_active: boolean
  printnode_options_json: string
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
      printnode_id: printer.printnode_id,
      name: printer.name,
      description: printer.description ?? "",
      is_active: printer.is_active,
      printnode_options_json: printer.printnode_options
        ? JSON.stringify(printer.printnode_options, null, 2)
        : "",
    })
  }, [printer])

  const onReset = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit((data) => {
    let printnode_options: Record<string, unknown> | null = null
    if (data.printnode_options_json.trim()) {
      printnode_options = JSON.parse(data.printnode_options_json)
    }
    update(
      printer.id,
      {
        printnode_id: data.printnode_id,
        name: data.name,
        description: data.description || undefined,
        is_active: data.is_active,
        printnode_options,
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
            <InputField
              label="PrintNode ID"
              required
              type="number"
              {...register("printnode_id", {
                required: "PrintNode ID is required",
                valueAsNumber: true,
              })}
              errors={errors}
            />
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
              {t("printers-save-button", "Save")}
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}

export default EditPrinterModal
