
### Local MongoDB 
```
mongodb://localhost:27017/<database>

db.products.createIndex({price: 1})
db.users.createIndex({email: 1}, {unique: true})
```

### Start backend
```shell
npm run start:server
```

### Start frontend
```shell
npm run start
```