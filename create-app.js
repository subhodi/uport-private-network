const UPortClient = require('./lib/index.js').UPortClient
const deploy = require('./lib/index.js').deploy
const EthJS = require('ethjs-query');
const HttpProvider = require('ethjs-provider-http');
const { decodeToken } = require('jsontokens')

const rpcUrl = 'http://127.0.0.1:7545'
const eth = new EthJS(new HttpProvider(rpcUrl))
let uportClient
let address

const createuPortClient = (appName = 'myapp', appDescription = 'Cool app', appDomain = 'dapp.com', iconRelativePath = './icon.png') => {
    return deploy(rpcUrl)
        .then(res => {
            console.log("Contracts deployed successfully")
            console.log(res)
            const config = {
                network: {
                    id: '0x5777',
                    rpcUrl: rpcUrl,
                    registry: res.Registry,
                    identityManager: res.IdentityManager
                },
                ipfsConfig: 'http://127.0.0.1:5001',
            }
            // Pass device key config to re-use the same keys
            // "deviceKeys": {
            //     "privateKey": process.env.PRIVATE_KEY,
            //     "publicKey": "0x048540bba4bb9d1f53d3f370e6acaddb52bab2f20c257b9cc3f73b0b695971d37042901539b6711e5db317f99b3885e94d0ce7b4a21c289f606de49e3ffdcf1682",
            //     "address": "0x67668f774e6c4576954575e95a1432f0f8545b91"
            // }

            uportClient = new UPortClient(config)
            uportClient.initKeys()
            return eth.coinbase()
                .then(addr => {
                    // Fund device key Transaction
                    address = addr
                    const fundTx = {
                        to: uportClient.deviceKeys.address,
                        value: 0.02 * 1.0e18,
                        from: address,
                        data: '0x'
                    }
                    return eth.sendTransaction(fundTx)
                })
                .then(txHash => {
                    console.log('Funded device key')
                    //  Crate an app identity
                    return uportClient.appDDO(appName, appDescription, appDomain, iconRelativePath)
                }).then(ddo => {
                    console.log('ddo App created')
                    return uportClient.initializeIdentity(ddo)
                }).then(res => {
                    console.log('Identity Created')
                    return uportClient
                })
        })
}

createuPortClient().then(client => {
    console.log("uPort application client")
    console.log(client)
}).catch(console.error)
