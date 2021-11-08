const express = require('express');
require('express-async-errors');
const app = express();
// const uuid=require('uuid')
const { v4: uuid } = require('uuid');
app.use(express.json());
const port = process.argv[2];
// const urlsPresent = process.argv[3];
const { argv, nextTick } = require('process');
const { scripts } = require('../package.json');

const someKeys = Object.values(scripts);
const urlObj = [];

someKeys.forEach((element) => {
  const urlAllIn = element.split(' ')[7];
  urlObj.push(urlAllIn);
  return urlAllIn;

  // element.slice(-21)
});
// console.log(urlObj);

// console.log(urlAll);
const rp = require('request-promise');
//node address
const nodeAddress = uuid().split('-').join('');
const Blockchain = require('./blockchain');
const requestPromise = require('request-promise');

const notFound = require('./middleware/not-fount');
const asyncWrapper = require('./middleware/asyncWrapper');
const uncaughtException = require('./middleware/uncaughtError');

const bitcoin = new Blockchain();

// console.log(argv);
// Middleware

//end points
app.get('/blockchain', (req, res) => {
  res.send(bitcoin);
});

app.post('/transaction', async (req, res) => {
  // console.log(req.body);
  // const { amount, sender, recipient } = req.body;
  // const blockIndex = bitcoin.createNewTransactions(amount, sender, recipient);
  // res
  //   .status(200)
  //   .json({ note: `Transaction will be added in block ${blockIndex}` });

  const newTransaction = await req.body;
  const blockIndex =
    bitcoin.addTransactionsToPendingTransactions(newTransaction);
  res.json({ note: `Transaction will be added in block ${blockIndex}` });
});

//creating transaction broadcasting it to other nodes in decentralized network
app.post('/transaction/brodcast', (req, res) => {
  const { amount, sender, recipient } = req.body;
  const newTransaction = bitcoin.createNewTransactions(
    amount,
    sender,
    recipient
  );
  bitcoin.addTransactionsToPendingTransactions(newTransaction);
  const requestPromises = [];
  bitcoin.netwokNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/transaction',
      method: 'POST',
      body: newTransaction,
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises).then((data) => {
    res.json({ note: 'Transaction brodcasted successfully' });
  });
});

app.get('/mine', (req, res) => {
  /** to get the previous block hash and nonce and hash for to create new
   *  block we need to get the lastBlock, hash of lastBlock is previousBlockHash
   *  to get nonce we need to write POW which return nonce
   *  */
  const lastBlock = bitcoin.getLastBlock();
  console.log(lastBlock);
  const previousBlockHash = lastBlock['hash'];
  console.log(previousBlockHash);
  //getting nonce
  //current block data
  const currentBlockData = {
    transaction: bitcoin.pendingTransactions,
    index: lastBlock['index'] + 1,
  };
  const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
  //hash
  const blockHash = bitcoin.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );

  bitcoin.createNewTransactions(12.5, '00', nodeAddress);
  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

  res
    .status(200)
    .json({ note: `New block mined Successfully`, blockHash: newBlock });
});

//it will register and broadcast that entire node.
app.post('/register-and-broadcast-node', async (req, res, next) => {
    const { newNodeUrl } = await req.body;
    // console.log(newNodeUrl);
    if (bitcoin.netwokNodes.indexOf(newNodeUrl) === -1) {
      bitcoin.netwokNodes.push(newNodeUrl);
    }
    const valueIsNotInArry = urlObj.indexOf(newNodeUrl) === -1;
    const registerNodesPromises = [];
    bitcoin.netwokNodes.forEach((networkNodeUrl) => {
      //  register node endpoint
      const requestOptions = {
        uri: networkNodeUrl + `/register-node`,
        method: 'POST',
        body: { newNodeUrl: newNodeUrl },
        json: true,
      };
      registerNodesPromises.push(rp(requestOptions));
    });
    // registerNodesPromises.forEach(async (p) => {
    //   // console.log(p);
    //   // console.log(body);
    //   const bulkRegisterOptions = await {
    //     uri: newNodeUrl + `/register-nodes-bulk`,
    //     method: 'POST',
    //     body: {
    //       allNetworkNodes: [...bitcoin.netwokNodes, bitcoin.currentNodeUrl],
    //     },
    //     json: true,
    //   };
    //   console.log(bulkRegisterOptions);

    //   
    //     return await rp(bulkRegisterOptions);
    // });

    // res.json({ note: `new node registered successfully` });

    Promise.all(registerNodesPromises)
      .then((data) => {
        const bulkRegisterOptions = {
          uri: newNodeUrl + `/register-nodes-bulk`,
          method: 'POST',
          body: {
            allNetworkNodes: [...bitcoin.netwokNodes, bitcoin.currentNodeUrl],
          },
          json: true,
        };
        return rp(bulkRegisterOptions);
      })
      .then((data) => {
        res.json({ note: `new node registered successfully` });
      });
});

//register/subscribe a node with the network
app.post('/register-node', (req, res) => {
  const { newNodeUrl } = req.body;
  const nodeNotAlreadyPresent = bitcoin.netwokNodes.indexOf(newNodeUrl) === -1;
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
  if (nodeNotAlreadyPresent && notCurrentNode) {
    bitcoin.netwokNodes.push(newNodeUrl);
  }
  res.json({ note: `New node registered successfully` });
});

//register multiple nodes at once
app.post('/register-nodes-bulk', (req, res) => {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach((networkNodeUrl) => {
    //..
    const nodeAlreadyPresent =
      bitcoin.netwokNodes.indexOf(networkNodeUrl) === -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
    if (nodeAlreadyPresent && notCurrentNode) {
      bitcoin.netwokNodes.push(networkNodeUrl);
    }
  });
  res.json({ note: `bulk registration successful` });
});

//error handloing
app.use(notFound);
app.use(asyncWrapper);
app.use(uncaughtException)

app.listen(port, () => console.log(`server is running on port ${port}...`));
