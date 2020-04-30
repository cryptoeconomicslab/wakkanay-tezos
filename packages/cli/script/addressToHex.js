const conseil = require('conseiljs');
require('dotenv').config();

(async _=>{
  const addr = await conseil.TezosMessageUtils.writeAddress(process.argv[process.argv.length - 1])
  console.log(`${process.argv[process.argv.length - 1]} to 0x${addr}`)
  console.log("Put it to .env")
})()