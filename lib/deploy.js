const Contract = require('truffle-contract')
const uportIdentity = require('uport-identity')
const registryArtifact = require('uport-registry')
const identityManagerArtifact = uportIdentity.IdentityManager.v1
const EthJS = require('ethjs-query');
const HttpProvider = require('ethjs-provider-http');
const SignerProvider = require('ethjs-provider-signer');
const sign = require('ethjs-signer').sign;

const Registry = Contract(registryArtifact)
const IdentityManager = Contract(identityManagerArtifact)

const deploy = (network, {from, gas, gasPrice, IdentityManagerArgs = {}} = {}, privKey) => {

  let provider

  if (privKey) {
    provider = new SignerProvider(network, {
      signTransaction: (rawTx, cb) => cb(null, sign(rawTx, privKey))
    });
  } else {
    provider = network || typeof(network) === 'string'  ? new HttpProvider(network) : network
  }

  Registry.setProvider(provider)
  IdentityManager.setProvider(provider)
  const eth = new EthJS(provider)

  const userTimeLock = IdentityManagerArgs.userTimeLock || 50
  const adminTimeLock = IdentityManagerArgs.adminTimeLock || 200
  const adminRate = IdentityManagerArgs.adminRate || 50
  gas = gas || 3000000

  let resObj = {}
  let address

  return eth.coinbase().then(res => {
    from = from || res
    return gasPrice ?  gasPrice : eth.gasPrice()
  }).then(res => {
    gasPrice = res
    const fakePrevVersion = 0 // Registry contract constructor expects a previous version
    return Registry.new(fakePrevVersion, {from, gas})
  }).then(instance => {
    resObj.Registry = instance.address
    return IdentityManager.new(userTimeLock, adminTimeLock, adminRate, {from, gas})
  }).then(instance => {
    resObj.IdentityManager = instance.address
    return resObj
  }).catch(console.log)
}

module.exports = deploy
