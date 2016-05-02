Package.describe({
  name: 'aida:pagination',
  summary: "pagination package from Uruworks",
  version: "1.0.12",
  git: "https://github.com/Exartu/Exartu-Pagination.git"
});

Package.onUse(function (api, where) {
  api.versionsFrom('METEOR@0.9.2');
  api.use(['templating','underscore', 'deps'],'client');
  api.use('aida:mongo-view@0.1.2','server',{ weak: true });
  
  api.addFiles(['metadata.js'], 'server');
  api.addFiles(['server.js'], 'server');
  api.addFiles(['client.js'], 'client');
  api.addFiles(['view.html'], 'client');
  api.addFiles(['view.js'], 'client');
});

