import { Bytes, BigNumber } from 'wakkanay/dist/types/Codables'
import { contract } from 'wakkanay'
import ICommitmentContract = contract.ICommitmentContract
import { ContractHelper } from '../helpers'

export class CommitmentContract implements ICommitmentContract {
  constructor(readonly connection: ContractHelper) {}

  /**
   * submit block
   */
  async submit(blockNumber: BigNumber, root: Bytes) {
    const amount = 0
    const entrypoint = 'submit'
    const params = `(Pair (Pair ${blockNumber} "${blockNumber.toString()}") "${root.toHexString()}")`

    await this.connection.invokeContract(amount, entrypoint, params)
  }

  // TODO: add implementation
  subscribeBlockSubmitted(
    handler: (blockNumber: BigNumber, root: Bytes) => void
  ) {
    throw new Error('Not implemented')
  }
}
