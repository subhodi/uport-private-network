var networks = require('./networks');
var Web3 = require('web3');
var Promise = require('bluebird');
var generators = require('eth-signer').generators;
var signers = require('eth-signer').signers;

var Transaction = require('ethereumjs-tx');
var { Client } = require('pg');
var SignerProvider = require('ethjs-provider-signer');

const HDSigner = signers.HDSigner

const DEFAULT_GAS_PRICE = 20000000000 // 20 Gwei

class EthereumMgr {

  constructor() {
    this.pgUrl = null
    this.seed = null

    this.web3s = {}
    this.gasPrices = {}
    this.setSecrets();
  }

  setSecrets() {
    this.seed = ''; // 12 word seed to create account and please fund the account created

    const hdPrivKey = generators.Phrase.toHDPrivateKey(this.seed)
    this.signer = new HDSigner(hdPrivKey)

    const txSigner = {
      signTransaction: (tx_params, cb) => {
        let tx = new Transaction(tx_params)
        let rawTx = tx.serialize().toString('hex')
        this.signer.signRawTx(rawTx, (err, signedRawTx) => {
          cb(err, '0x' + signedRawTx)
        })
      },
      accounts: (cb) => cb(null, [this.signer.getAddress()]),
    }

    for (const network in networks) {
      let provider = new SignerProvider(networks[network].rpcUrl, txSigner);
      let web3 = new Web3(provider)
      web3.eth = Promise.promisifyAll(web3.eth)
      this.web3s[network] = web3

      this.gasPrices[network] = DEFAULT_GAS_PRICE;
    }
  }

  getProvider(networkName) {
    if (!this.web3s[networkName]) return null;
    return this.web3s[networkName].currentProvider
  }

  getAddress() {
    return this.signer.getAddress()
  }

  getNetworkId(networkName) {
    if (!networkName) throw ('no networkName')
    console.log(networks);
    return networks[networkName].id
  }

  getContract(abi, networkName) {
    if (!abi) throw ('no abi')
    if (!networkName) throw ('no networkName')
    if (!this.web3s[networkName]) throw ('no web3 for networkName')
    return this.web3s[networkName].eth.contract(abi)
  }

  async getTransactionReceipt(txHash, networkName) {
    if (!txHash) throw ('no txHash')
    if (!networkName) throw ('no networkName')
    if (!this.web3s[networkName]) throw ('no web3 for networkName')
    return await this.web3s[networkName].eth.getTransactionReceiptAsync(txHash)
  }


  async getBalance(address, networkName) {
    if (!address) throw ('no address')
    if (!networkName) throw ('no networkName')
    if (!this.web3s[networkName]) throw ('no web3 for networkName')
    return await this.web3s[networkName].eth.getBalanceAsync(address)
  }

  async getGasPrice(networkName) {
    if (!networkName) throw ('no networkName')
    try {
      this.gasPrices[networkName] = (await this.web3s[networkName].eth.getGasPriceAsync()).toNumber()
    } catch (e) {
      console.log(e)
    }
    return this.gasPrices[networkName]
  }

  async getNonce(address, networkName) {
    if (!address) throw ('no address')
    if (!networkName) throw ('no networkName')
    let nonce = this.web3s[networkName].eth.getTransactionCount(address);
    return nonce;
  }

}

module.exports = EthereumMgr
