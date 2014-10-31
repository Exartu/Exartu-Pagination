/**
 * wraper for Meteor.subscribe
 * @param {String} the name passed in the publish settings or the collection name
 * @param cb
 * @returns {PaginatedHandler}
 */
Meteor.paginatedSubscribe = function (name, cb, options) {
  return new PaginatedHandler(name, cb, options);
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

// keeps created handlers
Hanlders = {};
/**
 * an extended handler
 * @param name
 * @param cb
 * @constructor
 */
var PaginatedHandler = function(name, cb, options){
  var self = this;
  self._ready = new reactive(false);
  self.name = name;

  self._page = new reactive(1);
  self._total = new reactive(0);
  self._filter = new reactive({});
  self._isLoading = new reactive(false);
  self._locked = false;

  var options = options || {
      stopCurrent: true
  };

  if (Hanlders[name] && options.stopCurrent){
    Hanlders[name].stop();
  }

  self.handler = Meteor.subscribe(name, 1, function(){
    self._ready.set(true);
    cb && cb.call(this)
  });

  Hanlders[name] = self;
};

PaginatedHandler.prototype._reRunSubscription = function (page, filter, cb) {
  var self = this;

  //default to current values non-reactively
  page = page || self._page.value;
  filter = filter || self._filter.value;

  if (self._page.value == page && _.isEqual(self._filter.value, filter)) return;
  self._isLoading.set(true);

  if (self._locked){
    return;
  }

  self._locked = true;

  if (! self.isInfiniteScroll()) self.handler.stop();

  //defer execution of subscription so that the stop called above has time to wipe the collection
  //if I execute subscribe right after a stop the subscription is ignored
  _.defer(function() {
    self.handler = Meteor.subscribe(self.name, page, filter, function () {
      self._locked = false;
      self._isLoading.set(false);
      cb && cb.call(this)
    });

    self._page.set(page);
    self._filter.set(filter);
  });
};

PaginatedHandler.prototype.currentPage = function(){
  return this._page.get();
};
PaginatedHandler.prototype.setPage = function(page, cb){
  this._reRunSubscription(page, null, cb);
};

PaginatedHandler.prototype.getFilter = function(){
  return this._filter.get();
};
PaginatedHandler.prototype.setFilter = function(obj, cb){
  if (_.isEqual(this._filter.value, obj)) return;

  checkQuerySelector(obj);

  this._reRunSubscription(1, obj, cb)
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

  this._reRunSubscription(current + metadata.pageSize, null, cb);
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
