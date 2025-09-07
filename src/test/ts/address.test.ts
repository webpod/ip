import {describe, test} from 'node:test'
import assert from 'node:assert'
import os from 'node:os'
import net from 'node:net'
import { isPrivate } from '../../main/ts/core.ts'
import { address, addresses } from '../../main/ts/address.ts'

describe('address()', () => {
  test('private', () => {
    const cases = [undefined, 'ipv4', 'ipv6']

    for (const family of cases) {
      const addr = address('private', family)!
      assert.ok(isPrivate(addr), `address('private', ${family}) === ${addr}`)
    }
  })

  describe('net ifaces', () => {
    const interfaces = os.networkInterfaces()
    const cases: [string | undefined, (addr: string) => boolean][] = [
      [undefined, net.isIPv4],
      ['ipv4', net.isIPv4],
      ['ipv6', net.isIPv6],
    ]

    Object.keys(interfaces).forEach((nic) => {
      for (const [family, check] of cases) {
        test(`${nic} ${family}`, () => {
          const addr = address(nic, family)
          assert.ok(!addr || check(addr), `address(${nic}, ${family}) === ${addr}`)
        })
      }
    })
  })

  test('`addresses()` method returns all ipv4 by default', () => {
    const all = addresses()
    const v4 = addresses(undefined, 'ipv4')

    assert.deepEqual(all, v4)
  })
})