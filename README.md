# uport-private-network
uPort identity wallet implementation using to support private network using uport-js-client

### Run
Modify IPFS, Ethereum RPC endpoints and network ID.

### Create app identity
Deploy uPort Registry and Identity manager contracts and registers an Uport APP identity.
```bash
$ npm install
$ node create-app.js
```

### Create user identity
Create new uPort user identity.
Modify Registry and Identity manager contract address.
```bash
$ node create-user.js
```

### Private Chain Provisioning Message
Script to enable Private chain provisioning in uPort mobile APP.
Refer [here](./private-provisioning)

