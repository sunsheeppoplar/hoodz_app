// SVG dimensions
var width = 800;
var height = 700;

// create svg element
var svg = d3.select('#nyc-map')
            .append('svg')
            .classed('nyc', true)
            .attr('width', width)
            .attr('height', height);

// $('#map').hide();

// GRAB GEOJSON AND ADD PATH ELEMENTS TO DOM
d3.json("../assets/nyc.geojson", function(error, json) {
  var nyc_data = json.features;
  // Parse NYC data into separate boroughs
  manhattan_data = nyc_data.filter(function (hood) {
    return ( hood.properties.borough == 'Manhattan' );
  });
  queens_data = nyc_data.filter(function (hood) {
    return ( hood.properties.borough == 'Queens' );
  });
  staten_data = nyc_data.filter(function(hood) {
    return ( hood.properties.borough == 'Staten Island');
  });
  brooklyn_data = nyc_data.filter(function (hood) {
    return ( hood.properties.borough == 'Brooklyn');
  });
  bronx_data = nyc_data.filter(function (hood) {
    return ( hood.properties.borough == 'Bronx');
  });


  var wOffset = 0;
  var hOffset = 230;
  // find centroid of geojson for projection position
  var center = d3.geo.centroid(json)
  var scale = 6.3 * 10000;
  var offset = [ width / 2 + wOffset, height / 2 - hOffset];  
  var projection = d3.geo.mercator()
      .scale(scale)
      .center(center)
      .translate(offset);

  // create path
  var path = d3.geo.path().projection(projection);

  var menuItems = ['Manhattan','Brooklyn','Queens','Bronx','Staten Island'];

  var menu = d3.select('#nyc-menu');
  var menuItems = menu.selectAll('p')
      .data(menuItems)
      .enter()
      .append('p').text(function(d) {return d;})
      .attr('class', function(d) {return nameToClass(d);});

  menuItems.on('click', startBoro);

  // creating color scheme for main map
  var hslScale = d3.scale.linear()
                 .domain([0, nyc_data.length])
                 .range([40, 60]);

  // create and append hood shapes to SVG element
  var hoods = svg.selectAll('path')
      .data(nyc_data)
      .enter()
      .append('path')
      .attr('class', function(d) {
        return 'hood ' + nameToClass(d.properties.neighborhood) + ' boro-' + nameToClass(d.properties.borough);
      })
      .attr('d', path)
      .attr('stroke', 'cornflowerblue')
      .attr('stroke-width','1')
      .attr('fill', function(d,i) { 
        return 'hsl(' + hslScale(i) + ',80%,75%)'; 
      })
      .attr('data-basecolor', function(d,i) { 
        return 'hsl(' + hslScale(i) + ',80%,75%)'; 
      })
      .attr('data-hoodname', function(d) {
        return d.properties.neighborhood;
      })
      .attr('data-hoodclass', function(d) {
        return nameToClass(d.properties.neighborhood);
      })
      .attr('data-borough', function(d) {
        return d.properties.borough;
      });


// ---------------------------------------------------------------------
  // INITIALIZE HOOD NAMES BEFORE PLAYING ROUND
  // ---------------------------------------------------------------------

  // Initialize hood quiz list; check to make sure only one entry even if 
  // multiple paths exist for one hood
  var hoodQuizNames = [];
    d3.selectAll('.hood').each(function(d) {
      currentName = d.properties.neighborhood
      if ( hoodQuizNames.indexOf(currentName) == -1 ) {
        hoodQuizNames.push(currentName)
      } 
    });
  
  // Initalize remaining names and classes arrays before main game loop
  var remainingNames = hoodQuizNames;
  var remainingClasses = hoodQuizNames.map(function(name) {
    return nameToClass(name);
  }); 


  // PLAY ROUND
  // ---------------------------------------------------------------------
  playRound(selectRandomHood(remainingNames));

  function playRound(currentQuizName) {
    
    // TRIES ------ test phase
    // Begin tries
    playerTry(3);
    function playerTry (triesLeft) {
      if (triesLeft > 0) {
        console.log('tries left: ', triesLeft)
        playerTry(triesLeft - 1);
      } else {
        console.log('returning')
        return;
      }
    } //end player try

    // select random hood for quiz
    // var currentQuizName = selectRandomHood(remainingNames);
    var currentQuizClass = nameToClass(currentQuizName);

    // display name of hood to find
    $('#guess-ui').show()
                  .empty()
                  .text("Find:  " + currentQuizName)
                  .append('<p id="test">TEST</p>')

    // listen for user to submit guess by clicking a hood
    d3.selectAll('.hood').on('click', checkGuess)
    d3.select('#test').on('click', test);


    // CHECK GUESS
    // ---------------------------------------------------------------------
    function checkGuess() {
      // Turn off event listeners
      console.log('checkGuess fired')
      d3.selectAll('.hood').on('click', null);
      // Name of clicked hood becomes guess
      var clickedHood = d3.select(this)

      var guessedName = clickedHood.attr('data-hoodname');
      var guessedClass = nameToClass(guessedName);
      // Is guess correct?
      console.log(guessedClass, currentQuizClass)
      if ( guessedClass == currentQuizClass ) {
        // console.log('correct guess!');
        flashColor(currentQuizClass, 'lime');
        // when correct, remove guessed hood from hood list array
        var hoodIndex = remainingNames.indexOf(currentQuizName);  
          if (hoodIndex !== -1) {
            remainingNames.splice(hoodIndex, 1);
          }
      } else {
        // console.log('incorrect, dude');
        flashColor(guessedClass, 'yellow');

        // ##### increment missed for current hood
        // ##### how to trigger a post request to database?
      }
      
      if (remainingNames.length > 0) {

        playRound(selectRandomHood(remainingNames));
      
      } else {
        // End game, remove event listeners
        alert('Game Over')
        hoods.on('click', null);
      }

    }
  }  




});



