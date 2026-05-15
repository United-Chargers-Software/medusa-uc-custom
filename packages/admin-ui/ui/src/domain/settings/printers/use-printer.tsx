import { useMedusa } from "medusa-react"
import { useEffect, useState } from "react"

export type PrinterType = {
  id: string
  printnode_id: number
  name: string
  description: string | null
  is_active: boolean
}

export type CreatePrinterData = {
  printnode_id: number
  name: string
  description?: string
}

export type UpdatePrinterData = {
  name?: string
  description?: string
  is_active?: boolean
}

const usePrinters = () => {
  const { client } = useMedusa()

  const [printers, setPrinters] = useState<PrinterType[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchPrinters()
  }, [])

  const fetchPrinters = async () => {
    const result = await getPrinters()
    setPrinters(result)
  }

  const getPrinters = async (): Promise<PrinterType[]> => {
    try {
      const res = await client.admin.custom.get("admin/printer")
      return res?.printers || []
    } catch (e) {
      return []
    }
  }

  const create = async (data: CreatePrinterData, onSuccess?: () => void) => {
    setIsLoading(true)
    try {
      await client.admin.custom.post("admin/printer", data)
      onSuccess?.()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const update = async (id: string, data: UpdatePrinterData, onSuccess?: () => void) => {
    setIsLoading(true)
    try {
      await client.admin.custom.post(`admin/printer/${id}`, data)
      onSuccess?.()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const sync = async (onSuccess?: () => void) => {
    setIsLoading(true)
    try {
      const res = await client.admin.custom.post("admin/printer/sync")
      setPrinters(res?.printers || [])
      onSuccess?.()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const setRegionDefault = async (regionId: string, printnode_id: number, onSuccess?: () => void) => {
    setIsLoading(true)
    try {
      await client.admin.custom.post(`admin/printer/region/${regionId}`, { printnode_id })
      onSuccess?.()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const remove = async (id: string, onSuccess?: () => void) => {
    setIsLoading(true)
    try {
      await client.admin.custom.delete(`admin/printer/${id}`)
      onSuccess?.()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const setUserDefault = async (userId: string, printnode_id: number, onSuccess?: () => void) => {
    setIsLoading(true)
    try {
      await client.admin.custom.post(`admin/printer/user/${userId}`, { printnode_id })
      onSuccess?.()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return { printers, fetchPrinters, getPrinters, create, update, remove, sync, setRegionDefault, setUserDefault, isLoading }
}

export default usePrinters
