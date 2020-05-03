# @cryptoeconomicslab/tezos-liteclient-cli

[![npm](https://img.shields.io/npm/v/@cryptoeconomicslab/tezos-liteclient-cli)](https://www.npmjs.com/package/@cryptoeconomicslab/tezos-liteclient-cli)

### Deposit

```
cp .sample.env .env # [addr2hex.js](https://gist.github.com/shogochiai/5518de3abe358c83bc9075e44a629968)
lerna clean -y && lerna bootstrap && lerna run build
node lib/index.js deposit 1
```

### Balance

```
node lib/index.js balance
```
