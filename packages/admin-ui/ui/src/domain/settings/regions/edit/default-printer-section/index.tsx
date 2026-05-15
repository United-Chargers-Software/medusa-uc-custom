import { Region } from "@medusajs/medusa"
import React, { useEffect, useState } from "react"
import { NextSelect } from "../../../../../components/molecules/select/next-select"
import Section from "../../../../../components/organisms/section"
import useNotification from "../../../../../hooks/use-notification"
import usePrinters from "../../../printers/use-printer"

type Props = {
  region: Region
}

const DefaultPrinterSection = ({ region }: Props) => {
  const { printers, getPrinters, setRegionDefault, isLoading } = usePrinters()
  const notification = useNotification()

  const currentId: number | null =
    (region.metadata?.default_printer_id as number) ?? null

  const [selected, setSelected] = useState<{ value: number; label: string } | null>(null)

  useEffect(() => {
    getPrinters()
  }, [])

  useEffect(() => {
    if (printers.length && currentId !== null) {
      const match = printers.find((p) => p.printnode_id === currentId)
      if (match) {
        setSelected({ value: match.printnode_id, label: match.name })
      }
    }
  }, [printers, currentId])

  const options = printers.map((p) => ({ value: p.printnode_id, label: p.name }))

  const handleChange = async (option: { value: number; label: string } | null) => {
    if (!option) return
    setSelected(option)
    await setRegionDefault(region.id, option.value, () => {
      notification("Success", "Default printer updated", "success")
    })
  }

  return (
    <Section title="Default Printer">
      <div className="gap-y-xsmall mt-large flex flex-col">
        <p className="inter-base-regular text-grey-50">
          The default printer used for fulfillments in this region when no session printer is selected.
        </p>
        <div className="mt-base w-[320px]">
          <NextSelect
            placeholder="Select a printer..."
            value={selected}
            onChange={handleChange}
            options={options}
            isLoading={isLoading}
            isClearable={false}
          />
        </div>
      </div>
    </Section>
  )
}

export default DefaultPrinterSection
