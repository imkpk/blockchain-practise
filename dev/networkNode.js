// noinspection UnnecessaryLocalVariableJS

const express = require('express');
const app = express();
// const uuid=require('uuid')
const {v4: uuid} = require('uuid');
app.use(express.json());
const port = process.argv[2];
// const urlsPresent = process.argv[3];
const {scripts} = require('../package.json');
const someKeys = Object.values(scripts);
const urlObj = [];
someKeys.forEach(( element ) => {
  const urlAllIn = element.split(' ')[7];
  urlObj.push(urlAllIn);
  return urlAllIn;
});

const rp = require('request-promise');
//node address
const nodeAddress = uuid().split('-').join('');
const Blockchain = require('./blockchain');
require('./middleware/not-fount');
require('./middleware/asyncWrapper');
const bitcoin = new Blockchain();

// console.log(argv);
// Middleware

//end points
app.get('/blockchain', ( req, res ) => {
  res.send(bitcoin);
});

app.post('/transaction', async ( req, res ) => {

  const newTransaction = await req.body;
  const blockIndex =
      bitcoin.addTransactionsToPendingTransactions(newTransaction);
  res.json({note: `Transaction will be added in block ${blockIndex}`});
});

//creating transaction broadcasting it to other nodes in decentralized network
app.post('/transaction/broadcast', ( req, res ) => {
  const {amount, sender, recipient} = req.body;
  const newTransaction = bitcoin.createNewTransactions(
      amount,
      sender,
      recipient,
  );
  bitcoin.addTransactionsToPendingTransactions(newTransaction);
  let requestPromises = [];
  bitcoin.netwokNodes.forEach(( networkNodeUrl ) => {
    const requestOptions = {
      uri: networkNodeUrl + '/transaction',
      method: 'POST',
      body: newTransaction,
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises).then(() => {
    res.json({note: 'Transaction broadcast successfully'});
  });
});

app.get('/mine', ( req, res ) => {
  /** to get the previous block hash and nonce and hash for to create new
   *  block we need to get the lastBlock, hash of lastBlock is previousBlockHash
   *  to get nonce we need to write POW which return nonce
   *  */
  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];
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
      nonce,
  );

  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

  let requestPromises = [];
  bitcoin.netwokNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/receive-new-block',
      method: 'POST',
      body: {newBlock: newBlock},
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises).then(() => {
    const requestOptions = {
      uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
      method: 'POST',
      body: {amount: 12.5, sender: '00', recipient: nodeAddress},
      json: true,
    };
    return rp(requestOptions);
  }).then(() => {
    res.json({
      note: 'New block mined and broadcast successfully',
      block: newBlock,
    });
  });
});

app.post('/receive-new-block', async ( req, res ) => {
  const newBlock = req.body.newBlock;
  const lastBlock = bitcoin.getLastBlock();
  const correctHash = lastBlock['hash'] === newBlock['previousBlockHash'];
  const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
  if (correctHash && correctIndex) {
    bitcoin.chain.push(newBlock);
    bitcoin.pendingTransactions = [];
    res.json({
      note: 'New block received and accepted',
      newBlock: newBlock,
    });
  } else {
    res.json({
      note: 'New block rejected',
      newBlock: newBlock,
    });
  }
});

//it will register and broadcast that entire node.
app.post('/register-and-broadcast-node', async ( req, res ) => {
  const newNodeUrl = await req.body.newNodeUrl;
  if (bitcoin.netwokNodes.indexOf(newNodeUrl) === -1) {
    bitcoin.netwokNodes.push(newNodeUrl);
  }
  let registerNodesPromises = [];
  bitcoin.netwokNodes.forEach(( networkNodeUrl ) => {
    //  register node endpoint
    const requestOptions = {
      uri: networkNodeUrl + `/register-node`,
      method: 'POST',
      body: {newNodeUrl: newNodeUrl},
      json: true,
    };
    registerNodesPromises.push(rp(requestOptions));
  });

  Promise.all(registerNodesPromises)
      .then(() => {
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
      .then(() => {
        res.json({note: `new node registered successfully`});
      });
});

//register/subscribe a node with the network
app.post('/register-node', ( req, res ) => {
  const {newNodeUrl} = req.body;
  const nodeNotAlreadyPresent = bitcoin.netwokNodes.indexOf(newNodeUrl) === -1;
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
  if (nodeNotAlreadyPresent && notCurrentNode) {
    bitcoin.netwokNodes.push(newNodeUrl);
  }
  res.json({note: `New node registered successfully`});
});

//register multiple nodes at once
app.post('/register-nodes-bulk', ( req, res ) => {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach(( networkNodeUrl ) => {
    //..
    const nodeAlreadyPresent =
        bitcoin.netwokNodes.indexOf(networkNodeUrl) === -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
    if (nodeAlreadyPresent && notCurrentNode) {
      bitcoin.netwokNodes.push(networkNodeUrl);
    }
  });
  res.json({note: `bulk registration successful`});
});

// consensus
app.get('/consensus', function( req, res ) {
  const requestPromises = [];
  bitcoin.netwokNodes.forEach(networkNodeUrl => {
    console.log(networkNodeUrl);
    const requestOptions = {
      uri: networkNodeUrl + '/blockchain',
      method: 'GET',
      json: true,
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises)
      .then(blockchains => {
        const currentChainLength = bitcoin.chain.length;
        let maxChainLength = currentChainLength;
        let newLongestChain = null;
        let newPendingTransactions = null;

        blockchains.forEach(blockchain => {
          if (blockchain.chain.length > maxChainLength) {
            maxChainLength = blockchain.chain.length;
            newLongestChain = blockchain.chain;
            newPendingTransactions = blockchain.pendingTransactions;
          }
        });
        if (!newLongestChain ||
            ( newLongestChain && !bitcoin.chainIsValid(newLongestChain) ))
        {
          res.json({
            note: 'Current chain has not been replaced.',
            chain: bitcoin.chain,
          });
        } else {
          bitcoin.chain = newLongestChain;
          bitcoin.pendingTransactions = newPendingTransactions;
          res.json({
            note: 'This chain has been replaced.',
            chain: bitcoin.chain,
          });
        }
      });
});


app.listen(port, () => console.log(`server is running on port ${port}...`));
