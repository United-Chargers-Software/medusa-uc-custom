import { useMedusa } from "medusa-react"
import { useEffect, useState } from "react"

type EffectivePrinter = {
  id: string
  printnode_id: number
  name: string
} | null | undefined

const useEffectivePrinter = (regionId?: string) => {
  const { client } = useMedusa()
  const [printer, setPrinter] = useState<EffectivePrinter>(undefined)

  useEffect(() => {
    const ts = Date.now()
    const query = regionId
      ? `?region_id=${regionId}&_t=${ts}`
      : `?_t=${ts}`
    client.admin.custom
      .get(`admin/printer/me${query}`)
      .then((res: any) => setPrinter(res?.printer ?? null))
      .catch(() => setPrinter(null))
  }, [regionId])

  return printer
}

export default useEffectivePrinter
