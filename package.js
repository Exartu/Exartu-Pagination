Package.describe({
  summary: "pagination package from Uruworks"
});

Package.on_use(function (api, where) {
  api.add_files(['server.js'], 'server');
  api.add_files(['client.js'], 'client');
  api.use(['templating','underscore'],'client');
  api.add_files(['view.html'], 'client');
  api.add_files(['view.js'], 'client');
  //api.export('Metadata');
});

//Package.on_test(function (api) {
//  api.use(['tinytest']);
//  api.add_files(['index.js', 'test.js'], 'server');
//});
