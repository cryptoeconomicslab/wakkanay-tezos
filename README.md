# wakkanay-tezos

This repository contains L1 adapter code for Tezos. L1 adaptor is the adaptor to support any blockchain for OVM client. Please also see ["What L1 adaptor is"](https://github.com/cryptoeconomicslab/ovm-plasma-chamber-spec/blob/master/core-spec/index.md#l1-adaptor-spec).

[![Build Status](https://travis-ci.org/cryptoeconomicslab/wakkanay-tezos.svg?branch=master)](https://travis-ci.org/cryptoeconomicslab/wakkanay-tezos)

## Development

### Requirement

wakkanay-tezos requires the following to run:

- [Node.js](https://nodejs.org/) v10+
- [npm](https://www.npmjs.com/) (normally comes with Node.js)
- [lerna](https://github.com/lerna/lerna) v3+

### Install

```
npm i
lerna bootstrap
```

#### Installation on debian/ubuntu

```
sudo apt install libusb-1.0-0-dev
npm i
lerna bootstrap
```

### Build

```
lerna run build
```

## Test

```
npm test
```

### Docmentation

- [Document root of framework](https://github.com/cryptoeconomicslab/ovm-plasma-chamber-spec)

### Contributing

When contributing to this repository, please first discuss the change you wish to make via issue or any other method with the owners of this repository before making a change.

Please note we have [a code of conduct](https://github.com/cryptoeconomicslab/ovm-plasma-chamber-spec/blob/master/CODE-OF-CONDUCT.md), please follow it in all your interactions with the project.

1.  Ensure that tests pass and code is lint free: `npm run lint`
2.  Update the README.md if any changes invalidate its current content.
3.  Include any tests for new functionality.
4.  Reference any revelant issues in your PR comment.

NOTE: Be sure to merge the latest from "upstream" before making a pull request!

## Packages

### [@cryptoeconomicslab/tezos-liteclient-cli](/packages/cli)

CLI of Plasma Lite Client

[![npm](https://img.shields.io/npm/v/@cryptoeconomicslab/tezos-liteclient-cli)](https://www.npmjs.com/package/@cryptoeconomicslab/tezos-liteclient-cli)

### [@cryptoeconomicslab/tezos-coder](/packages/coder)

Coder of Tezos

### [@cryptoeconomicslab/tezos-contract](/packages/contract)

Contract Wrapper of Tezos

### [@cryptoeconomicslab/tezos-plasma-aggregator](/packages/plasma-aggregator)

Plasma Aggregator

### [@cryptoeconomicslab/tezos-wallet](/packages/wallet)

Wallet of Tezos

## License

> You can check out the full license [here](/LICENSE)

This project is licensed under the terms of the Apache-2.0 license.
