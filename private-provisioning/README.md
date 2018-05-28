## Private network provisioning
Script generates uPort private network provisioning message and sends it to uPort mobile app using pushTokens for users approval.

### Setup
* Edit [./lib/networks.js](./lib/networks.js) with private network configurations.
* Deploy required contracts using uport-identity library to private chain and update [./lib/private-uport-contracts.js](./lib/private-uport-contracts.js) file with new contract addresses.
* Check the source code you might have to modify some variable values.
* Run `node index.js` 

