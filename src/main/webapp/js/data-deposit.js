var depWS = null;
var system;
var encoding;
var jsonDeposit;


$(function() {
    $('#entryType').change(function() {
    	
    	if ($(this).val() == "fileEntry" ){
    		 $('#message-text').hide();
    		 $('#encoded-msg-textarea').val('');
    		 $('#upload-file').show();
    		 $("#encoding-type-options").append(new Option("UPER Message", "UPER"));
    	}
    	if ($(this).val() == "textEntry" ){	
    		$('#upload-file').hide();
    		$("#fileselect").val('');
    		$('#message-text').show();
    		$("#encoding-type-options option[value='UPER']").remove();
    	}  	
    });
});

$('#clearFile').on('click', function(){
	$("#fileselect").val('');
	$('#encoded-msg-textarea').val('');
});

$('#submitFile').on('click', function(e){
	e.preventDefault();
	$("#submitFile").attr("disabled", true);

    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
    
    system = $('#systemDepositName').val();
    encoding = $('#encoding-type-options').val();
    
    if ($('#entryType').val() == "fileEntry"){
	   	var files = document.getElementById('fileselect').files[0];
		ParseFile(files, system, encoding);
    }
    if ($('#entryType').val() == "textEntry"){
    	text = $('#encoded-msg-textarea').val();
		ParseText(text, system, encoding);
    }
    
	$("#submitFile").attr("disabled", false);
});

  
function ParseFile(file, sysName, encode) {
	
	$('.amt').html('0%');
	$(".progress-bar").css('width', '0%').attr('aria-valuenow', 0);
	
	var reader = new FileReader();

	try {
		if (encode == "UPER") {
			var blob = file.slice(0, file.size);
			reader.readAsBinaryString(blob)
		}
		else {
			reader.readAsText(file);
		}
	}
	catch (err) {
		alert("File Error: " + err)
		$("#fileselect").val('');
		$('#encoded-msg-textarea').val('');
		$("#submitFile").attr("disabled", false);
	}
	
	reader.onloadend = function() {
		
		if (encode == "UPER") {
			var bytedata = reader.result;
			var hex = "";
			
			for (var i = 0; i < this.result.length; i++) {
				var byteStr = bytedata.charCodeAt(i).toString(16);
	            if (byteStr.length < 2) {
	            	byteStr = "0" + byteStr;
				}
				hex += byteStr;
			}
			
			jsonDeposit = {"systemDepositName": sysName, "encodeType": encode, "encodedMsg": hex};
			depWS.send("DEPOSIT:" + JSON.stringify(jsonDeposit));	
		}
		else {
			var textBlock = reader.result;
			var newLines = 0;
			var lines = textBlock.split(/\r?\n/);
			var hex = "";
			
			var percent;
			
			for (var j = 0; j < lines.length; j++) {
				
				jsonDeposit = {"systemDepositName": sysName, "encodeType": encode, "encodedMsg": lines[j]};
				
				percent = (j/(lines.length-1))*100;
				$('.amt').html((j/(lines.length-1))*100 + '%');
				$(".progress-bar").css('width', percent +'%').attr('aria-valuenow', percent);
				
				depWS.send("DEPOSIT:" + JSON.stringify(jsonDeposit));
			}
			
		console.log('Lines: ' + newLines);	
		$("#fileselect").val('');
	   }
	}
	
	//reader.readAsDataURL(blob);
	//reader.readAsBinaryString(blob)
	
	/*reader.onloadend = function () {
	
		var bytedata = reader.result;
		var hex = "";
		
		for (var i = 0; i < this.result.length; i++) {
			var byteStr = bytedata.charCodeAt(i).toString(16);
            if (byteStr.length < 2) {
            	byteStr = "0" + byteStr;
			}
			hex += byteStr;
		}
		
		
		//switch data encoding to hex
		//$('#encoding-type-options').options.selectedIndex=0;
		
		data = hex;    		
		
		console.log(data);

	}*/
}



function ParseText(text, sysName, encode) {
	
		$('.amt').html('0%');
		$(".progress-bar").css('width', '0%').attr('aria-valuenow', 0);
	
		console.log(text);

		var newLines = 0;
		var lines = text.split("\n");
		var percent;
		
		for (var j = 0; j < lines.length; j++) {
			
			jsonDeposit = {"systemDepositName": sysName, "encodeType": encode, "encodedMsg": lines[j]};
			
			percent = (j/(lines.length-1))*100;
			$('.amt').html((j/(lines.length-1))*100 + '%');
			$(".progress-bar").css('width', percent +'%').attr('aria-valuenow', percent);
			
			depWS.send("DEPOSIT:" + JSON.stringify(jsonDeposit));

			
		  /*  $.ajax({
				type    : "POST",
				url     : "message/decode",
		        data    : lines[j],
				success : function(data, textStatus, jqXHR) {
					percent = (j/newLines)*100;
					$('.amt').html((j/newLines)*100 + '%');
					$(".progress-bar").css('width', percent +'%').attr('aria-valuenow', percent);
				},
				error	: function(jqXHR, textStatus, errorThrown) {
					console.log("Could not proces file.");	
				}
		});*/
		
		console.log('Lines: ' + newLines);
		$('#encoded-msg-textarea').val('');
	   }
	}


/******************************************************************************************/

$(document).ready( function (){
	
	var totalLines = 0;
	var sessionLines = 0;
	var hostname = window.location.host.split(":")[0];
	var context = window.location.pathname.split("/")[1];
	var wsURL = "wss://" + hostname + ":443/" + context + "/websocket";

	if (depWS != null) {
		depWS.close();
	}

	depWS = new WebSocket(wsURL);

	depWS.onopen = function() {
		$('#depositIndicator').css({'color':'green'});
		sessionLines = 0;
	};

	depWS.onmessage = function(evt) {
		var depositedTag = "DEPOSITED:";
		var errorTag = "ERROR:";
		var connectedTag = "CONNECTED:";
		
		if (evt.data.startsWith(connectedTag)) {
			// Do nothing, we expect this
		} else if (evt.data.startsWith(depositedTag)) {
			var depositedCount = parseInt(evt.data.slice(depositedTag.length));
			totalLines += depositedCount;
			sessionLines += depositedCount;
			alert(depositedCount + " line(s) have been deposited (" + sessionLines + " this session, " + totalLines + " total)");
		} else if (evt.data.startsWith(errorTag)) {
			var errorMessage = evt.data.slice(errorTag.length);
			
			alert("An error occured: " + errorMessage);
		} else {
			alert("An unexpected message was received from the warehouse: " + evt.data);
		}
	};
	
	depWS.onclose = function() {
		$('#depositIndicator').css({'color':'red'});
	};

});



