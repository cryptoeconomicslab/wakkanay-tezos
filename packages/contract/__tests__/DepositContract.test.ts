import { DepositContract } from '../src/DepositContract'
import {
  Address,
  BigNumber,
  Bytes,
  Range
} from '@cryptoeconomicslab/primitives'
import { Property } from '@cryptoeconomicslab/ovm'
import { Checkpoint } from '@cryptoeconomicslab/plasma'
import { TzCoder } from '@cryptoeconomicslab/tezos-coder'

describe('DepositContract', () => {
  beforeEach(async () => {})

  describe('decodeCheckpoint', () => {
    const testCheckpoint = Bytes.fromHexString(
      '05070707070200000092070400000a0000001c050a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d070400010a0000000705070700010000070400020a00000003050000070400030a000000480507070a0000001601df89eeeeebf54451fac43136cb115607773acf47000200000025070400000a0000001c050a0000001600007a9f5213b12cfe85e32bf906601efd945079fcd20a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d070700010000'
    )
    it('succeed to decode', async () => {
      const checkpoint = DepositContract.decodeCheckpoint(testCheckpoint)
      const subrange = new Range(BigNumber.from(0), BigNumber.from(1))
      const stateUpdate = new Property(
        Address.from('0x000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d'),
        [
          Bytes.fromHexString(
            '0x050a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d'
          ),
          Bytes.fromHexString('0x05070700010000'),
          Bytes.fromHexString('0x050000'),
          Bytes.fromHexString(
            '0x0507070a0000001601df89eeeeebf54451fac43136cb115607773acf47000200000025070400000a0000001c050a0000001600007a9f5213b12cfe85e32bf906601efd945079fcd2'
          )
        ]
      )
      expect(checkpoint).toStrictEqual(new Checkpoint(subrange, stateUpdate))
    })
  })
})
