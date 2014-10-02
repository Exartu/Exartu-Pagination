
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
      this.data.handler.prev()
      break;

    case 39: // right
      this.data.handler.next()
      break;

    default: return; // exit this handler for other keys
  }
  e.preventDefault(); // prevent the default action (scroll / move caret)
};
Template.defaultPagination.created = function(){
  pager = _.bind(pager, this)
  $(document).keydown(pager);
};
Template.defaultPagination.destroyed = function(){
  $(document).off('keydown',pager);
};
Template.defaultPagination.pages = function(){
  console.log('pages', this.pages());
  return this.pages();
};

Template.defaultPagination.isActive = function(){
  var tmplCtx = UI._parentData(1);
  return this.valueOf() == tmplCtx.handler.currentPage();
}
Template.defaultPagination.events({
  'click .page-link': function(e, ctx){
    ctx.data.handler.setPage(this.valueOf());
  },
  'click .previous-page': function(e, ctx){
    var current = ctx.data.handler.currentPage();
    if (current > 1)
      ctx.data.handler.setPage(current - 1);
  },
  'click .next-page': function(e, ctx){
    var current = ctx.data.handler.currentPage();
    if (current < ctx.data.handler.pageCount() -1)
      ctx.data.handler.setPage(current + 1);
  }
});