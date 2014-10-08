//return true if obj is a integer
var isInt = function(obj){
  return _.isNumber(obj) && obj % 1 === 0 && obj < Infinity;
};

//default settings, todo:make this editable through some api
var defaultSettings = {
  pageSize: 100
};

//here I'll save info per user like the original cursor and the page size, etc
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

  Meteor.publish(publicationName, function(page, clientFilter){

    var originalCursor = fn.call(this);

    CollectionsMetadata[this.userId] = CollectionsMetadata[this.userId] || {};
    var metadata = CollectionsMetadata[this.userId];

    metadata[publicationName] = metadata[publicationName] || {};
    metadata[publicationName].cursor = originalCursor;
    metadata[publicationName].pageSize = settings.pageSize;

    if (!originalCursor) return originalCursor;

    //get client filter and extend it with the server defined selectors
    var selector = clientFilter || {};

    //add skip and limit
    page = (isInt(page) && page > 0) ? page : 1;
    var options = {
      skip: (page - 1) * settings.pageSize,
      limit: settings.pageSize
    };

    _.extend(selector, originalCursor._cursorDescription.selector);
    options = _.extend(originalCursor._cursorDescription.options || {}, options);

    metadata[publicationName].finalCursor = collection.find(selector);
    metadata[publicationName].onChanged && metadata[publicationName].onChanged();

    if (collection instanceof View){
      //Handle a ViewCursor
      collection.publishCursor(originalCursor, this, publicationName);

    }else{
      //Handle a regular mongo cursor
      return collection.find(selector, options);
    }

  })
};


//publish pageSize and cursor's total count
//todo: make this reactive to CollectionsMetadata object. ie: publish the metadata of a Collection after the user subscribe to it
Meteor.publish("CollectionsMetadata", function () {
  var self = this;

  _.each(CollectionsMetadata[this.userId], function(metadata, index){
    var originalCursor = metadata.cursor;
    if (originalCursor){
      var initializing = true;

      var handle = originalCursor.observeChanges({
        added: function (id) {
          //avoid to notify all added changes when it starts
          if (!initializing)
            self.changed("CollectionsMetadata", index, {count: originalCursor.count()});
        },
        removed: function (id) {
          self.changed("CollectionsMetadata", index, {count: originalCursor.count()});
        }
      });
      initializing = false;
      //send initial values
      self.added("CollectionsMetadata",  index, {count: originalCursor.count(), pageSize: metadata.pageSize});

      self.ready();
      self.onStop(function () {
        handle.stop();
      });

      //when the client change the filter, update the count info
      CollectionsMetadata[self.userId][index].onChanged = function(){
        self.changed("CollectionsMetadata", index, {count: metadata.finalCursor.count()});
      };

    }else{
      return false;
    }
  });
});