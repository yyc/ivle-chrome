$(document).ready(function() {
  if (!window.localStorage) {
    alert(
      "Your browser does not support (or enable) LocalStorage! Please switch to one that does."
    );
    return;
  }
  var localStorage = window.localStorage;
  var config = window.config;
  var app = new ivle(config.lapi_key);
  var userToken = getParameterByName("token");
  if (userToken) {
    // Handle LAPI login redirect
    localStorage.setItem("userToken", userToken);
  }
  userToken = localStorage.getItem("userToken");
  if (!userToken) {
    console.log("User token not found, please log in");
    $("login").show();
    app.auth($("login-button"), window.location.href);
    return;
  }
  console.log("Token acquired! " + userToken);
  var user = new app.user(userToken);
  // For browser debugging, remove for production
  window.user = user;
  updateUserModules(user)
    .then(updateModules(user))
    // Coalesce all the workbins into a single array of workbins before we operate on them
    .then(moduleWorkbins => {
      return moduleWorkbins.reduce((acc, mW) => acc.concat(mW), []);
    })
    .then(processWorkbins(user));
});

function updateUserModules(user) {
  return new Promise(function(fulfill, reject) {
    user.modules(
      function(result) {
        var arrayedResults = result["Results"].map(mod => {
          return {
            name: mod["CourseName"],
            code: mod["CourseCode"],
            id: mod["ID"]
          };
        });
        localStorage.setItem("modules", JSON.stringify(arrayedResults));
        fulfill(arrayedResults);
      },
      function(error) {
        reject(error);
      }
    );
  });
}

var updateModules = user => modules => {
  return Promise.all(
    modules.map(
      module =>
        new Promise((fulfill, reject) => {
          var config = JSON.parse(localStorage.getItem(module.id));
          if (!config) {
            config = module;
          }
          user.workbin(
            module.id,
            result => {
              var workbins = result["Results"].map(workbin => ({
                id: workbin["ID"],
                name: workbin["Title"],
                folders: workbin["Folders"]
              }));
              fulfill(workbins);
            },
            error => {
              reject(error);
            }
          );
        })
    )
  );
};

var processWorkbins = user => workbins => {
  return Promise.all(
    workbins.map(
      workbin =>
        new Promise((fulfill, reject) => {
          var localStorage = window.localStorage;
          var moduleData = JSON.parse(localStorage.getItem(workbin.id));
          console.log(moduleData);
          if (!moduleData) {
            // Entry does not exist, create and notify
            moduleData = Object.assign({ sync: false }, workbin);
            //localStorage.setItem(Object.)
            var notif = new Notification(
              `New Workbin Found: ${moduleData.name}`,
              {
                body: "Click to set sync options"
              }
            );
            console.log(notif);
          }
        })
    )
  );
};

// From https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
