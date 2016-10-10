/**
 * @todo review the pre & post render callbacks.
 * - the only reason I added this was because I needed to have the option to call a function after the pager is rendered.
 * - this is related to the "pagination styling bug".
 *
 * Bug description: when trying to add some styles, custom class, wrapper or simply overwriting the pager's container and
 * sub elements, outside of the widget, it would stop functioning normally. It would stop rendering the page links. Adding
 * styling or custom class post rendering seems to fix it.
 * @type {null}
 */

var preRenderCallback = null; // javascript code called before rendering the main pagination widget template
var postRenderCallback = null;// javascript code called after rendering the main pagination widget template

Template.paginationTemplate.helpers({
  context: function () {
    this.handler = Hanlders[this.name];
    if (!this.handler) return null;
    return this;
  }
});

Template.defaultView.helpers({
  isInfiniteScroll: function () {
    return this.handler.isInfiniteScroll();
  }
});

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

  //var container = this.$('.pagination-container');
  //var containerWidth = container.width();
  //if (!containerWidth) return;

  //var itemWidth = 43; //the width of the links to pages with 2 digits
  //containerWidth -= itemWidth * 6; //at most 6 extra links (next, prev, showNext, showPrev, first and last)
  //limit = Math.floor(containerWidth/itemWidth);

  //console.log('rendered limit', limit);
  //if (limit<0) debugger;
  rendered.set(true);

};
Template.defaultPagination.created = function(){
  var data = this.data;

  if (data.useKeys) {
    keyListener = _.bind(keyListener, this);
    $(document).keydown(keyListener);
  }

  if (! data.handler) return;

  //auto slice pagesToShow to fit in one line
  this.autorun(function(){
    if (! rendered.get()) return;
    var pageCount = data.handler.pageCount();
    var current = data.handler.currentPage();
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

var pageGoTo;
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
  },
  'click #goto-page': function(e, ctx){
    if(pageGoTo && !_.isNaN(pageGoTo)) {
      ctx.data.handler.setPage(pageGoTo);
    }
  },
  'change #goto-page-input': function(e){
    pageGoTo = parseInt(e.target.value)
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