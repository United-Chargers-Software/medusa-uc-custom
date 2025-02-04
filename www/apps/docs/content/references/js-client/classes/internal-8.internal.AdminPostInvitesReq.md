---
displayed_sidebar: jsClientSidebar
---

# Class: AdminPostInvitesReq

[internal](../modules/internal-8.md).[internal](../modules/internal-8.internal.md).AdminPostInvitesReq

**`Schema`**

AdminPostInvitesReq
type: object
required:
  - user
  - role
properties:
  user:
    description: "The email associated with the invite. Once the invite is accepted, the email will be associated with the created user."
    type: string
    format: email
  role:
    description: "The role of the user to be created. This does not actually change the privileges of the user that is eventually created."
    type: string
    enum: [admin, member, developer]

## Properties

### role

• **role**: [`UserRoles`](../enums/internal-1.UserRoles.md)

#### Defined in

packages/medusa/dist/api/routes/admin/invites/create-invite.d.ts:85

___

### user

• **user**: `string`

#### Defined in

packages/medusa/dist/api/routes/admin/invites/create-invite.d.ts:84
