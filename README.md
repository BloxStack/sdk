# `@bloxstack/sdk`

```ts
import { createBloxStack } from "@bloxstack/sdk"

import { profileServiceAdapter } from "@bloxstack/profile-service"
import { flameworkNetworkingAdapter, flameworkAdapter } from "@bloxstack/flamework"
import { centurionAdapter } from "@bloxstack/flamework"

/** In shared */
const SharedBloxstack = createBloxStack({
  datastore: profileServiceAdapter({}),
  networking: flameworkNetworkingAdapter({}),

  /* this could include misc or custom items, which do not have special bloxstack functionality */
  other: [
    centurionAdapter({}) // centurion often needs to be init on both client & server. so this is a perfect example
  ]
})

/* In client & server */
import { Server, Client } from "@bloxstack/sdk"

export const ServerBloxstack = startBloxStack<Server>(SharedBloxstack, {
  /* options */
});
export const ClientBloxstack = startBloxStack<Client>(SharedBloxstack, {
  /* options */
});
```
