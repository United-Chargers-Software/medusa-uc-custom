type TProps = {
  trackingLink: {
    url: string
    tracking_number: string
    fulfillment_id: string
    idempotency_key: string
    metadata: Record<string, unknown>
  }
}

export const TrackingLink = ({ trackingLink }: TProps) => {
  if (trackingLink?.url) {
    console.log("trackingLink", trackingLink);
    return (
      <div className="flex-column flex">
        <a
          style={{ textDecoration: "none" }}
          target="_blank"
          href={trackingLink.url}
          rel="noreferrer"
        >
          <div className="text-blue-60">{trackingLink.tracking_number}</div>
        </a>
        {trackingLink?.metadata?.shipmentCost && (<>&nbsp;-&nbsp;
          <span>{trackingLink?.metadata?.shipmentCost}</span></>)}
        &nbsp;-&nbsp;
        {trackingLink?.metadata?.labelBase64PDF &&
        trackingLink?.metadata?.labelBase64PDF.length > 100 &&
        trackingLink?.metadata?.labelBase64PDF.includes(
          "data:application/pdf;base64,JVB"
        ) ? (
          <>
            <a
              style={{ textDecoration: "none" }}
              target="_blank"
              download={`${trackingLink.tracking_number}.pdf`}
              href={trackingLink.metadata.labelBase64PDF}
              rel="noreferrer"
            >
              Download label
            </a>
            {";"}&nbsp;
          </>
        ) : (
          trackingLink?.metadata?.labelUrl && (
            <>
              <a
                style={{ textDecoration: "none" }}
                target="_blank"
                download={`${trackingLink.tracking_number}.pdf`}
                href={trackingLink.metadata.labelUrl}
                rel="noreferrer"
              >
                Download label
              </a>
              {";"}&nbsp;
            </>
          )
        )}
        {trackingLink?.metadata?.CustomsInvoice &&
          trackingLink?.metadata?.CustomsInvoice.length > 100 &&
          trackingLink?.metadata?.CustomsInvoice.includes(
            "data:application/pdf;base64,JVB"
          ) && (
            <>
              <a
                style={{ textDecoration: "none" }}
                target="_blank"
                download={`${trackingLink.tracking_number}-CustomsInvoice.pdf`}
                href={trackingLink.metadata.CustomsInvoice}
                rel="noreferrer"
              >
                Customs Invoice
              </a>
              {";"}&nbsp;
            </>
          )}
        {trackingLink?.metadata?.USMCA &&
          trackingLink?.metadata?.USMCA.length > 100 &&
          trackingLink?.metadata?.USMCA.includes(
            "data:application/pdf;base64,JVB"
          ) && (
            <a
              style={{ textDecoration: "none" }}
              target="_blank"
              download={`${trackingLink.tracking_number}-USMCA.pdf`}
              href={trackingLink.metadata.USMCA}
              rel="noreferrer"
            >
              USMCA
            </a>
          )}
      </div>
    );
  } else {
    return (
      <span className="text-blue-60 ml-2">{trackingLink.tracking_number} </span>
    );
  }
};
