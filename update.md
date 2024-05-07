## Update Operations

```mongodb
// override an existing field
db.users.updateOne({_id: ObjectId('66270e67a6cd2ed8da7ee0f8')}, {
    $set: {
        hobbies: [
            {
                title: 'Sports',
                frequency: 5
            },
            {
                title: 'Cooking',
                frequency: 3
            },
            {
                title: 'Hiking',
                frequency: 1
            }
        ]
    }
})

// adding a new field
db.users.updateMany({"hobbies.title": "Sports"}, {
    $set: {
        isSporty: true
    }
})

// adding new fields
db.users.updateOne({_id: ObjectId('66270e67a6cd2ed8da7ee0f8')}, {
    $set: {
        age: 40,
        phone: 123141414
    }
})

// incrementing a value (negative values will decrement)
db.users.updateOne({name: 'Chris'}, {
    $inc: {
        age: 1
    }
})

// min
db.users.updateOne({name: 'Chris'}, {
    $min: {
        age: 35
    }
})

// dropping a field
db.users.updateMany({isSporty: true}, {$unset: {
    phone: "" // value here doesn't really matter
}})

// renaming a field
db.users.updateMany({}, {$rename: {
    age: "totalAge" // age -> totalAge
}})
```

#### Upsert
```mongodb
db.users.updateOne({name: "Maria"}, {
    $set: {
        age: 29,
        hobbies: [{title: "Cooking", frequency: 3}],
        isSporty: true
    }
}, {
    upsert: true
})

// notice how the name (query) is also set
{
    _id: ObjectId('662712d95317945962a26254'),
    name: 'Maria',
    age: 29,
    hobbies: [ { title: 'Cooking', frequency: 3 } ],
    isSporty: true
}
```

### Working with Arrays
#### Updating Matched Array Elements
```mongodb
db.users.updateMany({hobbies: {$elemMatch: {title: "Sports", frequency: {$gte: 3}}}}, {
    $set: {
        "hobbies.$.highFrequency": true // $ is first match
    }
})

// result
[
  {
    _id: ObjectId('66222254a6cd2ed8da7ee0f5'),
    name: 'Jay',
    hobbies: [
      { title: 'Sports', frequency: 3, highFrequency: true },
      { title: 'Cooking', frequency: 6 }
    ],
    isSporty: true
  },
  {
    _id: ObjectId('66270e67a6cd2ed8da7ee0f8'),
    name: 'Chris',
    hobbies: [
      { title: 'Sports', frequency: 5, highFrequency: true },
      { title: 'Cooking', frequency: 3 },
      { title: 'Hiking', frequency: 1 }
    ],
    isSporty: true,
    totalAge: 35
  }
]
```
#### Updating All Array Elements
```mongodb
db.users.updateMany({"totalAge": {$gt: 30}}, {
    $inc: {
        "hobbies.$[].frequency": -1
    }
})
```

#### Finding & Updating Specific Fields
```mongodb
db.users.updateMany({"hobbies.frequency": {$gt: 2}}, {
    $set: {
        "hobbies.$[el].goodFrequency": true
    }
}, {arrayFilters: [{"el.frequency": {$gt: 2}}]
})

// result
[
    // ...,
    {
        _id: ObjectId('66222254a6cd2ed8da7ee0f7'),
        name: 'Sam',
        hobbies: [
            { title: 'Sports', frequency: 2 },
            { title: 'Padel', frequency: 3, goodFrequency: true }
        ],
        isSporty: true,
        totalAge: null
    },
    // ...
]
```
#### Adding Elements to Arrays
```mongodb
// push allows duplicated value
db.users.updateOne({name: "Maria"}, {
    $push: {
        hobbies: {
            title: "Sports",
            frequency: 2
        }
    }
})

// addToSet allows unique values only
db.users.updateOne({name: "Maria"}, {
    $addToSet: {
        hobbies: {
            title: "Reading",
            frequency: 99
        }
    }
})

db.users.updateOne({name: "Maria"}, {
    $push: {
        hobbies: {
            $each: [
                {
                    title: "Wine",
                    frequency: 1
                },
                {
                    title: "Hiking",
                    frequency: 2
                }
            ],
            $sort: {frequency: -1} // frequency desc
        }
    }
})

// result
{
    _id: ObjectId('662712d95317945962a26254'),
    name: 'Maria',
    age: 29,
    hobbies: [
      { title: 'Cooking', frequency: 3, goodFrequency: true },
      { title: 'Sports', frequency: 2 },
      { title: 'Hiking', frequency: 2 },
      { title: 'Wine', frequency: 1 }
    ],
    isSporty: true
}
```

#### Removing Elements from Arrays
```mongodb
db.users.updateOne({name: "Maria"}, {
    $pull: {
        hobbies: {
            title: "Hiking"
        }
    }
})

// remove first or last element
// 1: last element, -1: first element
db.users.updateOne({name: "Maria"}, {
    $pop: {hobbies: 1}
})
```