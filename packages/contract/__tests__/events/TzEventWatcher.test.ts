jest.unmock('../../src/')

import { Bytes } from '@cryptoeconomicslab/primitives'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import { InMemoryKeyValueStore } from '@cryptoeconomicslab/level-kvs'
import { MockBlockInfoProvider } from './MockBlockInfoProvider'
import EventWatcher, { EventType } from '../../src/events/TzEventWatcher'

jest.mock('conseiljs', () => {
  const TezosConseilClient = {
    getBlockHead: jest.fn().mockImplementation(() => {
      return 196530
    })
  }
  return {
    ...jest.requireActual('conseiljs'),
    TezosConseilClient
  }
})

describe('TzEventWatcher', () => {
  let kvs: KeyValueStore
  beforeEach(async () => {
    kvs = new InMemoryKeyValueStore(Bytes.default())
  })
  const conseilServerInfo = {
    url: 'https://tezos-dev.cryptonomic-infra.tech',
    apiKey: 'hooman',
    network: 'babylonnet'
  }

  describe('poll', () => {
    it('succeed to poll events', async () => {
      const eventWatcher = new EventWatcher({
        conseilServerInfo: conseilServerInfo,
        kvs,
        contractAddress: 'KT1HSBDy3MgRPh2G4oqBQMUsyxy5EYPGKzpv',
        options: { interval: 1000 },
        blockInfoProvider: new MockBlockInfoProvider(conseilServerInfo, false)
      })
      const handler = jest.fn()
      eventWatcher.subscribe('BlockSubmitted', handler)
      await eventWatcher.poll(196527, 196530, () => {})
      expect(handler).toHaveBeenCalledWith({
        name: 'BlockSubmitted',
        values: ['001', '0a00000006010203040506']
      })
      expect(handler).toHaveBeenCalledTimes(1)
      await eventWatcher.poll(196527, 196530, () => {})
      // confirm not to emit same event
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('fail to poll events', async () => {
      const eventWatcher = new EventWatcher({
        conseilServerInfo: conseilServerInfo,
        kvs,
        contractAddress: 'KT1HSBDy3MgRPh2G4oqBQMUsyxy5EYPGKzpv',
        options: { interval: 1000 },
        blockInfoProvider: new MockBlockInfoProvider(conseilServerInfo, true)
      })
      const handler = jest.fn()
      eventWatcher.subscribe('BlockSubmitted', handler)
      await eventWatcher.poll(196527, 196530, () => {})
      expect(handler).toHaveBeenCalledTimes(0)
    })
  })

  describe('getEventStorage', () => {
    it('succeed to getEventStorage', async () => {
      const eventWatcher = new EventWatcher({
        conseilServerInfo: conseilServerInfo,
        kvs,
        contractAddress: 'KT1HSBDy3MgRPh2G4oqBQMUsyxy5EYPGKzpv',
        options: { interval: 1000 },
        blockInfoProvider: new MockBlockInfoProvider(conseilServerInfo, false)
      })
      const storage = await eventWatcher.getEventStorage(
        EventType.BLOCK_SUBMITED
      )
      expect(storage[0]).toStrictEqual({
        prim: 'Pair',
        args: [
          { int: '0' },
          [{ bytes: '001' }, { bytes: '0a00000006010203040506' }]
        ]
      })
    })
  })
})
