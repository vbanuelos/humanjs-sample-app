/*global console*/
var express = require('express');
var helmet = require('helmet');
var Moonboots = require('moonboots');
var config = require('getconfig');
var semiStatic = require('semi-static');

var views = require('./views');
var app = express();

app.configure(function () {
    app.use(express.compress());
    app.use(express.static(__dirname + '/public'));
    // we only want to expose tests in dev
    if (config.isDev) {
        app.use(express.static(__dirname + '/clienttests/assets'));
        app.use(express.static(__dirname + '/clienttests/spacemonkey'));
    }
    app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    // in order to test this with spacemonkey we need frames
    if (!config.isDev) {
        app.use(helmet.xframe());
    }
    app.use(helmet.iexss());
    app.use(helmet.contentTypeOptions());
});

var clientApp = new Moonboots({
    main: __dirname + '/clientapp/app.js',
    developmentMode: true,
    libraries: [
        __dirname + '/clientapp/libraries/zepto.js'
    ],
    stylesheets: [
        __dirname + '/public/css/bootstrap.css',
        __dirname + '/public/css/app.css'
    ],
    browserify: {
        debug: false
    },
    server: app
});

// use jade (for now)
app.set('view engine', 'jade');

// public stuff
app.get('/signup', function (req, res) {
    res.redirect(config.oauth.accountsURL + '/signup', 303);
});
app.get('/support', views.render('about/support'));
app.get('/404', views.render('about/404'));
app.get('/500', views.render('about/500'));

// the help mini-site
app.get('/help*', semiStatic({
    folderPath: __dirname + '/views/help-site',
    root: '/help'
}));

// the test sub site should only be exposed in dev
if (config.isDev) {
    app.get('/test*', semiStatic({
        folderPath: __dirname + '/clienttests',
        root: '/test'
    }));
}

var clientSettingsMiddleware = function (req, res, next) {
    res.cookie('config', JSON.stringify(config.client));
    next();
}

app.get('*', clientSettingsMiddleware, clientApp.html());

// listen on the port as specified in our settings
app.listen(config.http.port);
console.log('human.js sample app is running at: http://localhost:' + config.http.port + ' Yep. That\'s pretty awesome.');
