# tagQuery
Creates hierarchy from initial query and # of tag occurence

__Behavior__:
- You feed it a list of objects with tags
- tagQuery(\<query\>, [ \<objs\> ])

- Query is of the form:
  [ "tag001", "tag002", \< include [] if you want to also display the objects not matching the intial query \> ]
  
- You can specify a subquery inside a query: [ "tag001", "tag002", ["tag003", []] ] : This would return first query, discarding non matches, and from within that selection it would filter out tag003, and bring back the rest in a separate node.


__Examples__:

```
var object_list = [
  {id: '001', tags: ['tag01', 'tag02', 'tag03']},
  {id: '002', tags: ['tag04', 'tag02', 'tag05']},
  {id: '003', tags: ['tag03', 'tag01', 'tag02']},
  {id: '004', tags: ['tag01', 'tag02', 'tag03']},
];

tagQuery([], object_list)

// gives a simple tree/hierarchy containing all objects ordered
// by highest tag occurences

{
    "tags": ["tag02"],
    "nodes": [{
        "tags": ["tag02", "tag01"],
        "nodes": [{
            "tags": ["tag02", "tag01", "tag03"],
            "nodes": [],
            "leaves": [{
                "id": "001",
                "tags": ["tag01", "tag02", "tag03"]
            }, {
                "id": "003",
                "tags": ["tag03", "tag01", "tag02"]
            }, {
                "id": "004",
                "tags": ["tag01", "tag02", "tag03"]
            }],
            "depth": 2
        }, {
            "tags": ["tag02"],
            "nodes": [],
            "leaves": [{
                "id": "002",
                "tags": ["tag04", "tag02", "tag05"]
            }],
            "depth": 2
        }],
        "leaves": [],
        "depth": 1
    }],
    "leaves": [],
    "depth": 0
}

// Now lets extract a directed hierarchy, showing tag03, tag02 first then the rest

tagQuery(["tag03", "tag02", []], object_list)

// This returns

{
    "tags": ["tag02", "tag03"],
    "nodes": [{
        "tags": ["tag02", "tag03", "tag01"],
        "nodes": [],
        "leaves": [{
            "id": "001",
            "tags": ["tag01", "tag02", "tag03"]
        }, {
            "id": "003",
            "tags": ["tag03", "tag01", "tag02"]
        }, {
            "id": "004",
            "tags": ["tag01", "tag02", "tag03"]
        }],
        "depth": 1
    }, {
        "tags": [],
        "nodes": [],
        "leaves": [{
            "id": "002",
            "tags": ["tag04", "tag02", "tag05"]
        }],
        "depth": 1
    }],
    "leaves": [],
    "depth": 0
}

// And lastly if we want ONLY the listed tags
tagQuery(["tag03", "tag02"], object_list)

{
    "tags": ["tag02", "tag03"],
    "nodes": [{
        "tags": ["tag02", "tag03", "tag01"],
        "nodes": [],
        "leaves": [{
            "id": "001",
            "tags": ["tag01", "tag02", "tag03"]
        }, {
            "id": "003",
            "tags": ["tag03", "tag01", "tag02"]
        }, {
            "id": "004",
            "tags": ["tag01", "tag02", "tag03"]
        }],
        "depth": 1
    }],
    "leaves": [],
    "depth": 0
}

```
