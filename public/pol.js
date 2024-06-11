$(function() {   // Handler for .ready() called.
	document.getElementById('toggle').addEventListener('click', function (e) {
		document.getElementById('tuckedMenu').classList.toggle('custom-menu-tucked');
		document.getElementById('toggle').classList.toggle('x');
	});
	
	$('#linkabout').click(function(){
		$('.main').addClass('hidden');
		$('#blockabout').removeClass('hidden');
	});
	
	$('#linkcontact').click(function(){
		$('.main').addClass('hidden');
		$('#blockcontact').removeClass('hidden');
	});
	
	$('.custom-menu-brand').click(function(){
		$('.main').addClass('hidden');
		$('#blocksearch').removeClass('hidden');
	});
	
	
	setTimeout("$('#tasearch').focus();", 0) 

function timerIncrement() {
    idleTime = idleTime + 1;
    if (idleTime > 59) { // 20 minutes
		console.log("reload on idle");
        window.location.reload();
    }
}
	
	var idleTime = 0;

	//Increment the idle time counter every minute.
	var idleInterval = setInterval(timerIncrement, 60000); // 1 minute

	//Zero the idle timer on mouse movement.
	$(this).mousemove(function (e) {
		idleTime = 0;
	});
	$(this).keypress(function (e) {
		idleTime = 0;
	});


	
	 // var el = $("#tasearch2").get(0);
		// var elemLen = el.value.length;
		// el.selectionStart = elemLen;
		// el.selectionEnd = elemLen;
		// el.focus();
// console.log("document.URL : "+document.URL);
// console.log("document.location.href : "+document.location.href);
// console.log("document.location.origin : "+document.location.origin);
// console.log("document.location.hostname : "+document.location.hostname);
// console.log("document.location.host : "+document.location.host);
// console.log("document.location.pathname : "+document.location.pathname);	
	
	$.ajax({
		url: "/user",
		cache: false,
		success: function (resp) {
			// $('#unamelink').html('keke');
			// $('#unamelink').html(resp);
			// window.location.replace("http://stackoverflow.com");
			// console.log(resp);
			$('#unamespan').html(resp);
		},
	});
	
	 var SgSrch = new Bloodhound({ 
		 queryTokenizer: Bloodhound.tokenizers.whitespace, 
		 datumTokenizer: Bloodhound.tokenizers.obj.whitespace('title'), 
		 identify: function(obj) { return obj.title; },
		 prefetch: {
			 url: '/def.json',		 
			 cacheKey: "olo2",
			 cache: false
		 },
		 remote: { 
			url: '/data.json?%QUERY', 
			wildcard: '%QUERY',
			transform: function(d) {
				// console.log(d);
				return d;
				
			},
			
			// replace: function(url, uriEncodedQuery) {
				// // settings.url = settings.url + '&country=' + selectedCountry();
				// // console.log(settings);
				// // var newUrl = url + '?query=' + uriEncodedQuery;
				// // newUrl += '&country=' + $('#wine_Pays').val();				
				// console.log(uriEncodedQuery);
				// return url;
			// },
		
		},
	 }); 
	 // SgSrch.clearPrefetchCache();
	 SgSrch.initialize(); 
	/*
	 SgSrch.search('al', function(s) { 
	 console.log('food='+JSON.stringify(s)); 
	 }); 
	 */
	 
	 
function SgSrchDef(q, sync, async) {
    if (q === '') {
	   // console.log(SgSrch.all().slice(0, 5));
	   sync(SgSrch.all().slice(0, 5));
	   return SgSrch.all().slice(0, 5)
    } else {
	  return SgSrch.search(q, sync, async)
    }
  }

	$('#tasearch')
		.typeahead(
		//null, // passing in `null` for the `options` arguments will result in the default options being used
		{
		  highlight: true,
		  minLength: 0,
		},
		{
		  name: 'countries2',
		  limit: 10,
		  display: 'title',
		  //source: SgSrch
		  source: SgSrchDef
		  
		})
		.on('typeahead:opened', onOpened)
		.on('typeahead:selected', onAutocompleted)
		.on('typeahead:autocompleted', onSelected)
		.on('typeahead:asyncreceive', onRec)
		.on('typeahead:rendered', function($e, datum, datum2) {
			
			// console.warn('datum', (datum ? datum : 'NOTHING'));
			
			if (datum) getById(datum.id);
			var sugboxht = $('.tt-menu').height();
			// console.log(sugboxht);
			$('#entry').css('margin-top',10+20+sugboxht);
			// $('#tasearch').typeahead('close');
			// console.log("renderED", datum, datum2);
			if (datum){
				if(!datum2){
					$('#tasearch').typeahead('close');
					$('#entry').css('margin-top',20);
					// var curSrch = $('#tasearch').val();
					// if(curSrch === datum.title){
						
					// }
				}
			}
		})
		.on('typeahead:close', function($e) {
			$('#entry').css('margin-top',20);
		})
		.on('typeahead:render', function($e, datum, datum2, datum3) {
			// console.info("render");
		})
		.on('keydown', function() {
			var key = event.keyCode || event.charCode;

			if( key == 46 ) {
				 var caretPos = document.getElementById("tasearch").selectionStart;
				// jQuery("#txt").val(textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring(caretPos) );
				if (caretPos){
					if ($('#tasearch').val().length === caretPos) {
						console.log('end');
						$('#tasearch').val('');
						// return false;
					}
				}
			} else if (key == 13) {
				console.log("enter!");
				return false;				
			}
			
		  })
		.keypress(function(evt){
			evt = evt || window.event;
			var charCode = evt.which || evt.keyCode;
	
			if (charCode !== 32){
				var charTyped = String.fromCharCode(charCode);
				
				// preg_replace("/[^[:alnum:][:space:]]/u", '', $string);
				// 
				charTyped = charTyped.replace(/[-'`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/0-9]/i, '');
				if (charTyped){
					var loc = getLoc(charTyped);
					var curSrch = $('#tasearch').val();
					var loc0 = getLoc(curSrch);
					console.log("Character typed: " + charCode + ' = ' + charTyped + " " +loc + ' in ' + curSrch);
					$('h1').html((loc === 'ru' ? 'Русско-польский словарь': 'Słownik polsko-ruski'));
					
					if (loc !== loc0){
						console.log("switch locale");
						$('#tasearch').val('');
					}
				} else {
					console.log("zero!");
				}
			}
			
			
			
		})
		.bind( "click", function() {
		  // alert( "User clicked on 'foo.'" );
		});
	
	
function getLoc(str) {
    return str.match(/[A-ZĄĆĘŁŃÓŚŹŻ]/i) ? "pl" : "ru";
}
	
function onRec($e) {
    // console.log($e);
	// window.location.replace("http://stackoverflow.com");
}

function onOpened($e) {
    console.log('opened');
}
 
function onAutocompleted($e, datum) {
    console.log('autocompleted');
	getById(datum.id);
}
 
function getById(id){
	// $.getJSON( , function( data ) {
		// var o = data[0];
		// showEntry(o.body, o.title);
	// });
	$.getJSON( "datum.json?" + id, { name: "John", time: "2pm" } )
	  .done(function( json ) {
			// console.log("ok");
			var o = json[0];
			showEntry(o.body, o.title);
	  })
	  .fail(function( jqxhr, textStatus, error ) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
		window.location.replace(document.location.origin);
		console.info("doing reload...");
	});
}


function showEntry (reply, title){
	// reply = reply.replace(/^/, "<div>");
	// reply = reply.replace(/$/, "</div>");
	// reply = reply.replace(/(?=Δ)/mg, "</div><div>");
	reply = reply.replace(/\n/mg, "<br/>");
	// reply = reply.replace(/\#/mg, "♥");
	// <c c="brown">выражаю согласие, подтверждаю</c>
	reply = reply.replace(/\<c\s+c\=\"/mg, '<span style="color:');
	reply = reply.replace(/\<\/c\>/mg, '</span>');

	$('#title').html(title);
	$('#entry_body').html(reply);
}
	
function onSelected($e, datum) {
    console.log('selected');
    console.log(datum);
	

}
});

