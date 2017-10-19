/********************************************************
 * USDOT DEV: 54.90.60.234; USDOT LIVE: 54.196.138.172;
 * User Confguration
 */
var user_config_path = "./user-config.json";
var project_config_path = "./proj-config.json";
var user_config;

function Config( data ) {
    this.ui = data.settings.UI.name;
    this.spec = data.settings.UI.spec;
    this.getFeatures = function () {
        var features = {};
        data.settings.UI.features.forEach(function (feature) {
            features[feature.name] = feature;
        });
        return features;
    };
    this.features = this.getFeatures();
};

Config.prototype.setPaths = function(paths) {
    this.paths = paths
};

function getPaths( data ) {
    var paths = {};

    data.UIs.forEach( function( ui ) {
        if( ui.name == user_config.ui ) {
            paths = ui.paths;
        }
    });
    return paths;
}

Config.prototype.setBounds = function(bounds) {
    this.bounds = bounds
};

function getBounds( data ) {
    var bounds = {};

    data.UIs.forEach( function( ui ) {
        if( ui.name == user_config.ui ) {
            bounds = ui.bounds;
        }
    });
    return bounds;
}

function getConfig()
{
    var user_data, proj_data;

    $.when(
        $.getJSON(user_config_path, function(data) {
            user_data = data;
        }),
        $.getJSON(project_config_path, function(data) {
            proj_data = data;
        })
    ).then(function() {
        if (user_data && proj_data) {
            user_config = new Config(user_data);
            console.log(user_config);
            user_config.setPaths( getPaths(proj_data) );
            user_config.setBounds( getBounds(proj_data) );
            main();
        }
        else {
            alert("no data?")
        }
    });
}




	
	
	