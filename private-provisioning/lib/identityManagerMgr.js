var { IdentityManager, MetaIdentityManager } = require('uport-identity');
var privateUportContracts = require('./private-uport-contracts');
var { Promise } = require('bluebird');
var { Client } = require('pg');
var abi = require('ethjs-abi');

class IdentityManagerMgr {

  constructor(ethereumMgr) {
    this.identityManagers = {}
    this.metaIdentityManagers = {}
    this.ethereumMgr = ethereumMgr;
    this.pgUrl = null

  }

  isSecretsSet() {
    return (this.pgUrl !== null);
  }

  setSecrets(secrets) {
    this.pgUrl = secrets.PG_URL;
  }

  async initIdentityManager(managerType, networkName) {
    if (!managerType) throw ('no managerType')
    if (!networkName) throw ('no networkName')

    let idMgrs, idMgrArtifact;
    switch (managerType) {
      case 'IdentityManager':
        idMgrs = this.identityManagers
        idMgrArtifact = IdentityManager.v2
        break;
      case 'MetaIdentityManager':
        idMgrs = this.metaIdentityManagers
        idMgrArtifact = MetaIdentityManager.v2
        break;
      default:
        throw ('invalid managerType')
    }

    if (!idMgrs[networkName]) {
      let abi = idMgrArtifact.abi

      //Private network support
      let imAddr;
      if (idMgrArtifact.networks[this.ethereumMgr.getNetworkId(networkName)]) {
        imAddr = idMgrArtifact.networks[this.ethereumMgr.getNetworkId(networkName)].address
      } else {
        imAddr = privateUportContracts[networkName][managerType]
      }

      let IdMgrContract = this.ethereumMgr.getContract(abi, networkName)
      idMgrs[networkName] = IdMgrContract.at(imAddr)
      idMgrs[networkName] = Promise.promisifyAll(idMgrs[networkName])
    }
  }

  async createIdentity({ deviceKey, recoveryKey, blockchain, managerType, payload }) {
    if (!deviceKey) throw ('no deviceKey')
    if (!managerType) throw ('no managerType')
    if (payload && !payload.destination) throw ('payload but no payload.destination')
    if (payload && !payload.data) throw ('payload but no payload.data')
    let recoveryKeyFix

    let zeroHexString = /^0x[^1-9]+$/
    if (recoveryKey && !recoveryKey.match(zeroHexString)) {
      recoveryKeyFix = recoveryKey
    } else {
      recoveryKeyFix = deviceKey
    }

    let idMgrs;
    switch (managerType) {
      case 'IdentityManager':
        idMgrs = this.identityManagers
        break;
      case 'MetaIdentityManager':
        idMgrs = this.metaIdentityManagers
        break;
      default:
        throw ('invalid managerType')
    }

    await this.initIdentityManager(managerType, blockchain)
    let from = this.ethereumMgr.getAddress() //TODO: read from provider
    let txOptions = {
      from: from,
      gas: 3000000,
      gasPrice: await this.ethereumMgr.getGasPrice(blockchain),
      // nonce: await this.ethereumMgr.getNonce(from, blockchain)
    }

    //Return object
    let ret = {
      managerAddress: idMgrs[blockchain].address
    }

    if (payload) {
      ret.txHash = await idMgrs[blockchain].createIdentityWithCallAsync(deviceKey, recoveryKeyFix, payload.destination, payload.data, txOptions)
    } else {
      ret.txHash = await idMgrs[blockchain].createIdentityAsync(deviceKey, recoveryKeyFix, txOptions)
    }

    return ret;
  }

  async getIdentityFromTxHash(txHash, blockchain) {
    if (!txHash) throw ('no txHash')
    if (!blockchain) throw ('no blockchain')
    // if (!this.pgUrl) throw ('no pgUrl set')

    const txReceipt = await this.ethereumMgr.getTransactionReceipt(txHash, blockchain);
    if (!txReceipt) return null;

    const decodedLogs = await this.decodeLogs(txReceipt)
    const identity = decodedLogs.identity
    return identity;
  }

  async decodeLogs(txReceipt) {
    if (!txReceipt) throw ('no txReceipt')
    const idMgrArtifact = MetaIdentityManager.v2 //TODO: need to fix this

    let eventAbi = idMgrArtifact.abi.filter((o) => { return o.name === 'LogIdentityCreated' })[0]
    let log = txReceipt.logs[0] //I hope is always the first one
    return abi.decodeEvent(eventAbi, log.data, log.topics)
  }


  async getTxData(txHash, blockchain) {
    await this.ethereumMgr.getTransaction(txHash, blockchain);
  }

}
module.exports = IdentityManagerMgr
