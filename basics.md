## MongoDB
- Database holds multiple collections and each collection holds multiple documents
- Databases and collections are created lazily when a document is inserted
- Each document needs a unique ID (created by default if not passed in)

### CRUD operations
```mongodb
insertOne(data, options)
insertMany(data, options)

find(filter, options)
findOne(filter, options)

updateOne(filter, data, options)
updateMany(filter, data, options)
replaceOne(filter, data, options)

deleteOne(filter, options)
deleteMany(filter, options)
```

### CRUD examples
```mongodb
db.flights.insertOne({"departureAirport": "ICN","arrivalAirport": "YYZ","aircraft": "Boeing 787","distance": 32000,"intercontinental": true})
db.flights.insertMany([{"departureAirport": "MUC","arrivalAirport": "SFO","aircraft": "Airbus A380","distance": 12000,"intercontinental": true},{"departureAirport": "LHR","arrivalAirport": "TXL","aircraft": "Airbus A320","distance": 950,"intercontinental": false}])

db.flights.find()
db.flights.find({intercontinental: true})
db.flights.find({distance: {$gt: 10000}})
db.flights.findOne({distance: {$gt: 10000}})

db.flights.updateOne({distance: 12000}, {$set: {delete: true}})
db.flights.updateOne({_id: ObjectId('661cdb2b527c61a97e4d6f02')}, {$set: {delayed: true}})
db.flights.updateMany({}, {$set: {delete: true}})

db.flights.replaceOne({_id: ObjectId('661cdb2b527c61a97e4d6f02')}, {delayed: false})

db.flights.deleteOne({delete: true})
db.flights.deleteMany({})
```

### Cursor Object
`find()` returns cursor not the actual object
```mongodb
db.passengers.insertMany([{"name": "Max Schwarzmueller","age": 29},{"name": "Manu Lorenz","age": 30},{"name": "Chris Hayton","age": 35},{"name": "Sandeep Kumar","age": 28},{"name": "Maria Jones","age": 30},{"name": "Alexandra Maier","age": 27},{"name": "Dr. Phil Evans","age": 47},{"name": "Sandra Brugge","age": 33},{"name": "Elisabeth Mayr","age": 29},{"name": "Frank Cube","age": 41},{"name": "Karandeep Alun","age": 48},{"name": "Michaela Drayer","age": 39},{"name": "Bernd Hoftstadt","age": 22},{"name": "Scott Tolib","age": 44},{"name": "Freddy Melver","age": 41},{"name": "Alexis Bohed","age": 35},{"name": "Melanie Palace","age": 27},{"name": "Armin Glutch","age": 35},{"name": "Klaus Arber","age": 53},{"name": "Albert Twostone","age": 68},{"name": "Gordon Black","age": 38}])
db.passengers.find().forEach(pd => {printjson(pd)})
```

### Projection
```mongodb
// db.collection.find(include, exclude)
db.passengers.find({}, {name: 1, _id: 0})
```

### Accessing Structured Data
#### Querying with filter within a nested object
```mongodb
db.flights.updateMany({}, {$set: {status: {current: "on-time", lastUpdated: "1 hr ago"}}})
```
```json
{
    _id: ObjectId('661cdb2c527c61a97e4d6f04'),
    departureAirport: 'LHR',
    arrivalAirport: 'TXL',
    aircraft: 'Airbus A320',
    distance: 950,
    intercontinental: false,
    status: { current: 'on-time', lastUpdated: '1 hr ago' }
}
```
```mongodb
db.flights.find({"status.current": "on-time"})
```

#### Querying if an array contains a value
```mongodb
db.passengers.updateOne({name: 'Albert Twostone'}, {$set: {hobbies: ['tennis', 'piano']}})
```
```json
[
  {
    _id: ObjectId('661cdd5e527c61a97e4d6f18'),
    name: 'Albert Twostone',
    age: 68,
    hobbies: [ 'tennis', 'piano' ]
  }
]
```
```mongodb
db.passengers.find({ hobbies: 'tennis' })
```

### Resetting Database
```mongodb
db.dropDatabase()

// drop a single collection
db.myCollection.drop()
```