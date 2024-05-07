## Read Operations

### Data Setup
```mongodb
$ mongoimport tv-shows.json -d movieData -c movies --jsonArray --drop
```

### Operators
Query Selectors
- Comparsion
```mongodb
// equal
db.movies.find({runtime: 60})
db.movies.find({runtime: {$eq: 60}})

// not equal
db.movies.find({runtime: {$ne: 60}})

// less than
db.movies.find({runtime: {$lt: 40}})

// less than or equal to
db.movies.find({runtime: {$lte: 42}})

// greater than
db.movies.find({"rating.average": {$gt: 9}})

// working with arrays
db.movies.find({genres: "Action"}) // contains
db.movies.find({genres: ["Drama"]}) // exact equality

// in - runtime is either 30 or 42
db.movies.find({runtime: {$in: [30, 42]}})

// not in - runtime is not 30 or 42
db.movies.find({runtime: {$nin: [30, 42]}})
```
- Logical
```mongodb
// and
db.movies.find({"rating.average": {$gt: 9.3}, genres: "Drama"})
db.movies.find({$and: [
    {"rating.average": {$gt: 9.3}},
    {genres: "Drama"}
  ]
})
db.movies.find({genres: "Drama", genres: "Horror"}).count() // 23 - value "Drama" gets replaced by "Horror"
db.movies.find({$and: [{genres: "Drama"}, {genres: "Horror"}]}).count() // 17 - and operator is useful when working with same field

// or
db.movies.find({$or: [
    {"rating.average": {$lt: 5}}, 
    {"rating.average": {$gt: 9.3}}
  ]
})

// nor
db.movies.find({$nor: [
    {"rating.average": {$lt: 5}}, 
    {"rating.average": {$gt: 9.3}}
  ]
})

// not
db.movies.find({runtime: {$not: {$eq: 60}}})
```
- Element
```mongodb
// data setup
db.users.insertMany([
    {name: "Jay", hobbies: [{title: "Sports", frequency: 3}, {title: "Cooking", frequency: 6}], phone: 0212341234},
    {name: "John", hobbies: [{title: "Cars", frequency: 2}, {title: "Cooking", frequency: 5}], phone: "123123", age: 30},
    {name: "Sam", hobbies: [{title: "Sports", frequency: 2}, {title: "Padel", frequency: 3}], phone: "142424", age: null}
])

// exists operator
db.users.find({age: {$exists: true}}).count() // returns John and Sam
// to make sure that field has a value
db.users.find({age: {$exists: true, $ne: null}}) // returns John

// type operator
db.users.find({phone: {$type: "number"}}) // returns Jay
db.users.find({phone: {$type: ["number", "string"]}}) // returns all Jay, John, Sam
```
- Evaluation
```mongodb
// regex
db.movies.find({summary: {$regex: /musical/}}) // not efficient

// expr
db.sales.insertMany([{volume: 100, target: 120}, {volume: 89, target: 80}, {volume: 200, target: 177}])
db.sales.find({$expr: {$gt: ["$volume", "$target"]}}) // returns where volume > target
db.sales.find({$expr: {
    $gt: [{$cond: {
        if: {$gte: ["$volume", 190]}, 
        then: {$subtract: ["$volume", 30]},
        else: "$volume"
    }}, "$target"]
}}) // returns {volume: 89, target: 80}
```
- Array
```mongodb
db.users.find({"hobbies.title": "Sports"})

// size
db.users.find({hobbies: {$size: 2}}) // exact match only for size operator

// all
db.movies.find({genres: {$all: ["Comedy", "Drama"]}}) // order does not matter

// elemMatch
db.users.find({$and: [{"hobbies.title": "Sports"}, {"hobbies.frequency": {$gte: 2}}]}) // wrong - filters don't get applied to the same element
db.users.find({hobbies: {$elemMatch: {title: "Sports", frequency: {$gte: 3}}}})
```
- Comments
- Geospatial
Sample data
```mongodb
db.places.insertOne({
    name: "Seolleung",
    location: {
        type: "Point",
        coordinates: [127.0471528, 37.5073294]
    }
})
db.places.insertOne({
    name: "Bongeunsa Temple",
    location: {
        type: "Point",
        coordinates: [127.0573766, 37.514852]
    }
})
db.places.insertOne({
    name: "Lotte World",
    location: {
        type: "Point",
        coordinates: [127.098167, 37.5111158]
    }
})
```
```mongodb
// geospatial index
db.places.createIndex({location: "2dsphere"})

db.places.find({location: {$near: {
    $geometry: {
        type: "Point",
        coordinates: [127.0562396, 37.5058645]
    },
    $minDistance: 10,
    $maxDistance: 3000
}}})

// finding places within a specific area
db.places.find({location: {$geoWithin: {
    $geometry: {
        type: "Polygon",
        coordinates: [[
            [127.038519, 37.508610], // p1
            [127.060065, 37.514181], // p2
            [127.062834, 37.509264], // p3
            [127.042596, 37.502769], // p4
            [127.038519, 37.508610]  // p1
        ]]
    }
}}})

// saving a polygon of an area
db.areas.insertOne({
    name: "part of Gangnam",
    area: {
        type: "Polygon",
        coordinates: [[
            [127.038519, 37.508610], // p1
            [127.060065, 37.514181], // p2
            [127.062834, 37.509264], // p3
            [127.042596, 37.502769], // p4
            [127.038519, 37.508610]  // p1
        ]]
    }
})

// finding if a point is within a specific area
db.areas.createIndex({area: "2dsphere"})
db.areas.find({
    area: {
        $geoIntersects: {
            $geometry: {
                type: "Point",
                coordinates: [127.0471528, 37.5073294]
            }
        }
    }
})

// finding places within a specific radius
db.places.find({location: {
    $geoWithin: {
        $centerSphere: [
            [127.0562396, 37.5058645], // center of point
            2 / 6378.1 // 2km to radians
        ]
    }
}})
```
Note that `$near` query returns all places within a radius sorted by nearest proximity but `$geoWithin` returns unsorted list.

Projection Operators
- $
- $elemMatch
- $meta
- $slice

### Cursors
```javascript
// shell uses JavaScript
const dataCursor = db.movies.find()

dataCursor.next()

dataCursor.forEach(doc => {printjson(doc)})

dataCursor.hasNext()
```

#### Sorting
```mongodb
// 1: asc, -1: desc
db.movies.find().sort({"rating.average": -1, runtime: 1}) // order by rating.average desc, runtime asc
```

#### Skipping & Limiting
```mongodb
// note: order of operation does not matter for cursors
db.movies.find().sort({"rating.average": -1, runtime: 1}).skip(100).limit(1)
```

#### Projection
```mongodb
// 1: include, 0 or not-mentioned: exclude
// for _id, it is included by default unless "_id: 0" is specified
db.movies.find({}, {id: 1, name: 1, "rating.average": 1, _id: 0}).sort({"rating.average": -1, runtime: 1}).skip(100).limit(1)

// filter and projection
db.movies.find({genres: "Drama"}, {genres: {$elemMatch: {$eq: "Horror"}}})

// slice
db.movies.find({"rating.average": {$gt: 9}}, {genres: {$slice: [1, 2]}, name: 1}) // skip first genre and display next 2 genres
```