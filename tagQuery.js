(function(root){

    // Checks if every item in arr1 is in arr2
    var array_in_array = function(arr1, arr2){
        return arr1.every(function(val) { return arr2.indexOf(val) >= 0; });
    };
    // Flatten array
    function array_flatten(a, r){
        if(!r){ r = []}
        for(var i=0; i<a.length; i++){
            if(a[i].constructor == Array){
                r.concat(flatten(a[i], r));
            }else{
                r.push(a[i]);
            }
        }
        return r;
    }

    //Remove duplicates in an array
    function array_dedupe(arr) {
        return arr.filter(function(v, i, a) {
            return a.indexOf(v) == i;
        });
    };


    // WARNING :: mutates data and queries
    var organizeTags = function(query, data) {

        var breakoff = 0;

        var test = [ ["tag001", "tag002", [ "tag003", [ "tag004", [] ] ]], [ "sec001", [] ] ];

        var root = {
            query   : query,
            tags    : [],
            nodes   : [],
            leaves  : [],
            data    : null,
            depth   : 0
        };

        var wdata = data.map(function(item){
            if(!item.tags) {
                item.tags = [];
            }
            return item;
        });

        // Copy and process data for root
        var to_process = [[root]];
        root.data = wdata;

        var process_query = function(queries, tags, dataset){
            if(dataset.length == 0) {
                return null;
            }

            var acc = [];
            var matches = [];
            var exact_matches = [];
            var discarded = [];
            var qacc = [];
            var keep_discarded = false;
            var discarded_query = null;
            var parent_leaves = [];
            
            console.log("Processing query: " + JSON.stringify(queries));

            while(queries.length > 0) {
                var query = queries.shift();
                console.log("Analyzing: " + JSON.stringify(query));
                if(typeof(query) == "string") {
                    if(qacc.length == 0) {
                        // We keep only the first strings, ignore those after a subquery
                        acc.push(query);
                    } else {
                        console.log("tag after subquery, ignored: " + query);
                    }
                } else if(query instanceof Array && query.length > 0) {
                    qacc.push(query);
                } else if(query instanceof Array && query.length == 0) {
                    keep_discarded = true;
                    break;
                } else {
                    console.log("Couldn't interpret: " + JSON.stringify(query));
                }
            }
            tags = array_dedupe(array_flatten(tags, acc));

            dataset.forEach(function(data){
                if( data.tags && array_in_array(tags, data.tags)) {
                    if(tags.length == data.tags.length) {
                        exact_matches.push(data);
                    } else {
                        matches.push(data);
                    }
                } else {
                    discarded.push(data);
                }
            });

            if(keep_discarded && discarded.length > 0) {
                // Fetch highest tag count
                var tag_count = {};
                var highest_tag_count = 0;
                var highest_tag_name  = "";

                discarded.forEach(function(item){
                    item.tags.forEach(function(tag){    

                        // Ignore current tags
                        if(tags.indexOf(tag) != -1) return;

                        tag_count[tag] = (tag_count[tag] || 0) + 1;

                        if(tag_count[tag] > highest_tag_count) {
                            highest_tag_count   = tag_count[tag];
                            highest_tag_name    = tag;
                        }
                    });
                });

                // If max count = 1, add everything as leaves
                if(highest_tag_count == 1) {
                    discarded.forEach(function(item){
                        parent_leaves.push(item);
                    });
                    discarded = [];
                } else {
                    discarded_query = [highest_tag_name, []];
                }

            }

            if(qacc.length == 0 && matches.length > 0) {
                // Fetch highest tag count
                var tag_count = {};
                var highest_tag_count = 0;
                var highest_tag_name  = "";

                matches.forEach(function(item){
                    item.tags.forEach(function(tag){    

                        // Ignore current tags
                        if(tags.indexOf(tag) != -1) return;

                        tag_count[tag] = (tag_count[tag] || 0) + 1;

                        if(tag_count[tag] > highest_tag_count) {
                            highest_tag_count   = tag_count[tag];
                            highest_tag_name    = tag;
                        }
                    });
                });

                // If max count = 1, add everything as leaves
                if(highest_tag_count == 1) {
                    matches.forEach(function(item){
                        exact_matches.push(item);
                    });
                    matches = [];
                } else {
                    qacc = [highest_tag_name, []];
                }

            }

            var res = {
                tags: tags,
                matches: matches,
                exact_matches: exact_matches,
                discarded : discarded,
                discarded_query: discarded_query,
                keep_discarded: keep_discarded,
                forward_queries: qacc,
                parent_leaves: parent_leaves
            };

            console.log("Result of query analysis: " + JSON.stringify(res, null, 2) );

            return res;

        }


        var classify = function(node, parent){

            var forward_query = [];
            var original_tags = array_flatten(node.tags);
            var show_discarded = false;

            if(node.query.length > 0 && typeof(node.query[0]) == "string" ) node.query = [node.query];

            var results = [];

            var dataset = node.data;
            while(node.query.length > 0) {
                var item = node.query.shift();
    
                var res = process_query(item, node.tags, dataset);
                dataset = res.discarded;
    
                if(!res) {
                    console.log("No data left to process");
                    break;
                }

                results.push(res);

                // If discarded is reserved, don't continue
                if(res.keep_discarded) break;

            }
            
            if(results.length > 0)
                node.tags = results[0].tags;

            while(results.length > 0) {
                var result = results.shift();
                
                result.exact_matches.forEach(function(item){
                    node.leaves.push(item);
                });

                result.parent_leaves.forEach(function(item){
                    if(parent) {
                        parent.leaves.push(item);
                    } else {
                        node.leaves.push(to_add);
                    }
                });

                if(result.matches.length > 0) {
                    var to_add = {
                        query   : result.forward_queries,
                        tags    : result.tags,
                        nodes   : [],
                        leaves  : [],
                        data    : result.matches,
                        depth   : node.depth + 1
                    };
                    node.nodes.push(to_add);
                    to_process.unshift([to_add, node]);
                }

                if(result.discarded.length > 0 && result.keep_discarded) {
                    var to_add = {
                        query   : result.discarded_query,
                        tags    : original_tags,
                        nodes   : [],
                        leaves  : [],
                        data    : result.discarded,
                        depth   : node.depth + 1
                    };
                    if(parent) {
                        parent.nodes.push(to_add);
                        to_process.unshift([to_add, parent]);
                    } else {
                        node.nodes.push(to_add);
                        to_process.unshift([to_add, node]);
                    }
                }
            }
        };
        
        while(to_process.length > 0) {
            classify.apply(null, to_process.shift());
        }

        console.log("tagQuery result: " + JSON.stringify(root, null, 4));
        return root;
    }

    root.tagQuery = organizeTags;

})(window);
