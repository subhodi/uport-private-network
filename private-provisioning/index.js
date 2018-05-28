const CreateIdentityHandler = require('./handlers/createIdentity');
const UPortMgr = require('./lib/uPortMgr')
const EthereumMgr = require('./lib/ethereumMgr')
const IdentityManagerMgr = require('./lib/identityManagerMgr')

let uPortMgr = new UPortMgr()
let ethereumMgr = new EthereumMgr()
let identityManagerMgr = new IdentityManagerMgr(ethereumMgr)

let createIdentityHandler = new CreateIdentityHandler(uPortMgr, identityManagerMgr)
createIdentityHandler.handle((err, res) => {
    console.log(err, res);
});
