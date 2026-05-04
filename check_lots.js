require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI, {dbName: 'teleremate-db'}).then(async () => {
  const A = require('./src/models/Article');
  const articles = await A.find({auctionDate: new Date('2026-05-08T00:00:00.000Z'), auctionLot: { $in: ['77', '78', '79', '80', '81'] }}).lean();
  console.log(articles.map(a => ({ lot: a.auctionLot, id: a.lotNumber, status: a.status, cat: a.category })));
  process.exit(0);
});
