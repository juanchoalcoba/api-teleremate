const fs = require("fs");
const data = JSON.parse(fs.readFileSync("catalogoupdate.json", "utf-8"));
const vendidos = data.filter(i => i.vendido === true).length;
const noVendidos = data.filter(i => i.vendido === false).length;
console.log(`Vendidos in JSON: ${vendidos}`);
console.log(`No Vendidos in JSON: ${noVendidos}`);
