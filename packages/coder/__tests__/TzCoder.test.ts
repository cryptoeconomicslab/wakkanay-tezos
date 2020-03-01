import TzCoder from '../src/TzCoder'
import {
  Address,
  Bytes,
  Integer,
  BigNumber,
  List,
  Tuple,
  Struct,
  Range
} from '@cryptoeconomicslab/primitives'
import { TezosMessageUtils } from 'conseiljs'
import { Property } from '@cryptoeconomicslab/ovm'
import {
  StateUpdateRecord,
  TransactionReceipt
} from '@cryptoeconomicslab/plasma'

describe('TzCoder', () => {
  const testAddress =
    '0x' +
    TezosMessageUtils.writeAddress('tz1TGu6TN5GSez2ndXXeDX6LgUDvLzPLqgYV')
  describe('encode', () => {
    test('encode Address', () => {
      const addr = Address.from(testAddress)
      expect(TzCoder.encode(addr).toHexString()).toBe(
        '0x050a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d'
      )
    })

    test('encode BigNumber', () => {
      const addr = BigNumber.from(1)
      expect(TzCoder.encode(addr).toHexString()).toBe('0x050001')
    })

    test('encode Struct', () => {
      const struct = Struct.from([
        {
          key: 'addr',
          value: Address.from(testAddress)
        },
        { key: 'greet', value: Bytes.fromString('hello') },
        { key: 'num', value: Integer.from(5) }
      ])
      expect(TzCoder.encode(struct).toHexString()).toBe(
        '0x05070707070a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d0a0000000568656c6c6f0005'
      )
    })

    test('encode Tuple', () => {
      const tuple = Tuple.from([
        Integer.from(5),
        Address.from(testAddress),
        Bytes.fromString('hello')
      ])
      expect(TzCoder.encode(tuple).toHexString()).toBe(
        '0x050707070700050a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d0a0000000568656c6c6f'
      )
    })

    test('encode List of an Integer', () => {
      const factory = {
        default: () => Integer.default()
      }
      const list = List.from(factory, [Integer.from(1)])
      expect(TzCoder.encode(list).toHexString()).toBe(
        '0x050200000006070400000001'
      )
    })
    test('encode List of Integer', () => {
      const factory = {
        default: () => Integer.default()
      }
      const list = List.from(factory, [
        Integer.from(1),
        Integer.from(2),
        Integer.from(3)
      ])
      expect(TzCoder.encode(list).toHexString()).toBe(
        '0x050200000012070400000001070400010002070400020003'
      )
    })

    test('encode List of Tuple', () => {
      const factory = {
        default: () => Tuple.from([Bytes.default(), Integer.default()])
      }
      const list = List.from(factory, [
        Tuple.from([Bytes.fromString('test1'), Integer.from(1)]),
        Tuple.from([Bytes.fromString('test2'), Integer.from(2)])
      ])
      expect(TzCoder.encode(list).toHexString()).toBe(
        '0x0502000000240704000007070a00000005746573743100010704000107070a0000000574657374320002'
      )
    })

    test('encode List of Struct', () => {
      const factory = {
        default: () =>
          Struct.from([
            { key: 'greet', value: Bytes.default() },
            { key: 'num', value: Integer.default() }
          ])
      }
      const list = List.from(factory, [
        Struct.from([
          { key: 'greet', value: Bytes.fromString('hello') },
          { key: 'num', value: Integer.from(1) }
        ]),
        Struct.from([
          { key: 'greet', value: Bytes.fromString('hello') },
          { key: 'num', value: Integer.from(2) }
        ])
      ])
      expect(TzCoder.encode(list).toHexString()).toBe(
        '0x0502000000240704000007070a0000000568656c6c6f00010704000107070a0000000568656c6c6f0002'
      )
    })

    test('encode List of List of Integer', () => {
      const childFactory = {
        default: () => Integer.default()
      }
      const factory = {
        default: () => List.from(childFactory, [])
      }
      const list = List.from(factory, [
        List.from(childFactory, [Integer.from(1), Integer.from(4)]),
        List.from(childFactory, [Integer.from(6), Integer.from(9)])
      ])
      expect(TzCoder.encode(list).toHexString()).toBe(
        '0x05020000002a07040000020000000c07040000000107040001000407040001020000000c070400000006070400010009'
      )
    })

    test('encode empty List', () => {
      const list = List.from(Bytes, [])
      expect(TzCoder.encode(list).toHexString()).toBe('0x050200000000')
    })
  })

  describe('decode', () => {
    test('decode Address', () => {
      const b = Bytes.fromHexString(
        '0x050a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d'
      )
      expect(TzCoder.decode(Address.default(), b)).toStrictEqual(
        Address.from(testAddress)
      )
    })

    test('decode BigNumber', () => {
      const b = Bytes.fromHexString('0x050001')
      expect(TzCoder.decode(BigNumber.default(), b)).toStrictEqual(
        BigNumber.from(1)
      )
    })

    test('decode Struct', () => {
      const b = Bytes.fromHexString(
        '0x05070707070a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d0a0000000568656c6c6f0005'
      )
      const t = Struct.from([
        { key: 'addr', value: Address.default() },
        { key: 'greet', value: Bytes.default() },
        { key: 'num', value: Integer.default() }
      ])
      expect(TzCoder.decode(t, b)).toStrictEqual(
        Struct.from([
          {
            key: 'addr',
            value: Address.from(testAddress)
          },
          {
            key: 'greet',
            value: Bytes.fromString('hello')
          },
          { key: 'num', value: Integer.from(5) }
        ])
      )
    })

    test('decode Tuple', () => {
      const b = Bytes.fromHexString(
        '0x050707070700050a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d0a0000000568656c6c6f'
      )
      const t = Tuple.from([
        Integer.default(),
        Address.default(),
        Bytes.default()
      ])
      expect(TzCoder.decode(t, b)).toStrictEqual(
        Tuple.from([
          Integer.from(5),
          Address.from(testAddress),
          Bytes.fromString('hello')
        ])
      )
    })

    test('decode List of an Integer', () => {
      const b = Bytes.fromHexString('0x050200000006070400000001')
      const t = List.default(Integer, Integer.default())
      expect(TzCoder.decode(t, b)).toStrictEqual(
        List.from(Integer, [Integer.from(1)])
      )
    })

    test('decode List of Integer', () => {
      const b = Bytes.fromHexString(
        '0x050200000012070400000001070400010002070400020003'
      )
      const t = List.default(Integer, Integer.default())
      expect(TzCoder.decode(t, b)).toStrictEqual(
        List.from(Integer, [Integer.from(1), Integer.from(2), Integer.from(3)])
      )
    })

    test('decode List of Tuple', () => {
      const factory = {
        default: () => Tuple.from([Bytes.default(), Integer.default()])
      }
      const b = Bytes.fromHexString(
        '0x0502000000240704000007070a00000005746573743100010704000107070a0000000574657374320002'
      )
      const t = List.default(
        factory,
        Tuple.from([Bytes.default(), Integer.default()])
      )
      expect(TzCoder.decode(t, b)).toStrictEqual(
        List.from(factory, [
          Tuple.from([Bytes.fromString('test1'), Integer.from(1)]),
          Tuple.from([Bytes.fromString('test2'), Integer.from(2)])
        ])
      )
    })
    test('decode List of Struct', () => {
      const factory = {
        default: () =>
          Struct.from([
            { key: 'greet', value: Bytes.default() },
            { key: 'num', value: Integer.default() }
          ])
      }
      const b = Bytes.fromHexString(
        '0x0502000000240704000007070a0000000568656c6c6f00010704000107070a0000000568656c6c6f0002'
      )
      const t = List.default(
        factory,
        Struct.from([
          { key: 'greet', value: Bytes.default() },
          { key: 'num', value: Integer.default() }
        ])
      )
      expect(TzCoder.decode(t, b)).toStrictEqual(
        List.from(factory, [
          Struct.from([
            { key: 'greet', value: Bytes.fromString('hello') },
            { key: 'num', value: Integer.from(1) }
          ]),
          Struct.from([
            { key: 'greet', value: Bytes.fromString('hello') },
            { key: 'num', value: Integer.from(2) }
          ])
        ])
      )
    })
    test('decode List of List of Integer', () => {
      const childFactory = {
        default: () => Integer.default()
      }
      const factory = {
        default: () => List.from(childFactory, [])
      }
      const b = Bytes.fromHexString(
        '0x05020000005107040000020000001207040000000107040001000307040002000407040001020000001207040000000207040001000407040002000607040002020000001207040000000a07040001000b07040002000c'
      )
      const t = List.default(
        factory,
        List.default(childFactory, Integer.default())
      )
      expect(TzCoder.decode(t, b)).toStrictEqual(
        List.from(factory, [
          List.from(childFactory, [
            Integer.from(1),
            Integer.from(3),
            Integer.from(4)
          ]),
          List.from(childFactory, [
            Integer.from(2),
            Integer.from(4),
            Integer.from(6)
          ]),
          List.from(childFactory, [
            Integer.from(10),
            Integer.from(11),
            Integer.from(12)
          ])
        ])
      )
    })

    test('succeed to decode StateObject', async () => {
      const property = Property.fromStruct(
        TzCoder.decode(
          Property.getParamType(),
          Bytes.fromHexString(
            '0x0507070a0000001601df89eeeeebf54451fac43136cb115607773acf47000200000025070400000a0000001c050a0000001600007a9f5213b12cfe85e32bf906601efd945079fcd2'
          )
        )
      )
      expect(property).toStrictEqual(
        new Property(
          Address.from('0x01df89eeeeebf54451fac43136cb115607773acf4700'),
          [
            Bytes.fromHexString(
              '0x050a0000001600007a9f5213b12cfe85e32bf906601efd945079fcd2'
            )
          ]
        )
      )
    })

    test('succeed to decode StateUpdate', async () => {
      const so = new Property(
        Address.from('0x01df89eeeeebf54451fac43136cb115607773acf4700'),
        [
          Bytes.fromHexString(
            '0x050a0000001600007a9f5213b12cfe85e32bf906601efd945079fcd2'
          )
        ]
      )
      const su = new StateUpdateRecord(
        Address.from(testAddress),
        Address.from(testAddress),
        BigNumber.from(10),
        so
      )
      expect(TzCoder.encode(su.toStruct()).toHexString()).toEqual(
        '0x050707070707070a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d0a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d000a07070a0000001601df89eeeeebf54451fac43136cb115607773acf47000200000025070400000a0000001c050a0000001600007a9f5213b12cfe85e32bf906601efd945079fcd2'
      )
      const record = StateUpdateRecord.fromStruct(
        TzCoder.decode(
          StateUpdateRecord.getParamType(),
          Bytes.fromHexString(
            '0x050707070707070a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d0a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d000a07070a0000001601df89eeeeebf54451fac43136cb115607773acf47000200000025070400000a0000001c050a0000001600007a9f5213b12cfe85e32bf906601efd945079fcd2'
          )
        )
      )
      expect(record).toStrictEqual(su)
    })

    test('succeed to decode TxReciept', async () => {
      const receipt = new TransactionReceipt(
        Integer.from(1),
        BigNumber.from(10),
        [BigNumber.from(2)],
        new Range(BigNumber.from(0), BigNumber.from(10)),
        Address.from('0x01df89eeeeebf54451fac43136cb115607773acf4700'),
        Address.from('0x01df89eeeeebf54451fac43136cb115607773acf4700'),
        Bytes.fromHexString(
          '0x050a0000001600007a9f5213b12cfe85e32bf906601efd945079fcd2'
        )
      )
      expect(TzCoder.encode(receipt.toStruct()).toHexString()).toEqual(
        '0x050707070707070707070707070001000a020000000607040000000207070000000a0a0000001601df89eeeeebf54451fac43136cb115607773acf47000a0000001601df89eeeeebf54451fac43136cb115607773acf47000a0000001c050a0000001600007a9f5213b12cfe85e32bf906601efd945079fcd2'
      )
      const record = TransactionReceipt.fromStruct(
        TzCoder.decode(
          TransactionReceipt.getParamType(),
          Bytes.fromHexString(
            '0x050707070707070707070707070001000a020000000607040000000207070000000a0a0000001601df89eeeeebf54451fac43136cb115607773acf47000a0000001601df89eeeeebf54451fac43136cb115607773acf47000a0000001c050a0000001600007a9f5213b12cfe85e32bf906601efd945079fcd2'
          )
        )
      )
      expect(record).toStrictEqual(receipt)
    })
  })
})
