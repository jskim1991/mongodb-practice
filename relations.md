# Schema & Relations
- MongoDB does not enforce schemas 
- but does not mean that schemas cannot be used

### Data Types
| Type | Example |
| ---- | ------- |
| Text | "Jay"   |
| Boolean | true |
| Integer (int32) | 55 |
| NumberLong (int64) | 10000000000 |
| NumberDecimal | 12.99 |
| ObjectId | ObjectId("asdasd") |
| ISO Date | ISODate("2018-09-09") |
| Timestamp | Timestamp(11421532) |
| Embedded Document | {"key": {...}} |
| Array | {"key": [...]} |

```mongodb
db.companies.insertOne({
    name: "some company", 
    isStartup: true, 
    employeeCount: 33, 
    funding: 12345678901234567890, 
    details: {ceo: "Jay"}, 
    tags: ["awesome", "growing"],
    foundingDate: new Date(), 
    lastUpdatedAt: new Timestamp()
})
```

```mongodb
$ db.companies.find()
[
  {
    _id: ObjectId('661f2979a6cd2ed8da7ee0d7'),
    name: 'some company',
    isStartup: true,
    employeeCount: 33,
    funding: 12345678901234567000, // input number was rounded off
    details: { ceo: 'Jay' },
    tags: [ 'awesome', 'growing' ],
    foundingDate: ISODate('2024-04-17T01:44:25.450Z'),
    lastUpdatedAt: Timestamp({ t: 1713318265, i: 2 })
  }
]
```

#### Numbers
```mongodb
// int32
db.numbers.insertOne({a: NumberInt(1)})

// int64
db.numbers.insertOne({b: NumberLong("7489729384792")}) 

// high-precision double (128-bit decimal)
db.numbers.insertOne({c: NumberDecimal("12.99")}) 

// default is float64
```

### Relations

#### One To One
```mongodb
// Embedded
db.patients.insertOne({
    name: "Jay", 
    age: 30, 
    diseaseSummary: {
        diseases: ["cold"]
    }
})

// References
db.persons.insertOne({
    _id: "661f4ee7a6cd2ed8da7ee0df",
    name: "Jay",
    age: 30
})

db.cars.insertOne({
    model: "Kia",
    price: 40000,
    owner: ObjectId("661f4ee7a6cd2ed8da7ee0df")
})

var personId = db.persons.findOne({name: "Jay"})._id
db.cars.findOne({owner: ObjectId(personId)})
```

#### One To Many
```mongodb
// Embedded
db.questionThreads.insertOne({
    creator: "Jay",
    question: "How much is this done?",
    answers: [
        {
            text: "Not sure"
        },
        {
            text: "Done by magic"
        }
    ]
})

// Reference
db.questionThreads.insertOne({
    creator: "Jay",
    question: "How much is this done?",
    answers: ["q1a1", "q1a2"]
})
db.answers.insertMany([
    {
        _id: "q1a1",
        text: "Not sure"
    },
    {
        _id: "q1a2",
        text: "Done by magic"
    }
])
```

#### Many To Many
```mongodb
// Embedded
db.customers.insertOne({
    name: "Jay",
    age: 30,
    orders: [
        {
            name: "Book1",
            price: 12.99,
            quantity: 2,
        }
    ]
})

// Reference
db.products.insertOne({
    _id: ObjectId("661f52dfa6cd2ed8da7ee0e3"),
    name: "Book1",
    price: 12.99
})

db.customers.insertOne({
    _id: ObjectId("661f5307a6cd2ed8da7ee0e4"),
    name: "Jay",
    age: 30
})

// option 1
db.orders.insertOne({
    productId: ObjectId("661f52dfa6cd2ed8da7ee0e3"),
    customerId: ObjectId("661f5307a6cd2ed8da7ee0e4")
})

// option 2
db.orders.deleteMany({})
db.customers.updateOne({name: "Jay"}, {$set: {orders: [
    {
        productId: ObjectId("661f52dfa6cd2ed8da7ee0e3"),
        quantity: 2,
    }
]}})
```

