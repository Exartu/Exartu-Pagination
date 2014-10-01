Exartu-Pagination
=================

This package allows you to make pagination over meteor's collections

#Usage


```js

MyCollection = new Meteor.Collection('myCollectionName')

if (Meteor.isServer){
  Meteor.paginatedPublish(MyCollection, function () {
    if (!this.userId)
      return false;
  
    return MyCollection.find({
      userId: this.userId
    });
  },{
    pageSize: 5, //default: 100
    publicationName: 'myCollection' //default: 'myCollectionName' (MyCollection._name)
  });
}

if (Meteor.isClient){
  MyHandler = Meteor.paginatedSubscribe('myCollection');
}


```
# MyHandler is an PaginatedHandler, this is the api:


* currentPage() : return the current page
* setPage (page, cb) : set the current page (integer)
* stop(): wrapper for regular handler's stop
* ready(): wrapper (actually is a bit more complex) for regular handler's ready
* totalCount(): return the count of documents in the original cursor (ie: the count if you wouldn't have paginated)
                this method is reactive even for changes in the server
* pageCount(): return the amount of pages used by this subscription. Also reactive


#View

A template is also provided to navegate trough pages. use it like this:

```html
{{fastPagination name="myCollection"}}
```

If you don't like it you can use paginationTemplate helper. check how fastPagination uses it 

