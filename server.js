//return true if obj is a integer
var isInt = function(obj){
  return _.isNumber(obj) && obj % 1 === 0 && obj < Infinity;
};

//default settings, todo:make this editable through some api
var defaultSettings = {
  pageSize: 100
};

//here I'll save info like the original cursor and the page size, etc
var CollectionsMetadata = {};

/**
 * Wrapper for Meteor.publish to publish with pagination
 * @constructor
 * @param {Meteor.Collection} collection - your collection object
 * @param {Function} fn - the same function that you'd pass to Meteor.publish, it should return either false or a cursor, you can use sort, fields, etc. but not skip and limit
 * @param {Object} settings - supported setting for now: pageSize, publicationName
 */
Meteor.paginatedPublish = function (collection, fn, settings) {
  settings = settings || defaultSettings;

  var publicationName = settings.publicationName || collection._name;

  Meteor.publish(publicationName, function(page){
    console.log('publicationName',publicationName);
    var originalCursor = fn.call(this);
    CollectionsMetadata[publicationName] = { cursor: originalCursor, pageSize: settings.pageSize };
    if (!originalCursor) return originalCursor;

    var selector = originalCursor._cursorDescription.selector;
    var options = originalCursor._cursorDescription.options || {};

    //add skip and limit
    page = (isInt(page) && page > 0) ? page : 1;
    options.skip = (page -1) * settings.pageSize;
    options.limit = settings.pageSize;

    return collection.find(selector, options);
  })
};


//publish pageSize and cursor's total count
Meteor.publish("CollectionsMetadata", function () {
  //todo: wait for CollectionsMetadata to be filled
  var self = this;

  _.each(CollectionsMetadata, function(metadata, index){
    var cursor = metadata.cursor;
    if (cursor){
      var initializing = true;

      var handle = cursor.observeChanges({
        added: function (id) {
          //avoid to notify all added changes when it starts
          if (!initializing)
            self.changed("CollectionsMetadata", index, {count: cursor.count()});
        },
        removed: function (id) {
          self.changed("CollectionsMetadata", index, {count: cursor.count()});
        }
      });
      initializing = false;
      //send initial values
      self.added("CollectionsMetadata",  index, {count: cursor.count(), pageSize: metadata.pageSize});

      self.ready();
      self.onStop(function () {
        handle.stop();
      });
    }else{
      return false;
    }
  });
});