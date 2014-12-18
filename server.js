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

  Meteor.publish(publicationName, function(arguments){
    arguments = arguments || {};


    var page = arguments.page,
      clientFilter = arguments.clientFilter,
      clientOptions = arguments.clientOptions,
      clientParams = arguments.clientParams,
      pubArguments =  _.isArray(arguments.pubArguments) ? arguments.pubArguments :  arguments.pubArguments === undefined ? [] : [arguments.pubArguments];

    var originalCursor = fn.apply(this, pubArguments);

    var metadata = {
      connectionId: this.connection.id,
      cursor: originalCursor,
      pageSize: settings.pageSize,
      infiniteScroll: settings.infiniteScroll,
      name: publicationName
    };

    if (!originalCursor) return originalCursor;

    //get client filter and extend it with the server defined selectors
    var selector = clientFilter || {};
    var options = clientOptions || {};

    //add skip and limit
    if (settings.infiniteScroll){
      //todo: improve infiniteScroll now that it support clientOptions

      //if it use infiniteScroll page means total count
      var count = (isInt(page) && page > settings.pageSize) ? page : settings.pageSize;

      options = {
        skip: 0,
        limit: count
      };
    }else{
      page = (isInt(page) && page > 0) ? page : 1;
      var pageSize = options.limit || settings.pageSize;

      options.skip =  (page - 1) * pageSize;
      options.limit = pageSize;
    }

    selector = settings.updateSelector ? settings.updateSelector.call(this, selector, clientParams) : selector;


    selector = mergeSelectors(selector, originalCursor._cursorDescription.selector);

    options = _.extend(originalCursor._cursorDescription.options || {}, options);
    var finalCursor = collection.find(selector, options);

    metadata.finalCursor = finalCursor;

    Metadata.add(metadata);

    return finalCursor;
  })
};

var mergeSelectors = function (clientSelector, serverSelector) {
  var result = {};
  _.each(['$or', '$and'], function (key) {
    if (!_.isUndefined(clientSelector[key]) && !_.isUndefined(serverSelector[key])){
      result.$and = result.$and || [];
      var aux = {};
      aux[key] = clientSelector[key];
      result.$and.push(_.clone(aux));
      aux[key] = serverSelector[key];
      result.$and.push(_.clone(aux));

      delete clientSelector[key];
      delete serverSelector[key];
    }
  });

  _.extend(result, clientSelector);
  _.extend(result, serverSelector);

  return result;
};
