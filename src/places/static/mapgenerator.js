var map, infowindow, geocoder;

var Placemarkr = {
	markers : []
};

var ForeignPlacemarkr = {
	markers : []
};

function showInfoWindow(marker) {
	console.log(marker.place)
	marker.setAnimation(google.maps.Animation.none);

	if (infowindow) {
		infowindow.close();
	}
	infowindow = new google.maps.InfoWindow({});

	var s = Mustache.render("<div><p>{{address}}, {{city}}</p>" + "<button class='btn btn-default vote votefor' value='True'>נכון</button>" +
	 "<button class='btn btn-default vote voteagainst' value='False'>לא נכון</button>"+
	 "<span id='loading' class='hide'>Loading...</span></div>" 
	 , marker.place);
	 
	 var el = $(s);

	infowindow.setContent(el.get(0));
	infowindow.open(map, marker);

	if (marker.place.vote != null){
		if (marker.place.vote == true){
			el.find('.votefor').attr('disabled', 'disabled');
		}
		else{
			el.find('.voteagainst').attr('disabled', 'disabled');
		}
	}
	el.find(".vote").on("click", function() {
		$('#loading').removeClass('hide');
		$('.vote').addClass('hide');
		$.post('/vote/', {
			id : marker.place.id,
			positive : $(this).val()
		}, function(resp) {
			$('.vote').removeClass('hide');
			if (resp == "OK"){
				$('.loading').text("Vote Recieved")
				// $('.votefor')
			}
		});

	
	
	});
	return marker;
}

function doMarker(place) {
	var inlatlng = new google.maps.LatLng(place['lat'], place['lng']);
	var marker = new google.maps.Marker({
		map : map,
		position : inlatlng,
		clickable : true
	});

	var litem = $(Mustache.render('<li class="place"><a href="#">{{address}}, {{city}}</a></li>', place));
	litem.data("marker", marker);
	marker.place = place;
	$("#mainlist").append(litem);
	google.maps.event.addListener(marker, 'click', function() {
		showInfoWindow(marker);
	});

	return marker;
}

function foreignInfoWindow(marker, fulladdress) {
	console.log(marker)
	marker.setAnimation(google.maps.Animation.none);
	if (infowindow) {
		infowindow.close();
	}
	infowindow = new google.maps.InfoWindow({});

	var s = Mustache.render("<p>{{address}}, {{locality}}?</p>" + "<button class='btn btn-default vote' value='True'>נכון</button>" + "<button class='btn btn-default remove' value='False'>הסר</button>", fulladdress);

	infowindow.setContent(s);
	infowindow.open(map, marker);

	$("body").on("click", ".vote", function() {
		$.post('/addplacemark/', {
			place : Placemarkr.id,
			city : fulladdress["locality"],
			address : fulladdress["address"],
			lat : marker.getPosition().lat(),
			lng : marker.getPosition().lng()
		});

		// $('#False').after("<div class='progress progress-striped active'>"+
		// "<div class='progress-bar'  role='progressbar' aria-valuenow='100' aria-valuemin='0' aria-valuemax='100' style='width: 100%'>" +
		// "</div></div>");
	});
	return marker;
}

function createForeignMarker(result, fulladdress) {
	console.log('createForeignMarker')
	var marker = new google.maps.Marker({
		map : map,
		position : result.geometry.location,
		clickable : true
	});

	var litem = $(Mustache.render('<li class="foreignplace"><a href="#">{{address}}, {{city}}</a></li>', fulladdress));
	litem.data("marker", marker);
	litem.data("fulladdress", fulladdress)
	marker.place = result;
	$("#foreignlist").append(litem);
	google.maps.event.addListener(marker, 'click', function() {
		foreignInfoWindow(marker, fulladdress);
	});

	return marker;
}

function codeAddress() {
	geocoder = new google.maps.Geocoder();
	var fulladdress = {
		address : document.getElementById("address").value,
		locality : document.getElementById("city").value,
	};

	geocoder.geocode({
		'address' : fulladdress['address']
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			map.setCenter(results[0].geometry.location);
			for (var i = 0; i < results.length; i++) {
				var marker = createForeignMarker(results[i], fulladdress);
				ForeignPlacemarkr.markers.push(marker);
			};
		} else {
			alert("Geocode was not successful for the following reason: " + status);
		}
	});
}

function initialize() {

	var places = $(Placemarkr.placemarks);
	var pageid = $(Placemarkr.id);
	var mapOptions = {
		zoom : 7,
		center : new google.maps.LatLng(31.046051, 34.851612),
		mapTypeId : google.maps.MapTypeId.ROADMAP
	};

	map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);

	for (var i = 0; i < Placemarkr.placemarks.length; i++) {
		var marker = doMarker(places[i]);
		Placemarkr.markers.push(marker);
	}

	$('#jsontitle').click(function() {
		$("#jsoncontent").toggle();
	});

	//events for the main list

	$("li.place").hover(function() {
		var marker = $(this).data("marker");
		marker.setAnimation(google.maps.Animation.BOUNCE);
	}, function() {
		var marker = $(this).data("marker");
		marker.setAnimation(google.maps.Animation.none);
	});

	$("body").on("click", "li.place", function() {
		var marker = $(this).data("marker");
		showInfoWindow(marker);
	});

	// events for the foreign list

	$("body").on({
		mouseenter : function() {
			var marker = $(this).data("marker");
			marker.setAnimation(google.maps.Animation.BOUNCE);
		},
		mouseleave : function() {
			var marker = $(this).data("marker");
			marker.setAnimation(google.maps.Animation.none);
		}
	}, "li.foreignplace");

	$("body").on("click", "li.foreignplace", function() {
		var marker = $(this).data("marker");
		var fulladdress = $(this).data("fulladdress");
		foreignInfoWindow(marker, fulladdress);
	});

	$("#search").click(function() {
		console.log("search");
		codeAddress();
	});

}

$(initialize);
