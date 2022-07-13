import { Router } from "express"
import { DeleteResponse, PaginatedResponse } from "../../../../types/common"
import "reflect-metadata"
import { isFeatureFlagEnabled } from "../../../middlewares/feature-flag-enabled"
import { SalesChannel } from "../../../../models"
import middlewares, {
  transformBody,
  transformQuery,
} from "../../../middlewares"
import { AdminPostSalesChannelsSalesChannelReq } from "./update-sales-channel"
import { AdminPostSalesChannelsReq } from "./create-sales-channel"
import { AdminGetSalesChannelsParams } from "./list-sales-channels"
import { AdminDeleteSalesChannelsChannelProductsBatchReq } from "./delete-products-batch"

const route = Router()

export default (app) => {
  app.use("/sales-channels", isFeatureFlagEnabled("sales_channels"), route)

  route.get(
    "/",
    transformQuery(AdminGetSalesChannelsParams, {
      isList: true,
    }),
    middlewares.wrap(require("./list-sales-channels").default)
  )

  const salesChannelRouter = Router({ mergeParams: true })
  route.use("/:id", salesChannelRouter)

  salesChannelRouter.get(
    "/",
    middlewares.wrap(require("./get-sales-channel").default)
  )
  salesChannelRouter.delete(
    "/",
    middlewares.wrap(require("./delete-sales-channel").default)
  )
  salesChannelRouter.post(
    "/",
    transformBody(AdminPostSalesChannelsSalesChannelReq),
    middlewares.wrap(require("./update-sales-channel").default)
  )
  salesChannelRouter.delete(
    "/products/batch",
    transformBody(AdminDeleteSalesChannelsChannelProductsBatchReq),
    middlewares.wrap(require("./delete-products-batch").default)
  )

  route.post(
    "/",
    transformBody(AdminPostSalesChannelsReq),
    middlewares.wrap(require("./create-sales-channel").default)
  )

  route.post(
    "/:id",
    transformBody(AdminPostSalesChannelsSalesChannelReq),
    middlewares.wrap(require("./update-sales-channel").default)
  )

  return app
}

export type AdminSalesChannelsRes = {
  sales_channel: SalesChannel
}

export type AdminSalesChannelsDeleteRes = DeleteResponse

export type AdminSalesChannelListRes = PaginatedResponse & {
  sales_channels: SalesChannel[]
}

export type AdminSalesChannelsListRes = PaginatedResponse & {
  sales_channels: SalesChannel[]
}

export * from "./get-sales-channel"
export * from "./create-sales-channel"
export * from "./list-sales-channels"
export * from "./update-sales-channel"
export * from "./delete-sales-channel"
export * from "./delete-products-batch"