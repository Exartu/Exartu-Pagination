
Template.paginationTemplate.context = function () {
  var handler= Hanlders[this.name];

  return {
      pages: function() {
        var pages = [];
        for (var i = 1; i <= handler.pageCount(); i++) {
          pages.push(i);
        }
        return pages;
      },
      name: this.name,
      handler: handler
    }
};






var pager = function (e) {
  if (e.target.tagName == 'INPUT') return;

  switch(e.which) {
    case 37: // left
      this.data.handler.prev();
      break;

    case 39: // right
      this.data.handler.next();
      break;

    default: return; // exit this handler for other keys
  }
  e.preventDefault(); // prevent the default action (scroll / move caret)
};
Template.defaultPagination.rendered = function(){
  var width = this.$('.pagination-container').width();
  width -= 43 * 5;
  limit = Math.trunc(width/43);
}
Template.defaultPagination.created = function(){
  pager = _.bind(pager, this)
  $(document).keydown(pager);

  var self = this.data;
  Meteor.autorun(function(){
    var aux = self.pages();
    var current = self.handler.currentPage()

    if (aux.length > limit){
      var min = 0;
      if (current > limit/2){
        if (current >  aux.length - limit/2){
          min = aux.length - limit;
        }else{
          min = current - limit/2;
        }
      }
      aux = aux.slice(min, Math.max(limit, limit/2 + current));
    }
    pagesToShow.set(aux);
  })
};
Template.defaultPagination.destroyed = function(){
  $(document).off('keydown',pager);
};
var pagesToShow = new reactive([]);
var limit = 10;
Template.defaultPagination.helpers({
  pagesToDisplay: function(){
    return pagesToShow.get();
  },
  isInFirstPage: function () {
    return this.handler.currentPage() == 1;
  },
  arePreviousPagesHiden: function () {
    var aux = pagesToShow.get();
    return aux && aux.length && aux[0]>1;
  },
  areNextPagesHiden: function () {
    var aux = pagesToShow.get();
    return aux && aux.length && (aux[aux.length - 1] < this.pages().length);

  },
  isInLastPage: function () {
    return this.handler.currentPage() == this.handler.pageCount();
  },
  lastPage: function(){
    var pages = this.pages();
    return pages.length;
  }
});

Template.defaultPagination.isActive = function(){
  var tmplCtx = UI._parentData(1);
  return this.valueOf() == tmplCtx.handler.currentPage();
}
Template.defaultPagination.events({
  'click .page-link': function(e, ctx){
    ctx.data.handler.setPage(this.valueOf());
  },
  'click .previous-page': function(e, ctx){
    ctx.data.handler.prev();
  },
  'click .next-page': function(e, ctx){
    ctx.data.handler.next();
  },
  'click .show-prev': function(e, ctx){
    var allpages = ctx.data.pages();
    var shown = pagesToShow.get();
    var min = Math.max(0, shown[0] - limit);
    pagesToShow.set(allpages.slice(min, min + limit));
  },
  'click .show-next': function(e, ctx){
    var allpages = ctx.data.pages();
    var shown = pagesToShow.get();
    var min = Math.min(allpages.length - limit, shown[shown.length - 1]);
    pagesToShow.set(allpages.slice(min, min + limit));
  }
});