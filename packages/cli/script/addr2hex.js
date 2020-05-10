const conseil = require('conseiljs');
require('dotenv').config();

/*
Unused Deposit Contract Addresses
KT1VxnvSZcHJv7asJcaa6XtuCy4aymsYk1NG
KT1LYPxmGgoCTEeuPKLuBYjJLkYWqaCg5tBd
*/

(async _=>{
  const addr = await conseil.TezosMessageUtils.writeAddress(process.argv[process.argv.length - 1])
  console.log(`${process.argv[process.argv.length - 1]} to 0x${addr}`)
  console.log("Put it to .env")
})()
