# `@bloxstack/sdk`

```ts
import { createBloxStack } from "@bloxstack/sdk"

import { profileServiceAdapter } from "@bloxstack/profile-service"
import { flameworkNetworkingAdapter, flameworkAdapter } from "@bloxstack/flamework"
import { centurionAdapter } from "@bloxstack/flamework"

/** In shared */
const SharedBloxstack = createBloxStack({
  adapters: [
    profileServiceAdapter({}), // will only be accessible via server, not any client functions.
    centurionAdapter({}) // centurion often needs to be init on both client & server. so this is a perfect example
  ]
})

/* In server */
export const ServerBloxstack = startBloxStackServer(SharedBloxstack, {});

```
