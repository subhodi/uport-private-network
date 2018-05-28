const UPortClient = require('./lib/index.js').UPortClient;
const Connect = require('uport-connect').Connect;
const SimpleSigner = require('uport-connect').SimpleSigner;
const { decodeToken } = require('jsontokens');
const { Credentials } = require('uport')
const EthJS = require('ethjs-query');
const HttpProvider = require('ethjs-provider-http');

const rpcUrl = 'http://127.0.0.1:7545'
const registry = '0x59e20fdf340d8b4f8fde994b1236d01f646c7fb2'
const identityManager = '0xc79ba3074486fdec6aa373a89ad4af336f48c36e'

const eth = new EthJS(new HttpProvider(rpcUrl))

const createuPortClient = (initState) => {
    const config = {
        network: {
            id: '0x5777',
            rpcUrl: rpcUrl,
            registry: registry,
            identityManager: identityManager
        },
        ipfsConfig: 'https://ipfs.infura.io/ipfs/',
        responseHandler: 'http',
    }
    // Pass device key config to re-use the same keys
    // "deviceKeys": {
    //     "privateKey": process.env.PRIVATE_KEY,
    //     "publicKey": "0x048540bba4bb9d1f53d3f370e6acaddb52bab2f20c257b9cc3f73b0b695971d37042901539b6711e5db317f99b3885e94d0ce7b4a21c289f606de49e3ffdcf1682",
    //     "address": "0x67668f774e6c4576954575e95a1432f0f8545b91"
    // }

    const uportClient = new UPortClient(config, initState);
    uportClient.initKeys();
    console.log(uportClient.deviceKeys.address)

    const value = 0.01 * 1.0e18
    let address;
    let mnid;

    return eth.coinbase().then(addr => {
        address = addr;
        const fundTx = { to: uportClient.deviceKeys.address, value, from: address, data: '0x' }
        return eth.sendTransaction(fundTx)
    }).then(txHash => {
        console.log(txHash)
        console.log("Funnded device key");
        return uportClient.initializeIdentity();
    }).then(() => {
        console.log("Identity initialization successfull");
        const value = 0.01 * 1.0e18
        console.log('MNID:' + uportClient.mnid);
        const fundTx = { to: uportClient.id, value, from: address, data: '0x' }
        return eth.sendTransaction(fundTx);
    }).then((txHash) => {
        console.log("Funded proxy");
        return uportClient
    })
}


const initState = {
    info: {
        'name': 'jony-lobo',
        'email': 'lobo@mail.com'
    }
}

createuPortClient(initState).then(client => {
    console.log("uPort application client")
    console.log(client);
}).catch(console.error)
