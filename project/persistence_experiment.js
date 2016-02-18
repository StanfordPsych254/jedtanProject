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

// Shows slides. We're using jQuery here - the **$** is the jQuery selector function, which takes as input either a DOM element or a CSS selector string.
function showSlide(id) {
  // Hide all slides
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
  currenttrial: 0,
  stimulustype: 0,
  gridsize: 4,
  xposition: 0,
  yposition: 0,
  trialinfo: [],

  // Parameters for this sequence.
  // Experiment-specific parameters - which keys map to odd/even
  movement_constant: 100,
  alltrials: [[2, 14, 5, 6], [3, 6, 9, 12]],
  trials: allPuppies.length,
  // An array to store the data that we're collecting.
  data: [],
  // The function that gets called when the sequence is finished.
  end: function() {
    // Show the finish slide.
    showSlide("finished");
    // Wait 1.5 seconds and then submit the whole experiment object to Mechanical Turk (mmturkey filters out the functions so we know we're just submitting properties [i.e. data])
    setTimeout(function() { turk.submit(experiment) }, 1500);
    console.log(experiment);
  },
  // The work horse of the sequence - what to do on every trial.
  next: function() {
    $('body').css({'background-color': 'black'});
    showSlide("stage");
    if (experiment.alltrials.length == 0) {
      experiment.end();
      return;
    }
    trial_values = experiment.alltrials.shift();
    trial_info = [];
    for (var val in trial_values){
      trial_info.push([(trial_values[val]-1) % experiment.gridsize, Math.floor((trial_values[val]-1) / experiment.gridsize)]);
    }
    experiment.trialinfo = trial_info;
    console.log(experiment.trialinfo);
    var html_string = "<table id='path-holder'><tr><td><img src='images/" + trial_values[0] + ".jpg'></img></td><td><img src='images/" + trial_values[1] + ".jpg'></img></td><td><img src='images/" + trial_values[2] + ".jpg'></img></td><td><img src='images/" + trial_values[3] + ".jpg'></img></td></tr></table>";
    var left_string = "+=" + experiment.xposition * 104 + "px";
    $('#path').html(html_string);
    $( "#display-table" ).css({
                marginLeft: left_string
                });

    $( "#display-table" ).animate({
          margin: '0 auto',
      }, 125, function() {
    }); 

    experiment.xposition = 0;
    experiment.yposition = 0;
    
    experiment.trials--;
    

    var keyBindings = {};
    var stimulus = [];
    var position = randomInteger(2);

    // Display the number stimulus.
    
   
    
    // Get the current time so we can compute reaction time later.
    var startTime = (new Date()).getTime();
    
    // Set up a function to react to keyboard input. Functions that are used to react to user input are called *event handlers*. In addition to writing these event handlers, you have to *bind* them to particular events (i.e., tell the browser that you actually want the handler to run when the user performs an action). Note that the handler always takes an <code>event</code> argument, which is an object that provides data about the user input (e.g., where they clicked, which button they pressed).
    var keyPressHandler = function(event) {
      // A slight disadvantage of this code is that you have to test for numeric key values; instead of writing code that expresses "*do X if 'Q' was pressed*", you have to do the more complicated "*do X if the key with code 80 was pressed*". A library like [Keymaster](http://github.com/madrobby/keymaster) lets you write simpler code like <code>key('a', function(){ alert('you pressed a!') })</code>, but I've omitted it here. Here, we get the numeric key code from the event object
      var keyCode = event.which;
      
      if (keyCode == 37 && experiment.xposition < experiment.gridsize-1) {
        experiment.xposition ++;
        if (experiment.stimulustype == 1){
          $( "#display-table" ).animate({
            opacity: '0'
           }, 250, function() {
              $( "#display-table" ).css({
                marginLeft: '-=150px'
                });
              $( "#display-table" ).animate({
                opacity: '1'
                }, 250, function() {});
          });
        }
        else{
          $( "#display-table" ).animate({
            marginLeft: '-=150px'
           }, 250, function() {
          });
        }
      } 
      else if (keyCode == 38 && experiment.yposition < experiment.gridsize-1) {
        experiment.yposition ++;
        if (experiment.stimulustype == 1){
          $( "#display-table" ).animate({
            opacity: '0'
           }, 250, function() {
              $( "#display-table" ).css({
                marginTop: '-=109px',
                marginBottom: '+=109px'
                });
              $( "#display-table" ).animate({
                opacity: '1'
                }, 250, function() {});

          });
        }
        else{
          $( "#display-table" ).animate({
          marginTop: '-=156px',
          marginBottom: '+=156px'
         }, 250, function() {
        });
        }
      }
      else if (keyCode == 39 && experiment.xposition > 0) {
        experiment.xposition --;
        if (experiment.stimulustype == 1){
          $( "#display-table" ).animate({
            opacity: '0'
           }, 250, function() {
              $( "#display-table" ).css({
                marginLeft: '+=150px'
                });
              $( "#display-table" ).animate({
                opacity: '1'
                }, 250, function() {});
          });
        }
        else{
          $( "#display-table" ).animate({
            marginLeft: '+=150px'
           }, 250, function() {
          });
        }
      }
      else if (keyCode == 40 && experiment.yposition > 0) {
        experiment.yposition --;
        if (experiment.stimulustype == 1){
          $( "#display-table" ).animate({
            opacity: '0'
           }, 250, function() {
              $( "#display-table" ).css({
                marginTop: '+=156px',
                marginBottom: '-=156px'
                });
              $( "#display-table" ).animate({
                opacity: '1'
                }, 250, function() {});
          });
        }
        else{
          $( "#display-table" ).animate({
            marginTop: '+=156px',
            marginBottom: '-=156px'
           }, 250, function() {
          });        
        }
      }

      console.log("X:" + experiment.xposition + " Y:" + experiment.yposition);
      console.log(experiment.trialinfo[0]);
      if (experiment.xposition == experiment.trialinfo[0][0] && experiment.yposition == experiment.trialinfo[0][1]) {
        experiment.trialinfo.shift();
        console.log("correct");
        if (experiment.trialinfo.length == 0){
            var endTime = (new Date()).getTime(),
            data = {
              time: endTime - startTime,
              stimulus: experiment.stimulustype,
              trial: experiment.currenttrial
            };

          experiment.data.push(data);
          experiment.currenttrial ++;
          setTimeout(experiment.next, 500);



        }
      }
    };
    
    if (experiment.currenttrial == 0){
      $(document).on("keydown", keyPressHandler);
    }
    console.log("hi");
    
  }
}


