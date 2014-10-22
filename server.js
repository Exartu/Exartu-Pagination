//return true if obj is a integer
var isInt = function(obj){
  return _.isNumber(obj) && obj % 1 === 0 && obj < Infinity;
};

//default settings, todo:make this editable through some api
var defaultSettings = {
  pageSize: 100,
  infiniteScroll: false
};

//here I'll save info per user like the original cursor and the page size, etc

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

    var metadata = {
      userId: this.userId,
      cursor: originalCursor,
      pageSize: settings.pageSize,
      infiniteScroll: settings.infiniteScroll,
      name: publicationName
    };

    if (!originalCursor) return originalCursor;

    //get client filter and extend it with the server defined selectors
    var selector = clientFilter || {};
    var options = {};
    //add skip and limit
    if (settings.infiniteScroll){
      //if it use infiniteScroll page means total count
      var count = (isInt(page) && page > settings.pageSize) ? page : settings.pageSize;

      options = {
        skip: 0,
        limit: count
      };
    }else{
      page = (isInt(page) && page > 0) ? page : 1;
      options = {
        skip: (page - 1) * settings.pageSize,
        limit: settings.pageSize
      };
    }

    _.extend(selector, originalCursor._cursorDescription.selector);
    options = _.extend(originalCursor._cursorDescription.options || {}, options);
    var finalCursor = collection.find(selector, options);

    metadata.finalCursor = finalCursor;

    Metadata.add(metadata);

    //if (settings.extraCursors){
    //  return settings.extraCursors(collection.find(selector, options))
    //}
    return finalCursor;

  })
};