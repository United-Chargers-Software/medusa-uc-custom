---
displayed_sidebar: jsClientSidebar
---

# Class: AdminPostDiscountsReq

[internal](../modules/internal-8.md).AdminPostDiscountsReq

**`Schema`**

AdminPostDiscountsReq
type: object
required:
  - code
  - rule
  - regions
properties:
  code:
    type: string
    description: A unique code that will be used to redeem the discount
  is_dynamic:
    type: boolean
    description: Whether the discount should have multiple instances of itself, each with a different code. This can be useful for automatically generated discount codes that all have to follow a common set of rules.
    default: false
  rule:
    description: The discount rule that defines how discounts are calculated
    type: object
    required:
       - type
       - value
       - allocation
    properties:
      description:
        type: string
        description: "A short description of the discount"
      type:
        type: string
        description: "The type of the discount, can be `fixed` for discounts that reduce the price by a fixed amount, `percentage` for percentage reductions or `free_shipping` for shipping vouchers."
        enum: [fixed, percentage, free_shipping]
      value:
        type: number
        description: "The value that the discount represents. This will depend on the type of the discount."
      allocation:
        type: string
        description: "The scope that the discount should apply to. `total` indicates that the discount should be applied on the cart total, and `item` indicates that the discount should be applied to each discountable item in the cart."
        enum: [total, item]
      conditions:
        type: array
        description: "A set of conditions that can be used to limit when the discount can be used. Only one of `products`, `product_types`, `product_collections`, `product_tags`, and `customer_groups` should be provided based on the discount condition's type."
        items:
          type: object
          required:
             - operator
          properties:
            operator:
              type: string
              description: "Operator of the condition. `in` indicates that discountable resources are within the specified resources. `not_in` indicates that
               discountable resources are everything but the specified resources."
              enum: [in, not_in]
            products:
              type: array
              description: list of product IDs if the condition's type is `products`.
              items:
                type: string
            product_types:
              type: array
              description: list of product type IDs if the condition's type is `product_types`.
              items:
                type: string
            product_collections:
              type: array
              description: list of product collection IDs if the condition's type is `product_collections`.
              items:
                type: string
            product_tags:
              type: array
              description: list of product tag IDs if the condition's type is `product_tags`.
              items:
                type: string
            customer_groups:
              type: array
              description: list of customer group IDs if the condition's type is `customer_groups`.
              items:
                type: string
  is_disabled:
    type: boolean
    description: Whether the discount code is disabled on creation. If set to `true`, it will not be available for customers.
    default: false
  starts_at:
    type: string
    format: date-time
    description: The date and time at which the discount should be available.
  ends_at:
    type: string
    format: date-time
    description: The date and time at which the discount should no longer be available.
  valid_duration:
    type: string
    description: The duration the discount runs between
    example: P3Y6M4DT12H30M5S
  regions:
    description: A list of region IDs representing the Regions in which the Discount can be used.
    type: array
    items:
      type: string
  usage_limit:
    type: number
    description: Maximum number of times the discount can be used
  metadata:
    description: An optional set of key-value pairs to hold additional information.
    type: object
    externalDocs:
      description: "Learn about the metadata attribute, and how to delete and update it."
      url: "https://docs.medusajs.com/development/entities/overview#metadata-attribute"

## Properties

### code

• **code**: `string`

#### Defined in

packages/medusa/dist/api/routes/admin/discounts/create-discount.d.ts:194

___

### ends\_at

• `Optional` **ends\_at**: `Date`

#### Defined in

packages/medusa/dist/api/routes/admin/discounts/create-discount.d.ts:199

___

### is\_disabled

• **is\_disabled**: `boolean`

#### Defined in

packages/medusa/dist/api/routes/admin/discounts/create-discount.d.ts:197

___

### is\_dynamic

• **is\_dynamic**: `boolean`

#### Defined in

packages/medusa/dist/api/routes/admin/discounts/create-discount.d.ts:196

___

### metadata

• `Optional` **metadata**: [`Record`](../modules/internal.md#record)<`string`, `unknown`\>

#### Defined in

packages/medusa/dist/api/routes/admin/discounts/create-discount.d.ts:203

___

### regions

• **regions**: `string`[]

#### Defined in

packages/medusa/dist/api/routes/admin/discounts/create-discount.d.ts:202

___

### rule

• **rule**: [`AdminPostDiscountsDiscountRule`](internal-8.AdminPostDiscountsDiscountRule.md)

#### Defined in

packages/medusa/dist/api/routes/admin/discounts/create-discount.d.ts:195

___

### starts\_at

• `Optional` **starts\_at**: `Date`

#### Defined in

packages/medusa/dist/api/routes/admin/discounts/create-discount.d.ts:198

___

### usage\_limit

• `Optional` **usage\_limit**: `number`

#### Defined in

packages/medusa/dist/api/routes/admin/discounts/create-discount.d.ts:201

___

### valid\_duration

• `Optional` **valid\_duration**: `string`

#### Defined in

packages/medusa/dist/api/routes/admin/discounts/create-discount.d.ts:200
