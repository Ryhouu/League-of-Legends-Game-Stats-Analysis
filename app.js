function final_project(){ 
    var fpath='./data/participant_records.csv'
    var serversJson = 'data/servers.json'
    var worldMapJson = './data/world.json'

    const bgColorPalette = ['#0a0908ff', '#22333bff', '#eae0d5ff', '#c6ac8fff', '#5e503fff']
    for (let i = 1; i <= 5; i ++) {
        d3.select('#section' + i).style('background-color', bgColorPalette[i-1])
    }
    
    // section0(fpath)
    section1(fpath)
    section2(fpath)
    section3(fpath)
    section4(fpath, serversJson, worldMapJson)
    section5(fpath)
}

var parseRecord = function(d){
    return {
        matchId: d.matchId,
        puuid: d.puuid,
        platform: d.platform,
        position: d.position,
        kills: parseInt(d.kills),
        deaths: parseInt(d.deaths),
        assists: parseInt(d.assists),
        win: d.win == 'True' ? 1 : 0,
        champId: parseInt(d.championId),
        champName: d.championName,
        gold: parseInt(d.goldEarned),
        cs: parseInt(d.totalMinionsKilled),
        totalDmg: parseInt(d.totalDamageDealt),
        totalDmgToChamps: parseInt(d.totalDamageDealtToChampions)
    }
}

var addSectionId = function(i, light) {
    var svg = d3.select('#section'+i)
    .append("svg")
    .attr("class", "section_id_" + (light ? "light" : "dark"))
    .attr("width", 75)
    .attr("height", 75)
    svg.append('polygon')
        .attr("points", "0, 0 0, 70 70,0")
    
    svg.append('text').text(i + ".")
        .attr("class", "section_id_text_" + (light ? "light" : "dark"))
        .attr("transform", "translate(11, 35)")
        .attr("font-size", "28px")
}

var section0 = function(fpath) {
    d3.csv(fpath, parseRecord).then(function(data) {
        console.log(JSON.stringify(data[0]))
    })
}

var section1 = function(fpath) {
    // scatter plot of gold vs. cs
    // TODO: switch: by position

    addSectionId(1, true)

    var margin = {top: 40, right: 30, bottom: 60, left: 470}
    var width = 550
    var height = 350
    var svg = d3.select('#section1_plot')
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    
    svg.append('rect')
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "lighegrey")
        .attr("opacity", .1)

    var title = svg.append('g')
            .attr('class', 'plot_title1')
            .attr("transform", "translate(-390, 160)")
    title.append("text")
            .attr("font-size", "48px")
            .text(`Total Gold v.s.`)
    title.append('text')
            .attr("dy", "1em")
            .attr("font-size", "48px")
            .text(`Minions Killed`)
    title.append("text")
            .attr("dy", "3em")
            .attr("font-size", "28px")
            .text(`Per Game, North America`)

    svg.append("text")
            .attr('class', 'axis_title')
            .attr("x", width)
            .attr("y", height + 40)
            .text("Minions Killed")

    svg.append("text")
            .attr('class', 'axis_title')
            .attr("transform", "rotate(-90)")
            .attr("y", -60)
            .attr("x", -(height / 2) + 130)
            .text("Gold Earned")

    selectCols = (d => ({
        gold: parseInt(d.goldEarned), 
        cs: parseInt(d.totalMinionsKilled),
        platform: d.platform
    }))

    d3.csv(fpath, selectCols).then(function(data){
        data = data.filter(d => d.platform === 'na1')
            var xScale = d3.scaleLinear()
                .domain([ d3.min(data, d => d.cs), d3.max(data, d => d.cs) ])
                .range([ 0, width ])
            svg.append('g')
                .attr('transform', `translate(0, ${height})`)
                .attr("class", "plot_axis")
                .call(d3.axisBottom(xScale))
        
            var yScale = d3.scaleLinear()
                .domain([ d3.min(data, d => d.gold), d3.max(data, d => d.gold) ])
                .range([ height, 0 ])
            svg.append('g')
                .attr("class", "plot_axis")
                .call(d3.axisLeft(yScale).ticks(6))
            
            svg.append('g').selectAll('.scatter')
                .data(data)
                .enter().append('circle')
                .attr('class', 'scatter')
                .attr('r', 2)
                .attr('cx', d => xScale(d.cs))
                .attr('cy', d => yScale(d.gold))
    })
}


