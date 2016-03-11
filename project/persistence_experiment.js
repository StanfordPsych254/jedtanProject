// I'm implementing the experiment using a data structure that I call a **sequence**. The insight behind sequences is that many experiments consist of a sequence of largely homogeneous trials that vary based on a parameter. For instance, in this example experiment, a lot stays the same from trial to trial - we always have to present some number, the subject always has to make a response, and we always want to record that response. Of course, the trials do differ - we're displaying a different number every time. The idea behind the sequence is to separate what stays the same from what differs - to **separate code from data**. This results in **parametric code**, which is much easier to maintain - it's simple to add, remove, or change conditions, do randomization, and do testing.

// ## High-level overview
// Things happen in this order:
// 
// 1. Compute randomization parameters (which keys to press for even/odd and trial order), fill in the template <code>{{}}</code> slots that indicate which keys to press for even/odd, and show the instructions slide.
// 2. Set up the experiment sequence object.
// 3. When the subject clicks the start button, it calls <code>experiment.next()</code>
// 4. <code>experiment.next()</code> checks if there are any trials left to do. If there aren't, it calls <code>experiment.end()</code>, which shows the finish slide, waits for 1.5 seconds, and then uses mmturkey to submit to Turk.
// 5. If there are more trials left, <code>experiment.next()</code> shows the next trial, records the current time for computing reaction time, and sets up a listener for a key press.
// 6. The key press listener, when it detects either a P or a Q, constructs a data object, which includes the presented stimulus number, RT (current time - start time), and whether or not the subject was correct. This entire object gets pushed into the <code>experiment.data</code> array. Then we show a blank screen and wait 500 milliseconds before calling <code>experiment.next()</code> again.

// ## Helper functions
var trialsPerBlock = 50;

function toggleFullScreen() {
  console.log("requested");
   var element = document.documentElement;
          if (element.requestFullscreen) {
            element.requestFullscreen();
          } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
          } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
          } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
          }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
// Shows slides. We're using jQuery here - the **$** is the jQuery selector function, which takes as input either a DOM element or a CSS selector string.
function showSlide(id) {
  // Hide all slides
  if (id != "stage"){
    $(document).unbind("keydown");
  }
  $(".slide").hide();
	// Show just the slide we want to show
	$("#"+id).show();
}

// Get a random integer less than n.
function randomInteger(n) {
	return Math.floor(Math.random()*n);
}

// Get a random element from an array (e.g., <code>random_element([4,8,7])</code> could return 4, 8, or 7). This is useful for condition randomization.
function randomElement(array) {
// I need to test this function more.
var randomIndex = randomInteger(array.length)
var returnString = array[randomIndex];
array.splice(randomIndex, 1);

return returnString;
}

// ## Configuration settings
var keyBindings = {"p": "left", "q": "right"},
allPuppies = ["https://pbs.twimg.com/profile_images/497043545505947648/ESngUXG0.jpeg", "http://cdn.sheknows.com/articles/2013/04/Puppy_2.jpg", "http://media.mydogspace.com.s3.amazonaws.com/wp-content/uploads/2013/08/puppy-500x350.jpg"],
allKittens = ["http://cdn.playbuzz.com/cdn/260e39ce-346c-4eb0-a3ef-1aeb3724f7c7/b0a68efc-b312-46af-9487-5afb7be17ce8.jpg", "http://www.welikeviral.com/files/2014/12/8325_8_site.jpeg", "http://sereedmedia.com/srmwp/wp-content/uploads/kitten.jpg"];

// Fill in the instructions template using jQuery's <code>html()</code> method. In particular,
// let the subject know which keys correspond to even/odd. Here, I'm using the so-called **ternary operator**, which is a shorthand for <code>if (...) { ... } else { ... }</code>

$("#odd-key").text("P");
$("#even-key").text("Q");

// Show the instructions slide -- this is what we want subjects to see first.
showSlide("instructions");
console.log("hi");

