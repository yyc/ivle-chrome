const Menubar = require("menubar");

var mb = Menubar({
  index: "file:///Users/Yuchuan/Code/js/ivle-desktop/index.html"
});

mb.on("ready", () => {
  console.log("ready");
})
