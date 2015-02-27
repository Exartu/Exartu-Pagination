/**
 * wraper for Meteor.subscribe
 * @param {String} the name passed in the publish settings or the collection name
 * @param cb
 * @returns {PaginatedHandler}
 */
Meteor.paginatedSubscribe = function (name, options, cb) {
  //todo: fix the order of the arguments
  
  //fix for iron-router version 1.0.3
  return Tracker.nonreactive(function () {
    return new PaginatedHandler(name, cb, options);
  });
};
/**
 * A reactive var
 * @param value - initial value
 * @constructor
 */
reactive = function(value){
  var self = this;
  self.value = value;
  self._dep = new Deps.Dependency;
};
reactive.prototype = {
  get: function(){
    this._dep.depend();
    return this.value;
  },
  set: function(newVal){
    if (this.value !== newVal){
      this._dep.changed();
      this.value = newVal;
    }
  }
};
var isEqual = function (obj1, obj2) {
  return (JSON.stringify(obj1) === JSON.stringify(obj2));
};
// keeps created handlers
Hanlders = {};
/**
 * an extended handler
 * @param name
 * @param cb
 * @constructor
 */
var PaginatedHandler = function(name, cb, options){
  var self = this, opt = options || {},
    options = {
      stopCurrent: opt.stopCurrent !== undefined ? opt.stopCurrent : true,
      filter: opt.filter || {},
      options: opt.options || {},
      params: opt.params || {},
      pubArguments: opt.pubArguments || {}
    };

  self._ready = new reactive(false);
  self.name = name;

  self._page = new reactive(1);
  self._total = new reactive(0);
  self._filter = new reactive(options.filter);
  self._options = new reactive(options.options);
  self._params = new reactive(options.params);
  self._pubArguments = new reactive(options.pubArguments);

  self._isLoading = new reactive(false);
  self._locked = false;
  self._queuedFilter = undefined;

  if (Hanlders[name] && options.stopCurrent){
    Hanlders[name].stop();
  }

  //transform arguments
  var arguments = {
    page: 1,
    clientFilter:  options.filter,
    pubArguments: options.pubArguments
  }

  self.handler = Meteor.subscribe(name, arguments, function(){
    self._ready.set(true);
    cb && cb.call(this)
  });

  Hanlders[name] = self;
};

PaginatedHandler.prototype._reRunSubscription = function (page, filter, options, params, cb) {
  var self = this;

  //default to current values non-reactively
  var page = page || self._page.value,
    filter = EJSON.clone(filter) || self._filter.value,
    options = EJSON.clone(options) || self._options.value;
    params = EJSON.clone(params) || self._params.value;

  if (self._page.value == page
    && isEqual(self._filter.value, filter)
    && isEqual(self._options.value, options)
    && isEqual(self._params.value, params)) return;

  self._isLoading.set(true);

  if (self._locked){
    self._queuedFilter = filter;
    return;
  }

  self._locked = true;

  if (! self.isInfiniteScroll()) self.handler.stop();

  //transform arguments
  var args = {
    page: page,
    clientFilter:  filter,
    clientOptions: options,
    clientParams: params,
    pubArguments: self._pubArguments.value
  }


  //defer execution of subscription so that the stop called above has time to wipe the collection
  //if I execute subscribe right after a stop the subscription is ignored
  _.defer(function() {
    self.handler = Meteor.subscribe(self.name, args, function () {
      self._locked = false;
      if (self._queuedFilter) {
        self.setFilter(self._queuedFilter, params, cb);
        delete self._queuedFilter;
      } 
      self._isLoading.set(false);
      cb && cb.call(this)
      
    });

    self._page.set(page);
    self._filter.set(filter);
    self._options.set(options);
    self._params.set(params);
  });
};

PaginatedHandler.prototype.currentPage = function(){
  return this._page.get();
};
PaginatedHandler.prototype.setPage = function(page, cb){
  this._reRunSubscription(page, null, null, null, cb);
};

PaginatedHandler.prototype.getFilter = function(){
  return this._filter.get();
};
PaginatedHandler.prototype.setFilter = function(obj, params, cb){
  if (isEqual(this._filter.value, obj) && isEqual(this._params.value, params)) return;

  checkQuerySelector(obj);

  this._reRunSubscription(1, obj, null, params, cb);
};
PaginatedHandler.prototype.getOptions = function(){
  return this._options.get();
};
PaginatedHandler.prototype.setOptions = function(obj, cb){
  if (isEqual(this._options.value, obj)) return;

  this._reRunSubscription(1, null, obj, null, cb);
};

var checkQuerySelector = function (selector) {
  //get any cursor
  var cursor = Metadata.find();

  cursor.matcher._compileSelector(selector);

};
PaginatedHandler.prototype.prev = function(){
  var self= this;
  if (self.currentPage() > 1){
    self.setPage(self.currentPage() - 1);
  }

};
PaginatedHandler.prototype.next = function(){
  var self= this;
  if (self.currentPage() < self.pageCount()){
    self.setPage(self.currentPage() + 1);
  }
};

PaginatedHandler.prototype.loadMore = function(cb){
  var total = this.totalCount();
  var metadata = Metadata.findOne(this.name);
  var current = this.currentCount();

  if (total == current) return;

  this._reRunSubscription(current + metadata.pageSize, null, null,  cb);
};

PaginatedHandler.prototype.isLoading = function () {
  return this._isLoading.get()
}
PaginatedHandler.prototype.stop = function(){
  return this.handler.stop();
};
PaginatedHandler.prototype.ready = function(){
  return this._ready.get();
};


PaginatedHandler.prototype.isInfiniteScroll = function(){
  var metadata = Metadata.findOne(this.name);
  return metadata && metadata.infiniteScroll;
};
PaginatedHandler.prototype.totalCount = function(){
  var metadata = Metadata.findOne(this.name);
  return metadata && metadata.count;
};
PaginatedHandler.prototype.pageCount = function(){
  var metadata = Metadata.findOne(this.name);
  return metadata && Math.ceil(metadata.count / metadata.pageSize);
};
PaginatedHandler.prototype.currentCount = function(){
  try{
    return Meteor.connection._mongo_livedata_collections[this.name].find().count();
  }catch (e){
    console.error(e)
    return;
  }
};

var Metadata = new Meteor.Collection('CollectionsMetadata');

Meteor.subscribe('CollectionsMetadata');
