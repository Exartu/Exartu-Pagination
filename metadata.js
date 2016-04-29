Metadata = {
  metadatas: {},
  add: function (metadata) {
    this.metadatas[metadata.connectionId] = this.metadatas[metadata.connectionId]  || {};
    var old = this.metadatas[metadata.connectionId][metadata.name];
    this.metadatas[metadata.connectionId][metadata.name] = metadata;

    if (old) {
      //update finalCursor count
      if (this.published[metadata.connectionId]) {
        this.updatePublish(metadata, old);
      }
    }else {
      if (this.published[metadata.connectionId]){
        this.publish(metadata);
      }
    }
  },
  get: function(connectionId){
    return this.metadatas[connectionId];
  },
  publish: function(metadata){
    var self = this,
      finalCursor = metadata.finalCursor;
    if (finalCursor) {

      var pub = self.published[metadata.connectionId];
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

      self.metadatas[metadata.connectionId][metadata.name].handler = handler;

      initializing = false;
      //send initial values

      pub.added("CollectionsMetadata", metadata.name, {
        count: finalCursor.count(),
        pageSize: metadata.pageSize,
        infiniteScroll: metadata.infiniteScroll
      });


      pub.onStop(function () {
        if (! self.metadatas[metadata.connectionId]) return;

        self.metadatas[metadata.connectionId][metadata.name].handler.stop();

        delete self.metadatas[metadata.connectionId][metadata.name];
        if (_.isEmpty(self.metadatas[metadata.connectionId])){
          delete self.metadatas[metadata.connectionId];
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

      var pub = this.published[metadata.connectionId];
      var initializing = true;

      self.metadatas[metadata.connectionId][metadata.name].handler = finalCursor.observeChanges({
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
      self.published[metadata.connectionId].changed("CollectionsMetadata", metadata.name, {count: metadata.finalCursor.count(), pageSize: finalCursor._cursorDescription.options.limit});

    }


  },
  setAsPublished: function(pub){
    var self = this;

    self.published = self.published || {};
    self.published[pub.connection.id] = pub;
  }
};


//publish pageSize and cursor's total count, etc
Meteor.publish("CollectionsMetadata", function () {

  //if (!this.userId) return false;

  var self = this;

  Metadata.setAsPublished(self);
  _.each(Metadata.get(self.connection.id), function (metadata) {
    Metadata.publish(metadata);
  });
  self.ready();
});