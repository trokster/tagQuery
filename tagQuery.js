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
        var to_process = [root];
        root.data = wdata;

        var classify= function (node){

            var forward_query = [];
            var original_tags = array_flatten(node.tags);
            var show_discarded = false;

            // Set node tags based on query
            node.query.forEach(function(item){
                if(typeof(item) == "string") {
                    node.tags.push(item);
                } else if(item.length && item.length > 0) {
                    // This is a not a tag, needs to be passed to next query node if any
                    // Last wins, others ignored
                    forward_query = item;
                } else if(item.length == 0) {
                    // If [], keep discarded
                    show_discarded = true;
                }
            });

            node.tags = array_flatten(node.tags);

            if(node.query.length == 0) {
                // Fetch highest tag count
                var tag_count = {};
                var highest_tag_count = 0;
                var highest_tag_name  = "";

                node.data.forEach(function(item){
                    item.tags.forEach(function(tag){

                        // Ignore current tags
                        if(node.tags.indexOf(tag) != -1) return;

                        tag_count[tag] = (tag_count[tag] || 0) + 1;

                        if(tag_count[tag] > highest_tag_count) {
                            highest_tag_count   = tag_count[tag];
                            highest_tag_name    = tag;
                        }
                    });
                });

                // If max count = 1, add everything as leaves
                if(highest_tag_count == 1) {
                    node.data.forEach(function(item){
                        node.leaves.push(item);
                    });

                    delete(node.data);
                    delete(node.query);

                    return;
                } else {
                    // We reset this node with the highest tag count and request an encore
                    node.query = [highest_tag_name, []];
                    to_process.unshift(node);

                    // Exit current run
                    return;
                }
            }

            var forward_data = [];
            var discarded_data = [];

            node.data.forEach(function(item){
                // Find tags matches
                if(array_in_array(node.tags, item.tags)){
                    // If full match, add as leaves
                    if(node.tags.length == 0 || node.tags.length == item.tags.length){
                        // Add as leaf
                        node.leaves.push(item);
                    } else {
                        // Add to data of direct child
                        forward_data.push(item);
                    }
                } else {
                    // Doesn't match current tags, but query may request it ( [] parameter )
                    discarded_data.push(item);
                }
            });

            if(forward_data.length > 0) {
                var to_add = {
                    query   : forward_query,
                    tags    : array_flatten(node.tags),
                    nodes   : [],
                    leaves  : [],
                    data    : forward_data,
                    depth   : node.depth + 1
                };
                node.nodes.push(to_add);
                to_process.unshift(to_add);
            }

            if(discarded_data.length > 0 && show_discarded) {
                var to_add = {
                    query   : [],
                    tags    : original_tags,
                    nodes   : [],
                    leaves  : [],
                    data    : discarded_data,
                    depth   : node.depth + 1
                };
                node.nodes.push(to_add);
                to_process.push(to_add);
            }

            delete(node.data);
            delete(node.query);

        };

        while(to_process.length > 0) {
            //if(to_process[0].depth > 5) break;
            classify(to_process.shift());
        }

        return root;
    }

    root.tagQuery = organizeTags;

})(window);
