import { useAdminLogin } from "medusa-react"
import { useForm } from "react-hook-form"
import { useWidgets } from "../../../providers/widget-provider"
import { useTranslation } from "react-i18next"
import InputError from "../../atoms/input-error"
import WidgetContainer from "../../extensions/widget-container"
import Button from "../../fundamentals/button"
import SigninInput from "../../molecules/input-signin"
import { useAccess } from "../../../providers/access-provider"
import { useMedusa } from "medusa-react"
import { PrinterType } from "../../../domain/settings/printers/use-printer"

type FormValues = {
  email: string
  password: string
}

type PrinterPrompt = {
  required: boolean
  printers: PrinterType[]
  current_printnode_id: number | null
}

type LoginCardProps = {
  toResetPassword: () => void
  onPrinterPrompt?: (prompt: PrinterPrompt) => void
  onLoginStart?: () => void
  onLoginEnd?: () => void
}

const LoginCard = ({ toResetPassword, onPrinterPrompt, onLoginStart, onLoginEnd }: LoginCardProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>()
  const { mutate, isLoading } = useAdminLogin()
  const { t } = useTranslation()
  const { getWidgets } = useWidgets()
  const { getAccess } = useAccess()
  const { client } = useMedusa()

  const onSubmit = (values: FormValues) => {
    mutate(values, {
      onSuccess: async () => {
        onLoginStart?.()
        await getAccess()

        if (onPrinterPrompt) {
          try {
            const res = await client.admin.custom.get("admin/printer/me/prompt")
            const prompt = res as PrinterPrompt
            if (prompt?.required && prompt.printers.length > 0) {
              onPrinterPrompt(prompt)
              return
            }
          } catch (e) {
            // non-critical — fall through to normal redirect
          }
        }

        onLoginEnd?.()
      },
      onError: () => {
        setError(
          "password",
          {
            type: "manual",
            message: t(
              "login-card-no-match",
              "These credentials do not match our records."
            ) as string,
          },
          {
            shouldFocus: true,
          }
        )
      },
    })
  }
  return (
    <div className="gap-y-large flex flex-col">
      {getWidgets("login.before").map((w, i) => {
        return (
          <WidgetContainer
            key={i}
            widget={w}
            injectionZone="login.before"
            entity={undefined}
          />
        )
      })}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col items-center">
          <h1 className="inter-xlarge-semibold text-grey-90 mb-large text-[20px]">
            {t("login-card-log-in-to-medusa", "Log in")}
          </h1>
          <div>
            <SigninInput
              placeholder={t("login-card-email", "Email") as string}
              {...register("email", { required: true })}
              autoComplete="email"
              className="mb-small"
            />
            <SigninInput
              placeholder={t("login-card-password", "Password") as string}
              type={"password"}
              {...register("password", { required: true })}
              autoComplete="current-password"
              className="mb-xsmall"
            />
            <InputError errors={errors} name="password" />
          </div>
          <Button
            className="rounded-rounded inter-base-regular mt-4 w-[280px]"
            variant="secondary"
            size="medium"
            type="submit"
            loading={isLoading}
          >
            Continue
          </Button>
          <span
            className="inter-small-regular text-grey-50 mt-8 cursor-pointer"
            onClick={toResetPassword}
          >
            {t("login-card-forgot-your-password", "Forgot your password?")}
          </span>
        </div>
      </form>
      {getWidgets("login.after").map((w, i) => {
        return (
          <WidgetContainer
            key={i}
            widget={w}
            injectionZone="login.after"
            entity={undefined}
          />
        )
      })}
    </div>
  )
}

export default LoginCard
