import { DepositContract } from '../src/DepositContract'
import {
  Address,
  BigNumber,
  Bytes,
  Range
} from '@cryptoeconomicslab/primitives'
import { Property } from '@cryptoeconomicslab/ovm'
import { Checkpoint } from '@cryptoeconomicslab/plasma'

describe('DepositContract', () => {
  beforeEach(async () => {})

  describe('decodeCheckpoint', () => {
    const testCheckpoint = Bytes.fromHexString(
      '0x05070707070200000092070400000a0000001c050a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d070400010a0000000705070700030002070400020a00000003050000070400030a000000480507070a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d0200000025070400000a0000001c050a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d0a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d070700030002'
    )
    it('succeed to decode', async () => {
      const checkpoint = DepositContract.decodeCheckpoint(testCheckpoint)
      const subrange = new Range(BigNumber.from(2), BigNumber.from(3))
      /*
      const stateUpdate = new Property(
        Address.from('0x000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d'),
        []
      )
      */
      console.log(checkpoint.stateUpdate.inputs)
      console.log(checkpoint.stateUpdate.inputs[1].toHexString())
      console.log(checkpoint.stateUpdate.inputs[2].toHexString())
      console.log(checkpoint.stateUpdate.inputs[3].toHexString())
      //expect(checkpoint).toStrictEqual(new Checkpoint(subrange, stateUpdate))
    })
  })
})
