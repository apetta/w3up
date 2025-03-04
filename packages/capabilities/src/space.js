/**
 * Space Capabilities
 *
 * These can be imported directly with:
 * ```js
 * import * as Space from '@web3-storage/capabilities/space'
 * ```
 *
 * @module
 */

import * as Store from './store.js'
import { capability, URI, Schema, ok, fail } from '@ucanto/validator'
import { canDelegateURI, equalWith, and } from './utils.js'
import * as Upload from './upload.js'
export { top } from './top.js'

// Need this to workaround TS bug
// @see https://github.com/microsoft/TypeScript/issues/51548
export { Store }

export const SpaceDID = Schema.did({ method: 'key' })
export const space = capability({
  can: 'space/*',
  with: SpaceDID,
  derives: equalWith,
})

/**
 * `space/info` can be derived from any of the `store/*`
 * capability that has matching `with`. This allows store service
 * to identify account based on any user request.
 */
export const info = Store.add
  .or(Store.list)
  .or(Store.remove)
  .or(Upload.add)
  .or(Upload.list)
  .or(Upload.remove)
  .derive({
    to: capability({
      can: 'space/info',
      with: SpaceDID,
    }),
    derives: equalWith,
  })

export const recoverValidation = capability({
  can: 'space/recover-validation',
  with: SpaceDID,
  nb: Schema.struct({
    identity: URI.match({ protocol: 'mailto:' }),
  }),
})

export const recover = capability({
  can: 'space/recover',
  with: Schema.did(),
  nb: Schema.struct({
    identity: URI.match({ protocol: 'mailto:' }),
  }),
  derives: (child, parent) => {
    return (
      and(equalWith(child, parent)) ||
      and(canDelegateURI(child.nb.identity, parent.nb.identity)) ||
      ok({})
    )
  },
})

export const allocate = capability({
  can: 'space/allocate',
  with: SpaceDID,
  nb: Schema.struct({
    size: Schema.integer(),
  }),
  derives: (child, parent) => {
    const result = equalWith(child, parent)
    if (result.ok) {
      return child.nb.size <= parent.nb.size
        ? ok({})
        : fail(
            `Claimed size ${child.nb.size} escalates delegated size ${parent.nb.size}`
          )
    } else {
      return result
    }
  },
})
