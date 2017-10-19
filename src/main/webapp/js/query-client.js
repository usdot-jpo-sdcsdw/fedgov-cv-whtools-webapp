$(function() {

	// var defs
	var temp;
	var msgCount = 0;
	var ws = null;
	var wbs = null;
	var nwMap = null;
	var seMap = null;
	var nwMap2 = null;
	var seMap2 = null;
	var resultSeparator = "----------------------------------------------------";
	var objDiv = document.getElementById("subResults");
	
	// function defs
	function startsWith(stringToSearch, pattern) {
		return (stringToSearch.indexOf(pattern) == 0);
	}
	
	function appendValue(obj, value) {
		var prev_text = obj.val();
		obj.val(prev_text + value + '\n');
	}
	
	function getNVPValue(nvp) {
		var nvpArray = nvp.split("=");
		return nvpArray[1];
	}
	
	function initPage() {
		$("#connect").prop('disabled', false);
		$("#disconnect").prop('disabled', true);
		$("#wbsConnect").prop('disabled', false);
		$("#wbsDisconnect").prop('disabled', true);
		$("#submitQuery").prop('disabled', true);
		$("#submitSubscription").prop('disabled', true);
		$('#spinner,#spinner2').hide();
		$('#queryIndicator,#subscribeIndicator,#mapIndicator,#depositIndicator').css({'color':'red'});
		$('#mapTools').hide();
		
		var hostname = window.location.host.split(":")[0];
		var context = window.location.pathname.split("/")[1];
		$("#wsURL").val("wss://" + hostname + ":443/" + context + "/websocket");
		$("html,body").scrollTop(0);
		
		var hostname = window.location.host.split(":")[0];
		var context = window.location.pathname.split("/")[1];
		$("#wbsURL").val("wss://" + hostname + ":443/" + context + "/websocket");
		$("html,body").scrollTop(0);
	}
	
	function toUTCDateString(localDateString) {
	    // bit of a hack method here because chrome and firefox parse date strings differently
		// if given no timezone info in date string chrome assumes UTC and firefox assumes local 
		// see http://stackoverflow.com/questions/15109894/new-date-works-differently-in-chrome-and-firefox
		// we don't have a great way of getting timezone accurately without external js lib so we use this function
		// both chrome and firefox use local time zone with no-arg "new Date()", so we use that, parse the date components
		// set them on the "new Date()" and then convert that to UTC
		var d = new Date();
	    var pattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
	    var matches = localDateString.match(pattern);

	    d.setFullYear(matches[1]);
	    d.setMonth(matches[2] - 1);
	    d.setDate(matches[3]);
	    d.setHours(matches[4]);
	    d.setMinutes(matches[5]);
	    d.setSeconds(matches[6]);
	    return d.toISOString();
	}
	
	function collectFormData() {
		var data = new Object();
		$(".query-form :input").each(
			function() {
				if ($(this).is(':checkbox')) {
					if ($(this).prop('checked') == true) {
						data[$(this).attr("id")] = $(this).val();
					}
				} else if ($(this).attr("type") != 'hidden'
						&& $(this).val().length > 0) {
					if ($(this).attr("id") == 'startDate' || $(this).attr("id") == 'endDate') {
						data[$(this).attr("id")] = toUTCDateString($(this).val());
					} else {
						data[$(this).attr("id")] = $(this).val();
					}
				}
			});
		return data;
	}
	
	function collectSubFormData() {
		var data = new Object();
		data["vsmType"] = 0;
		temp = 0;
		$(".subscribe-form :input").each(
			function() {
				if ($(this).is(':checkbox')) {
					if ($(this).prop('checked') == true) {
						
						switch($(this).val()){
						case "fund":
							temp = 1;
							break;
						case "vehstat":
							temp = 2;
							break;
						case "weather":
							temp = 4;
							break;
						case "env":
							temp = 8;
							break;
						case "elveh":
							temp = 16;
							break;
						default: temp = 0;
						}	
						data["vsmType"] = data["vsmType"] + temp;
					}
				} else if ($(this).attr("type") != 'hidden' && $(this).val().length > 0) {
					switch($(this).attr("id")) {
						case "nwLat2":
							data["nwLat"] = $(this).val(); break;
						case "nwLon2":
							data["nwLon"] = $(this).val(); break;
						case "seLat2":
							data["seLat"] = $(this).val(); break;
						case "seLon2":
							data["seLon"] = $(this).val(); break;
						default:
							data[$(this).attr("id")] = $(this).val();
					}
				}
			});
		return data;
	}
	
	function openSocket() {

		if (ws != null) {
			ws.close();
		}

		ws = new WebSocket($("#wsURL").val());

		ws.onopen = function() {
			$("#connect").prop('disabled', true);
			$("#disconnect").prop('disabled', false);
			$("#submitQuery").prop('disabled', false);
			$('#queryIndicator').css({'color':'green'});
		};

		ws.onmessage = function(evt) {
			var received_msg = evt.data;

			if (startsWith(received_msg, "START:")) {
				// just ignoring these for now
			} else if (startsWith(received_msg, "STOP:")) {
				// end of results
				var recordCount = getNVPValue(received_msg);
				$("#recordCount").val(recordCount);
				$("#submitQuery").prop('disabled', false);
				$('#spinner').hide();
				
				if (recordCount == "0") {
					appendValue($("#results"), "No records found!");
				}
				appendValue($("#results"), resultSeparator);
			} else {
				appendValue($("#results"), received_msg);
				if (startsWith(received_msg, "ERROR:")) {
					$("#recordCount").val(0);
					$("#submitQuery").prop('disabled', false);
					$('#spinner').hide();
					appendValue($("#results"), resultSeparator);
				}
			}
		};

		ws.onclose = function() {
			$("#connect").prop('disabled', false);
			$("#disconnect").prop('disabled', true);
			$("#submitQuery").prop('disabled', true);
			$('#spinner').hide();
			$('#queryIndicator').css({'color':'red'});
		};

	}
	
	
	function openSubSocket() {

		if (wbs != null) {
			wbs.close();
		}

		wbs = new WebSocket($("#wbsURL").val());

		wbs.onopen = function() {
			$("#wbsConnect").prop('disabled', true);
			$("#wbsDisconnect").prop('disabled', false);
			$("#submitSubscription").prop('disabled', false);
			$('#subscribeIndicator').css({'color':'green'});
		};

		wbs.onmessage = function(evt) {
			var received_subMsg = evt.data;
			msgCount++;
			appendValue($("#subResults"), received_subMsg);
			document.getElementById("wbsRecordCount").value = msgCount;
			
			if (msgCount > 1000){
				var subResults = $("#subResults").val();
				var newLineIndex = nthIndex(subResults,"\n",1);
				document.getElementById("subResults").value = subResults.replace(subResults.slice(0,newLineIndex+1),'');
			}
			
			objDiv.scrollTop = objDiv.scrollHeight;
			
		};

		wbs.onclose = function() {
			$("#wbsConnect").prop('disabled', false);
			$("#wbsDisconnect").prop('disabled', true);
			$("#submitSubscription").prop('disabled', false);
			$('#spinner2').hide();
			$('#subscribeIndicator').css({'color':'red'});
		};

	};
	
	function nthIndex(str, pat, n){
	    var L= str.length, i= -1;
	    while(n-- && i++<L){
	        i= str.indexOf(pat, i);
	    }
	    return i;
	}
	
	// click and other handlers
	$("#submitQuery").click(function(){
		sendQueryForm();
		return false;
	});
	
	$("#submitSubscription").click(function(){
		sendSubscriptionForm();
		return false;
	});

	function sendQueryForm(){
		if (ws == null) {
			appendValue($("#rawQuery"), "Not Connected!");
		} else {
			$("#submitQuery").prop('disabled', true);
			$('#spinner').show();
			var query = "QUERY:" + JSON.stringify(collectFormData());
			appendValue($("#rawQuery"), query);
			appendValue($("#rawQuery"), resultSeparator);
			ws.send(query);
		}
	}
	
	function sendSubscriptionForm(){
		if (wbs == null) {
			appendValue($("#subResults"), "Not Connected!");
		} else {
			$("#submitSubscription").prop('disabled', true);
			$('#spinner2').show();
			var subscription = "SUBSCRIBE:" + JSON.stringify(collectSubFormData());
			appendValue($("#subResults"), subscription);
			appendValue($("#subResults"), resultSeparator);
			wbs.send(subscription);
		}
	}

	$("button#connect").click(function() {
		openSocket();
	});
	
	$("button#wbsConnect").click(function() {
		openSubSocket();
	});

	$("button#disconnect").click(function() {
		ws.close();
		ws = null;
		$('#spinner').hide();
	});
	
	$("button#wbsDisconnect").click(function() {
		wbs.close();
		wbs = null;
		msgCount = 0;
		$('#spinner2').hide();
	});

	$("button#clearResults").click(function() {
		$("#results").val('');
		$("#recordCount").val('');
	});

	$("button#clearHistory").click(function() {
		$("#rawQuery").val('');
	});
	
	$("button#clearSubscription").click(function() {
		$("#subResults").val('');
		msgCount = 0;
	});

	$('.form_datetime').datetimepicker({
		weekStart : 1,
		todayBtn : 1,
		autoclose : 1,
		todayHighlight : 1,
		startView : 2,
		forceParse : 0,
		showMeridian : 1
	});

	$("#clearStartDate").click(function() {
		$('#startDate').val("");
	});

	$("#clearEndDate").click(function() {
		$('#endDate').val("");
	});

	$('#toggleNWMap').click(function() {
		$('#nwMap').toggle();
		if (nwMap == null) {
			(nwMap = new GMapsLatLonPicker()).init($("#nwPicker"));
		}
	});

	$('#toggleSEMap').click(function() {
		$('#seMap').toggle();
		if (seMap == null) {
			(seMap = new GMapsLatLonPicker()).init($("#sePicker"));
		}
	});
	
	$('#toggleNWMap2').click(function() {
		$('#nwMap2').toggle();
		if (nwMap2 == null) {
			(nwMap2 = new GMapsLatLonPicker()).init($("#nwPicker2"));
		}
	});

	$('#toggleSEMap2').click(function() {
		$('#seMap2').toggle();
		if (seMap2 == null) {
			(seMap2 = new GMapsLatLonPicker()).init($("#sePicker2"));
		}
	});
	
	
    $(document).ready(function(){
        $("select").change(function(){
            $( "select option:selected").each(function(){
                if($(this).attr("value")=="154"){
                    $("#vsmType").show();
                }
                if($(this).attr("value")=="162"){
                    $("#vsmType").hide();
                }
            });
        }).change();
    });
    
 	
	// start things up
	initPage();
});

function mapReveal(){
	$('html, body').css({'overflow':'hidden'});
	$('#mapTools').show();
}

function mapHide(){
	$('html, body').css({'overflow':'visible'});
	$('#mapTools').hide();
}