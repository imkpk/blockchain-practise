const sha256 = require("sha256");
const currentNodeUrl = process.argv[3];
const { v4: uuid } = require("uuid");

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];

  this.currentNodeUrl = currentNodeUrl;
  this.netwokNodes = [];
  //  Genesis block
  this.createNewBlock(100, "0", "0");
}

//create new block
Blockchain.prototype.createNewBlock = function (
  nonce,
  previousBlockHash,
  hash
) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce: nonce, //proof of work
    hash: hash, //all newTransactions will convert into single string
    previousBlockHash: previousBlockHash,
  };
  this.pendingTransactions = [];
  this.chain.push(newBlock);
  return newBlock;
};

//this method will return to us the last/previous block in our blockChain
Blockchain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1]; //the last chain
};

//create new Transactions
Blockchain.prototype.createNewTransactions = function (
  amount,
  sender,
  recipient
) {
  let newTransaction;
  newTransaction = {
    amount: amount,
    sender: sender,
    recipient: recipient,
    transactionsId: uuid().split("-").join(""),
  };
  // this.pendingTransactions.push(newTransaction);
  // return this.getLastBlock()['index'] + 1;
  return newTransaction;
};

Blockchain.prototype.addTransactionsToPendingTransactions = function (
  transactionObj
) {
  this.pendingTransactions.push(transactionObj);
  return this.getLastBlock()["index"] + 1;
};

//how can we get pending transaction into out blockChain?
//the way we do that we mine/create a new block

//hash block
Blockchain.prototype.hashBlock = function (
  previousBlockHash,
  currentBlockHash,
  nonce
) {
  /** this method will take in a block from our blockchain and hash that block into some fixed length string**/
  const dataAsString =
    previousBlockHash + nonce.toString() + JSON.stringify(currentBlockHash);
  // console.log( dataAsString );
  return sha256(dataAsString);
};
//proof o work
/* proof of work method takes in current block of data and a previous
 block-hash */
Blockchain.prototype.proofOfWork = function (
  previousBlockHash,
  currentBlockData
) {
  let nonce = 0;
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  while (hash.substring(0, 4) !== "0000") {
    nonce++;
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    // console.log(hash)
  }
  return nonce;
};

// consensus algorithm

Blockchain.prototype.chainIsValid = function (blockchain) {
  let validChain = true;

  for (var i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    const prevBlock = blockchain[i - 1];
    const blockHash = this.hashBlock(
      prevBlock["hash"],
      {
        transactions: currentBlock["transactions"],
        index: currentBlock["index"],
      },
      currentBlock["nonce"]
    );
    if (blockHash.substring(0, 4) !== "0000") validChain = false;
    if (currentBlock["previousBlockHash"] !== prevBlock["hash"]) {
      validChain = false;
    }
  }
  const genesisBlock = blockchain[0];
  const correctNonce = genesisBlock["nonce"] === 100;
  const correctPreviousBlockHash = genesisBlock["previousBlockHash"] === "0";
  const correctHash = genesisBlock["hash"] === "0";
  const correctTransactions = genesisBlock["transactions"].length === 0;

  if (
    !correctNonce ||
    !correctPreviousBlockHash ||
    !correctHash ||
    !correctTransactions
  ) {
    validChain = false;
  }

  return validChain;
};

// this method will query our blockchain and return the entire blockchain
Blockchain.prototype.getBlock = function (blockHash) {
  let correctBlock = null;
  this.chain.forEach((block) => {
    if (block.hash === blockHash) {
      correctBlock = block;
    }
  });
  return correctBlock;
};

// //this method will return the transaction by id
Blockchain.prototype.getTransaction = function (transactionId) {
  let correctTransaction = null;
  let correctBlock = null;

  this.chain.forEach((block) => {
    block.transactions.forEach((items) => {
      if (items.transactionsId === transactionId) {
        correctBlock = block;
        correctTransaction = items;
      }
    });
  });
  return {
    block: correctBlock,
    transaction: correctTransaction,
  };
};

// finding the adress by using sendr and recipient in transcation array
Blockchain.prototype.getAddressData = function (address) {
  let addressTransactions = [];
  this.chain.forEach((block) => {
    block.transactions.forEach((items) => {
      if (items.sender === address || items.recipient === address) {
        addressTransactions.push(items);
      }
    });
  });
  let balance = 0;
  addressTransactions.forEach((transaction) => {
    if (transaction.recipient === address) {
      balance += transaction.amount;
    } else {
      balance -= transaction.amount;
    }
  });
  return { addressTransactions: addressTransactions, adressBalance: balance };
};

module.exports = Blockchain;
