/*eslint no-console: "off"*/

// Declare globally accessible data:
let menu = {today: false, date: '', menu1: [], menu2: [], menu3: [], menu1name: '', menu2name: '', menu3name: ''};
let responseReceived = false;
let popShown = false;

// Declare globally accessible functions:

const showPop = () => {
    popShown = true;
    history.pushState('pop', 'The Menu at Pembroke');
    document.getElementById('footerPop').style.display = 'block';
};

const hidePop = () => {
    popShown = false;
    document.getElementById('footerPop').style.display = 'none';
    window.history.go(-1);
};

const injectScript = (url) => {
    let scriptElement = document.createElement('script');
    scriptElement.setAttribute('type', 'text/javascript');
    scriptElement.setAttribute('src', url);
    document.getElementsByTagName('head')[0].appendChild(scriptElement);
};

const setMenuNames = (menu1name, menu2name, menu3name) => {
    menu.menu1name = menu1name;
    menu.menu2name = menu2name;
    menu.menu3name = menu3name;
};

const populateMenu = (entry) => {
    const parseSectionToMenu = (parseString, menuNum, type) => {
        if(parseString == '') {
            return;
        }
        let item = true;
        let i = menu[menuNum].length;

        while(item) {
            menu[menuNum].push({food: '', price: '', contains: '', type: 'none'});
            const twoSpaces = (parseString.substring(0, parseString.search(/£/))).search(/\b\s*[\n\r]/);
            const vegV = (parseString.substring(0, parseString.search(/£/))).search(/\(V\)/);
            let tempContains;
            if(vegV != -1) {
                console.log('veg');
                menu[menuNum][i].food = parseString.substring(0, parseString.search(/\(V\)/)).trim();
                tempContains = parseString.substring(parseString.search(/\(V\)/)+3, parseString.search(/£/)).trim();
                if(!tempContains === '') {
                    menu[menuNum][i].contains = tempContains.toLowerCase();
                }
                menu[menuNum][i].veg = true;
            } else if(twoSpaces != -1) {
                console.log('twospaces');
                menu[menuNum][i].food = parseString.substring(0, parseString.search(/\b\s*[\n\r]/)+1).trim();
                tempContains = parseString.substring(parseString.search(/\b\s*[\n\r]/)+1, parseString.search(/£/)).trim();
                if(!tempContains === '') {
                    menu[menuNum][i].contains = tempContains.toLowerCase();
                }
            } else {
                // if price before contains, skip contains:
                if (parseString.search(/£/) < parseString.search(/[a-z][A-Z]/)) {
                    menu[menuNum][i].food = parseString.substring(0, parseString.search(/£/)).trim();
                } else {
                    menu[menuNum][i].food = parseString.substring(0, parseString.search(/[a-z][A-Z]/) + 1).trim();
                    tempContains = parseString.substring(parseString.search(/[a-z][A-Z]/) + 1, parseString.search(/£/)).trim();
                    menu[menuNum][i].contains = tempContains;
                }
            }
            menu[menuNum][i].price = (parseString.substring(parseString.search(/£/), parseString.search(/[0-9][0-9]/)+2)).trim();

            // if name empty, move contains to name
            if (menu[menuNum][i].food === '') {
                menu[menuNum][i].food = menu[menuNum][i].contains;
                menu[menuNum][i].contains = '';
            }

            if (type == 'sp') menu[menuNum][i].type = 'sp';
            if (type == 'gk') menu[menuNum][i].type = 'gk';
            if (type == 'side') menu[menuNum][i].type = 'side';
            const priceNum = parseFloat(menu[menuNum][i].price.substring(1));
            if (priceNum == 1.55) menu[menuNum][i].type = 'dessert';
            if (priceNum == 1.40) menu[menuNum][i].type = 'soup';
            if (priceNum >= 2.60 && priceNum <= 3.10) {
                menu[menuNum][i].food += ' (v)';
                menu[menuNum][i].type = 'gkv';
            }

            // If text immediately after price AND no text between that and next price, append to broken name
            var checkAfter = parseString.substring(parseString.search(/£/)+5);
            // checkBetween: return -1 if no text between "correction" line and next price (todo - MAY BE BROKEN FOR WHEN THIS INCLUDES ALLERGENS AS WELL)
            var checkBetween = checkAfter.search(/[a-z]*[\n\r]*£/i);
            if(checkAfter.search(/^\s?[\n\r]\s?\b/) > -1 && checkBetween == -1) {
                var append = checkAfter.substring(0, checkAfter.search(/(\b\n)|(\b$)/));
                menu[menuNum][i].food += ' ' + append.trim();
                parseString = checkAfter.substring(checkAfter.search(/(\b\n)|(\b$)/)+1);
            } else {
                parseString = parseString.substring(parseString.search(/[0-9][0-9]/)+2);
            }

            // if(type == "side") {
            //     console.log(menu[menuNum][i])
            //     var temp = menu[menuNum][i].food;
            //     menu[menuNum][i].food = menu[menuNum][i].contains;
            //     menu[menuNum][i].contains = temp;
            //     menu[menuNum][i].food = menu[menuNum][i].food.charAt(0).toUpperCase() + menu[menuNum][i].food.slice(1);
            //     menu[menuNum][i].contains = "";
            // }

            menu[menuNum][i].contains = menu[menuNum][i].contains.toLowerCase();

            if(parseString.length < 10) {
                item = false;
            }
            i = i+1;
        }
    };

    responseReceived = true;

    // Compare dates
    var postDate = parseInt(entry.date.substring(0,10).replace(/-/g,''));
    //var todayDate = parseInt(new Date().toISOString().substring(0, 10).replace(/-/g,''));
    var today = new Date();
    today.setFullYear(2018, 5, 26);
    var todayDate = parseInt(today.toISOString().substring(0, 10).replace(/-/g,''));
    var yesterdayDate = parseInt(new Date(Date.now() - 24*60*60*1000).toISOString().substring(0, 10).replace(/-/g,''));

    if(postDate == todayDate) {
        // A menu for today has been posted and found
        menu.today = true;
        menu.date = entry.date.substring(0,entry.date.search(/20[0-9][0-9]/)+4);
    } else if(((new Date()).getDay() == 0) && (postDate == yesterdayDate)) {
        // Today is Sunday, posting Saturday's two-day menu
        menu.today = true;
        menu.date = entry.date.substring(0,entry.date.search(/20[0-9][0-9]/)+4);
    } else {
        console.log('No menu found for today - post date doesn\'t match current date');
    }
    // Force date ignore for testing -
    // menu.today = true;

    var content = String(entry.summary.content);

    // Remove image tags from HTML before rendering
    content = content.replace(/<img.+\/>/g, '');

    var newcontent = document.createElement('div');
    newcontent.innerHTML = content;
    var menuText = newcontent.textContent || newcontent.innerText || '';
    console.log(menuText)
    // First delete the line about formal:
    // var cutStart = menuText.search(/[A-Za-z0-9 ]*formal/i);
    // var cutLine = menuText.substring(cutStart, menuText.substring(cutStart).search(/[\n\r]/)+cutStart);
    // var cutEnd = cutStart + cutLine.length;
    // menuText = menuText.substring(0, cutStart) + menuText.substring(cutEnd);
    // console.log(cutStart, cutEnd)
    // console.log(menuText)

    if ((menuText.search(/saturday/i) > -1) && (menuText.search(/sunday/i) > -1)) { // weekend both days
        console.log('Weekend');

        var spSatStart = menuText.search(/price/i)+5;
        var spSatEnd = (menuText.substring(spSatStart)).search(/(Simply Pembroke)/) -1 + spSatStart;

        var spSunStart = (menuText.substring(spSatEnd)).search(/(price)/i) + 5 + spSatEnd;
        var spSunEnd = menuText.search(/(Pembroke Catering)/i) -1;

        var gkSatStart = (menuText.substring(spSunEnd)).search(/price/i) + 5 + spSunEnd;
        var gkSatEnd = (menuText.substring(gkSatStart)).search(/(Pembroke Catering)/i) + gkSatStart;

        var gkSunStart = (menuText.substring(gkSatEnd)).search(/price/i) + 5 + gkSatEnd;
        var gkSunEnd = menuText.search(/(all side)|(let's block)/i);

        //var sidesStart = ((menuText.substring(gkSunEnd)).substring(menuText.substring(gkSunEnd).search(/side/i))).search(/[\n\r][\n\r]/) + gkSunEnd + 4;
        var sidesStart = ((menuText.substring(gkSunEnd)).substring(menuText.substring(gkSunEnd).search(/side/i))).search(/vegan friendly/) + gkSunEnd + 18;

        var sidesEnd = menuText.search(/let's block/i);
        if(menuText.search(/all side/i) == -1) {
            sidesStart = sidesEnd;
        }

        var spSat = menuText.substring(spSatStart, spSatEnd).trim();
        var spSun = menuText.substring(spSunStart, spSunEnd).trim();
        var gkSat = menuText.substring(gkSatStart, gkSatEnd).trim();
        var gkSun = menuText.substring(gkSunStart, gkSunEnd).trim();
        var sides = menuText.substring(sidesStart, sidesEnd).trim();

        parseSectionToMenu(spSat, 'menu1', 'sp');
        parseSectionToMenu(gkSat, 'menu1', 'gk');
        parseSectionToMenu(spSun, 'menu2', 'sp');
        parseSectionToMenu(gkSun, 'menu2', 'gk');
        parseSectionToMenu(sides, 'menu3', 'side');

        setMenuNames('Saturday dinner', 'Sunday dinner', 'Sides');
    } else if ((menuText.search(/saturday/i) > -1) || ((new Date(2018,5,26)).getDay() == 6)) { // Saturday only

        console.log('Saturday');

        var spSatStart = menuText.search(/price/i)+5;
        var spSatEnd = (menuText.substring(spSatStart)).search(/(Pembroke Catering)/) + spSatStart;

        var gkSatStart = (menuText.substring(spSatEnd)).search(/price/i) + 5 + spSatEnd;
        var gkSatEnd = (menuText.substring(gkSatStart)).search(/(all side)|(let's block)/i) + gkSatStart;

        //var sidesStart = ((menuText.substring(gkSatEnd)).substring(menuText.substring(gkSatEnd).search(/side/i))).search(/[\n\r][\n\r]/) + gkSatEnd + 4;
        var sidesStart = ((menuText.substring(gkSatEnd)).substring(menuText.substring(gkSatEnd).search(/side/i))).search(/vegan friendly/) + gkSatEnd + 18;

        var sidesEnd = menuText.search(/let's block/i);
        if(menuText.search(/all side/i) == -1) {
            sidesStart = sidesEnd;
        }

        var spSat = menuText.substring(spSatStart, spSatEnd).trim();
        var gkSat = menuText.substring(gkSatStart, gkSatEnd).trim();
        var sides = menuText.substring(sidesStart, sidesEnd).trim();

        parseSectionToMenu(spSat, 'menu1', 'sp');
        parseSectionToMenu(gkSat, 'menu1', 'gk');
        parseSectionToMenu(sides, 'menu2', 'side');

        setMenuNames('Saturday dinner', 'Sides', '');

    } else if ((menuText.search(/sunday/i) > -1) || ((new Date(2018,5,26)).getDay() == 0)) { // Sunday only
        console.log('Sunday');

        var spSunStart = menuText.search(/price/i)+5;
        var spSunEnd = (menuText.substring(spSunStart)).search(/(Pembroke Catering)/) + spSunStart;

        var gkSunStart = (menuText.substring(spSunEnd)).search(/price/i) + 5 + spSunEnd;
        var gkSunEnd = (menuText.substring(gkSunStart)).search(/(all side)|(let's block)/i) + gkSunStart;

        //var sidesStart = ((menuText.substring(gkSunEnd)).substring(menuText.substring(gkSunEnd).search(/side/i))).search(/[\n\r][\n\r]/) + gkSunEnd + 4;
        var sidesStart = ((menuText.substring(gkSunEnd)).substring(menuText.substring(gkSunEnd).search(/side/i))).search(/vegan friendly/) + gkSunEnd + 18;
        var sidesEnd = menuText.search(/let's block/i);
        if(menuText.search(/all side/i) == -1) {
            sidesStart = sidesEnd;
        }

        var spSun = menuText.substring(spSunStart, spSunEnd).trim();
        var gkSun = menuText.substring(gkSunStart, gkSunEnd).trim();
        var sides = menuText.substring(sidesStart, sidesEnd).trim();

        parseSectionToMenu(spSun, 'menu2', 'sp');
        parseSectionToMenu(gkSun, 'menu2', 'gk');
        parseSectionToMenu(sides, 'menu3', 'side');

        setMenuNames('', 'Sunday dinner', 'Sides');
    } else {
        console.log("weekday")
        console.log(menuText)
        // Weekday:
        var spLunchStart = menuText.search(/price/i)+5;
        var spLunchEnd = (menuText.substring(spLunchStart)).search(/(Simply Pembroke)/) + spLunchStart;

        var spDinnerStart = (menuText.substring(spLunchEnd)).search(/(price)/i) + 5 + spLunchEnd;
        var spDinnerEnd = menuText.search(/(Pembroke Catering)\s+Lunch/);

        var gkLunchStart = (menuText.substring(spDinnerEnd)).search(/price/i) + 5 + spDinnerEnd;
        var gkLunchEnd = (menuText.substring(gkLunchStart)).search(/(Pembroke Catering)/) + gkLunchStart;

        var gkDinnerStart = (menuText.substring(gkLunchEnd)).search(/price/i) + 5 + gkLunchEnd;
        var gkDinnerEnd = menuText.search(/(all side)|(let's block)/i);

        var sidesStart = ((menuText.substring(gkDinnerEnd)).substring(menuText.substring(gkDinnerEnd).search(/side/i))).search(/vegan friendly/) + gkDinnerEnd + 18;
        var sidesEnd = menuText.search(/let's block/i);
        if(menuText.search(/all side/i) == -1) {
            sidesStart = sidesEnd;
        }

        var spLunch = menuText.substring(spLunchStart, spLunchEnd).trim();
        var spDinner = menuText.substring(spDinnerStart, spDinnerEnd).trim();
        var gkLunch = menuText.substring(gkLunchStart, gkLunchEnd).trim();
        var gkDinner = menuText.substring(gkDinnerStart, gkDinnerEnd).trim();
        var sides = menuText.substring(sidesStart, sidesEnd).trim();

        console.log("HERE")
        console.log(gkDinner)

        parseSectionToMenu(spLunch, 'menu1', 'sp');
        parseSectionToMenu(gkLunch, 'menu1', 'gk');
        parseSectionToMenu(spDinner, 'menu2', 'sp');
        parseSectionToMenu(gkDinner, 'menu2', 'gk');
        parseSectionToMenu(sides, 'menu3', 'side');

        setMenuNames('Lunch', 'Dinner', 'Sides');
    }
};

const printMenu = () => {
    if(menu.today == true) {
        // Menu 1:
        console.log(menu)
        document.getElementById('menu1meal').innerHTML = menu.menu1name + ' &raquo;';
        for(let i=0; i<menu.menu1.length; i++) {
            document.getElementById('menu1').innerHTML += '<a href=\'https://www.google.com/search?q=' + menu.menu1[i].food + '\'><div class=\'item sp ' + menu.menu1[i].type + '\'><span class=\'name\'>' + menu.menu1[i].food + '</span><span class=\'price\'>' + menu.menu1[i].price + '</span><span class=\'contains\'>' + menu.menu1[i].contains + '</span></div></a>';
        }
        console.log(document.getElementById('menu1'))
        // Menu 2:
        document.getElementById('menu2meal').innerHTML = menu.menu2name + ' &raquo;';
        for(let i=0; i<menu.menu2.length; i++) {
            document.getElementById('menu2').innerHTML += '<a href=\'https://www.google.com/search?q=' + menu.menu2[i].food + '\'><div class=\'item sp ' + menu.menu2[i].type + '\'><span class=\'name\'>' + menu.menu2[i].food + '</span><span class=\'price\'>' + menu.menu2[i].price + '</span><span class=\'contains\'>' + menu.menu2[i].contains + '</span></div></a>';
        }
        // Menu 3:
        if(menu.menu3.length > 0) {
            document.getElementById('menu3meal').innerHTML = menu.menu3name + ' &raquo;';
            for(let i=0; i<menu.menu3.length; i++) {
                document.getElementById('menu3').innerHTML += '<a href=\'https://www.google.com/search?q=' + menu.menu3[i].food + '\'><div class=\'item sp ' + menu.menu3[i].type + '\'><span class=\'name\'>' + menu.menu3[i].food + '</span><span class=\'price\'>' + menu.menu3[i].price + '</span><span class=\'contains\'>' + menu.menu3[i].contains + '</span></div></a>';
            }
        }

        // if day of week is sunday, hide saturday:
        if ((new Date(2018,05,26)).getDay() == 0) {
            document.getElementById('menu1').style.display = 'none';
            document.getElementById('columnSplit').style.display = 'none';
        }

        document.getElementById('waiting').style.display = 'none';
        document.getElementById('mainPane').style.display = 'block';
        //document.getElementById('loading').style.display = 'none';
    } else {
        document.getElementById('waiting').style.display = 'none';
        document.getElementById('notPublished').style.display = 'block';
    }
}

// Load RSS feed; do on response from JQL callback:
const handleResponse = (response) => {
    try {
        console.log('Response from YQL:');
        console.log(response);
        // Skip first post if it's a formal menu or otherwise unrelated:
        var thePost = response.query.results.feed.entry[0];

        if ((thePost.title).search(/formal/i) > -1) {
            console.log('Got here 1');
            thePost = response.query.results.feed.entry[1];
            console.log('Formal found - skipping.');
        } else if ((thePost.title).search(/menu/i) == -1) {
            console.log('Got here 2');
            console.log(thePost.title);
            thePost = response.query.results.feed.entry[1];
            console.log('Irrelevant first post found - skipping.');
        }

        // Parse the feed to the menu object:
        populateMenu(thePost);

        // Now print the menus to their HTML divs:
        printMenu();
    } catch(err) {
        console.log('Error caught');
        document.getElementById('waiting').style.display = 'none';
        document.getElementById('error').style.display = 'block';
    }
};

// Begin the app once DOM has loaded:

var now = new Date(2018,5,26);
var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var theDay = days[now.getDay()];
var theMonth = months[now.getMonth()];
var theYear = now.getFullYear();

document.getElementById('line2').innerHTML = 'for ' + theDay + ', ' + now.getDate() + ' ' + theMonth + ' ' + theYear;

// The Menu is dead; hardcode to final ever post on ThePembrokeKitchen:
final_post = Object();
final_post.date = "2018-06-26";

// $.get("thepembrokekitchen-2018-10-18-final.html", function(textString) {
    // console.log(textString)
// });
function loadFile(filePath) {
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send();
    if (xmlhttp.status==200) {
      result = xmlhttp.responseText;
    }
    return result;
  }

final_post.summary = {}
final_post.summary.content = loadFile("menu-2018-06-26.html");
populateMenu(final_post);
printMenu();

// http://developer.yahoo.com/yql/console/?q=select%20*%20from%20feednormalizer%20where%20url%3D'http%3A%2F%2Fftr.fivefilters.org%2Fmakefulltextfeed.php%3Furl%3Dhttp%253A%252F%252Fthepembrokekitchen.blogspot.com%252Ffeeds%252Fposts%252Fdefault%26amp%3Bamp%3Bmax%3D2'%20and%20output%3D'atom_1.0'

// injectScript('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20feednormalizer%20where%20url%3D\'http%3A%2F%2Fftr.fivefilters.org%2Fmakefulltextfeed.php%3Furl%3Dhttp%253A%252F%252Fthepembrokekitchen.blogspot.com%252Ffeeds%252Fposts%252Fdefault%26max%3D2\'%20and%20output%3D\'atom_1.0\'&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=handleResponse&_maxage=660');

// var timeLimit = 10;
// var start = new Date;

// setTimeout(function() {
//     if(!responseReceived) {
//         if ((new Date - start) / 1000 >= timeLimit) {
//             console.log('Timed out waiting for YQL response');
//             // window.location.reload();
//         }
//         else {
//             setTimeout(arguments.callee, 100);
//         }
//     }
// }, 100);

var userAgent = navigator.userAgent || navigator.vendor || window.opera;
if( userAgent.match( /iPad/i ) || userAgent.match( /iPhone/i ) || userAgent.match( /iPod/i ) ) {
    // on iOS
    document.getElementById('firstInside').innerHTML += '<p>To use this app, you should install it to your home screen:</p><ol><li>Tap the <img src=\'img/ios-share.png\' id=\'ios\' /> <span class=\'b\'>share button</span></li><li>Tap <span class=\'b\'>\'Add to Home Screen\'</span> then tap <span class=\'b\'>\'Add\'</span></li><li>Close this browser and launch the app!</li></ol><p id=\'small\'>(To browse as a website instead, <span class=\'b\'><a href=\'\'>tap here</a></span> and this message won\'t be shown again.)</p>';
} else if( userAgent.match( /Android/i ) ) {
    // on Android
    document.getElementById('firstInside').innerHTML += '<p>To use this app, you should install it to your home screen:</p><ol><li>Tap the <img src=\'img/android-menu.png\' id=\'android\' /> <span class=\'b\'>menu button</span></li><li>Tap <span class=\'b\'>\'Add to Home screen\'</span> then tap <span class=\'b\'>\'Add\'</span></li><li>Close this browser and launch the app!</li></ol><p id=\'small\'>(To browse as a website instead, <span class=\'b\'><a href=\'\'>tap here</a></span> and this message won\'t be shown again.)</p>';
} else {
    // assume desktop
    document.getElementById('firstInside').innerHTML += '<p>You can install this app by visiting <a href=\'https://menu.dunkley.me\'>menu.dunkley.me</a> from your phone.</p><p>To use it as a website on your computer, <span class=\'b\'><a href=\'\'>click here</a></span> and this message won\'t be shown again.</p>';
}

var shown= localStorage.getItem('isshown');
// Add (|| 1) for testing
if(shown !='t') {
    localStorage.setItem('isshown', 't');
    document.getElementsByClassName('app')[0].style.display = 'none';
    document.getElementById('firstPop').style.display = 'block';
}

// Back button closes pop-up
const onBackKeyDown = (event) => {
    hidePop();
    event.preventDefault();
};
//document.addEventListener('backbutton', onBackKeyDown, false);

window.onpopstate = function(event) {
    if(popShown) {
        hidePop();
    }
};