// GAME FUNCTION ====================================================

function startBoro() {
  var clickedBoro = d3.select(this);
  console.log(clickedBoro.attr('class'));
  

  // switch -- case for boro selection
}

// HELPER FUNCTIONS =================================================

function flashColor(pathClass, color) {
  var currentPath = d3.selectAll('.' + pathClass)
  var currentFill = currentPath.attr('fill');
  currentPath.transition()
             .duration(50)
             .attr('fill', color)
             .transition()
             .duration(50)
             .attr('fill', currentFill)
             .transition()
             .duration(50)
             .attr('fill', color)
             .transition()
             .duration(50)
             .attr('fill', currentFill)
             .transition()
             .duration(50)
             .attr('fill', color)
}

function setPathToColor(pathClass, color) {
  d3.selectAll('.' + pathClass).attr('fill', color);
}

function nameToClass (hoodName) {
  var hoodNameArray = hoodName.split('\'')
                              .join('')
                              .split('.')
                              .join('')
                              .split(' ');
  var lowercaseArray = [];
  for (var i = 0; i < hoodNameArray.length; i++) {
    lowercaseArray.push(hoodNameArray[i].toLowerCase());
  }
  return lowercaseArray.join('-');
}

function selectRandomHood(remainingNames) {
  randNum = Math.floor(Math.random() * remainingNames.length)
  return remainingNames[randNum];
}

// Aesthetic UI selection events
//------------------------------
function hoodClick() {
  var clickedHood = d3.select(this);

  var isWrong = clickedHood.classed('wrong-guess')
  if (!isWrong) {
    clickedHood
      .classed('wrong-guess', true)
      .transition()
      .duration(500)
      .attr('fill', 'red')
  } else {
    var basecolor = clickedHood.attr('data-basecolor');
    clickedHood
      .classed('wrong-guess', false)
      .transition()
      .duration(500)
      .attr('fill', basecolor)
  }
};

function hoodMouseover() {
  var current = d3.select(this);
  var currentFill = current.attr('fill');
  var current = d3.select(this)
      .transition()
      .duration(100)
      .attr('fill','yellow')
      .transition()
      .duration(500)
      .attr('fill', currentFill)   
};

function hoodMouseleave() {
  d3.select(this)
      .transition()
      .duration(500)
      .attr('fill','steelblue')
}