// ## The main event
// I implement the sequence as an object with properties and methods. The benefit of encapsulating everything in an object is that it's conceptually coherent (i.e. the <code>data</code> variable belongs to this particular sequence and not any other) and allows you to **compose** sequences to build more complicated experiments. For instance, if you wanted an experiment with, say, a survey, a reaction time test, and a memory test presented in a number of different orders, you could easily do so by creating three separate sequences and dynamically setting the <code>end()</code> function for each sequence so that it points to the next. **More practically, you should stick everything in an object and submit that whole object so that you don't lose data (e.g. randomization parameters, what condition the subject is in, etc). Don't worry about the fact that some of the object properties are functions -- mmturkey (the Turk submission library) will strip these out.**

var experiment = {
  trialsInBlock: 2,
  block: 0,
  currenttrial: 0,
  stimulustype: 0,
  tutorial_completed: 0,
  gridsize: 4,
  xposition: 0,
  yposition: 0,
  currpos: 0,
  trialinfo: [],
  trialOrder: [],

  // Parameters for this sequence.
  // Experiment-specific parameters - which keys map to odd/even
  movement_constant: 100,
  current_grid: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  gridConfigurations: [[8, 4, 14, 9, 5, 16, 2, 6, 10, 12, 11, 1, 13, 7, 15, 3], [3, 14, 5, 4, 7, 9, 12, 11, 8, 16, 13, 10, 2, 6, 15, 1]],
  //, [16, 2, 1, 4, 14, 7, 6, 13, 15, 5, 12, 8, 3, 9, 10, 11], [10, 8, 13, 6, 9, 12, 16, 14, 5, 4, 3, 11, 7, 1, 15, 2]],
  alltrials: [[8, 12], [3, 14]], 
  superabridgedtotal: [[[8, 10, 6, 15]], [[2, 1, 10, 8]]],
  //, [[15, 4, 3, 14]], [[5, 13, 4, 9]]],
  abridgedtotal: [[[8, 10, 6, 15], [9, 5, 16, 6], [2, 1, 10, 8], [1, 6, 9, 12]] , [[15, 4, 3, 14], [7, 16, 4, 9], [5, 13, 4, 9], [2, 10, 16, 13]]],
  totaltrials: [[[8, 10, 6, 15], [9, 5, 16, 6], [2, 1, 10, 8], [6, 1, 9, 12], [15, 4, 3, 14], [7, 16, 4, 9], [5, 13, 4, 9], [2, 10, 16, 13], [7, 6, 4, 3], [6, 4, 7, 11], [11, 10, 6, 3], [9, 1, 14, 6], [5, 15, 11, 16], [4, 12, 14, 16], [10, 8, 11, 13], [16, 12, 2, 13], [15, 12, 9, 14], [12, 4, 3, 14], [2, 15, 12, 6], [15, 13, 14, 7], [3, 13, 7, 6], [5, 9, 4, 3], [15, 8, 16, 6], [14, 8, 6, 12], [11, 12, 2, 16], [2, 15, 8, 11], [14, 4, 3, 7], [12, 10, 4, 8], [11, 4, 14, 6], [11, 8, 15, 5], [15, 11, 12, 5], [6, 12, 7, 5], [11, 15, 4, 14], [7, 1, 16, 12], [13, 12, 9, 11], [14, 8, 10, 15], [13, 7, 10, 16], [9, 11, 16, 6], [15, 4, 9, 16], [11, 8, 6, 5], [16, 9, 6, 4], [7, 1, 16, 2], [12, 10, 13, 5], [15, 14, 1, 4], [10, 1, 11, 12], [5, 1, 10, 15], [7, 4, 15, 16], [14, 8, 7, 11], [4, 1, 15, 11], [9, 13, 11, 14]], [[6, 1, 3, 12], [15, 13, 8, 12], [13, 1, 4, 7], [8, 14, 4, 12], [11, 8, 13, 4], [7, 6, 3, 1], [9, 1, 12, 16], [11, 3, 13, 14], [10, 14, 5, 9], [11, 1, 7, 10], [5, 8, 6, 9], [3, 8, 11, 13], [8, 6, 13, 14], [6, 13, 10, 16], [2, 15, 10, 9], [12, 9, 13, 6], [6, 16, 15, 4], [12, 8, 14, 10], [11, 8, 14, 3], [4, 9, 16, 1], [2, 4, 11, 9], [5, 1, 8, 3], [12, 11, 16, 15], [5, 15, 16, 3], [4, 7, 6, 15], [10, 1, 9, 6], [16, 14, 8, 10], [14, 12, 6, 7], [11, 10, 2, 3], [10, 7, 6, 3], [7, 8, 12, 1], [13, 4, 2, 1], [16, 14, 11, 15], [3, 10, 16, 7], [13, 16, 15, 7], [2, 13, 11, 7], [10, 5, 2, 7], [16, 5, 6, 8], [6, 1, 2, 12], [16, 8, 11, 9], [4, 15, 9, 11], [13, 1, 5, 11], [12, 1, 15, 13], [4, 1, 11, 3], [7, 1, 10, 11], [5, 13, 6, 12], [13, 10, 8, 6], [7, 6, 2, 14], [4, 15, 12, 9], [3, 4, 15, 10]]],
  lock: 1,
  // An array to store the data that we're collecting.
  data: [],
  // The function that gets called when the sequence is finished.
  debrief: function(){
    $('body').css({'background-color': 'white'});
    showSlide("debrief-form");
  },
  ending: function(){
    $('body').css({'background-color': 'white'});
    showSlide("debriefing");
  },
  end: function() {
    // Show the finish slide.
    experiment.age = $('#agepicker').val();
    experiment.race = $( "#race option:selected" ).text();;
    experiment.gender = $("#gender option:selected").text();

    showSlide("finished");
    setTimeout(function() { self.opener.turk.submit(experiment) }, 1500);
    console.log(experiment);
    // Wait 1.5 seconds and then submit the whole experiment object to Mechanical Turk (mmturkey filters out the functions so we know we're just submitting properties [i.e. data])
    
  },
  furtherDirections: function(){
    showSlide("further-instructions");
  },
  // The work horse of the sequence - what to do on every trial.
  next: function() {
    console.log($("#progress").attr('aria-valuenow'));
    console.log(experiment.currenttrial);
    console.log(experiment.trialsInBlock);

    $("#progress").attr('aria-valuenow', 100 * experiment.currenttrial/experiment.trialsInBlock);
    $("#progress").css({'width': 100 * experiment.currenttrial/experiment.trialsInBlock + "%"});
    $("#progress").html((100 * experiment.currenttrial/experiment.trialsInBlock) + "%");
    $(document).unbind("keydown");
    $("#display-table").finish();
    //END
    if (experiment.alltrials.length == 0) {
      if (experiment.tutorial_completed == 0){
        experiment.currenttrial -= 2;
        $('body').css({'background-color': 'white'});
        experiment.block --;
        experiment.tutorial_completed = 1;
        experiment.block_completed = 0;
        showSlide("tutorial-completed");
        for(var i = 0; i < experiment.totaltrials.length; i++){
          //experiment.abridgedtotal[i] = shuffle(experiment.abridgedtotal[i])
          experiment.totaltrials[i] = shuffle(experiment.totaltrials[i])
        }
        if (experiment.trialOrder.length == 0){
          //experiment.trialOrder = experiment.abridgedtotal.slice();
          experiment.trialOrder = experiment.totaltrials.slice();
        } 

        return;
      }
      else if(experiment.gridConfigurations.length == 0){
        experiment.debrief();
        return;
      }
      else if (experiment.block_completed == 1){
        $('body').css({'background-color': 'white'});
        experiment.block_completed = 0;
        showSlide("continue");
        return;
      }
      else{
        //GENERATE NEW GRID IF GRID HAS BEEN EXHAUSTED
        $("#progress").attr('aria-valuenow', 0);
        $("#progress").css({'width': "0%"});
        $("#progress").html("0%");
        experiment.block ++;
        experiment.stimulustype = !experiment.stimulustype;
        experiment.current_grid = experiment.gridConfigurations.shift();
        var table_string = ""
        var row_string = ""
        for(var i = 0; i < 16; i++){
          if (i % 4 == 0){
            row_string += "</tr>";
            table_string += row_string;
            row_string = "<tr>";
          }
          row_string += "<td><img src=\"images/" + (experiment.block * 16 + experiment.current_grid[i]) + ".jpg\"></img></td>"
        }
        table_string += row_string + "</tr>";
        $('#display-table').html(table_string);
        experiment.bindFlag = true;
        //reset trials
        experiment.alltrials = experiment.totaltrials.shift();
        //experiment.alltrials = experiment.abridgedtotal.shift();
        experiment.trialsInBlock = experiment.alltrials.length;
        
      }
    }

    //RESET CURRENT POSITION IN TRIAL, SET KEYPRESSES TO ZERO, RESET POSITION/TRIALS
    experiment.keypresses = 0;
    experiment.currpos = 0;
    experiment.xposition = 0;
    experiment.yposition = 0;
    experiment.trials--;

    //CSS RESET
    $('body').css({'background-color': 'black'});
    showSlide("stage");


    //INCREMENT TO NEXT TRIAL
    trial_values = experiment.alltrials.shift();
    trial_info = [];
    console.log(trial_values);
    for (var val in trial_values){
      var current_index = experiment.current_grid.indexOf(trial_values[val]);
      trial_info.push([(current_index) % experiment.gridsize, Math.floor((current_index) / experiment.gridsize)]);
    }

    //GENERATE PATH HTML
    experiment.trialinfo = trial_info;
    console.log(experiment.trialinfo);
    var html_string = "<table id='path-holder'><tr>"
    console.log("BLOCK ")
    for (var j = 0; j < trial_values.length; j++){
      console.log(experiment.block * 16 + trial_values[j])
      html_string += "<td><img src='images/" + (experiment.block * 16 + trial_values[j]) + ".jpg'></img></td>"
    }
    console.log(html_string)
    html_string += "</tr></table>";
    var left_string = "+=" + experiment.xposition * 150 + "px";
    $('#path').html(html_string);

    $( "#display-table" ).css({
      //marginLeft: left_string,
      margin: '0px auto'
    });


    $(document).unbind("keydown", experiment.keyPressHandler);
    $(document).on("keydown", experiment.keyPressHandler);


    

    
    // Get the current time so we can compute reaction time later.
    experiment.startTime = (new Date()).getTime();


    },
    testKey: function(event){
      //console.log("X:" + experiment.xposition + " Y:" + experiment.yposition);
      //console.log(experiment.trialinfo[0]);
      if (experiment.trialinfo.length > 0 && experiment.xposition == experiment.trialinfo[0][0] && experiment.yposition == experiment.trialinfo[0][1]) {
        $( "#path-holder img" ).eq(experiment.currpos).css({'border': '4px solid green'});
        experiment.currpos ++;
        experiment.trialinfo.shift();
        if (experiment.trialinfo.length == 0){
          experiment.lock = 0;
          var endTime = (new Date()).getTime(),
          data = {
            keypresses: experiment.keypresses,
            time: endTime - experiment.startTime,
            stimulus: experiment.stimulustype,
            trial: experiment.currenttrial,
            block: experiment.block
          };
            //experiment.stimulustype = 0;
            experiment.data.push(data);
            experiment.currenttrial = experiment.currenttrial % trialsPerBlock + 1;
            experiment.block_completed = 1;
            $(document).unbind("keydown");
            setTimeout(experiment.next, 900);
            experiment.lock = 1;
          }
        }
      },

    // Set up a function to react to keyboard input. Functions that are used to react to user input are called *event handlers*. In addition to writing these event handlers, you have to *bind* them to particular events (i.e., tell the browser that you actually want the handler to run when the user performs an action). Note that the handler always takes an <code>event</code> argument, which is an object that provides data about the user input (e.g., where they clicked, which button they pressed).
    keyPressHandler: function(event) {
      // A slight disadvantage of this code is that you have to test for numeric key values; instead of writing code that expresses "*do X if 'Q' was pressed*", you have to do the more complicated "*do X if the key with code 80 was pressed*". A library like [Keymaster](http://github.com/madrobby/keymaster) lets you write simpler code like <code>key('a', function(){ alert('you pressed a!') })</code>, but I've omitted it here. Here, we get the numeric key code from the event object
      var keyCode = event.which;
      
      if (keyCode == 39 && experiment.xposition < experiment.gridsize-1) {
        $(document).unbind("keydown");
        experiment.keypresses ++;
        if (experiment.stimulustype == 1){
          $( "#display-table" ).animate({
            opacity: '0'
          }, 167, function() {
            $( "#display-table" ).css({
              marginLeft: '-=154px'
            });
            setTimeout(function(){
              $( "#display-table" ).animate({ opacity: '1'}, 167, function() {
                experiment.xposition ++;
                experiment.testKey();
                $(document).unbind("keydown", experiment.keyPressHandler);
                $(document).on("keydown", experiment.keyPressHandler);
              });}, 66);
          });
        }
        else{
          $( "#display-table" ).animate({
            marginLeft: '-=154px'
          }, 400, function() {
           experiment.xposition ++;
           experiment.testKey();
           $(document).unbind("keydown", experiment.keyPressHandler);
           $(document).on("keydown", experiment.keyPressHandler);
         });
        }
      } 
      else if (keyCode == 40 && experiment.yposition < experiment.gridsize-1) {
        $(document).unbind("keydown");
        experiment.keypresses ++;
        if (experiment.stimulustype == 1){
          $( "#display-table" ).animate({
            opacity: '0'
          }, 167, function() {
            $( "#display-table" ).css({
              marginTop: '-=155px',
              marginBottom: '+=155px'
            });
            setTimeout(function(){
              $( "#display-table" ).animate({ opacity: '1'}, 167, function() {
                experiment.yposition ++;
                experiment.testKey();
                console.log("bound");
                $(document).unbind("keydown", experiment.keyPressHandler);
                $(document).on("keydown", experiment.keyPressHandler);
              });}, 66);
          });
        }
        else{
          $( "#display-table" ).animate({
            marginTop: '-=155px',
            marginBottom: '+=155px'
          }, 400, function() {
           experiment.yposition ++;
           experiment.testKey();
           $(document).unbind("keydown", experiment.keyPressHandler);
           $(document).on("keydown", experiment.keyPressHandler);
         });
        }
      }
      else if (keyCode == 37 && experiment.xposition > 0) {
        $(document).unbind("keydown");
        experiment.keypresses ++;
        if (experiment.stimulustype == 1){
          $( "#display-table" ).animate({
            opacity: '0'
          }, 167, function() {
            $( "#display-table" ).css({
              marginLeft: '+=154px'
            });
            setTimeout(function(){
              $( "#display-table" ).animate({ opacity: '1'}, 167, function() {
                experiment.xposition --;
                experiment.testKey();
                $(document).unbind("keydown", experiment.keyPressHandler);
                $(document).on("keydown", experiment.keyPressHandler);
              });}, 66);
           });
        }
        else{
          $( "#display-table" ).animate({
            marginLeft: '+=154px'
          }, 400, function() {
           experiment.xposition --;
           experiment.testKey();
           $(document).unbind("keydown", experiment.keyPressHandler);
           $(document).on("keydown", experiment.keyPressHandler);
         });
        }
      }
      else if (keyCode == 38 && experiment.yposition > 0) {
        $(document).unbind("keydown");
        experiment.keypresses ++;
        if (experiment.stimulustype == 1){
          $( "#display-table" ).animate({
            opacity: '0'
          }, 200, function() {
            $( "#display-table" ).css({
              marginTop: '+=155px',
              marginBottom: '-=155px'
            });
             setTimeout(function(){
              $( "#display-table" ).animate({ opacity: '1'}, 167, function() {
                experiment.yposition --;
                experiment.testKey();
                $(document).unbind("keydown", experiment.keyPressHandler);
                $(document).on("keydown", experiment.keyPressHandler);
              });}, 66);
          });
        }
        else{
          $( "#display-table" ).animate({
            marginTop: '+=155px',
            marginBottom: '-=155px'
          }, 400, function() {
            experiment.yposition --;
            experiment.testKey();
            $(document).unbind("keydown", experiment.keyPressHandler);
            $(document).on("keydown", experiment.keyPressHandler);
          });        
        }
      }



     


    }
  }


