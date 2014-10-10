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
    publicationName: 'myCollection' //default: 'myCollectionName' (MyCollection._name),
    infiniteScroll: false //default to false, if is set to true pageSize will mean the docs that will load when the scroll hits the bottom
  });
}

if (Meteor.isClient){
  MyHandler = Meteor.paginatedSubscribe('myCollection');
}


```
# PaginatedHandler api:


* `currentPage()`: return the current page
* `setPage (page, cb)`: set the current page (integer)

* `getFilter()`: return the current filter
* `setFilter (page, cb)`: set the filter, a mongo selector and re-run the subscription

* `prev()`: set the current page to current page - 1
* `next()`: set the current page to current page + 1
* `loadMore(cb)`: for infinite scroll, loads more data

* `stop()`: wrapper for regular handler's stop
* `ready()`: wrapper (actually is a bit more complex) for regular handler's ready

* `isLoading`: reactively returns true if the subscription is re-running
* `isInfiniteScroll`: returns true if this subscriptions was created with infiniteScroll

* `totalCount()`: return the count of documents in the original cursor (ie: the count if you wouldn't have paginated)
                this method is reactive even for changes in the server
* `pageCount()`: return the amount of pages used by this subscription. Also reactive


#View

A template is also provided to navigate trough pages, use it like this:

```html
{{> fastPagination name="myCollection"}}
```

If you don't like it you can use paginationTemplate helper. check how fastPagination uses it for more info

