var db;
var updateurl = "http://athaniti.zapto.org:82/comics/api/comics";

function init() {
	//startup();
  document.addEventListener("deviceready",startup);
}

function startup() {
	
    console.log("Starting up...");
    db = window.openDatabase("comics","1","Comics DB",1000000);
    db.transaction(initDB,dbError,dbReady);
}

function dbError(e) {
    console.log("SQL ERROR");
    console.dir(e);
}

function initDB(tx) {
    tx.executeSql("create table if not exists comics(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
    		"name TEXT, series TEXT, seriesno TEXT, pubyear INTEGER, bought INTEGER, " +
    		"timestamp INT, token INTEGER)");
}

function dbReady() {
    console.log("DB initialization done.");
    //begin sync process
    //if (navigator.onLine) {syncDB();}
    if(navigator.onLine || (navigator.network && navigator.network.connection.type != Connection.NONE)) syncDB();
    else displayComics();
}


function syncDB() {
    $("#comics").html("Refreshing documentation...");
    localStorage["lastdate"]=localStorage["lastdate"]!="undefined"?localStorage["lastdate"]:'';
    //alert(localStorage["lastdate"]);
    var date = localStorage["lastdate"];
    //localStorage["lastdate"]='0';
    console.log("Will get items after "+date);
    //$.get(updateurl, {date:date}, function(resp,code) {
    if (date!='' && date!="undefined") {updateurl+="/getupdates/"+date;}
    $.get(updateurl, function(resp) {
        console.log("back from getting updates with "+resp.comic.length + " items to process.");
        //Ok, loop through. For each one, we see if it exists, and if so, we update/delete it
        //If it doesn't exist, straight insert
	var comics = resp.comic;
	var tstamp=date;
        comics.forEach(function(ob) {
            db.transaction(function(ctx) {
                ctx.executeSql("select id from comics where token = ?", [ob.id], 
                		function(tx,checkres) {
                    if(checkres.rows.length>0) {
                        console.log("possible update/delete");
                        if(ob.deleted==0) {
                            console.log("updating "+ob.name+ " "+ob.timestamp);
                            tx.executeSql("update comics set name='?',series='?',seriesno='?',pubyear=?,bought=?,timestamp=? " +
                            		"where token=?", [ob.name,ob.series,ob.seriesno,ob.pubyear,ob.bought,ob.tmstamp,ob.id]);
			    if (ob.tmstamp>tstamp) {tstamp=ob.tmstamp}
                        } else {
                            console.log("deleting "+ob.name+ " "+ob.tmstamp);
                            tx.executeSql("delete from comics where token = ?", [ob.id]);
                        }
                    } else {
                        //only insert if not deleted
                        //console.log("possible insert" + ob.deleted);
                        if(ob.deleted==0) {
                            console.log(checkres.rows.length + " = inserting "+ob.name+ ","+ob.series + ","+ob.seriesno + ","+ob.pubyear +
					","+ob.tmstamp +","+ob.bought +"," + ob.id);
                            tx.executeSql("insert into comics(name,series, seriesno, pubyear, bought,timestamp,token) values('"+ob.name+"','"+ob.series+"','"+ob.seriesno+"',"+ob.pubyear+","+ob.bought+","+ob.tmstamp+","+ob.id+")");
			    if (ob.tmstamp>tstamp) {tstamp=ob.tmstamp}
                        }
                    }

                });
            });
        });
        //if we had anything, last value is most recent
	var now = new Date;
	//if(resp.comic.length) localStorage["lastdate"] = now.getFullYear()+"-"+now.getMonth()+"-"+now.getDay()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
        if(resp.comic.length) localStorage["lastdate"] = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
        //if(resp.comic.length) localStorage["lastdate"] = resp.comic[resp.comic.length-1].timestamp;
	//if(resp.comic.length) localStorage["lastdate"] = tstamp;
        displayComics();    
    },"json");

}

function displayComics() {
  $("#comics").html('');
    db.transaction(function(tx) {
        tx.executeSql("select * from comics order by series, pubyear, seriesno, name asc", [], 
        		function(tx, results) {
            var s = "<h2>Comics</h2>";
	    $('#comicList li').remove();
            for(var i=0; i<results.rows.length; i++) {
	      $('#comicList').append('<li class="bought' + results.rows.item(i).bought + '"><a href="#" onclick="findById(' + results.rows.item(i).id + ');" data-identity="' + results.rows.item(i).id + '">'+results.rows.item(i).name+' ('+results.rows.item(i).seriesno+' - '+results.rows.item(i).pubyear+')</a></li>');
                //s += results.rows.item(i).name + "<br/>";
            }
            //$("#comics").html(s);
        });
    });
}

