Package.describe({
  summary: "pagination package from Uruworks"
});

Package.onUse(function (api, where) {
  api.addFiles(['server.js'], 'server');
  api.addFiles(['client.js'], 'client');
  api.use(['templating','underscore', 'deps'],'client');
  api.addFiles(['view.html'], 'client');
  api.addFiles(['view.js'], 'client');
  //api.export('Metadata');
});

