## Aggregation Framework

Data Setup
```
$ mongoimport persons.json -d contactData -c persons --jsonArray
$ mongoimport friends.json -d contactData -c friends --jsonArray
```

```mongodb
db.persons.aggregate([
    { $match: { gender: "female" } },
    { $group: { _id: { stateName: "$location.state" }, totalCount: { $sum: 1 } } },
    { $sort: { totalCount: -1 } }
])
```
```mongodb
db.persons.aggregate([
    { $project: { _id: 0, gender: 1, fullName: { 
        $concat: [
            { $toUpper: { $substrCP: ["$name.first", 0, 1] } },
            { $substrCP: ["$name.first", 1, { $subtract: [ { $strLenCP: "$name.first" }, 1 ] } ]},
            " ", 
            { $toUpper: { $substrCP: ["$name.last", 0, 1] } },
            { $substrCP: ["$name.last", 1, { $subtract: [ { $strLenCP: "$name.last" }, 1 ] } ]}
        ] 
    } } }
])
```

Transforming location into geoJSON
```mongodb
db.persons.aggregate([
    { $project: {
        _id: 0, 
        name: 1, 
        email: 1,
        birthdate: { $toDate: "$dob.date" },
        age: "$dob.age",
        location: {
            type: "Point",
            coordinates: [
                { $convert: { input: "$location.coordinates.longitude", to: "double", onError: 0.0, onNull: 0.0 } }, 
                { $convert: { input: "$location.coordinates.latitude", to: "double", onError: 0.0, onNull: 0.0 } }
            ]
        } 
    } },
    { $project: { 
        email: 1,
        birthdate: 1,
        age: 1,
        location: 1,
        fullName: { 
        $concat: [
            { $toUpper: { $substrCP: ["$name.first", 0, 1] } },
            { $substrCP: ["$name.first", 1, { $subtract: [ { $strLenCP: "$name.first" }, 1 ] } ]},
            " ", 
            { $toUpper: { $substrCP: ["$name.last", 0, 1] } },
            { $substrCP: ["$name.last", 1, { $subtract: [ { $strLenCP: "$name.last" }, 1 ] } ]}
        ] 
    } } }
])
```

Using `$unwind` and `$addToSet` or `$push`
```mongodb
db.friends.aggregate([
    { $unwind: "$hobbies" },
    { 
        $group: { 
            _id: { age: "$age" }, 
            allHobbies: { $addToSet: "$hobbies" } 
        }
    }
])
```

Projection with Arrays
```mongodb
db.friends.aggregate([
    { $project: { _id: 0, examScore: { $slice: ["$examScores", 0, { $size: "$examScores" }] } } }
])
```

Filtering exam scores >= 60
```mongodb
db.friends.aggregate([
    { $project: { _id: 0, passedExams: { $filter: { input: "$examScores", as: "ex", cond: { $gte: ["$$ex.score", 60] } } } } }
])
```

Finding max exam score for each person then order by score desc
```mongodb
db.friends.aggregate([
    { $unwind: "$examScores" },
    { $project: { _id: 1, name: 1, age: 1, score: "$examScores.score" } },
    { $sort: { score: -1 } },
    { $group: { _id: "$_id", name: { $first: "$name"}, maxScore: { $max: "$score" } } },
    { $sort: { maxScore: - 1 } }
])
```

Distribution of data
```mongodb
db.persons.aggregate([
    { $bucket: { groupBy: "$dob.age", boundaries: [18, 30, 40, 50, 60, 70, 80, 90, 100], output: { 
        total: { $sum: 1 },
        averageAge: { $avg: "$dob.age" }
    } } }
])

// or use bucket auto
db.persons.aggregate([
    { $bucketAuto: { groupBy: "$dob.age", buckets: 5, output: {
        total: { $sum: 1 },
        averageAge: { $avg: "$dob.age" }
    } } }
])
```
Stages: Useful for pagination. It is important that `sort`, `skip`, `limit` are in order. Note that the order did not matter in `find()` operation.
```mongodb
db.persons.aggregate([
    { $match: { gender: "male" }},
    { $project: { _id: 0, name: { $concat: ["$name.first", " ", "$name.last"] }, birthdate: { $toDate: "$dob.date" } } },
    { $sort: { birthdate: 1 } },
    { $skip: 10 },
    { $limit: 10 }
])
```
Writing pipeline results into a new collection using `$out`,
```mongodb
db.persons.aggregate([
    { $project: {
        _id: 0, 
        name: 1, 
        email: 1,
        birthdate: { $toDate: "$dob.date" },
        age: "$dob.age",
        location: {
            type: "Point",
            coordinates: [
                { $convert: { input: "$location.coordinates.longitude", to: "double", onError: 0.0, onNull: 0.0 } }, 
                { $convert: { input: "$location.coordinates.latitude", to: "double", onError: 0.0, onNull: 0.0 } }
            ]
        } 
    } },
    { $project: { 
        email: 1,
        birthdate: 1,
        age: 1,
        location: 1,
        fullName: { 
        $concat: [
            { $toUpper: { $substrCP: ["$name.first", 0, 1] } },
            { $substrCP: ["$name.first", 1, { $subtract: [ { $strLenCP: "$name.first" }, 1 ] } ]},
            " ", 
            { $toUpper: { $substrCP: ["$name.last", 0, 1] } },
            { $substrCP: ["$name.last", 1, { $subtract: [ { $strLenCP: "$name.last" }, 1 ] } ]}
        ] 
    } } },
    { $out: "transformedPersons" }
])
```

Working with `$geoNear`
```mongodb
db.transformedPersons.createIndex({location: "2dsphere"})

db.transformedPersons.aggregate([
    { $geoNear: {
        near: {
            type: "Point",
            coordinates: [-18.6, -42.6]
        },
        maxDistance: 500000,
        query: { age: { $gt: 20 } },
        distanceField: "dist"
    }},
    { $limit: 5 }
])
```