var section2 = function(fpath) {

    addSectionId(2, true)

    var margin = {top: 100, right: 20, bottom: 75, left: 150}
    var width = 800
    var height = 200
    var legParams = {xOffset: width - 140, yOffset: 150, spacing: 4, itemHeight: 20}

    var svg = d3.select('#section2_plot')
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    svg.append("text")
        .attr('class', 'plot_title2')           
        .attr("y", -30)
        .text(`Average Damage Dealt by Position`)
    
    svg.append("text")
        .attr('class', 'axis_title')
        .attr("x", width / 2)
        .attr("y", height + 40)
        .text("Damage");

    selectCols = (d => ({
        totalDmgToChamps: parseInt(d.totalDamageDealtToChampions), 
        totalDmg: parseInt(d.totalDamageDealt),
        position: d.position
    }))

    d3.csv(fpath, selectCols).then(function(data){
        data = d3.rollup(data,
                v => ({
                    avgTotalDmgToChamps: d3.mean(v, d => d.totalDmgToChamps),
                    avgTotalDmg: d3.mean(v, d => d.totalDmg),
                    position: v[0].position
                }),
                d => d.position)
        positions = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'SUPPORT']
        var xScale = d3.scaleLinear()
                .domain([ 0, d3.max(data.values(), d => d.avgTotalDmg) ])
                .range([ 0, width ])
        svg.append('g')
                .attr("class", "plot_axis")
                .attr('transform', `translate(0, ${height})`)
                .call(d3.axisBottom(xScale))
        var yScale = d3.scaleBand()
                .domain(positions)
                .range([ 0, height ])
                .paddingInner(.2)
        svg.append('g')
                .attr("class", "plot_axis")
                .call(d3.axisLeft(yScale))
        var colorScale = d3.scaleOrdinal()
                .domain([0, 1])
                .range(["burlywood", "lightsteelblue"])
        
        svg.append('g').selectAll('.bar')
                .data(positions)
                .enter().append('rect')
                .attr('class', 'bar')
                .attr('y', d => yScale(d))
                .attr("fill", colorScale(0))
                .attr('height', yScale.bandwidth())
                .transition()
                .duration(2000)
                .attr('width', d => xScale(data.get(d).avgTotalDmg))
                // .delay((d, i) => 10 * i)
        
        var dmgToChamps = svg.append('g').selectAll('.bar')
            .data(positions)
            .enter().append('rect')
            .attr('fill', colorScale(1))
            .attr('y', d => yScale(d))
            .attr('height', yScale.bandwidth())
            

        d3.select('#totalDmgToChamps').on("click", function(event, d) {
            var isChecked = d3.select(this).property("checked")
            if (isChecked) {
                dmgToChamps
                .transition()
                .duration(1000)
                .attr('width', d => xScale(data.get(d).avgTotalDmgToChamps))
            }
            else {
                dmgToChamps
                .transition()
                .duration(1000)
                .attr('width', 0)
            }
        })

        var legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${legParams.xOffset}, ${legParams.yOffset})`)
        
        legend.selectAll('.legend_item')
            .data([0, 1])
            .enter().append('circle')
            .attr('class', 'legend_item')
            .attr('r', legParams.itemHeight / 2)
            .style('fill', d => colorScale(d))
            .attr('cx', 0)
            .attr('cy', (d, i) => i * (legParams.itemHeight + legParams.spacing))
      
        legend.selectAll('.legend_label')
            .data(["Total Damage Dealt", "Dealt to Champions"])
            .enter().append('text')
            .attr("fill", "lightgrey")
            .attr("font-size", "16px")
            .attr('transform', 
                (d, i) => `translate(${legParams.itemHeight}, ${legParams.spacing + i * (legParams.itemHeight + legParams.spacing)})`)
            .text(d => d)
    })

}


// var section3_v1 = function(fpath) {
//     // winrate/gamesplayed by champ
//     // circular bar chart
//     // interaction: hover to show champ name, hover bar to show the win rate
//     // more: stacked, by position

//     var margin = {top: 50, right: 50, bottom: 50, left: 50}
//     var width = 950
//     var height = 950
//     var innerRadius = 190
//     var outerRadius = Math.min(width, height) / 2 - 60

//     var svg = d3.select('#section3_plot')
//         .append("svg")
//             .attr("width", width + margin.left + margin.right)
//             .attr("height", height + margin.top + margin.bottom)
//         .append("g")
//             .attr("transform", "translate(" + (width / 2 + margin.left) + "," + (height / 2 + margin.top) + ")")

//     svg.append("text")
//         .attr('class', 'plot_title')
//         // .attr("x", (width / 2))             
//         // .attr("y", - (outerRadius + 60 + margin.top / 2))
//         .text(`Total Games Played by Champion`)

//     selectCols = (d => ({
//         win: d.win == 'True' ? 1 : 0, 
//         champId: parseInt(d.championId),
//         champName: d.championName,
//         position: d.position
//     }))

//     d3.csv(fpath, selectCols).then(function(data){
//         data = d3.sort(
//             d3.rollups(data, 
//                 v => ({
//                     champId: v[0].champId,
//                     champName: v[0].champName,
//                     position: v[0].position,
//                     winrate: d3.mean(v, d => d.win),
//                     gamesPlayed: v.length
//                 }),
//                 d => d.champId),
//             (a, b) => d3.descending(a[1].gamesPlayed, b[1].gamesPlayed))
//         data = [...d3.map(data, d => d[1])]
//         console.log(data)

//         var xScale = d3.scaleBand()
//                 .domain([...data.map(d => d.champName)])
//                 .range([0, 2 * Math.PI])
//                 .align(0)

//         console.log(xScale('Xayah'))
        
//         var yScale = d3.scaleRadial()
//                 .range([ innerRadius, outerRadius ])
//                 .domain([ 0, d3.max(data, d => d.gamesPlayed) ])

//         var fontsizeScale = d3.scaleLinear()
//             .domain([ 0, 2 * Math.PI ])
//             .range([ 16, 10 ])
        
        
//         svg.append('g').selectAll('path')
//             .data(data)
//             .enter().append('path')
//             .attr('class', 'radial_bar')
//             .attr('d', d3.arc()
//                 .innerRadius(innerRadius)
//                 .outerRadius(d => yScale(d.gamesPlayed))
//                 .startAngle(d => xScale(d.champName))
//                 .endAngle(d => (xScale(d.champName) + xScale.bandwidth()))
//                 .padAngle(0.01)
//                 .padRadius(innerRadius)
//             )
        
//         svg.append("g")
//             .selectAll("g")
//             .data(data)
//             .enter().append("g")
//               .attr("text-anchor", d => (xScale(d.champName) + xScale.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start")
//               .attr("transform", d => "rotate(" + ((xScale(d.champName) + xScale.bandwidth() / 2) * 180 / Math.PI - 90) + ")"+"translate(" + (yScale(d.gamesPlayed)+10) + ",0)")
//             .append("text")
//               .text(d => d.champName)
//               .attr("transform", d => (xScale(d.champName) + xScale.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)")
//               .style("font-size", d => fontsizeScale(xScale(d.champName)) + "px")
//               .attr("alignment-baseline", "middle")
//     })
// }

var section3 = function(fpath) {
    // winrate/gamesplayed by champ
    // circular bar chart
    // interaction: hover to show champ name, hover bar to show the win rate
    // more: stacked, by position

    addSectionId(3, false)

    var margin = {top: 40, right: 0, bottom: 0, left: 0}
    var width = 1100
    var height = 1100
    var legParams = {xOffset: -30, yOffset: 50, spacing: 4, itemHeight: 20}

    var innerRadius = 0.4 * Math.min(width, height) / 2
    var outerRadius = Math.min(width, height) / 2 - 60

    var svg = d3.select('#section3_plot')
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + (width / 2 + margin.left) + "," + (height / 2 + margin.top) + ")")

    var title = svg.append('g')
            .attr('class', 'plot_title3')
            .attr("transform", "translate(-170, -30)")
    title.append("text")
        .attr("font-size", "66px")
        .text(`# of Games`)
    title.append("text")
        .attr('dy', '1.2em')
        .attr("font-size", "32px")
        .text(`for each Champion`)

    var replayButton = svg.append('polygon')
        .attr("points", "0, 30 0, -30 50, 0")
        .attr("fill", "grey")
        .attr("transform", `translate(${width/2 - 90}, -${height/2 - 100})`)
    
    var replayLabel = svg.append('g')
            .append('text')
            .text('Display')
            .attr("font-size", "30px")
            .attr("font-family", "Courier")
            .attr("text-anchor", "end")
            .attr("transform", `translate(${width/2 - 100}, -${height/2 - 105})`)
    
    
    var legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${legParams.xOffset}, ${legParams.yOffset})`);

    var selectCols = (d => ({
        win: d.win == 'True' ? 1 : 0, 
        champId: parseInt(d.championId),
        champName: d.championName,
        position: d.position
    }))

    d3.csv(fpath, selectCols).then(function(data){
        positions = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'SUPPORT']

        data = d3.rollups(data, 
            v => {
                byPos = d3.rollup(v, vv => vv.length, d => d.position)
                res = {
                    champId: v[0].champId,
                    champName: v[0].champName,
                    totalGames: 0
                }
                for (let pos of positions) {
                    res[pos] = byPos.get(pos) | 0
                    res['totalGames'] += res[pos]
                }
                return res
            }, d => d.champName)
        
        data = d3.sort(data, (a, b) => d3.descending(a[1].totalGames, b[1].totalGames))
        champions = [...d3.map(data, d => d[0])]
        data = [...d3.map(data, d => d[1])]

        var stacked = d3.stack().keys(positions)(data)
        var color = d3.scaleOrdinal(d3.schemeSet3)
        var xScale = d3.scaleBand()
                .domain(champions)
                .range([0, 2 * Math.PI])
                .align(0)
        var yScale = d3.scaleRadial()
                .range([ innerRadius, outerRadius ])
                .domain([ 0, d3.max(data, d => d.totalGames) ])
        var fontsizeScale = d3.scaleLinear()
            .domain([ 0, 2 * Math.PI ])
            .range([ 16, 10 ])

        yAxis = (g => g
                .attr("text-anchor", "end")
                .call(g => g.selectAll("g")
                  .data(yScale.ticks(3).slice(1))
                  .join("g")
                    .attr("fill", "none")
                    .call(g => g.append("circle")
                        .attr("class", "radial_yAxis_circle")
                        .attr("r", yScale))
                    .call(g => g.append("text")
                        .attr("class", "radial_yAxis_text")
                        .attr("y", d => -yScale(d))
                        .attr("dy", "-0.4em")
                        .text(yScale.tickFormat(5, "s")))))
    
        svg.append("g").call(yAxis)
        const bars = svg.append('g')
        const labels = svg.append("g")

        function replay (event, d) {
            replayLabel.text("Replay")
            bars.selectAll("*").remove()
            labels.selectAll("*").remove()
            legend.selectAll("*").remove()

            bars.selectAll('.radial_bar')
                .data(stacked)
                .enter().append('g')
                .style('fill', d => color(d.key))
                .selectAll('path')
                .data(d => d)
                .enter().append('path')
                .attr('class', 'radial_bar')
                .transition().duration(600)
                .attr('d', d3.arc()
                .innerRadius(d => yScale(d[0]))
                .outerRadius(d => yScale(d[1]))
                .startAngle(d => xScale(d.data.champName))
                .endAngle(d => (xScale(d.data.champName) + xScale.bandwidth()))
                .padAngle(0.01)
                .padRadius(innerRadius))
                .delay((d, i) => i * 15)
        
            labels.selectAll("g")
                .data(data)
                .enter().append("g")
                .attr("text-anchor", d => (xScale(d.champName) + xScale.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start")
                .attr("transform", d => "rotate(" + ((xScale(d.champName) + xScale.bandwidth() / 2) * 180 / Math.PI - 90) + ")"+"translate(" + (yScale(d.totalGames)+10) + ",0)")
                .append("text")
                .attr("transform", d => (xScale(d.champName) + xScale.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)")
                .style("font-size", d => fontsizeScale(xScale(d.champName)) + "px")
                .attr("font-family", "Rajdhani")
                .attr("alignment-baseline", "middle")
                .transition().duration(600)
                .text(d => d.champName)
                .delay((d, i) => i * 15)

            legend.selectAll('.legend_item')
                .data(stacked)
                .enter().append('circle')
                .attr('class', 'legend_item')
                .attr('r', legParams.itemHeight / 2)
                .style('fill', d => color(d.key))
                .attr('cx', 0)
                .attr('cy', (d, i) => i * (legParams.itemHeight + legParams.spacing))
          
            legend.selectAll('.legend_label')
                .data(stacked)
                .enter().append('text')
                .attr('transform', 
                    (d, i) => `translate(${legParams.itemHeight}, ${legParams.spacing + i * (legParams.itemHeight + legParams.spacing)})`)
                .text(d => d.key)
        }

        replayButton
            .on("mouseover", (event, d) => {
                replayButton.attr("opacity", .4)
                replayLabel.attr("opacity", .4)
            })
            .on("click", replay)
            .on("mouseleave", (event, d) => {
                replayButton.attr("opacity", 1)
                replayLabel.attr("opacity", 1)
            })
        
        
    })
}


var section4 = function(fpath, serversJson, worldMapJson) {
    addSectionId(4, true)

    var margin = {top: 60, right: 50, bottom: 50, left: 50}
    var width = 1000
    var height = 600
    var legParams = {xOffset: 100, yOffset: 150, spacing: 4, itemHeight: 20}

    var innerRadius = 0.4 * Math.min(width, height) / 2
    var outerRadius = Math.min(width, height) / 2 - 60
    
    var selectCols = (d => ({
        champName: d.championName,
        platform: d.platform,
        matchId: d.matchId
    }))

    d3.csv(fpath, selectCols).then(function(data){
        // var groups = d3.group(data, d => d.platform)
        const gamesPlayed = d3.rollups(data, 
            v => (new Set(d3.map(v, d => d.matchId))).size, 
            d => d.platform)

        const servers = d3.json(serversJson)
        const projection = d3.geoAitoff()
            .scale(width / 1.7 / Math.PI)
            .translate([width / 2, height / 2])
        const pathgeo = d3.geoPath().projection(projection)
        const worldmap = d3.json(worldMapJson)

        const radiusScale = d3.scaleLinear()
            .domain([ d3.min(gamesPlayed, d => d[1]), d3.max(gamesPlayed, d => d[1])])
            .range([10, 20])

        const palette1 = ['#797d62ff', '#9b9b7aff', '#baa587ff', '#d9ae94ff', '#f1dca7ff', '#ffcb69ff', '#e8ac65ff', '#d08c60ff', '#b58463ff', '#997b66ff']

        const zoom = d3.zoom().scaleExtent([1, 5])

        const svg = d3.select('#section4_plot')
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
        const title = svg.append('g')
                    .attr('class', 'plot_title4')
                    .attr("transform", "translate(" + (margin.left) +"," + (height - 20) +")")
            title.append("text")
                    .attr("font-size", "60px")
                    .text(`Number of Games`)
            title.append("text")
                    .attr('dy', '1.2em')
                    .attr("font-size", "32px")
                    .text(`on each Server`)

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${legParams.xOffset}, ${legParams.yOffset})`)
            .selectAll("g")
            .data([400, 1000, 2000])
            .enter().append("g")
            legend.append("circle")
                .attr('class', 'legend_circle')
                .attr("cy", d => -radiusScale(d))
                .attr("r", radiusScale)
            legend.append("text")
                .attr('class', 'legend_label')
                .attr("y", d => -2.3 * radiusScale(d) - 12)
                .attr("dy", "1.5em")
                .text(d3.format(".1s"))

        var tooltip = d3.select("#section4_plot")
                    .append("div")
                    .attr("class", "tooltip")

        var graph = svg.append("g")
                    .attr("transform", "translate(" + (margin.left) + "," + (margin.top) + ")")


        
        worldmap.then(function(map) {
            servers.then(function(serverData){
                var serverMap = {}
                for (let u of Object.entries(serverData)) {
                    for (let country of u[1].countries) {
                        serverMap[country] = u[0]
                    }
                }
                const colorScale = d3.scaleOrdinal()
                    .domain(Object.keys(serverData))
                    .range(palette1)
                    .unknown("rgb(140, 140, 140)")

                const countries = graph.append('g')
                    .attr('class', 'map_mesh')
                    .selectAll('path')
                    .data(map.features)
                    .enter().append('path')
                    .on("click", clicked)
                    .attr("d", pathgeo)
                    .attr("fill", d => {
                        var country = d.properties.name
                        return colorScale(serverMap[country])
                    })
                
                const bubbles = graph.append('g')
                    .attr('class', 'map_bubble')
                    .selectAll('circle')
                    .data(gamesPlayed)
                    .enter().append('circle')
                    .attr('transform', d => {
                        let long = serverData[d[0]].longitude
                        let lat = serverData[d[0]].latitude
                        return `translate(${projection([ long, lat ])})`
                    })
                    .attr('r', d => radiusScale(d[1]))
                    .on("mouseenter", (event, d) => {
                        var str = "Server Name: " + d[0]
                                + "<br>" + "Number of Games: " + d[1] 
                        tooltip.style('visibility', 'visible')
                        tooltip.html(str)
                        d3.select(event.target)
                            .transition().duration('5')
                            .attr("r", 1.5 * radiusScale(d[1]));
                    })
                    .on("mousemove", (event, d) => {
                        tooltip.style("left", (event.pageX + 40) + "px")
                            .style("top", (event.pageY - 3000) + "px")
                    })
                    .on("click", (event, d) => {
                        console.log("Clicked", d[0])
                    })
                    .on("mouseleave", (event, d) => {
                        d3.select(event.target)
                            .transition().duration('5')
                            .attr("r", radiusScale(d[1]));
                        tooltip.style('visibility', 'hidden')
                    })
                
                const bubbleLabels = graph.append('g')
                    .selectAll('.bubble_label')
                    .data(gamesPlayed)
                    .enter().append('text')
                    .attr("class", "bubble_label")
                    .attr('transform', (d, i) => {
                        let long = serverData[d[0]].longitude
                        let lat = serverData[d[0]].latitude
                        return `translate(${projection([ long, lat ])})`
                    })
                    .text(d => serverData[d[0]].name)

                svg.on("click", reset)   
                zoom.on("zoom", zoomed);
                svg.call(zoom)             
                
                function reset() {
                    countries.transition().style("stroke", null)
                    countries.transition().style("stroke-width", null)
                    svg.transition().duration(750).call(
                        zoom.transform,
                        d3.zoomIdentity,
                        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
                    )
                }

                function clicked(event, d) {
                    const [[x0, y0], [x1, y1]] = pathgeo.bounds(d)
                    event.stopPropagation();
                    // countries.transition().style("fill", null)
                    d3.select(this).transition().style("stroke", "cornsilk")
                    d3.select(this).transition().style("stroke-width", "3px")
                    svg.transition().duration(750).call(
                        zoom.transform,
                        d3.zoomIdentity
                            .translate(width / 2, height / 2)
                            .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                        d3.pointer(event, svg.node())
                    );
                  }
                
                function zoomed(event) {
                    const {transform} = event
                    graph.attr("transform", transform)
                    graph.attr("stroke-width", 1 / transform.k)
                }

                    
            })
        })
        
        
    })

    
       


}


