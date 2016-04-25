//Lets require/import the HTTP module
const http = require('http');
const url = require('url')
const request = require('request-promise');
var gitlabServer = process.env.GITLAB_URL;
var privateToken = process.env.GITLAB_PRIVATE_TOKEN;

//Lets define a port we want to listen to
const PORT=8080; 

//We need a function which handles requests and send response
function handleRequest(req, res){
	var uriObj = url.parse(req.url, true);
	var query = uriObj.query || {};
	var repo = query.repo;
	var ref = query.ref;
	var buildName = query.build;
	if (!repo || !ref) {
		return;
	}
	var requestUri = gitlabServer + '/api/v3/projects/' + encodeURIComponent(repo) + '/repository/commits/' + ref;
	// https://git.smarpsocial.com/api/v3/projects/smarpers%2Fsmarpshare/repository/commits/master
	request({
		uri: requestUri,
		headers: {
        'PRIVATE-TOKEN': privateToken
    },
    json: true,
	})
	.then(function(a){
		
	    var requestUri = gitlabServer + '/api/v3/projects/' + encodeURIComponent(repo) + '/repository/commits/' + a.id + '/statuses';
		return request({
		uri: requestUri,
		headers: {
        'PRIVATE-TOKEN': privateToken
    },
    json: true,
	})
		
	})
	.then(function(buildList){
		for (var i  in buildList) {
			build = buildList[i];
			if (build.name == buildName) {
				return build;
			}
		}
	})
	.then(function(a){
		
		
	    var requestUri = gitlabServer + '/api/v3/projects/' + encodeURIComponent(repo) + '/builds/' + a.id;
		return request({
			uri: requestUri,
			headers: {
	        'PRIVATE-TOKEN': privateToken
		    },
		    json: true,
		})
		
	})
	.then(function(a){
		var coverage = a.coverage;
		var subject = "translation";
		var status = coverage + "%25";
		var color = "red";
		switch (Math.floor(coverage/10)) {
			case 10:
			color = "brightgreen";
			break;
			case 9:
			color = "yellow";
			break;
			case 8:
			color = "orange";
			break;
		}
		var redirectUrl = "https://img.shields.io/badge/"+subject+"-"+status+"-"+color+".svg";
		res.writeHead(307,
  {Location: redirectUrl}
);
res.end();
	})
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});
