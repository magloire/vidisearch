'use strict';

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');;

var ReactDOM = require('react-dom');

var reproject = require('reproject');

var proj4 = require('proj4');

var wktParser = require('terraformer-wkt-parser');

var cloud;

var layerGroup = L.layerGroup();

var utils;

var mapObj;

var exId = "mainSearch";

var backboneEvents;

var config = require('../../../config/config.js');

var _searchers = {};

var crss = {
    "from" : "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs",
    "to"   : "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
};

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        backboneEvents = o.backboneEvents;
        mapObj = cloud.get().map;

    },
    /**
     * Searchers will call this function to register themeselves.
     * 
     * @argument searcher 
     * {
     *  "key" : "dawa",
     *  "obj" : {"searcher" : this, "title":"Adresser"} 
     * }
     */
    registerSearcher: function(searcher){
        console.log(searcher['key']);
        _searchers[searcher['key']] = searcher['obj'];
    },

    init: function(){
        utils.createMainTab(exId, __("Main Search!"), __("Search prototype...."), require('./../../../browser/modules/height')().max); 
        // console.log(config.extensionConfig.mainSearch);
        
        

        var currentSearcher = {};

        class SearchItem extends React.Component{
            constructor(props){
                super(props);

                this.state = {
                    hover: false
                }
                this.hoverOn = this.hoverOn.bind(this);
                this.hoverOff = this.hoverOff.bind(this);
            }
            hoverOn(){
                this.setState({hover : true});
            }

            hoverOff(){
                this.setState({hover:false});
            }

            render(){
                let liStyle= {
                    padding:'4px 16px'
                };
                return <a
                           href="#"  
                           style={liStyle} 
                           id={this.props.searcher+':'+this.props.id} 
                           className="list-group-item"
                           onMouseEnter={this.hoverOn}
                           onMouseLeave={this.hoverOff}
                           >                           
                               {this.props.value}
                        </a>;             
            }
                
            
        }
        class SearcherText extends React.Component{
            constructor(props){
                super(props);
            }
        }

        class SearchList extends React.Component{
            
            constructor(props){
                super(props);
               // this.searcher = this.props.searcher;
               this.onItemClick = this.onItemClick.bind(this);

               this.state = {
                    items: this.props.items
               };
            }
            onItemClick(e){
             //   console.log(e.target.id); 
                let searcher = searchers[this.props.searcher];
                
                let me = this;
                searcher.handleSearch(e.target.id).then(function(fulfilled){
                    let items = fulfilled.map((item) => {
                        return item.tekst.toString();
                    });
                    me.setState({items : items});
                }); 
              }
            render(){
                const items = this.props.items;
                let me = this;
                const searchItems = items.map((item,index) =>
                    <SearchItem key={index+':'+ me.props.searcher+':'+item.id} 
                                id={item.id.toString()} 
                                searcher={me.props.searcher} 
                                value={item.title}/>
                );

                
            
                return (
                    <div onClick={this.props.onAdd} className="list-group">{searchItems}</div>
                );
            }
        }

        class SearchersList extends React.Component{
            constructor(props){
                super(props);
                this.state = {
                    searchers: this.props.searchers
                }
            }
            render(){
                const searchers = this.props.searchers;
                const list = searchers.map(searcher => {
                    return <Searcher key={searcher}
                                     searcher={searcher}   
                    />;
                });
                return <div onClick={this.props.onAdd} className="list-group">{list}</div>;
            }
        }

        class Searcher extends React.Component{
            constructor(props){
                super(props);
            }

            render(){
                let liStyle = {
                    padding : '4px 16px'
                };
                return <a
                           href="#"  
                           style={liStyle} 
                           id={this.props.searcher} 
                           className="list-group-item"
                           >                           
                               {this.props.searcher}
                        </a>; 
            }
        }


        class MainSearch extends React.Component {
            constructor(props) {
                super(props);

                this.state = {
                    currentSearcherName:'',
                    compontInCharge: 'mainSearch',
                    dataReady:false,
                    searchTerm: '',
                    searchResults: {},
                    searchReady: false, 
                    searchDetailReady: false,
                    reset: true,
                    searchRes: <div></div>
                };

                
                this.searchers = _searchers;
                this.componentsToRender = [];
               
                this.handleChange = this.handleChange.bind(this);
                this.handleClick = this.handleClick.bind(this);
                this.handleSearcherClick = this.handleSearcherClick.bind(this);
                this.selectSearcher = this.selectSearcher.bind(this);
            }

            reset(){
                this.setState({
                    reset : true
                });
            }

            renderListOfSearchers(){
                let searcherNames = Object.keys(_searchers); 
                let searchLen = Object.keys(this.state.searchResults).length;
                if(searchLen > 0){ console.log('searchresults > 0');
                    searcherNames = Object.keys(this.state.searchResults);
                }
                console.log('searchers => ');
                console.log(searcherNames);
                return <SearchersList searchers={searcherNames}
                                      onAdd={this.selectSearcher}  
                />;
            }

            getInitialView(){
                let searcherNames = Object.keys(this.searchers);
                return <SearchersList searchers={searcherNames}/>;
            }

            handleSearcherClick(e){
                this.setState({
                    currentSearcherName : '',
                    searchTerm: ''
                  //  reset : true
                });
                this.doSearch('', '');
                
            }

            handleClick(e){
                let me = this;
                let _searcher, searchTerm;
                [_searcher,searchTerm] = e.target.id.split(':');
                let searcher = this.searchers[_searcher]['searcher'];
                me.setState({searchTerm : searchTerm});
                /* 
                    set the currentSearcher. From now on, only this searcher will be called 
                    when the user writes in the input box.
                */
                // console.log('currentSEarhcer :' + _searcher);
                me.setState({currentSearcherName : _searcher});
                
                currentSearcher[_searcher] = this.searchers[_searcher];
                searcher.handleSearch(searchTerm).then((res) => {
                    me.setState({searchRes : res});
                    me.setState({searchReady : false});
                    me.setState({searchDetailReady: true});
                })


            }

            selectSearcher(e){ 
                var me = this; //console.log(me);
               // console.log(e.target.id);
                let _searcher = e.target.id; //console.log('searcher selected : ', _searcher);
               // let searcher = _searchers[_searcher]['searcher']; console.log(searcher);
                let searcher = {}; 
                searcher[_searcher] = _searchers[_searcher];
                me.setState({currentSearcherName : _searcher});
                me.doSearch(_searcher, me.state.searchTerm);
            }

            handleChange(e){
                var me = this;
                let val = e.target.value; 
                let _res = {}; //Object.assign({}, me.state.searchResults);
                me.setState({searchTerm : val});
                let currentSearchers = {};
                if(this.state.currentSearcherName){
                    currentSearcher[this.state.currentSearcherName] = this.searchers[this.state.currentSearcherName];
                }
                if(Object.keys(currentSearcher).length > 0){
                    currentSearchers = currentSearcher;
                }else{
                    currentSearchers = me.searchers;
                }
                me.doSearch(this.state.currentSearcherName, val);
            }

            doSearch(searcherName, _searchTerm){ 
                let currentSearchers = {};
               

                if(searcherName === ''){ 
                    currentSearchers = this.searchers;
                }else{ 
                    currentSearchers[searcherName] = this.searchers[searcherName];
                }
                this.setState({searchResults:{}});
                var me = this;
                let _res = {};
                Object.keys(currentSearchers).map((key) => {
                currentSearchers[key]['searcher'].search(_searchTerm).then(function(fulfilled){
                    _res[key] = fulfilled;
                    me.setState({searchResults : _res});
                    me.setState({searchReady: true});
                    me.setState({reset: false});
                    });
                })
            }

            noResults(){ console.log('entered no results')
                return this.state.searchReady == false && this.state.searchDetailReady == false;
            }

            /**
             *
             * @returns {XML}
             */
            render1() {
               
                let k = ['matrikelnr']
               
                let searchRes = this.state.searchRes;
                let searcherButton = '';
                if(this.state.searchReady){
                   
                    let _keys = Object.keys(this.state.searchResults);
                    let _length = _keys.length;
                    
                    let hitsList1 = _keys.map(key => { 
                        let temp = [{id:'all',title:this.searchers[key]['title']}];
                        return <SearchList items={temp} searcher={key} onAdd={this.selectSearcher}/>;
                        
                    })
                    /* let dawaRes = <SearchList items={this.state.searchResults['dawa'].slice(0,10)}
                                              searcher= 'dawa'
                                              onAdd={this.handleClick}
                                    />;   */          
                    let searchRes1 = _keys.map((key) => {
                           let _items = _length == 1 ? this.state.searchResults[key] : this.state.searchResults[key].slice(0,5); 
                           if(_length == 1){
                               hitsList1 = '';
                           }
                           let t = <div>
                                <h5>{this.searchers[key]['title']}</h5>
                                <SearchList items={_items}
                                            searcher = {key}
                                            onAdd={this.handleClick}
                                />
                            </div>;
                            return t;
                        });
                    
                    if(this.state.reset){
                        searchRes = <div></div>;
                    }else{
                        searchRes = <div>
                                        <div>{hitsList1}</div>
                                        <div>{searchRes1}</div>
                                    </div>;
                    }
                    
                }

                if(this.state.currentSearcherName){
                    let text = this.searchers[this.state.currentSearcherName]['title'];
                    searcherButton = <button type="button" onClick={this.handleSearcherClick} className="btn btn-info">
                                        {this.state.currentSearcherName} <span className="glyphicon glyphicon-remove"></span>
                                    </button>
                }else{ //console.log('searcherName empty');
                }


                return (
                    <div role="tabpanel">
                        <div className="panel panel-default">
                            <div className="panel-body">

                                <div className="form-group">

                                    <div className="btn-group">
                                        <input id="my-search" className="custom-search typeahead" type="text"
                                            placeholder="search" onChange={this.handleChange}>
                                            
                                        </input>
                                        {searcherButton}
                                        
                                        
                                    </div>

                                </div>
                                
                                {searchRes}

                            </div>
                        </div>
                    </div>
                );
            }

            getComponentsToRender(){ //console.log('I was called');
                let searcherNames = Object.keys(this.state.searchResults);
                let _length = searcherNames.length;
                if(_length == 0) return [];
                let comps = searcherNames.map(name => { 
                    let items = _length == 1 ? this.state.searchResults[name] : this.state.searchResults[name].slice(0,5);    
                    let title = _length == 1 ? '' :<h5>{this.searchers[name]['title']}</h5>; 
                    let list =  <div>
                                    {title}
                                    <SearchList items={items} 
                                                searcher={name}
                                                onAdd={this.handleClick}  
                                    />
                                </div>
                              ;
                    return list;
                });
                return comps;
            }
            render(){
                /*
                TODO:
                1. handle the initial state where there is no searchResults yet.
                    here we should render the list of all available searchers.

                2. When there is not yet set a  searcherName, but there are some searchResults,
                   remove from ListOfSearchers, those with no results.

                3. Set a primary searcher. preferably in config.js. Initially only show results
                   from the primary searcher and the list of searchers.

                4 Use the componentInCharge instead of searchReady for readability.
                */
                let searchRes = this.state.searchRes;
                if(this.state.searchReady){
                    let listOfSearchers = (this.state.currentSearcherName)? '' : this.renderListOfSearchers();

                    let comps = this.getComponentsToRender();
                    console.log('components : ',comps.length);
                    searchRes = <div className="res">
                                        {listOfSearchers}
                                        {comps}
                                    </div>;
                }else{
                    searchRes = <div className="res">
                                    {this.renderListOfSearchers()}
                                </div>;
                }
                /* if(this.noResults()){ console.log('noResults() is true');
                    searchRes = <div className="res">
                                    {this.renderListOfSearchers()}
                                </div>;
                } */
                let searcherButton = '';
                if(this.state.currentSearcherName){
                    searcherButton = <button type="button" onClick={this.handleSearcherClick} className="btn btn-info">
                                        {this.state.currentSearcherName} <span className="glyphicon glyphicon-remove"></span>
                                    </button>
                }
                return (
                    <div role="tabpanel">
                        <div className="panel panel-default">
                            <div className="panel-body">

                                <div className="form-group">

                                    <div className="btn-group">
                                        <input id="my-search" className="custom-search typeahead" type="text"
                                            placeholder="search" onChange={this.handleChange}>
                                            
                                        </input>
                                        {searcherButton}
                                        
                                        
                                    </div>

                                </div>
                                {searchRes}

                            </div>
                        </div>
                    </div>
                );
            }
        }

        try {

            ReactDOM.render(
                <MainSearch />,
                document.getElementById(exId)
            );
        } catch (e) {

        }

    }
};