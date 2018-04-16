var init = function(){

    window.object_list = [
        {id: '001', tags: ['tag01', 'tag02', 'tag03']},
        {id: '002', tags: ['tag04', 'tag02', 'tag05']},
        {id: '003', tags: ['tag03', 'tag01', 'tag02']},
        {id: '004', tags: ['tag01', 'tag02', 'tag03']},
    ];

    var cola = window.cola.d3adaptor(d3)
        .linkDistance(1)
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
            width:"20vw",
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
        links: []
    };

    var updateGraph = function(query){

        // TODO sometime --> keep positions of existing nodes
        while(graph.nodes.length > 0) graph.nodes.pop();
        while(graph.links.length > 0) graph.links.pop();
        while(graph.groups.length > 0) graph.groups.pop();

        var res = tagQuery(query, window.object_list);

        to_process = [[res]];
        
        var process = function(param){
            var node = null;
            var item = param[0];
            if(param[1]) {
                node = {
                    type: "node",
                    name: "[" + item.tags.join(" - ") + " ]",
                    tags: item.tags,
                    width: 20*("[ " + item.tags.join(" - ") + " ]").length + 20,
                    height: 70,
                    x:0,
                    y:0,
                    needs_drawing: true,
                    __uuid : md5(item.depth + JSON.stringify(item.tags))
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
                    border: "orange"
                };
            }
            graph.nodes.push(node);

            if(param[1]) {
                graph.links.push({
                    source: param[1],
                    target: graph.nodes[graph.nodes.length-1], // The leaf we just added
                    length: 20,
                    show: 150
                });
            }

            param[0].leaves.forEach(function(leaf){
                graph.nodes.push({
                    type: "leaf",
                    name: leaf.id,
                    tags: leaf.tags,
                    width: 20*leaf.id.length + 20,
                    height: 70,
                    x:0,
                    y:0,
                    needs_drawing: true,
                    __uuid : md5(leaf.id + JSON.stringify(leaf.tags)),
                    border: "green"
                });
                graph.links.push({
                    source: node,
                    target: graph.nodes[graph.nodes.length-1], // The leaf we just added
                    length: 5,
                    show: true
                });
            });

            param[0].nodes.forEach(function(item){
                to_process.push([item, node]);
            });
        };

        while(to_process.length > 0) {
            var param = to_process.shift();
            process(param);
        }

        return graph;
    };



    graph.nodes.push({
        name: "Hello",
        type: "item",
        width: 200,
        height: 300,
        needs_drawing: true,
        data: null
    });
    graph.nodes.push({
        name: "There",
        type: "item",
        width: 200,
        height: 300,
        needs_drawing: true,
        data: null
    });

    graph.links.push({
        source: graph.nodes[0],
        target: graph.nodes[1],
        length: 150,
        show: true
    });


    var pad = 2;


    var updateCola = function(){

        cola
            .nodes(graph.nodes)
            .links(graph.links)
            //.groups(graph.groups)
            //.flowLayout('x', 1500)
            //.jaccardLinkLengths(500)
            //.constraints(graph.constraints)
            .symmetricDiffLinkLengths(250)
            .start(50,50,50);

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
                    .attr("y", d.height/2+pad)
                    .attr("font-family", "Quicksand")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "20px")
                    .attr("font-weight", "bold")
                    .attr("fill", "black");

                d.needs_drawing = false;
                d3.select(this).attr("__uuid", d.__uuid);

            }

            return "translate(" + (d.x - d.width / 2 + pad) + "," + (d.y - d.height / 2 + pad) + ")"; 
        });
        
        /*group.attr("x", function (d) { return d.bounds.x-20; })
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


    d3.select("#div-menu").html("<div style='width:100%;text-align:center;padding:5px;box-sizing:border-box'><span>Edit query</span><br><input id='tagquery'></input></div>");
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

}

window.onload = init;