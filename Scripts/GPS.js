﻿//Define Google Maps API properties and PubNub API keys 
var map;
var map_marker;
var lat;
var lng;
var lineCoordinatesArray = [];
var publish = 'pub-c-9d0d75a5-38db-404f-ac2a-884e18b041d8';
var subscribe = 'sub-c-4e25fb64-37c7-11e5-a477-0619f8945a4f';
var myLatLng;
var imei;
var done; 

//Get current location of dispatcher 
if (navigator.geolocation)
{
    navigator.geolocation.getCurrentPosition(function (position)
    {
        var locationMarker = null;

        if (locationMarker)
        {
            return;
        }
        //Get current LatLng and set as default map position 
        lat = position.coords["latitude"];
        lng = position.coords["longitude"];

        myLatLng = { lat: lat, lng: lng };

        // Init PubNub
        initPubNub();

        // Init Google Maps
        google.maps.event.addDomListener(window, 'load', initMap());

    },
    //Console log Google Maps API failure 
    function (error)
    {
        console.log("Could initialize Google Maps API: ", error);
    },
    {
        enableHighAccuracy: true
    }
    );
}


function initMap()
{
    console.log("Google Maps Initialized");

    //Map is definied as an HTML dom with name "map-canvas"
    map = new google.maps.Map(document.getElementById('map-canvas'),
    {
        //Define specific map properties and style 
        center: myLatLng,
        zoom: 15,
        styles:
            [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#263c3f' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#6b9a76' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#38414e' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#212a37' }]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9ca5b3' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{ color: '#746855' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#1f2835' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#f3d19c' }]
            },
            {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [{ color: '#2f3948' }]
            },
            {
                featureType: 'transit.station',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#17263c' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#515c6d' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#17263c' }]
            }
        ]
    });
    //Allow map to be resized
    google.maps.event.trigger(map, 'resize');

    //Set map marker to determined position 
    map_marker = new google.maps.Marker({ position: myLatLng, map: map });
    map_marker.setMap(map);
}

//Draw line path of GPS coordinates to indicate user position 
function redraw()
{
    map.setCenter({ lat: lat, lng: lng, alt: 0 });
    map_marker.setPosition({ lat: lat, lng: lng, alt: 0 });
    pushCoordToArray(lat, lng);

    var lineCoordinatesPath = new google.maps.Polyline
    ({
        path: lineCoordinatesArray,
        geodesic: true,
        strokeColor: '#E91E63',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    lineCoordinatesPath.setMap(map);
}


function pushCoordToArray(latIn, lngIn)
{
    lineCoordinatesArray.push(new google.maps.LatLng(latIn, lngIn));
}

//Initalize PubNub API
function initPubNub() {
    pubnub = PUBNUB.init
    ({
        publish_key: publish,
        subscribe_key: subscribe,
        ssl: true
    });

    pubnub.subscribe
    ({
        channel: "my_channel",
        message: function (message, channel) {
           

            //Recieve GPS from Android client
            lat = message.lat;
            lng = message.lng;

            imei = message.imei;

            GetUser();

            //Append GPS to HTML DOM
            document.getElementById("Latitude").innerHTML = "Latitude: ".concat(lat);
            document.getElementById("Longitude").innerHTML = "Latitude: ".concat(lng);

            document.getElementById("first").innerHTML = "First Name: ".concat(response.FirstName);
            document.getElementById("last").innerHTML = "Last Name: ".concat(response.LastName);
            document.getElementById("age").innerHTML = "Age: ".concat(response.Age);
            document.getElementById("phonecont").innerHTML = "First Name: ".concat(response.Phone);
           

            //Gecode LatLng to get Android client address 
            getAddress();

            //Update and draw client position on map
            redraw();

            
        },
        connect: function () { console.log("PubNub Connected"); }
    });
}

//Google Maps API query to get address 
function getAddress()
{
    //Use Android client LatLng for query 
    var query = "http://maps.googleapis.com/maps/api/geocode/json?latlng=".concat(lat).concat(",").concat(lng).concat("&sensor=true");

    //Parse JSON return results for address
    $.getJSON(query, function (results)
    {
        //Append adress to HTML dom 
        document.getElementById("Address").innerHTML = "Address: ".concat(results.results[0].formatted_address);
    });
}


//Query DB through AJAX GET request
function GetUser() {
    if (!done) {
        $.ajax({
            url: "Home/GetUser",
            type: "GET",
            data: { UserId: imei.toString() },
            success: function (responseq) {
                //Return response and add set HTML properties 

                document.getElementById("first").innerHTML = "First Name: ".concat(responseq.FirstName);
                document.getElementById("last").innerHTML = "Last Name: ".concat(responseq.LastName);
                document.getElementById("age").innerHTML = "Age: ".concat(responseq.Age);
                document.getElementById("phonecont").innerHTML = "Phone Number: ".concat(responseq.Phone);

                //Console log for testing
                console.log(responseq);

            },
            error: function (xhr) {
                //Alert dispatch of an error in user information
                document.getElementById("first").innerHTML = "Database Failure";
                document.getElementById("last").innerHTML = "Database Failure";
                document.getElementById("age").innerHTML = "Database Failure";
                document.getElementById("phonecont").innerHTML = "Database Failure";
            }
        });
        done = true;
    }
}