### Merging Relations
```mongodb
// products
$ db.products.find()
[
  {
    _id: ObjectId('661f52dfa6cd2ed8da7ee0e3'),
    name: 'Book1',
    price: 12.99
  }
]

// customers
$ db.customers.find()
[
  {
    _id: ObjectId('661f5307a6cd2ed8da7ee0e4'),
    name: 'Jay',
    age: 30,
    orders: [
      { productId: ObjectId('661f52dfa6cd2ed8da7ee0e3'), quantity: 2 }
    ]
  }
]

// merging
$ db.customers.aggregate(
    [
        {
            $lookup: {
                from: "products", 
                localField: "orders.productId", 
                foreignField: "_id", 
                as: "orderItems"
            }
        }
    ]
)

// result
[
  {
    _id: ObjectId('661f5307a6cd2ed8da7ee0e4'),
    name: 'Jay',
    age: 30,
    orders: [
      { productId: ObjectId('661f52dfa6cd2ed8da7ee0e3'), quantity: 2 }
    ],
    orderItems: [
      {
        _id: ObjectId('661f52dfa6cd2ed8da7ee0e3'),
        name: 'Book1',
        price: 12.99
      }
    ]
  }
]
```

### Practice
```mongodb
// it might be better to have users aside from posts 
// because users can create many posts and 
// updating user info in multiple posts can be expensive
db.users.insertMany([
    {
        _id: ObjectId('661f7dd9a6cd2ed8da7ee0e7'),
        name: "Jay",
        age: 30, 
        email: "jay@email.com"
    },
    {
        _id: ObjectId('661f7dd9a6cd2ed8da7ee0e8'),
        name: "Su",
        age: 30, 
        email: "su@email.com"
    }
])

// posts and comments are tightly coupled
db.posts.insertOne({
    title: "first post",
    text: "content of the post",
    tags: ["new", "hit"],
    creator: ObjectId('661f7dd9a6cd2ed8da7ee0e7'),
    comments: [
        {
            text: "content of comment 1",
            author: ObjectId('661f7dd9a6cd2ed8da7ee0e8')
        },
        {
            text: "content of comment 2",
            author: ObjectId('661f7dd9a6cd2ed8da7ee0e7')
        }
    ]
})
```

### Schema Validation
```mongodb
db.createCollection("posts", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["title", "text", "creator", "comments"],
            properties: {
                title: {
                    bsonType: "string",
                    description: "must be a string (required)"
                },
                text: {
                    bsonType: "string",
                    description: "must be a string (required)"
                },
                creator: {
                    bsonType: "objectId",
                    description: "must be an object id (required)"
                },
                comments: {
                    bsonType: "array",
                    description: "must be an array (required)",
                    items: {
                        bsonType: "object",
                        required: ["text", "author"],
                        properties: {
                            text: {
                                bsonType: "string",
                                description: "must be a string (required)"
                            },
                            author: {
                                bsonType: "objectId",
                                description: "must be an object id (required)"
                            }
                        }
                    }
                }
            }
        }
    }
})

// updating schema
db.runCommand({collMod: "posts", validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["title", "text", "creator", "comments"],
            properties: {
                title: {
                    bsonType: "string",
                    description: "must be a string (required)"
                },
                text: {
                    bsonType: "string",
                    description: "must be a string (required)"
                },
                creator: {
                    bsonType: "objectId",
                    description: "must be an object id (required)"
                },
                comments: {
                    bsonType: "array",
                    description: "must be an array (required)",
                    items: {
                        bsonType: "object",
                        required: ["text", "author"],
                        properties: {
                            text: {
                                bsonType: "string",
                                description: "must be a string (required)"
                            },
                            author: {
                                bsonType: "objectId",
                                description: "must be an object id (required)"
                            }
                        }
                    }
                }
            }
        }
    },
    validationAction: "error" // error is default value
})
```