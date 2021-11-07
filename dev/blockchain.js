const sha256 = require( 'sha256' )
const currentNodeUrl=process.argv[3]

function Blockchain(){
  this.chain = [];
  this.pendingTransactions = [];

  this.currentNodeUrl=currentNodeUrl;
  this.apis=[]
//  Genesis block
  this.createNewBlock( 100, '0', '0' )
}

//create new block
Blockchain.prototype.createNewBlock = function ( nonce, previousBlockHash, hash ){
  const newBlock = {
    index: this.chain.length + 1,
    timeStamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce: nonce,//proof of work
    hash: hash,//all newTransactions will convert into single string
    previousBlockHash: previousBlockHash
  }
  this.pendingTransactions = [];
  this.chain.push( newBlock )
  return newBlock;
}

//this method will return to us the last/previous block in our blockChain
Blockchain.prototype.getLastBlock = function (){
  return this.chain[this.chain.length - 1];//the last chain
}

//create new Transactions
Blockchain.prototype.createNewTransactions = function ( amount, sender, recipient ){
  const newTransaction = {
    amount: amount,
    sender: sender,
    recipient: recipient
  }
  this.pendingTransactions.push( newTransaction )
  return this.getLastBlock()['index'] + 1;
};
//how can we get pending transaction into out blockChain?
//the way we do that we mine/create a new block

//hash block
Blockchain.prototype.hashBlock = function ( previousBlockHash, currentBlockHash, nonce ){
  /** this method will take in a block from our blockchain and hash that block into some fixed length string**/
  const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify( currentBlockHash )
  // console.log( dataAsString );
  return sha256( dataAsString );
}
//proof o work
/* proof of work method takes in current block of data and a previous
 block-hash */
Blockchain.prototype.proofOfWork = function ( previousBlockHash, currentBlockData ){
  let nonce = 0;
  let hash = this.hashBlock( previousBlockHash, currentBlockData, nonce )
  while (hash.substring( 0, 4 ) !== '0000'){
    nonce++;
    hash = this.hashBlock( previousBlockHash, currentBlockData, nonce );
    // console.log(hash)
  }
  return nonce;
}


module.exports = Blockchain;