import { useAdminGetSession } from "medusa-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import LoginCard from "../components/organisms/login-card"
import ResetTokenCard from "../components/organisms/reset-token-card"
import PrinterSelectionModal from "../components/organisms/printer-selection-modal"
import SEO from "../components/seo"
import PublicLayout from "../components/templates/login-layout"
import { PrinterType } from "../domain/settings/printers/use-printer"

type PrinterPrompt = {
  required: boolean
  printers: PrinterType[]
  current_printnode_id: number | null
}

const LoginPage = () => {
  const [resetPassword, setResetPassword] = useState(false)
  const [printerPrompt, setPrinterPrompt] = useState<PrinterPrompt | null>(null)

  const { user } = useAdminGetSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !printerPrompt) {
      navigate("/")
    }
  }, [user, navigate, printerPrompt])

  const showLogin = () => {
    setResetPassword(false)
    navigate("/login", { replace: true })
  }

  const showResetPassword = () => {
    setResetPassword(true)
  }

  const handlePrinterPrompt = (prompt: PrinterPrompt) => {
    if (prompt.required) {
      setPrinterPrompt(prompt)
    }
  }

  const handlePrinterSelected = () => {
    setPrinterPrompt(null)
    navigate("/")
  }

  return (
    <PublicLayout>
      <SEO title="Login" />
      {resetPassword ? (
        <ResetTokenCard goBack={showLogin} />
      ) : (
        <LoginCard
          toResetPassword={showResetPassword}
          onPrinterPrompt={handlePrinterPrompt}
        />
      )}
      {printerPrompt?.required && (
        <PrinterSelectionModal
          printers={printerPrompt.printers}
          currentPrintnodeId={printerPrompt.current_printnode_id}
          onSelect={handlePrinterSelected}
        />
      )}
    </PublicLayout>
  )
}

export default LoginPage
