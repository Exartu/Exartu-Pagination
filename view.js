Template.paginationTemplate.context = function () {
  this.handler= Hanlders[this.name];
  return this;
};
Template.defaultView.isInfiniteScroll= function(){
  return this.handler.isInfiniteScroll();
};

var keyListener = function (e) {
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

var rendered = new reactive(false);
Template.defaultPagination.rendered = function(){
  var container = this.$('.pagination-container');
  var containerWidth = container.width();
  console.log('containerWidth',containerWidth);
  var itemWidth = 43; //the width of the links to pages with 2 digits
  containerWidth -= itemWidth * 6; //at most 6 extra links (next, prev, showNext, showPrev, first and last)
  limit = Math.floor(containerWidth/itemWidth);
  console.log('limit',limit);
  rendered.set(true);

}
Template.defaultPagination.created = function(){
  if (this.data.useKeys) {
    keyListener = _.bind(keyListener, this)
    $(document).keydown(keyListener);
  }

  var self = this.data;

  //auto slice pagesToShow to fit in one line
  Meteor.autorun(function(){
    if (! rendered.get()) return;
    var pageCount = self.handler.pageCount();
    var current = self.handler.currentPage();
    var aux;
    if (pageCount > limit){
      var min = 0;
      if (current > limit/2){
        if (current >  pageCount - limit/2){
          min = pageCount - limit;
        }else{
          min = Math.floor(current - limit/2);
        }
      }
      aux = getIntArray(min + 1, min + 1 + limit);
    }else{
      aux = getIntArray(1, pageCount + 1);
    }
    pagesToShow.set(aux);
  })
};

Template.defaultPagination.destroyed = function(){
  if (this.data.useKeys){
    $(document).off('keydown', keyListener);
  }
};

var pagesToShow = new reactive([]);
var limit = 10;

Template.defaultPagination.helpers({
  hasPages: function () {
    return this.handler.pageCount() > 1;
  },
  isActive : function(){
    var tmplCtx = UI._parentData(1);
    return this.valueOf() == tmplCtx.handler.currentPage();
  },
  pagesToDisplay: function(){
    return pagesToShow.get();
  },
  isInFirstPage: function () {
    return this.handler.currentPage() == 1;
  },
  arePreviousPagesHidden: function () {
    var aux = pagesToShow.get();
    return aux && aux.length && aux[0] > 1;
  },
  areNextPagesHidden: function () {
    var aux = pagesToShow.get();
    return aux && aux.length && (aux[aux.length - 1] < this.handler.pageCount());

  },
  isInLastPage: function () {
    return this.handler.currentPage() == this.handler.pageCount();
  },
  lastPage: function(){
    return this.handler.pageCount();
  }
});

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
    var shown = pagesToShow.get();
    var min = Math.max(0, shown[0] - limit);
    pagesToShow.set(getIntArray(min, min + limit));
  },
  'click .show-next': function(e, ctx){
    var pageCount = ctx.data.handler.pageCount();
    var shown = pagesToShow.get();
    var min = Math.min(pageCount - limit, shown[shown.length - 1]);
    min = min + 1;
    pagesToShow.set(getIntArray(min, min + limit));
  }
});

var getIntArray = function(min, max){
  var result = [];
  for (var i = min; i < max; ++i){
    result.push(i);
  }
  return result;
}


var scrollListener = function(e){

  var elem = $(this.container || window);

  if(elem.scrollTop() + elem.height() > $(this.content || document).height() - 100){
    this.handler.loadMore();
  }
};
Template.defaultInfiniteScroll.created = function(){
  scrollListener = _.debounce(_.bind(scrollListener, this.data), 300);
  $(this.data.container || window).on("scroll", scrollListener)
};
Template.defaultInfiniteScroll.destroyed = function(){
  $(this.data.container || window).off("scroll", scrollListener)

};
Template.defaultInfiniteScroll.isLoading = function () {
  return this.handler.isLoading();
}