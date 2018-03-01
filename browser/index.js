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

//var _searchers = config.extensionConfig.mainSearch.searchers;


var dawaSearcher = require('../../dawaSearcher/browser/index.js');
var matrikelSearcher = require('../../matrikelSearcher/browser/index.js');

var _searchers = {
    dawa: {'searcher':dawaSearcher,'title':'Adresser'},
    matrikel: {'searcher':matrikelSearcher, 'title':'Matrikler'}
};

//var dawaS = require('../../dawaSearcher/browser/index.js');
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

    init: function(){
        utils.createMainTab(exId, __("Main Search!"), __("Search prototype...."), require('./../../../browser/modules/height')().max); 
        // console.log(config.extensionConfig.mainSearch);
        
        

        var currentSearcher = null;

        class SearchItem extends React.Component{
            constructor(props){
                super(props);
            }

            render(){
                return <a id={this.props.searcher+':'+this.props.value} href="#" className="list-group-item">                           
                                {this.props.value}
                        </a>;             
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
                const searchItems = items.map((item) =>
                    <SearchItem key={item.toString()} searcher={me.props.searcher} value={item}/>
                );

                
            
                return (
                    <div onClick={this.props.onAdd} className="list-group">{searchItems}</div>
                );
            }
        }


        class MainSearch extends React.Component {
            constructor(props) {
                super(props);

                this.state = {
                    
                    dataReady:false,
                    searchTerm: '',
                    searchResults: {},
                    searchReady: false, 
                    searchDetailReady: false,
                    searchRes: <div></div>
                };

                
                this.searchers = _searchers;
               
                this.handleChange = this.handleChange.bind(this);
                this.handleClick = this.handleClick.bind(this);
            }

            handleClick(e){
                let me = this;
                let _searcher, searchTerm;
                [_searcher,searchTerm] = e.target.id.split(':');
                let searcher = this.searchers[_searcher]['searcher'];

                searcher.handleSearch(searchTerm).then((res) => {
                    me.setState({searchRes : res});
                    me.setState({searchReady : false});
                    me.setState({searchDetailReady: true});
                })


            }

            handleChange(e){
                var me = this;
                let val = e.target.value; 
                let _res = Object.assign({}, me.state.searchResults);
               Object.keys(me.searchers).map((key) => { 
                   me.searchers[key]['searcher'].search(val).then(function(fulfilled){
                    _res[key] = fulfilled; 
                    me.setState({searchResults : _res}); 
                    me.setState({searchReady: true});
                    });
                })
            }

            
            /**
             *
             * @returns {XML}
             */
            render() {
               
                let k = ['matrikelnr']
               
                let searchRes = this.state.searchRes;

                if(this.state.searchReady){
                   
                    let _keys = Object.keys(this.state.searchResults);
                    let searchRes1 = _keys.map((key) => {
                           let t = <div>
                                <h3>{this.searchers[key]['title']}</h3>
                                <SearchList items={this.state.searchResults[key]}
                                            searcher = {key}
                                            onAdd={this.handleClick}
                                />
                            </div>;
                            return t;
                        });
                    
                    searchRes = <div>{searchRes1}</div>;
                    
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