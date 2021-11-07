const express = require('express');
const app = express();
// const uuid=require('uuid')
const {v4: uuid} = require('uuid');
app.use(express.json());

const port = process.argv[2];
//node address
const nodeAddress = uuid().split('-').join('');

const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

//end points
app.get('/blockchain', ( req, res ) => {
  res.send(bitcoin);
});

app.post('/transaction', ( req, res ) => {
  console.log(req.body);
  const {amount, sender, recipient} = req.body;
  const blockIndex = bitcoin.createNewTransactions(amount, sender, recipient);
  res.status(200)
      .json({note: `Transaction will be added in block ${blockIndex}`});
});

app.get('/mine', ( req, res ) => {
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
  const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData,
      nonce);

  bitcoin.createNewTransactions(12.5, '00', nodeAddress);
  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

  res.status(200)
      .json({note: `New block mined Successfully`, blockHash: newBlock});
});

//it will register and broadcast that entire node.
app.post('/register-and-broadcast-node', ( req, res ) => {
const newNodeUrl=req.body;
res.send(`register-and-broadcast-node`)
});

app.post('/register-node', ( req, res ) => {
// const newNodeUrl=req.body;
  res.send(`register-node`)
});

app.post('/register-nodes-bulk', ( req, res ) => {
// const newNodeUrl=req.body;
  res.send(`register-node-bulk`)
});



app.listen(port, () => console.log(`server is running on port ${port}...`));