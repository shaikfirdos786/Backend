// const fs = require("fs");
// /*
// fs.writeFile("message.txt", "Hello Iam Firdos!", (err)=>{
//     if(err) throw err;
//     console.log("The file has been saved!");
// });
// */

// fs.readFile('message.txt','utf-8', (err, data) => {
//   if (err) throw err;
//   console.log(data);
// }); 

/* using CSM CommonJS
var generateName = require("sillyname");
var sillyName = generateName();
console.log(`My name is ${sillyName}`);
*/

/*
// using ESM-ECMASCRIPT Modules we added type = module in package.json below main
import generateName from "sillyname";
var sillyName = generateName();
console.log(`My name is ${sillyName}`);
*/

import superheroes from 'superheroes';
console.log(`Iam ${superheroes.random()}!`);
console.log(superheroes.all);