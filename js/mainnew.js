// The root URL for the RESTful services
var rootURL = "http://athaniti.zapto.org:82/comics/api/comics";




var currentcomic;

// Retrieve comic list when application starts 
findAll();

// Nothing to delete in initial application state
$('#btnClose').hide();
$('#comicdetails').hide();

// Register listeners
$('#btnSearch').click(function() {
	search($('#searchKey').val());
	return false;
});

// Trigger search when pressing 'Return' on search key input field
$('#searchKey').keypress(function(e){
	if(e.which == 13) {
		search($('#searchKey').val());
		e.preventDefault();
		return false;
    }
});

$('#btnAdd').click(function() {
	newcomic();
	return false;
});

$('#btnSave').click(function() {
	if ($('#comicId').val() == '')
		addcomic();
	else
		updatecomic();
	return false;
});

$('#btnClose').click(function() {
	closecomic();
	return false;
});



// Replace broken images with generic comic bottle
$("img").error(function(){
  $(this).attr("src", "pics/generic.jpg");

});

function search(searchKey) {
	if (searchKey == '') 
		findAll();
	else
		findByName(searchKey);
}

function newcomic() {
	$('#btnClose').hide();
	currentcomic = {};
	renderDetails(currentcomic); // Display empty form
}

function findAll() {
	console.log('findAll');
	$.ajax({
		type: 'GET',
		url: rootURL,
		dataType: "json", // data type of response
		success: renderList
	});
}

function findByName(searchKey) {
	console.log('findByName: ' + searchKey);
	$.ajax({
		type: 'GET',
		url: rootURL + '/search/' + searchKey,
		dataType: "json",
		success: renderList 
	});
}

function findById(id) {
	console.log('findById: ' + id);
	$.ajax({
		type: 'GET',
		url: rootURL + '/' + id,
		dataType: "json",
		success: function(data){
			$('#btnClose').show();
			console.log('findById success: ' + data.name);
			currentcomic = data;
			renderDetails(currentcomic);
		}
	});
}

function addcomic() {
	console.log('addcomic');
	$('#comicdetails').show();
	$.ajax({
		type: 'POST',
		contentType: 'application/json',
		url: rootURL,
		dataType: "json",
		data: formToJSON(),
		success: function(data, textStatus, jqXHR){
			alert('comic created successfully');
			$('#btnClose').show();
			$('#comicId').val(data.id);
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert('addcomic error: ' + textStatus);
		}
	});
}


function updatecomic() {
	console.log('updatecomic');
	$('#comicdetails').show();
	var bought = 0;
	if ($('#bought').is(":checked")) {bought=1;}
	var comicid = $('#comicId').val();
	var now = new Date;
	var tmstamp = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
	db.transaction(function(tx)
	{
		tx.executeSql("update comics set bought=?,timestamp=? where token=?", [bought,tmstamp,comicid]);
	});
	//updateComic(db.transaction,bought,tmstamp,comicid);
	
	if(navigator.onLine || (navigator.network && navigator.network.connection.type != Connection.NONE))
	{
		$.ajax({
			type: 'PUT',
			contentType: 'application/json',
			url: rootURL + '/' + $('#comicId').val(),
			dataType: "json",
			data: formToJSON(),
			success: function(data, textStatus, jqXHR){
				$('#comicdetails').hide();
				$("li").find("[data-identity='" + $('#comicId').val() + "']").text($('#name').val() +' ('+$('#seriesno').val()+' - '+$('#pubyear').val()+')');
				$("li").find("[data-identity='" + $('#comicId').val() + "']").attr('class', "bought"+data.bought);
				alert('comic updated successfully');
			},
			error: function(jqXHR, textStatus, errorThrown){
				$('#comicdetails').hide();
				alert('updatecomic error: ' + textStatus);
			}
		});
	}
	$('#comicdetails').hide();
}

function closecomic() {
	$('#comicdetails').hide();
}
	
function deletecomic() {
	console.log('deletecomic');
	$.ajax({
		type: 'DELETE',
		url: rootURL + '/' + $('#comicId').val(),
		success: function(data, textStatus, jqXHR){
			$("li").find("[data-identity='" + $('#comicId').val() + "']").remove();
			alert('comic deleted successfully');
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert('deletecomic error');
		}
	});
}

function renderList(data) {
	// JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
	var list = data == null ? [] : (data.comic instanceof Array ? data.comic : [data.comic]);

	$('#comicList li').remove();
	$.each(list, function(index, comic) {
		$('#comicList').append('<li class="bought' + comic.bought + '"><a href="#" onclick="findById(' + comic.id + ');" data-identity="' + comic.id + '">'+comic.name+' ('+comic.seriesno+' - '+comic.pubyear+')</a></li>');
		//console.log(comic.id);
	});
}

function renderDetails(comic) {
	$('#comicdetails').show();
	$('#comicId').val(comic.id);
	$('#name').val(comic.name);
	$('#series').val(comic.series);
	$('#seriesno').val(comic.seriesno);
	$('#pubyear').val(comic.pubyear);
	$('#timestamp').val(comic.tmstamp);

	(comic.bought == 1) ? $('#bought').attr('checked', true):$('#bought').attr('checked', false);
	//$('#pic').attr('src', 'pics/' + comic.picture);
	//$('#description').val(comic.description);
}

// Helper function to serialize all the form fields into a JSON string
function formToJSON() {
	return JSON.stringify({
		"id": $('#Id').val(), 
		"name": $('#name').val(), 
		"series": $('#series').val(),
		"seriesno": $('#seriesno').val(),
		"pubyear": $('#pubyear').val(),
		"bought": $('#bought').is(':checked')?1:0//,
		//"picture": currentcomic.picture,
		//"description": $('#description').val()
		});
}
