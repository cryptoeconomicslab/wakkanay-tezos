import { config } from 'dotenv'
config()

import { TezosLanguageUtil, TezosMessageUtils } from 'conseiljs'
import {
  Address,
  Bytes,
  Integer,
  Range,
  BigNumber
} from '@cryptoeconomicslab/primitives'
import { IDepositContract, EventLog } from '@cryptoeconomicslab/contract'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import { Property } from '@cryptoeconomicslab/ovm'
import { removeBytesPrefix, TzCoder } from '@cryptoeconomicslab/tezos-coder'
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
    this.tokenAddress = process.env.NATIVE_TOKEN_BASE58 as string
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
    const result = await this.connection.invokeContract(
      amount.data,
      'main',
      JSON.stringify(param)
    )
    console.log(
      `succeed to deposit. open https://arronax.io/tezos/carthagenet/operation_groups/${result.operationGroupID.replace(/"/g, '')}`
    )
    // console.log('invokeContract result:', JSON.stringify(result))
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

  public static decodeCheckpoint(bytes: Bytes) {
    const hexString = bytes.toHexString().substr(2)
    const body = hexString.substr(2)
    const micheline = JSON.parse(TezosLanguageUtil.hexToMicheline(body).code)
    const subrange = new Range(
      BigNumber.fromString(micheline.args[1].args[1].int),
      BigNumber.fromString(micheline.args[1].args[0].int)
    )
    const stateUpdate = new Property(
      Address.from('0x' + micheline.args[0].args[1].bytes),
      micheline.args[0].args[0].map(i => Bytes.fromHexString(i.args[1].bytes))
    )
    return new Checkpoint(subrange, stateUpdate)
  }

  subscribeCheckpointFinalized(
    handler: (checkpointId: Bytes, checkpoint: [Range, Property]) => void
  ) {
    this.eventWatcher.subscribe('CheckpointFinalized', (log: EventLog) => {
      let values = []
      try {
        values = log.values.map(v => Bytes.fromHexString(v))
        const checkpointId = TzCoder.decode(Bytes.default(), values[1])
        const checkpoint = DepositContract.decodeCheckpoint(values[2])
        const stateUpdate = checkpoint.stateUpdate
        const subrange = checkpoint.subrange
        handler(checkpointId, [subrange, stateUpdate])
      } catch (e) {
        console.error('invalid log data', values)
      }
    })
    this.eventWatcher.cancel()
    this.eventWatcher.start(() => {
      // console.log('CheckpointFinalized event polled')
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
