# wakkanay-tezos

wakkanay-tezos is experimental ovm implementation in TypeScript for Tezos.
This repository contains L1 adapter code for [Tezos](https://tezos.com).
L1 adaptor is the adaptor to support any blockchain for OVM client. Please also see "[What L1 adaptor is](https://github.com/cryptoeconomicslab/ovm-plasma-chamber-spec/blob/master/core-spec/index.md#l1-adaptor-spec)".

[![Build Status](https://travis-ci.org/cryptoeconomicslab/wakkanay-tezos.svg?branch=master)](https://travis-ci.org/cryptoeconomicslab/wakkanay-tezos)

## Packages

### [@cryptoeconomicslab/tezos-liteclient-cli](/packages/cli)

CLI of Plasma Lite Client

[![npm](https://img.shields.io/npm/v/@cryptoeconomicslab/tezos-liteclient-cli)](https://www.npmjs.com/package/@cryptoeconomicslab/tezos-liteclient-cli)

### [@cryptoeconomicslab/tezos-plasma-aggregator](/packages/plasma-aggregator)

Plasma Aggregator

## Development

### Install

```
npm i
lerna bootstrap
```

### Test

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
