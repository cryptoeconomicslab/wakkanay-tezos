# @cryptoeconomicslab/tezos-liteclient-cli

[![npm](https://img.shields.io/npm/v/@cryptoeconomicslab/tezos-liteclient-cli)](https://www.npmjs.com/package/@cryptoeconomicslab/tezos-liteclient-cli)

### Deposit L1 fund to L2

```
node script/addr2hex.js KT1....XXX # When you deployed a new contract.
cp .sample.env .env
vi .env # Replace: CONTRACT_BASE58,{DEPOSIT,COMMITMENT,ADJUDICATION}_CONTRACT_ADDERSS
lerna clean -y && lerna bootstrap && lerna run build
node ../plasma-aggregator/lib/index.js & >/dev/null 2>&1
node lib/index.js deposit 1
```

### Confirm your balance in the L1 and L2

```
rm -rf .db && node lib/index.js balance
```