var section5 = function(fpath) {
    addSectionId(5, true)
    var margin = {top: 90, right: 30, bottom: 30, left: 30}
    var width = 1150
    var height = 900
    var radius = Math.min(width, height) / 2 - 60
    var svg = d3.select('#section5_plot')
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + (width / 2 + margin.left) + "," + (height / 2 + margin.top) + ")")

    svg.append("text")
        .attr('class', 'plot_title5')
        .attr("x", 0)             
        .attr("y", - (height / 2))
        .text("Laning between Bottom Champions")

    selectCols = (d => ({
        champName: d.championName,
        champId: parseInt(d.championId),
        position: d.position,
        matchId: d.matchId,
        win: d.win == 'True' ? 1 : 0,
    }))

    var botChamps = ["Jinx", "Xayah", "Kaisa", "Jhin", "Caitlyn", "Zeri", "Twitch",
                "Veigar", "Tristana", "Sivir", "Ezreal", "Nilah", "MissFortune",
                "Lucian", "Varus", "Ashe", "Samira", "Draven", "Vayne", "Seraphine",
                "KogMaw", "Kalista", "Ziggs", "Aphelios"]

    const nNodes = botChamps.length

    var xScale = d3.scaleBand()
        .domain(botChamps)
        .range([0, width ])
        .paddingInner(1)
        .paddingOuter(1)

    d3.csv(fpath, selectCols).then(function(data){
        data = data.filter(d => d.position === 'BOTTOM' 
            && botChamps.includes(d.champName))
        data = [...d3.group(data, d => d.matchId).values()]
            .filter(d => d.length === 2 && d[0].win + d[1].win == 1)

        matches = {}
        gamesPlayed = {}
        for (let champ1 of botChamps) {
            gamesPlayed[champ1] = 0
            matches[champ1] = {}
            for (let champ2 of botChamps) {
                matches[champ1][champ2] = ({matches: 0, wins: 0})
            }
        }

        for (let d of data) {
            let champ1 = d[0].champName
            let champ2 = d[1].champName
            matches[champ1][champ2].matches += 1
            matches[champ2][champ1].matches += 1
            gamesPlayed[champ1] += 1
            gamesPlayed[champ2] += 1
            if (d[0].win === 1) {
                matches[champ1][champ2].wins += 1
            }
            else {
                matches[champ2][champ1].wins += 1
            }
        }

        function coord(i) {
            var theta = 2 * i / nNodes * Math.PI
            return [radius * Math.cos(theta), radius * Math.sin(theta)]
        }

        var graph = {"nodes": [], "edges": [], "links": []}
        for (let i = 0; i < botChamps.length; i ++) {
            let champ1 = botChamps[i]
            let c1 = coord(i);
            graph.nodes.push(({id: i, name: champ1, fx: c1[0], fy: c1[1], gamesPlayed: gamesPlayed[champ1]}))
            
            for (let j = i + 1; j < botChamps.length; j ++) {
                let champ2 = botChamps[j]
                let c2 = coord(2)
                if (matches[champ1][champ2].matches === 0) continue;

                let edge = {
                    'source': {}, 'target': {}, 'matches': 0, 'wins': 0
                }
                if (matches[champ1][champ2].wins > matches[champ2][champ1].wins) {
                    edge['source'] = ({id: i, name: champ1, x: c1[0], y: c1[1]})
                    edge['target'] = ({id: j, name: champ2, x: c2[0], y: c2[1]})
                    edge['wins'] = matches[champ1][champ2].wins
                }
                else {
                    edge['target'] = ({id: i, name: champ1, x: c1[0], y: c1[1]})
                    edge['source'] = ({id: j, name: champ2, x: c2[0], y: c2[1]})
                    edge['wins'] = matches[champ2][champ1].wins
                }
                edge['matches'] = matches[champ1][champ2].matches
                graph.edges.push(edge)
                graph.links.push({
                    "source": edge["source"].id,
                    "target": edge["target"].id,
                    "matches": edge["matches"],
                    "wins": edge["wins"]
                })
            }
        }

        var colorScale = d3.scaleOrdinal()
            .domain(botChamps)
            .range(['#252323ff', '#70798cff', '#dad2bcff', '#a99985ff', '#0d1321ff', '#1d2d44ff', '#3e5c76ff', '#748cabff'])

        var linkScale = d3.scaleLinear()
            .domain([ d3.min(graph.links, d => d.matches), d3.max(graph.links, d => d.matches)])
            .range([ 5, 20 ])
        var linkOpacity = d3.scaleLinear()
            .domain([ d3.min(graph.links, d => d.matches), d3.max(graph.links, d => d.matches)])
            .range([ .05, .9 ])
        var nodeScale = d3.scaleLinear()
            .domain([ d3.min(graph.nodes, d => d.gamesPlayed), d3.max(graph.nodes, d => d.gamesPlayed)])
            .range([ 2, 30 ])

        var link = svg.selectAll(".link")
            .data(graph.links)
            .enter().append("line")
            .attr("stroke", "lightgrey")
            .attr("stroke-width", d => linkScale(d.matches))
            .attr("opacity", d => linkOpacity(d.matches))

        var node = svg.selectAll(".node") 
            .data(graph.nodes)
            .enter().append("circle")
            .attr("fill", d => colorScale(d.name))
            .attr("r", d => nodeScale(d.gamesPlayed))


        var label = svg.selectAll(".label")
            .data(graph.nodes)
            .enter().append("text")
            .attr("class", "plot_label")
            .text(d => d.name)

        var force = d3.forceSimulation(graph.nodes)
            .force("charge", d3.forceManyBody(-1000))
            .force("link", d3.forceLink(graph.links))
            .force("center", d3.forceCenter(0, 0))

        function click(event, d) {
            delete d.fx
            delete d.fy
            force.alpha(1).restart()
        }
        function dragstart() {
            d3.select(this).classed("fixed", true)
        }
        function clamp(x, lo, hi) {
            return x < lo ? lo : x > hi ? hi : x
        }
        function dragged(event, d) {
            d.fx = clamp(event.x, -width / 2, width / 2)
            d.fy = clamp(event.y, -height / 2, height / 2)
            force.alpha(1).restart()
        }

        const drag = d3.drag()
            .on("start", dragstart)
            .on("drag", dragged)
        node.call(drag).on("click", click)
        label.call(drag).on("click", click)
        
        force.on("tick", function() {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)
            
            node.attr("cx", d => d.x)
                .attr("cy", d => d.y)

            label.attr("x", d => d.x)
                .attr("y", d => d.y)
        })

    })
}