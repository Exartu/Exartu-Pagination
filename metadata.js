Metadata = {
  metadatas: {},
  add: function (metadata) {
    this.metadatas[metadata.userId] = this.metadatas[metadata.userId]  || {};
    var old = this.metadatas[metadata.userId][metadata.name];
    this.metadatas[metadata.userId][metadata.name] = metadata;

    if (old) {
      //update finalCursor count
      if (this.published[metadata.userId]) {
        this.updatePublish(metadata, old);
      }
    }else {
      if (this.published[metadata.userId]){
        this.publish(metadata);
      }
    }
  },
  get: function(userId){
    return this.metadatas[userId];
  },
  publish: function(metadata){
    var self = this,
      finalCursor = metadata.finalCursor;
    if (finalCursor) {

      var pub = self.published[metadata.userId];
      var initializing = true;

      var handler = finalCursor.observeChanges({
        added: function (id) {
          //avoid to notify all added changes when it starts
          if (!initializing)
            pub.changed("CollectionsMetadata", metadata.name, {count: finalCursor.count()});
        },
        removed: function (id) {
          pub.changed("CollectionsMetadata", metadata.name, {count: finalCursor.count()});
        }
      });

      self.metadatas[metadata.userId][metadata.name].handler = handler;

      initializing = false;
      //send initial values

      pub.added("CollectionsMetadata", metadata.name, {
        count: finalCursor.count(),
        pageSize: metadata.pageSize,
        infiniteScroll: metadata.infiniteScroll
      });

      pub.ready();
      pub.onStop(function () {
        if (! self.metadatas[metadata.userId]) return;

        self.metadatas[metadata.userId][metadata.name].handler.stop();

        delete self.metadatas[metadata.userId][metadata.name];
        if (_.isEmpty(self.metadatas[metadata.userId])){
          delete self.metadatas[metadata.userId];
        }
      });
    }
  },
  updatePublish: function (metadata, old) {
    if (old.handler){
      old.handler.stop();
    };
    var self = this,
      finalCursor = metadata.finalCursor;
    if (finalCursor) {

      var pub = this.published[metadata.userId];
      var initializing = true;

      self.metadatas[metadata.userId][metadata.name].handler = finalCursor.observeChanges({
        added: function (id) {
          //avoid to notify all added changes when it starts
          if (!initializing){
            pub.changed("CollectionsMetadata", metadata.name, {count: finalCursor.count()});
          }
        },
        removed: function (id) {
          pub.changed("CollectionsMetadata", metadata.name, {count: finalCursor.count()});
        }
      });
      initializing = false;
      self.published[metadata.userId].changed("CollectionsMetadata", metadata.name, {count: metadata.finalCursor.count(), pageSize: finalCursor._cursorDescription.options.limit});

    }


  },
  setAsPublished: function(pub){
    var self = this;

    self.published = self.published || {};
    self.published[pub.userId] = pub;
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