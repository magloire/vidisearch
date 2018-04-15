# vidisearch

Vidisearch is a vidi search extension.
Currently it can be used to search DAWA (addresses), Geosearch (matrikler), elasticsearch (plandokumenter).

New searcher can be easily added by following these steps:

* Create a vidi extension or use an existing one.
* In /browser/index.js (or another .js file), add 2 methods (search(), handleSearch()):
* MainSearch will call the search() method on all registered searchers. Searchers are expected to return a promise as shown in the example below.
title will be used to populate the autocomple list. And id is what will be sent to handleSearch(), if the item is selected in the list.

  ```javascript
      search : function(searchTerm){
         //do your search here...
         return new Promise(function(resolve, reject){
          // This where you do your ajax request and so on ...
      
          resolve([
            {title: 'title 1', id : 'id 1'},
            {title: 'title 2', id : 'id 2'},
            .....
          ]);
        })
      }
    ```  
 * handleSearch() will be called if an item from this searcher is selected from the list.
 This method is expected to return a react component. The react component can be as simple or complex as you want.
 this searcher will be in control until the user starts a new search.
     
  ```javascript
      
     handleSearch: function(searchTerm){
       /* 
       do your search here, or show something on the map
       */
       mapObj.setView(poit, 15);
       
       return new Promise(function(resolve, reject){
         let reactComp = <div>
                            <h3>Matrikler</h3>
                            <ul></ul>
                        </div>
        
        return
       
       });
     } 
 ```     
  * Register your searcher in mainSearch
  
  ```javascript
  var dawaSearcher = require('../../dawaSearcher/browser/index.js');
  var matrikelSearcher = require('../../matrikelSearcher/browser/index.js');
  var planSearcher = require('../../planSearcher/browser/index.js');

  var _searchers = {
      dawa: {'searcher':dawaSearcher,'title':'Adresser'},
      matrikel: {'searcher':matrikelSearcher, 'title':'Matrikler'},
      plan: {'searcher':planSearcher, 'title':'Lokalplaner'}
  };
  
  ```
  NB: 
  
  * he registration part will be moved to a config file.
  * MainSearch is a prototype, and much can be changed in the future
  
