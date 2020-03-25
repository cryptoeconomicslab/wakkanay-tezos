/* eslint-disable @typescript-eslint/no-var-requires */
const conseiljs = require('conseiljs')
import { TzWalletFactory } from '../src'
import { Bytes } from '@cryptoeconomicslab/primitives'

const mockGetAccount = jest.fn().mockImplementation(async () => {
  return [{ balance: 100 }]
})

conseiljs.TezosConseilClient = {
  getAccount: mockGetAccount
}

describe('TzWallet', () => {
  let factory, wallet
  beforeEach(async () => {
    factory = new TzWalletFactory('')
    wallet = await factory.fromPrivateKey(
      'edskRpVqFG2FHo11aB9pzbnHBiPBWhNWdwtNyQSfEEhDf5jhFbAtNS41vg9as7LSYZv6rEbtJTwyyEg9cNDdcAkSr9Z7hfvquB'
    )
  })
  describe('signMessage', () => {
    it('succeed to sign hex string', async () => {
      const message = Bytes.fromHexString('0x00123456')
      const signature = await wallet.signMessage(message)
      expect(signature).toBeTruthy()
    })
  })
  describe('verifySignature', () => {
    it('succeed to verify signature', async () => {
      const message = Bytes.fromHexString('0x00123456')
      const signature = await wallet.signMessage(message)
      const verify = await wallet.verifyMySignature(message, signature)
      expect(verify).toBeTruthy()
    })
    it('fail to verify signature', async () => {
      const bobWallet = await factory.fromPrivateKey(
        'edskS5pf29PwnxHN7P7UhyR5t8mKsh3CiH86mAKZZ9E3Y46d1AULDk4N9CxugkeD5UAGvL7UyXVFRptSy439YT1jvMoGA8GMoR'
      )
      const message = Bytes.fromHexString('0x00123456')
      const signature = await bobWallet.signMessage(message)
      const verify = await wallet.verifyMySignature(message, signature)
      expect(verify).toBeFalsy()
    })
  })
  describe('getL1Balance', () => {
    it('succeed to get L1 balance', async () => {
      const balance = await wallet.getL1Balance()
      expect(balance).toBeTruthy()
      expect(balance.decimals).toBe(6)
      expect(balance.symbol).toBe('tz')
      expect(mockGetAccount).toHaveBeenCalledTimes(1)
    })
  })
})
