## Index
Setup
```
$ mongoimport persons.json -d contactData -c contacts --jsonArray
```

```mongodb
$ db.contacts.explain().find({"dob.age": {$gte: 60}})
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'contactData.contacts',
    indexFilterSet: false,
    parsedQuery: { 'dob.age': { '$gte': 60 } },
    queryHash: 'D4A2C216',
    planCacheKey: 'D4A2C216',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'COLLSCAN',
      filter: { 'dob.age': { '$gte': 60 } },
      direction: 'forward'
    },
    rejectedPlans: []
  },
}
```

```mongodb
$ db.contacts.explain("executionStats").find({"dob.age": {$gte: 60}})
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'contactData.contacts',
    indexFilterSet: false,
    parsedQuery: { 'dob.age': { '$gte': 60 } },
    queryHash: 'D4A2C216',
    planCacheKey: 'D4A2C216',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'COLLSCAN',
      filter: { 'dob.age': { '$gte': 60 } },
      direction: 'forward'
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 1328,
    executionTimeMillis: 4,
    totalKeysExamined: 0,
    totalDocsExamined: 5000,
    executionStages: {
      stage: 'COLLSCAN',
      filter: { 'dob.age': { '$gte': 60 } },
      nReturned: 1328,
      executionTimeMillisEstimate: 0,
      works: 5002,
      advanced: 1328,
      needTime: 3673,
      needYield: 0,
      saveState: 5,
      restoreState: 5,
      isEOF: 1,
      direction: 'forward',
      docsExamined: 5000
    }
  },
}
```

### Adding Index
```mongodb
// 1: asc, -1: desc
db.contacts.createIndex({"dob.age": 1})

db.contacts.createIndex({"dob.age": 1}, {background: true}) // create index in the background without locking the collection. Useful for production DB

db.contacts.explain("executionStats").find({"dob.age": {$gte: 60}})
// result
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'contactData.contacts',
    indexFilterSet: false,
    parsedQuery: { 'dob.age': { '$gte': 60 } },
    queryHash: 'D4A2C216',
    planCacheKey: '22069445',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'FETCH',
      inputStage: {
        stage: 'IXSCAN',
        keyPattern: { 'dob.age': 1 },
        indexName: 'dob.age_1',
        isMultiKey: false,
        multiKeyPaths: { 'dob.age': [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { 'dob.age': [ '[60, inf.0]' ] }
      }
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 1328,
    executionTimeMillis: 3,
    totalKeysExamined: 1328,
    totalDocsExamined: 1328,
    executionStages: {
      stage: 'FETCH',
      nReturned: 1328,
      executionTimeMillisEstimate: 0,
      works: 1329,
      advanced: 1328,
      needTime: 0,
      needYield: 0,
      saveState: 1,
      restoreState: 1,
      isEOF: 1,
      docsExamined: 1328,
      alreadyHasObj: 0,
      inputStage: {
        stage: 'IXSCAN',
        nReturned: 1328,
        executionTimeMillisEstimate: 0,
        works: 1329,
        advanced: 1328,
        needTime: 0,
        needYield: 0,
        saveState: 1,
        restoreState: 1,
        isEOF: 1,
        keyPattern: { 'dob.age': 1 },
        indexName: 'dob.age_1',
        isMultiKey: false,
        multiKeyPaths: { 'dob.age': [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { 'dob.age': [ '[60, inf.0]' ] },
        keysExamined: 1328,
        seeks: 1,
        dupsTested: 0,
        dupsDropped: 0
      }
    }
  }
}
```

### Compound Index
```mongodb
// order of index matters 
db.contacts.createIndex({"dob.age": 1, gender: 1})

db.contacts.explain().find({gender: "male", "dob.age": 35}) // index scan - order does not matter for query
db.contacts.explain().find({"dob.age": 35}) // index scan
db.contacts.explain().find({gender: "male"}) // collection scan

db.contacts.explain().find({"dob.age": 35}).sort({gender: 1}) // index scan
```

### Default Index
```mongodb
$ db.contacts.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  {
    v: 2,
    key: { 'dob.age': 1, gender: 1 },
    name: 'dob.age_1_gender_1'
  }
]
```

### Unique Index
```mongodb
db.contacts.createIndex({email: 1}, {unique: true})
```

### Partial Index
```mongodb
// create index only when gender is male
db.contacts.createIndex({"dob.age": 1}, {partialFilterExpression: {gender: "male"}})
db.contacts.explain().find({"dob.age": {$gt: 60}}) // collection scan because gender was not specified in query filter
db.contacts.explain().find({"dob.age": {$gt: 60}, gender: "male"}) // index scan
db.contacts.explain().find({"dob.age": {$gt: 60}, gender: "female"}) // collection scan

// create index only for age > 60
db.contacts.createIndex({"dob.age": 1}, {partialFilterExpression: {"dob.age": {$gt: 60}}})
```

### Unique + Partial Index
```mongodb
// mongo treats non-exsting value still as a value in index
// to create a unique index for existing emails
db.users.createIndex({email: 1}, {unique: true, partialFilterExpression: {email: {$exists: true}}})
```

### TTL Index for Dates
Data will get deleted automatically once expired.
Only available for single field (date type).
Useful for maintaining user session data or cart data which gets deleted after some day
```mongodb
db.sessions.createIndex({createdAt: 1}, {expireAfterSeconds: 10})
```

### MultiKey (Array) Index
Sample data
```mongodb
{
    "_id": ObjectId("asdasd"),
    "name": "Jay",
    "hobbies": ["Sports", "Cooking"],
    "addresses": [
        {"street": "Main Street"},
        {"street": "Second Street"}
    ]
}
```
MongoDB pulls out the elements of the array and store as indexes
```mongodb
db.contacts.createIndex({hobbies: 1})
db.contacts.find({hobbies: "Sports"}) // index scan

// embedded document becomes an index value
db.contacts.createIndex({addresses: 1})
db.contacts.find({"addresses.street": "Main Street"}) // collection scan
db.contacts.find({addresses: {street: "Main Street"}}) // index scan

// address street value becomes an index value
db.contacts.createIndex({"addresses.street": 1})
db.contacts.find({"addresses.street": "Main Street"}) // index scan
```

### Text Index
Index values are stored as splitted lower case words.
```mongodb
// sample data
{
    "_id": ObjectId("aaa"),
    "title": "A book",
    "description": "What an awesome book"
}
```
```mongodb
db.products.createIndex({description: "text"})
db.products.find({$text: {$search: "red book"}}) // searches for "red" and "book" keywords
db.products.find({$text: {$search: "\"red book\""}}) // searches for "red book" keyword

// check text score by projection
db.products.find({$text: {$search: "awesome t-shirt"}}, {score: {$meta: "textScore"}})
```
Text indexes are expensive so it might be a good idea to have only one text index per collection.
```mongodb
// combined text indexes
db.products.createIndex({title: "text", description: "text"})

// exclude specific words
db.products.find({$text: {$search: "awesome -t-shirt"}}) // exclue "t-shirt" word
```
```mongodb
// other options
db.products.createIndex({title: "text", description: "text"}, {
    default_language: "english",
    weights: {title: 1, description: 10}
})
db.products.find({$text: {$search: "red", $language: "english", $caseSensitive: false}})
```