var util = util || {};
util.toArray = function(list) {
  return Array.prototype.slice.call(list || [], 0);
};

var Terminal = Terminal || function(cmdLineContainer, outputContainer) {
  window.URL = window.URL || window.webkitURL;
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

  var cmdLine_ = document.querySelector(cmdLineContainer);
  var output_ = document.querySelector(outputContainer);

  const CMDS_ = [
    'cat', 'clear', 'clock', 'date', 'echo', 'help', 'uname', 'whoami', 'resume', 'fun'
  ];
  
  var fs_ = null;
  var cwd_ = null;
  var history_ = [];
  var histpos_ = 0;
  var histtemp_ = 0;

  window.addEventListener('click', function(e) {
    cmdLine_.focus();
  }, false);

  cmdLine_.addEventListener('click', inputTextClick_, false);
  cmdLine_.addEventListener('keydown', historyHandler_, false);
  cmdLine_.addEventListener('keydown', processNewCommand_, false);

  //
  function inputTextClick_(e) {
    this.value = this.value;
  }

  //
  function historyHandler_(e) {
    if (history_.length) {
      if (e.keyCode == 38 || e.keyCode == 40) {
        if (history_[histpos_]) {
          history_[histpos_] = this.value;
        } else {
          histtemp_ = this.value;
        }
      }

      if (e.keyCode == 38) { // up
        histpos_--;
        if (histpos_ < 0) {
          histpos_ = 0;
        }
      } else if (e.keyCode == 40) { // down
        histpos_++;
        if (histpos_ > history_.length) {
          histpos_ = history_.length;
        }
      }

      if (e.keyCode == 38 || e.keyCode == 40) {
        this.value = history_[histpos_] ? history_[histpos_] : histtemp_;
        this.value = this.value; // Sets cursor to end of input.
      }
    }
  }

  //
  function processNewCommand_(e) {

    if (e.keyCode == 9) { // tab
      e.preventDefault();
      // Implement tab suggest.
    } else if (e.keyCode == 13) { // enter
      // Save shell history.
      if (this.value) {
        history_[history_.length] = this.value;
        histpos_ = history_.length;
      }

      // Duplicate current input and append to output section.
      var line = this.parentNode.parentNode.cloneNode(true);
      line.removeAttribute('id')
      line.classList.add('line');
      var input = line.querySelector('input.cmdline');
      input.autofocus = false;
      input.readOnly = true;
      output_.appendChild(line);

      if (this.value && this.value.trim()) {
        var args = this.value.split(' ').filter(function(val, i) {
          return val;
        });
        var cmd = args[0].toLowerCase();
        args = args.splice(1); // Remove cmd from arg list.
      }

      switch (cmd) {
        case 'cat':
          var url = args.join(' ');
          if (!url) {
            output('Usage: ' + cmd + ' https://s.codepen.io/...');
            output('Example: ' + cmd + ' https://s.codepen.io/AndrewBarfield/pen/LEbPJx.js');
            break;
          }
          $.get( url, function(data) {
            var encodedStr = data.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
               return '&#'+i.charCodeAt(0)+';';
            });
            output('<pre>' + encodedStr + '</pre>');
          });          
          break;
        case 'clear':
          output_.innerHTML = '';
		  output('<img align="left" src="logo.svg" width= "120" height= "100" style="padding: 0px 10px 20px 0px"><h2 style="letter-spacing: 4px">Ayush Rautwar</h2><p>' + new Date() + '</p><p>Enter "help" for more information.</p>');
          this.value = '';
          return;
        case 'clock':
          var appendDiv = jQuery($('.clock-container')[0].outerHTML);
          appendDiv.attr('style', 'display:inline-block');
          output_.appendChild(appendDiv[0]);
          break;
        case 'date':
          output( new Date() );
          break;
        case 'echo':
          output( args.join(' ') );
          break;
        case 'help':
          output('<div class="ls-files">' + CMDS_.join('<br>') + '</div>');
          break;
        case 'uname':
          output(navigator.appVersion);
          break;
        case 'whoami':
		  output('<img align="left" src="face.jpg" style="width:20vh; height:auto; padding: 0px 10px 20px 0px"><p style="line-height:1.5">Hi, I am Ayush Rautwar, a junior at Thomas Jefferson High School for Science and Technology. My passion is aerospace engineering. As an avid tinkerer, I often spend weekends refining my programming skills, learning about new technologies, and building new gadgets. Please take a look around my website to learn more about my interests and goals!</p><br><p>High School: TJHSST</p><br><p>Age: 16</p><br><p>Passion (Goal College Path): Computer Science and Aerospace Engineering</p><br><p>Hobbies: Programming, Gardening, Biking, Eating, Being Cool</p><br><p>Philosophy: Low stress -> fun life -> high productivity</p>');
          break;
		case 'resume':
			var a = document.createElement('a');
			output('<a href="resume.pdf" target="_blank" download id="download" hidden></a>');
			document.getElementById('download').click();
			break;
		case 'fun':
			output("Typing Speed: 85 WPM");
			break;
        default:
          if (cmd) {
            output(cmd + ': command not found');
          }
      };

      window.scrollTo(0, getDocHeight_());
      this.value = ''; // Clear/setup line for next input.
    }
  }

  //
  function formatColumns_(entries) {
    var maxName = entries[0].name;
    util.toArray(entries).forEach(function(entry, i) {
      if (entry.name.length > maxName.length) {
        maxName = entry.name;
      }
    });

    var height = entries.length <= 3 ?
        'height: ' + (entries.length * 15) + 'px;' : '';

    // 12px monospace font yields ~7px screen width.
    var colWidth = maxName.length * 7;

    return ['<div class="ls-files" style="-webkit-column-width:',
            colWidth, 'px;', height, '">'];
  }

  //
  function output(html) {
    output_.insertAdjacentHTML('beforeEnd', '<p>' + html + '</p>');
  }

  // Cross-browser impl to get document's height.
  function getDocHeight_() {
    var d = document;
    return Math.max(
        Math.max(d.body.scrollHeight, d.documentElement.scrollHeight),
        Math.max(d.body.offsetHeight, d.documentElement.offsetHeight),
        Math.max(d.body.clientHeight, d.documentElement.clientHeight)
    );
  }

  //
  return {
    init: function() {
      output('<img align="left" src="logo.svg" width= "120" height= "100" style="padding: 0px 10px 20px 0px"><h2 style="letter-spacing: 4px">Ayush Rautwar</h2><p>' + new Date() + '</p><p>Enter "help" for more information.</p>');
    },
    output: output
  }
};
