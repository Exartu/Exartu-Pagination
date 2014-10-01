
Template.paginationTemplate.context = function () {
  var handler= Hanlders[this.name];
  var pages = [];
  for (var i = 1; i <= handler.pageCount(); i++) {
    pages.push(i);
  }
  return {
      pages: pages,
      name: this.name,
      handler: handler
    }
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
    if (current < MessageInstanceHandler.pageCount() -1)
      ctx.data.handler.setPage(current + 1);
  }
});