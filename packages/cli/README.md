# @cryptoeconomicslab/tezos-liteclient-cli

[![npm](https://img.shields.io/npm/v/@cryptoeconomicslab/tezos-liteclient-cli)](https://www.npmjs.com/package/@cryptoeconomicslab/tezos-liteclient-cli)

### Deposit L1 fund to L2

```
# Tab A: Common
node script/addr2hex.js <KT1....XXX>
lerna clean -y && lerna bootstrap && lerna run build

# Tab B: Aggregator
cd ../plasma-aggregator
cp .env.sample .env
vi .env # Replace: CONTRACT_BASE58,{DEPOSIT,COMMITMENT,ADJUDICATION}_CONTRACT_ADDERSS
node lib/index.js

# Tab C: CLI
cp .env.sample .env
vi .env # Replace: CONTRACT_BASE58,{DEPOSIT,COMMITMENT,ADJUDICATION}_CONTRACT_ADDERSS
node lib/index.js deposit 1
```

### Confirm your balance in the L1 and L2

It'll take a few minutes to finalize the result of L2 balance increment.

```
rm -rf .db && node lib/index.js balance
```
