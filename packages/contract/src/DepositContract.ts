import { TezosMessageUtils } from 'conseiljs'
import {
  Address,
  BigNumber,
  Bytes,
  Integer,
  Range,
  Struct
} from '@cryptoeconomicslab/primitives'
import { IDepositContract, EventLog } from '@cryptoeconomicslab/contract'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import { Property } from '@cryptoeconomicslab/ovm'
import {
  MichelineBytes,
  MichelinePrim,
  removeBytesPrefix,
  TzCoder
} from '@cryptoeconomicslab/tezos-coder'
import { ContractManager, TzWallet } from '@cryptoeconomicslab/tezos-wallet'
import EventWatcher, { EventType } from './events'
import { Checkpoint } from '@cryptoeconomicslab/plasma'

/**
 * TODO: add implementation
 */
export class DepositContract implements IDepositContract {
  private eventWatcher: EventWatcher
  private connection: ContractManager
  private tokenAddress: string

  constructor(
    readonly address: Address,
    eventDb: KeyValueStore,
    wallet: TzWallet
  ) {
    this.connection = new ContractManager(wallet, address)
    this.eventWatcher = new EventWatcher({
      tezosNodeEndpoint: wallet.tezosNodeEndpoint,
      conseilServerInfo: wallet.conseilServerInfo,
      kvs: eventDb,
      contractAddress: address.data
    })
    this.tokenAddress = TezosMessageUtils.readAddress(
      address.data.substr(2)
      //      address.data.startsWith('0x') ? address.data.substr(2) : address.data
    )
  }

  async deposit(amount: Integer, initialState: Property) {
    const owner = TzCoder.decode(Address.default(), initialState.inputs[0])
    const param = {
      prim: 'Left',
      args: [
        {
          prim: 'Left',
          args: [
            {
              prim: 'Right',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      prim: 'Pair',
                      args: [
                        { int: amount.data.toString() },
                        {
                          prim: 'Pair',
                          args: [
                            [
                              {
                                prim: 'Elt',
                                args: [
                                  { int: '0' },
                                  {
                                    bytes: TzCoder.encode(owner)
                                      .toHexString()
                                      .substr(2)
                                  }
                                ]
                              }
                            ],
                            {
                              string: TezosMessageUtils.readAddress(
                                initialState.deciderAddress.data.substr(2)
                              )
                            }
                          ]
                        }
                      ]
                    },
                    {
                      string: this.tokenAddress
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
    console.log('invokeContract:', JSON.stringify(param))
    const result = await this.connection.invokeContract(
      0, //amount.data,
      'main',
      JSON.stringify(param)
    )
    console.log('invokeContract result:', result)
  }

  async finalizeCheckpoint(checkpoint: Property) {
    const param = {
      prim: 'Left',
      args: [
        {
          prim: 'Right',
          args: [
            {
              prim: 'Left',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      prim: 'Pair',
                      args: [
                        [
                          {
                            prim: 'Elt',
                            args: [
                              { int: '0' },
                              {
                                bytes: `'${removeBytesPrefix(
                                  checkpoint.inputs[0]
                                )}'`
                              }
                            ]
                          },
                          {
                            prim: 'Elt',
                            args: [
                              { int: '1' },
                              {
                                bytes: `'${removeBytesPrefix(
                                  checkpoint.inputs[1]
                                )}'`
                              }
                            ]
                          }
                        ],
                        { string: `'${checkpoint.deciderAddress}'` }
                      ]
                    },
                    { string: this.tokenAddress }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
    await this.connection.invokeContract(0, 'main', JSON.stringify(param))
  }

  async finalizeExit(exit: Property, depositedRangeId: Integer) {
    const param = {
      prim: 'Left',
      args: [
        {
          prim: 'Right',
          args: [
            {
              prim: 'Right',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      prim: 'Pair',
                      args: [
                        { int: `'${depositedRangeId.data}'` },
                        {
                          prim: 'Pair',
                          args: [
                            [
                              {
                                prim: 'Elt',
                                args: [
                                  { int: '0' },
                                  {
                                    bytes: `'${removeBytesPrefix(
                                      exit.inputs[0]
                                    )}'`
                                  }
                                ]
                              },
                              {
                                prim: 'Elt',
                                args: [
                                  { int: '1' },
                                  {
                                    bytes: `'${removeBytesPrefix(
                                      exit.inputs[1]
                                    )}'`
                                  }
                                ]
                              }
                            ],
                            { string: `'${exit.deciderAddress}'` }
                          ]
                        }
                      ]
                    },
                    { string: this.tokenAddress }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
    await this.connection.invokeContract(0, 'main', JSON.stringify(param))
  }

  subscribeCheckpointFinalized(
    handler: (checkpointId: Bytes, checkpoint: [Range, Property]) => void
  ) {
    this.eventWatcher.subscribe('CheckpointFinalized', (log: EventLog) => {
      /**
       * TODO: delete
       * NOTE: this is the image data
      const d = [
        // token type
        { bytes: '000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d' },
        // checkpoint id
        {
          bytes:
            '28f3a910172a1fd70d8d172600485c764c82761702e650e45448ca53c2135092'
        },
        // checkpoint
        {
          prim: 'Pair',
          args: [
            {
              prim: 'Pair',
              args: [
                [
                  {
                    prim: 'Elt',
                    args: [
                      { int: '0' },
                      {
                        // token type address
                        bytes:
                          '050a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d'
                      }
                    ]
                  },
                  {
                    prim: 'Elt',
                    // range
                    args: [{ int: '1' }, { bytes: '05070700020003' }]
                  },
                  // current block
                  { prim: 'Elt', args: [{ int: '2' }, { bytes: '050000' }] },
                  {
                    // property
                    prim: 'Elt',
                    args: [
                      { int: '3' },
                      {
                        bytes:
                          '0507070a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d0200000025070400000a0000001c050a00000016000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d'
                      }
                    ]
                  }
                ],
                // predicateAddress
                { bytes: '000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d' }
              ]
            },
            // subrange
            { prim: 'Pair', args: [{ int: '3' }, { int: '2' }] }
          ]
        }
      ]
      */
      let values = []
      try {
        values = log.values.map(v => Bytes.fromHexString(v))
        const checkpointId = TzCoder.decode(Bytes.default(), values[1])
        const checkpoint = Checkpoint.fromStruct(
          TzCoder.decode(Checkpoint.getParamType(), values[2])
        )
        const stateUpdate = checkpoint.stateUpdate
        const subrange = checkpoint.subrange
        handler(checkpointId, [subrange, stateUpdate])
      } catch (e) {
        console.error('invalid log data', values)
      }
    })
    this.eventWatcher.cancel()
    this.eventWatcher.start(() => {
      console.log('event polled')
    })
  }

  subscribeExitFinalized(handler: (exitId: Bytes) => void) {
    this.eventWatcher.subscribe(EventType.EXIT_FINALIZED, (log: EventLog) => {
      const [exitId] = log.values[1].bytes
      // remove 05
      handler(Bytes.fromHexString(exitId.slice(2)))
    })
    this.eventWatcher.cancel()
    this.eventWatcher.start(() => {
      console.log('event polled')
    })
  }
}
