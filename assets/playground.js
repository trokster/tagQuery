var init = function(){

    object_list = [
        { "id": "Allow dynamic components", "tags": ["task", "framework", "vue", "milestone"] },
        { "id": "Create framework", "tags": ["task", "in progress", "milestone"] },
        { "id": "Alter vue-loader", "tags": ["task", "vue", "framework", "TODO"] },
        { "id": "Integrate decimal.js", "tags": ["task", "UI", "display"] },
        { "id": "Integrate PouchDB", "tags": ["task", "DB", "vuex", "vue"] },
        { "id": "Create Tag hierarchy", "tags": ["task", "tags", "in progress", "milestone"] },
        { "id": "Create Tag Query", "tags": ["task", "done", "milestone", "tags"] },
    ]
    var cola = window.cola.d3adaptor(d3)
        .linkDistance(function(d){
            return d.length;
        })
        //.symmetricDiffLinkLengths(50)
        .avoidOverlaps(true)
        .handleDisconnected(false);

    var svg = d3.select("body")
        .append("svg")
        .attr("pointer-events", "all");

    svg.append('rect')
        .attr('class', 'background')
        .attr('width', "100%")
        .attr('height', "100%")
        .call(d3.behavior.zoom().on("zoom", redraw))

    var vis = svg
        .append('g')
        .attr('transform', 'translate(0,0) scale(1)');

    d3.selection.prototype.moveToFront = function() {  
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };
                
    function redraw() {
        vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        d3.selectAll(".shoop").attr("stroke-width", 1.5 / d3.event.scale);
        window.scale = d3.event.scale;
    }

    d3.select("svg")
        .style("width", "100%")
        .style("height", "100%")
        .style("position", "absolute")
        .style("top", "0px")
        .style("left", "0px")
        .style("box-sizing", "border-box");

    // Append menu div
    d3.select("body")
        .append("div")
        .attr("id", "div-menu")
        .style({
            width:"300px",
            height:"98vh",
            border: "solid rgba(0,0,0,.1) 1px",
            background: "rgba(0,0,0,.1)",
            zIndex: 10000,
            position: "fixed",
            right: "1vh",
            top: "1vh",
            boxSizing: "border-box"
        });

    var graph = {
        nodes: [],
        groups: [],
        links: [],
        constraints: []
    };

    var updateGraph = function(query){

        // TODO sometime --> keep positions of existing nodes
        while(graph.nodes.length > 0) graph.nodes.pop();
        while(graph.links.length > 0) graph.links.pop();
        while(graph.groups.length > 0) graph.groups.pop();
        while(graph.constraints.length > 0) graph.constraints.pop();

        var res = tagQuery(query, window.object_list);
        //console.log(JSON.stringify(res, null, 2));
        window.res = res;

        var to_process = [[res]];

        var process = function(param){
            var node = null;
            var item = param[0];
            var parent = null;
            if(param[1]) {
                parent = param[1];
                node = {
                    type: "node",
                    name: "[ " + item.tags.join(" - ") + " ]",
                    tags: item.tags,
                    width: 20*("[ " + item.tags.join(" - ") + " ]").length + 20,
                    height: 70,
                    x:0,
                    y:0,
                    needs_drawing: true,
                    __uuid : md5(item.depth + JSON.stringify(item.tags)),
                    ref : item,
                    depth: parent.depth + 1,
                    children: []
                };
            } else {
                node = {
                    type: "node",
                    name: "Root :: [ " + item.tags.join(" - ") + "]",
                    tags: item.tags,
                    width:  20*("Root :: [ " + item.tags.join(" - ") + "]").length + 20,
                    height: 70,
                    x:0,
                    y:0,
                    needs_drawing: true,
                    __uuid : md5(item.depth + JSON.stringify(item.tags)),
                    border: "orange",
                    ref: item,
                    depth: 0,
                    children: []
                };
            }
            graph.nodes.push(node);

            if(param[1]) {
                graph.links.push({
                    source: param[1],
                    target: graph.nodes[graph.nodes.length-1], // The leaf we just added
                    length: 250,
                    show: 150
                });
                param[1].children.push(graph.nodes[graph.nodes.length-1]);
            }

            var prev = null;
            var to_group = [graph.nodes.length-1];
            param[0].leaves.forEach(function(leaf){
                graph.nodes.push({
                    type: "leaf",
                    name: leaf.id,
                    tags: leaf.tags,
                    width: 16*("[ " + leaf.tags.join(" - ") + " ]").length + 5,
                    height: 70 + 50,
                    x:0,
                    y:0,
                    needs_drawing: true,
                    __uuid : md5(leaf.id + JSON.stringify(leaf.tags)),
                    border: "green",
                    ref: item,
                    depth: node.depth + 1,
                    children: []
                });

                graph.links.push({
                    source: node,
                    target: graph.nodes[graph.nodes.length-1], // The leaf we just added
                    length: 200,
                    show: true
                });
                node.children.unshift(graph.nodes[graph.nodes.length-1]);

                prev = graph.nodes.length;
                to_group.push(prev-1);
            });

            /*
            if(to_group.length > 1) {
                graph.groups.push({name: Math.random+"", leaves: to_group, color: "red"})
            }
            */

            param[0].nodes.forEach(function(item){
                to_process.push([item, node]);
            });
        };

        while(to_process.length > 0) {
            var param = to_process.shift();
            process(param);
        }

        // Apply constraints
        graph.links.forEach(function(link){
            graph.constraints.push({
                "axis":"y", 
                "left":graph.nodes.indexOf(link.source), 
                "right":graph.nodes.indexOf(link.target), 
                "gap":200, 
                "equality":true
            });
        });

        var items = {};
        var max_depth = 0;
        
        var to_process = [graph.nodes[0]];

        while(to_process.length > 0) {
            
            var node = to_process.pop();
            var leaves = [];
            var nodes = [];

            if(node.depth > max_depth) {
                max_depth = node.depth;
            }

            node.children.forEach(function(item){
                if(item.type == "leaf") {
                    leaves.push(item);
                } else {
                    nodes.push(item);
                    to_process.unshift(item);
                }
            });
            if(!items[node.depth]) items[node.depth] = [];

            /*var tmp = leaves.concat(nodes);

            if(tmp.length == 1) {
                graph.constraints.push({
                    "axis"      : "x", 
                    "left"      : graph.nodes.indexOf(node),
                    "right"     : graph.nodes.indexOf(tmp[0]),
                    "gap"       : 0,
                    "equality"  : true
                });
            } else if(tmp.length > 2 && tmp.length % 2 != 0 ) {
                graph.constraints.push({
                    "axis"      : "x", 
                    "left"      : graph.nodes.indexOf(node),
                    "right"     : graph.nodes.indexOf(tmp[Math.floor(tmp.length/2)]),
                    "gap"       : 0,
                    "equality"  : true
                });
            }*/

            items[node.depth] = items[node.depth].concat(leaves, nodes);
        }

        for(var i=0;i<=max_depth;i++) {
            if(items[i].length > 1) {
                for (var j=1;j<items[i].length;j++){
                    graph.constraints.push({
                        "axis"  : "x", 
                        "left"  : graph.nodes.indexOf(items[i][j-1]), 
                        "right" : graph.nodes.indexOf(items[i][j]), 
                        "gap"   : items[i][j-1].width / 2 + items[i][j].width / 2 + 50
                    });
                }
            }
        }        

        return graph;

    };


    var pad = 2;


    var updateCola = function(){

        cola
            .nodes(graph.nodes)
            .links(graph.links)
            .groups(graph.groups)
            //.flowLayout('x', 1500)
            //.jaccardLinkLengths(500)
            .constraints(graph.constraints)
            //.symmetricDiffLinkLengths(250)
            .start(100,100,100);

        /*vis.selectAll(".group")
            .data(graph.groups)
            .enter().append("rect")
            .attr("rx", 8).attr("ry", 8)
            .attr("class", "group")
            .attr("stroke", function(d){return d.color || "pink"})
            .call(cola.drag);
        */

        vis.selectAll(".link")
            .data(graph.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("pointer-events", "none")
            .attr("stroke-width", function(d){
            if(d.show) return 1;
            return 0;
            });

        vis.selectAll(".link")
            .data(graph.links)
            .exit().remove();

        vis.selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(cola.drag);
        
        vis.selectAll(".node")
            .data(graph.nodes)
            .exit().remove();
    }

    updateCola();

    cola.on("tick", function () {        
        
        vis.selectAll(".link").attr("d", function(d){

          return "M"+d.source.x+","+d.source.y+ "L" + d.target.x + "," + d.target.y;

        });
        
        vis.selectAll(".node").attr("transform", function (d) {

            // Ok check if it needs drawing
            // This is brute force check, should really check if we need to
            // move things around
            if(d.needs_drawing || d3.select(this).attr("__uuid") != d.__uuid) {

                // Cleanup first :)
                d3.select(this).selectAll("*").remove();
                d3.select(this).html("");

                d3.select(this)
                    .append("rect")
                    .attr("width", d.width - 2 * pad)
                    .attr("height", d.height - 2 * pad)
                    .attr("rx", 5).attr("ry", 5)
                    .attr("stroke", d.border ||"gray")
                    .attr("stroke-width", 1.5)
                    .attr("fill", "white")
                    .attr("class", "shoop");

                d3.select(this)
                    .append("text").text(d.name)
                    .attr("x", d.width/2)
                    .attr("y", d.type == "leaf" ? d.height/2+pad - 20 : d.height/2+pad)
                    .attr("font-family", "Quicksand")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "20px")
                    .attr("font-weight", "bold")
                    .attr("fill", "black");
                
                if(d.type == "leaf") {
                    d3.select(this)
                        .append("text").text("[ " + d.tags.join(" - ") + " ]")
                        .attr("x", d.width/2)
                        .attr("y", d.height/2+pad + 20)
                        .attr("font-family", "Quicksand")
                        .attr("text-anchor", "middle")
                        .attr("font-size", "20px")
                        .attr("font-weight", "bold")
                        .attr("fill", "black");
                }


                d.needs_drawing = false;
                d3.select(this).attr("__uuid", d.__uuid);

            }

            return "translate(" + (d.x - d.width / 2 + pad) + "," + (d.y - d.height / 2 + pad) + ")"; 
        });

        vis.selectAll(".node").moveToFront();
        /*
        vis.selectAll(".group").attr("x", function (d) { return d.bounds.x-20; })
            .attr("y", function (d) { return d.bounds.y-20; })
            .attr("width", function (d) { return d.bounds.width()+40; })
            .attr("height", function (d) { return d.bounds.height()+40; })
            .attr("stroke-width", 1.5 * 1/window.scale)
            .attr("fill", "white");
        */
        
    });


    // So we can play around in console should we need to
    window.graph        = graph ;
    window.updateCola   = updateCola;
    window.updateGraph  = updateGraph;
    window.object_list  = object_list;

    window.cola2 = cola ;


    d3.select("#div-menu").html("<div style='width:100%;text-align:center;padding:5px;box-sizing:border-box'><span style='font-family:Quicksand;'>Edit query</span><br/><br/><input style='padding:5px;font-family:Quicksand;font-size:20px' id='tagquery' value='[\"milestone\", []]'></input><br/><small><i>Not sure how to avoid initial overlap, if you have an idea, drop me a pm please :)</i></small></div>");
    d3.select("#tagquery").on("change", function(){
        var str = this.value;
        try {
            var param = JSON.parse(str);
            if(param instanceof Array) {
                updateGraph(param);
                updateCola();
            } else {
                alert("Couldn't interpret input: " + str);
            }
        } catch(e){
            alert("Couldn't interpret input: " + str);
        }
    });

    updateGraph(["milestone", []]);
    updateCola();

}

window.onload = init;
