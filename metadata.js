Metadata = {
  metadatas: {},
  add: function (metadata) {
    this.metadatas[metadata.userId] = this.metadatas[metadata.userId]  || {};
    var old = this.metadatas[metadata.userId][metadata.name];
    if (old) {
      //update finalCursor count
      if (this.published[metadata.userId]) {
        this.published[metadata.userId].changed("CollectionsMetadata", metadata.name, {count: metadata.finalCursor.count()});
      }
    }else {
      if (this.published[metadata.userId]){
        this.publish(metadata);
      }
    }
    this.metadatas[metadata.userId][metadata.name] = metadata;
  },
  get: function(userId){
    return this.metadatas[userId];
  },
  publish: function(metadata){
    var originalCursor = metadata.cursor;
    if (originalCursor) {

      var pub = this.published[metadata.userId];
      var initializing = true;

      var handler = originalCursor.observeChanges({
        added: function (id) {
          //avoid to notify all added changes when it starts
          if (!initializing)
            pub.changed("CollectionsMetadata", metadata.name, {count: originalCursor.count()});
        },
        removed: function (id) {
          pub.changed("CollectionsMetadata", metadata.name, {count: originalCursor.count()});
        }
      });

      initializing = false;
      //send initial values

      pub.added("CollectionsMetadata", metadata.name, {
        count: originalCursor.count(),
        pageSize: metadata.pageSize,
        infiniteScroll: metadata.infiniteScroll
      });

      pub.ready();
      pub.onStop(function () {
        handler.stop();
      });
    }
  },
  setAsPublished: function(pub){
    this.published = this.published || {};
    this.published[pub.userId] = pub;
  }
};


//publish pageSize and cursor's total count, etc
Meteor.publish("CollectionsMetadata", function () {

  if (!this.userId) return false;

  var self = this;

  Metadata.setAsPublished(self);
  _.each(Metadata.get(self.userId), function (metadata) {
    Metadata.publish(metadata);
  });
});