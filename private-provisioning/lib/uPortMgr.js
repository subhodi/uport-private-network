var { Credentials, SimpleSigner } = require('uport');
var { createJWT } = require('uport/lib/JWT');


class UPortMgr {

    constructor() {
        this.signer=null;
        this.address=null;
        this.credentials=null;
        this.callbackUrl=null;
        this.setSecrets();
    }

    isSecretsSet(){
        return (this.signer !== null || this.credentials !== null || this.callbackUrl !== null);
    }

    setSecrets(){
        // Application identity: Should be registered with contracts. 
        this.signer = SimpleSigner(process.env.APP_PRIVATE_KEY)
        this.address = '' // App MNID;
        this.credentials = new Credentials({
          appName: 'myapp', // App name
          address: this.address,
          signer:  this.signer
        })
        this.callbackUrl='http://10.244.48.83:8080'
    }
    
    
    async requestToken(networkId){
        let requestOpts={
            notifications: true,
            callbackUrl: this.callbackUrl,
            accountType: 'devicekey',
            network_id: networkId,
            exp: 1522540800 // Sunday, 1 de April de 2018 0:00:00 GMT
        }
        return this.credentials.createRequest(requestOpts);
    }

    async receiveAccessToken(accessToken){
        return this.credentials.receive(accessToken);
    }

    async signJWT(payload){
        return createJWT({address:this.address, signer:this.signer},payload)
    }

    async push(pushToken, pubEncKey, url){
        return this.credentials.push(pushToken, pubEncKey, {url})
    }
}
module.exports = UPortMgr
