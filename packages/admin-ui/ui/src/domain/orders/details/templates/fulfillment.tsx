import {
  useAdminCancelClaimFulfillment,
  useAdminCancelFulfillment,
  useAdminCancelSwapFulfillment,
  useMedusa,
} from "medusa-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "../../../../components/fundamentals/button"
import IconBadge from "../../../../components/fundamentals/icon-badge"
import BuildingsIcon from "../../../../components/fundamentals/icons/buildings-icon"
import CancelIcon from "../../../../components/fundamentals/icons/cancel-icon"
import PackageIcon from "../../../../components/fundamentals/icons/package-icon"
import Actionables from "../../../../components/molecules/actionables"
import useImperativeDialog from "../../../../hooks/use-imperative-dialog"
import useNotification from "../../../../hooks/use-notification"
import useStockLocations from "../../../../hooks/use-stock-locations"
import { getErrorMessage } from "../../../../utils/error-messages"
import { TrackingLink } from "./tracking-link"
import { capitalize } from "lodash"

export const FormattedFulfillment = ({
  setFullfilmentToShip,
  order,
  fulfillmentObj,
}) => {
  const dialog = useImperativeDialog()
  const notification = useNotification()
  const { t } = useTranslation()
  const { client } = useMedusa()
  const [isReprintLoading, setIsReprintLoading] = useState(false)

  const cancelFulfillment = useAdminCancelFulfillment(order.id)
  const cancelSwapFulfillment = useAdminCancelSwapFulfillment(order.id)
  const cancelClaimFulfillment = useAdminCancelClaimFulfillment(order.id)
  const { getLocationNameById } = useStockLocations()

  const { fulfillment } = fulfillmentObj
  const hasLinks = !!fulfillment.tracking_links?.length
  const fulfillmentData = (fulfillment.data as Record<string, unknown> | undefined) ?? {}
  const nestedData = (fulfillmentData.data as Record<string, unknown> | undefined) ?? {}
  const metadataData = (fulfillmentData.metadata as Record<string, unknown> | undefined) ?? {}

  const pickString = (...values: unknown[]): string | undefined => {
    for (const value of values) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim()
      }
    }
    return undefined
  }

  const pickPdfDataUri = (...values: unknown[]): string | undefined => {
    const raw = pickString(...values)
    if (!raw) {
      return undefined
    }

    if (raw.startsWith("data:application/pdf;base64,")) {
      return raw
    }

    // Some providers store only the base64 payload (without data URI prefix).
    if (raw.startsWith("JVBER")) {
      return `data:application/pdf;base64,${raw}`
    }

    return undefined
  }

  const fallbackTrackingMetadata = {
    shipmentCost: pickString(
      fulfillmentData.shipmentCost,
      nestedData.shipmentCost,
      metadataData.shipmentCost
    ) || (order?.shipping_total != null
      ? `${(order.shipping_total / 100).toFixed(2)} (CAD)`
      : ""),
    labelUrl: pickString(
      fulfillmentData.labelUrl,
      fulfillmentData.label_url,
      nestedData.labelUrl,
      nestedData.label_url,
      metadataData.labelUrl
    ) || "",
    labelBase64PDF: pickPdfDataUri(
      fulfillmentData.labelBase64PDF,
      fulfillmentData.label_base64_pdf,
      fulfillmentData.labelPdfBase64,
      nestedData.labelBase64PDF,
      nestedData.label_base64_pdf,
      nestedData.labelPdfBase64,
      metadataData.labelBase64PDF
    ) || "",
    CustomsInvoice: pickPdfDataUri(
      fulfillmentData.CustomsInvoice,
      fulfillmentData.customsInvoice,
      nestedData.CustomsInvoice,
      nestedData.customsInvoice,
      metadataData.CustomsInvoice
    ) || "",
    USMCA: pickPdfDataUri(
      fulfillmentData.USMCA,
      fulfillmentData.usmca,
      nestedData.USMCA,
      nestedData.usmca,
      metadataData.USMCA
    ) || "",
  }
  const rawTrackingNumbers = fulfillmentData.tracking_numbers
  const fallbackTrackingNumbers = Array.isArray(rawTrackingNumbers)
    ? rawTrackingNumbers.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0
      )
    : typeof rawTrackingNumbers === "string" && rawTrackingNumbers.trim().length > 0
      ? [rawTrackingNumbers.trim()]
      : []
  const hasFallbackTrackingNumbers = fallbackTrackingNumbers.length > 0

  const getData = () => {
    switch (true) {
      case !!fulfillment?.claim_order_id:
        return {
          resourceId: fulfillment.claim_order_id,
          resourceType: "claim",
        }
      case !!fulfillment?.swap_id:
        return {
          resourceId: fulfillment.swap_id,
          resourceType: "swap",
        }
      default:
        return { resourceId: order?.id, resourceType: "order" }
    }
  }

  const handleReprintLabel = () => {
    setIsReprintLoading(true)
    client.admin.custom
      .post(`/admin/orders/${order?.id}/fill-tracking-link`, {})
      .then(() => {
        notification(t("templates-success", "Success"), "Label sent to printer", "success")
      })
      .catch(() => {
        notification(t("templates-error", "Error"), "Failed to reprint label", "error")
      })
      .finally(() => {
        setIsReprintLoading(false)
      })
  }

  const handleCancelFulfillment = async () => {
    const { resourceId, resourceType } = getData()

    const shouldCancel = await dialog({
      heading: t("templates-cancel-fulfillment-heading", "Cancel fulfillment?"),
      text: t(
        "templates-are-you-sure-you-want-to-cancel-the-fulfillment",
        "Are you sure you want to cancel the fulfillment?"
      ),
    })

    if (!shouldCancel) {
      return
    }

    switch (resourceType) {
      case "swap":
        return cancelSwapFulfillment.mutate(
          { swap_id: resourceId, fulfillment_id: fulfillment.id },
          {
            onSuccess: () =>
              notification(
                t("templates-success", "Success"),
                t(
                  "templates-successfully-canceled-swap",
                  "Successfully canceled swap"
                ),
                "success"
              ),
            onError: (err) =>
              notification(
                t("templates-error", "Error"),
                getErrorMessage(err),
                "error"
              ),
          }
        )
      case "claim":
        return cancelClaimFulfillment.mutate(
          { claim_id: resourceId, fulfillment_id: fulfillment.id },
          {
            onSuccess: () =>
              notification(
                t("templates-success", "Success"),
                t(
                  "templates-successfully-canceled-claim",
                  "Successfully canceled claim"
                ),
                "success"
              ),
            onError: (err) =>
              notification(
                t("templates-error", "Error"),
                getErrorMessage(err),
                "error"
              ),
          }
        )
      default:
        return cancelFulfillment.mutate(fulfillment.id, {
          onSuccess: () =>
            notification(
              t("templates-success", "Success"),
              t(
                "templates-successfully-canceled-fulfillment",
                "Successfully canceled fulfillment"
              ),
              "success"
            ),
          onError: (err) =>
            notification(
              t("templates-error", "Error"),
              getErrorMessage(err),
              "error"
            ),
        })
    }
  }

  return (
    <div className="flex w-full justify-between">
      <div className="flex flex-col space-y-1 py-4">
        <div className="text-grey-90">
          {fulfillment.canceled_at
            ? t(
                "templates-fulfillment-has-been-canceled",
                "Fulfillment has been canceled"
              )
            : t(
                "templates-fulfilled-by-provider",
                "{{title}} Fulfilled by {{provider}}",
                {
                  title: fulfillmentObj.title,
                  provider: capitalize(fulfillment.provider_id),
                }
              )}
        </div>
        <div className="text-grey-50 flex flex-col">
          {!fulfillment.shipped_at && !hasFallbackTrackingNumbers
            ? t("templates-not-shipped", "Not shipped")
            : t("templates-tracking", "Tracking:")}
          <div className="flex flex-col">
            {hasLinks &&
              fulfillment.tracking_links.map((tl, j) => (
                <TrackingLink key={j} trackingLink={tl} />
              ))}
            {!hasLinks &&
              fallbackTrackingNumbers.map((trackingNumber, index) => {
                const trackingUrl = `https://ship3.2ship.com/Tracking/TrackClientTrackings?TrackingNumber=${trackingNumber}&Lang=0`

                return (
                  <TrackingLink
                    key={`${trackingNumber}-${index}`}
                    trackingLink={{
                      url: trackingUrl,
                      tracking_number: trackingNumber,
                      fulfillment_id: fulfillment.id,
                      idempotency_key: fulfillment.idempotency_key || "",
                      metadata: fallbackTrackingMetadata,
                    }}
                  />
                )
              })}
          </div>
        </div>
        {!fulfillment.canceled_at && fulfillment.location_id && (
          <div className="flex flex-col">
            <div className="text-grey-50 font-semibold">
              {fulfillment.shipped_at
                ? t("templates-shipped-from", "Shipped from")
                : t("templates-shipping-from", "Shipping from")}{" "}
            </div>
            <div className="flex items-center pt-2">
              <IconBadge className="mr-2">
                <BuildingsIcon />
              </IconBadge>
              {getLocationNameById(fulfillment.location_id)}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          size="small"
          loading={isReprintLoading}
          onClick={handleReprintLabel}
        >
          Reprint Label
        </Button>
        {!fulfillment.canceled_at &&
          !fulfillment.shipped_at &&
          !hasFallbackTrackingNumbers && (
          <Actionables
            actions={[
              {
                label: t("templates-mark-shipped", "Mark Shipped"),
                icon: <PackageIcon size={"20"} />,
                onClick: () => setFullfilmentToShip(fulfillment),
              },
              {
                label: t("templates-cancel-fulfillment", "Cancel Fulfillment"),
                icon: <CancelIcon size={"20"} />,
                onClick: () => handleCancelFulfillment(),
              },
            ]}
          />
        )}
      </div>
    </div>
  )
}
