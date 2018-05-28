var { encode } = require('mnid')

class CreateIdentityHandler {
    constructor(uPortMgr, identityManagerMgr) {
        this.uPortMgr = uPortMgr
        this.identityManagerMgr = identityManagerMgr
    }

    async handle(cb) {
        const networkName = 'msft'
        const networkId = '0x5777'

        // Get profile details of mobile APP identity using uport-connect library(use request.crdential api)
        let deviceKey;
        let profile = {
            deviceKey: '0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Device Ethereum address
            address: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // MNID of the identity
            pushToken: "", // Identity Push token for notification
            publicEncKey: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // publicEncKey
        }
        deviceKey = profile.deviceKey

        //Create Identity
        let idCreationtxHash;
        let metaIdentityManagerAddress;
        try {
            console.log("calling identityManagerMgr.createIdentity")
            let identityOpts = {
                deviceKey: deviceKey,
                managerType: 'MetaIdentityManager',
                blockchain: networkName
            }
            const { managerAddress, txHash } = await this.identityManagerMgr.createIdentity(identityOpts)
            console.log("managerAddress:" + managerAddress)
            console.log("txHash:" + txHash)

            idCreationtxHash = txHash;
            metaIdentityManagerAddress = managerAddress;
        } catch (err) {
            console.log("Error on this.identityManagerMgr.createIdentity")
            console.log(err)
            cb({ code: 500, message: err.message })
            return;
        }

        //Wait for identity to be created
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        let idAddress = null;
        while (idAddress == null) {
            try {
                console.log("Waiting 1000 ms")
                await delay(1000);
                console.log("calling identityManagerMgr.getIdentityFromTxHash")
                idAddress = await this.identityManagerMgr.getIdentityFromTxHash(idCreationtxHash, networkName)
                console.log("idAddress:" + idAddress)
            } catch (err) {
                console.log("Error on this.identityManagerMgr.getIdentityFromTxHash")
                console.log(err)
                cb({ code: 500, message: err.message })
                return;
            }
        }

        //Prepare Private Chain Provisioning Message
        let privProv = {
            aud: profile.address,
            sub: encode({
                network: networkId,
                address: idAddress
            }),
            dad: deviceKey,
            ctl: metaIdentityManagerAddress,
            rel: "https://api.uport.space/olorun/relay", //TODO: Make this a parameter
            acc: '',
            gw: 'http://104.214.116.254:8545/' // RPC endpoint
        }

        //Sign privProv
        let signedPrivProv;
        try {
            console.log("calling uPortMgr.signJWT")
            signedPrivProv = await this.uPortMgr.signJWT(privProv);
        } catch (error) {
            console.log("Error on this.uPortMgr.signJWT")
            console.log(error)
            cb({ code: 500, message: error.message })
            return;
        }
        console.log(signedPrivProv);

        //Push network definition to mobile app
        const privProvUrl = 'me.uport:net/' + signedPrivProv
        try {
            console.log("calling uPortMgr.push")
            await this.uPortMgr.push(profile.pushToken, profile.publicEncKey, privProvUrl);
            console.log("pushed.")
        } catch (error) {
            console.log("Error on this.uPortMgr.push")
            console.log(error)
            cb({ code: 500, message: error.message })
            return;
        }

        cb(null, signedPrivProv)
    }

}

module.exports = CreateIdentityHandler
