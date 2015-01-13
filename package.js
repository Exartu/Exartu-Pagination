Package.describe({
  name: 'aida:pagination',
  summary: "pagination package from Uruworks",
  version: "0.1.0",
  git: "https://github.com/Exartu/Exartu-Pagination.git"
});

Package.onUse(function (api, where) {
  api.use(['templating','underscore', 'deps'],'client');
  api.use('mongoview','server',{ weak: true });

  api.addFiles(['metadata.js'], 'server');
  api.addFiles(['server.js'], 'server');
  api.addFiles(['client.js'], 'client');
  api.addFiles(['view.html'], 'client');
  api.addFiles(['view.js'], 'client');
});

