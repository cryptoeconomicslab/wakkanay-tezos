import { TezosMessageUtils, TezosWalletUtil } from 'conseiljs'
import { Address, Bytes } from '@cryptoeconomicslab/primitives'
import { RangeDb } from '@cryptoeconomicslab/db'
import { InMemoryKeyValueStore } from '@cryptoeconomicslab/level-kvs'
import {
  DepositContract,
  CommitmentContract
} from '@cryptoeconomicslab/tezos-contract'
import { TzWallet } from '@cryptoeconomicslab/tezos-wallet'
import * as TzCoder from '@cryptoeconomicslab/tezos-coder'
import { setupContext } from '@cryptoeconomicslab/context'
import fs from 'fs'
import { config } from 'dotenv'
config()

import Aggregator, {
  BlockManager,
  StateManager
} from '@cryptoeconomicslab/plasma-aggregator'

setupContext({
  coder: TzCoder
})

const instantiate = async (): Promise<Aggregator> => {
  const kvs = new InMemoryKeyValueStore(Bytes.fromString('aaaaa'))
  await kvs.open()
  const url = process.env.MAIN_CHAIN_HOST
  const network = process.env.TEZOS_NETWORK || 'babylonnet'
  const apiKey = process.env.TEZOS_APIKEY || 'hooman'
  if (!url) {
    throw new Error('must require MAIN_CHAIN_HOST')
  }
  const wallet = new TzWallet(
    await TezosWalletUtil.restoreIdentityWithSecretKey(process.env
      .AGGREGATOR_PRIVATE_KEY as string),
    {
      url: url,
      apiKey: apiKey,
      network: network
    }
  )

  const stateBucket = await kvs.bucket(Bytes.fromString('state_update'))
  const stateDb = new RangeDb(stateBucket)
  const blockDb = await kvs.bucket(Bytes.fromString('block'))
  const stateManager = new StateManager(stateDb)
  const blockManager = new BlockManager(blockDb)
  const witnessDb = await kvs.bucket(Bytes.fromString('witness'))
  const eventDb = await kvs.bucket(Bytes.fromString('event'))
  function depositContractFactory(address: Address) {
    return new DepositContract(address, eventDb, wallet)
  }
  function commitmentContractFactory(address: Address) {
    return new CommitmentContract(address, eventDb, wallet)
  }

  return new Aggregator(
    wallet,
    stateManager,
    blockManager,
    witnessDb,
    depositContractFactory,
    commitmentContractFactory,
    loadConfigFile(process.env.CONFIG_FILE || 'config.local.json')
  )
}

async function main() {
  const aggregator = await instantiate()
  aggregator.registerToken(
    Address.from(process.env.DEPOSIT_CONTRACT_ADDRESS as string)
  )
  aggregator.run()
  console.log('aggregator is running on port ', process.env.PORT)
}

function loadConfigFile(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath).toString())
}

main()
