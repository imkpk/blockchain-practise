const Blockchain = require( './blockchain' )
const bitcoin = new Blockchain();
const previous = 'klsjflkjassn93929'
const currentBD = [ {
  amount: 10,
  sender: 'a',
  recipient: 'a1'
}, {
  amount: 11,
  sender: 'b',
  recipient: 'b1'
}, {
  amount: 12,
  sender: 'c',
  recipient: 'c1'
}, {
  amount: 13,
  sender: 'd',
  recipient: 'd1'
}, ]
// const nonce = 100;
// bitcoin.createNewBlock(23,'jaaf3sjdakjfjsa342','kjsadfjeewrw3232')
// bitcoin.createNewTransactions(100,'pratibha','viggu')
// bitcoin.createNewBlock(43,'jasjkjfjsa342','kjsadfjeewrw3232')
//
// bitcoin.createNewTransactions(101,'pratibha1','viggu-1')
// bitcoin.createNewTransactions(102,'pratibha2','viggu-2')
// bitcoin.createNewTransactions(103,'pratibha3','viggu-3')
// bitcoin.createNewBlock(44,'jasjkjfjsa342000','000kjsadfjeewrw3232')

// const hash = bitcoin.hashBlock( previous, currentBD, 2498 )
// const hash = bitcoin.proofOfWork( previous, currentBD )
console.log( bitcoin)

