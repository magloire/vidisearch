'use strict';

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');

var ReactDOM = require('react-dom');

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Place from '@material-ui/icons/Place';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ExpandLess from '@material-ui/icons/ExpandLess';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import Search from '@material-ui/icons/Search';
import HighlightOff from '@material-ui/icons/HighlightOff';
import Chip from '@material-ui/core/Chip';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import SvgIcon from '@material-ui/core/SvgIcon';
import PinDrop from '@material-ui/icons/PinDrop';

var cloud;
var utils;
var exId = "mainSearch";

var _searchers = {};

var _lastBounds;


module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
    },
    /**
     * Searchers will call this function to register themeselves.
     * 
     * @argument searcher 
     * {
     *  "key" : "dawa",
     *  "obj" : {"searcher" : this, "title":"Adresser","icon":<Icon/>} 
     * }
     */
    registerSearcher: function(searcher){
        _searchers[searcher['key']] = searcher['obj'];
    },

    init: function(){
        utils.createMainTab(exId, __("Main Search!"), __("Search prototype...."), require('./../../../browser/modules/height')().max); 

        var currentSearcher = {};

        class SearchList extends React.Component{
            
            constructor(props){
                super(props);
                this.state = {
                        items: this.props.items
                };
            }
            
            render(){
                const items = this.props.items;
                let me = this;
                let s = me.props.searcher
                const searchItems = items.map((item,index) =>
                    <ListItem key={index+':'+ me.props.searcher+':'+item.id} 
                                button
                                id={item.id.toString()} 
                                searcher={me.props.searcher} 
                                value={item.title}
                               onClick={(e) => this.props.onAdd(s+':'+item.id.toString())}
                                >
                        <ListItemIcon>
                            {_searchers[s]['icon'] ? _searchers[s]['icon'] : <PinDrop/> }
                        </ListItemIcon>
                        <ListItemText primary={item.title} />
                        <ChevronRight/>
                    </ListItem>
                );
                
             //   {item.icon ? item.icon : <PinDrop />}
                
            
                return (
                    <List component="nav">{searchItems}</List>
                );
            }
        }

       
        class SearchersList extends React.Component{
            constructor(props){
                super(props);
                this.state = {
                    searchers : this.props.searchers
                }
            }
            render(){
                const searchers = this.props.searchers;
                const list = searchers.map(searcher => {
                    return <ListItem 
                                key={searcher} 
                                button 
                                divider
                                onClick={(e) => this.props.onAdd(searcher)}>
                        <ListItemIcon>
                        {_searchers[searcher]['icon'] ? _searchers[searcher]['icon'] : <PinDrop/>}
                        </ListItemIcon>
                        <ListItemText primary={searcher} />
                        <ChevronRight/>
                    </ListItem>
                });
                return <List component="nav">{list}</List>;
            }
        }

        

        function RoadIcon(props){
            return <SvgIcon {...props}>
                <path fill="#000000" d="M18.1,4.8C18,4.3 17.6,4 17.1,4H13L13.2,7H10.8L11,4H6.8C6.3,4 5.9,4.4 5.8,4.8L3.1,18.8C3,19.4 3.5,20 4.1,20H10L10.3,15H13.7L14,20H19.8C20.4,20 20.9,19.4 20.8,18.8L18.1,4.8M10.4,13L10.6,9H13.2L13.4,13H10.4Z" />
            </SvgIcon>
        }

        class MainSearch extends React.Component {
            constructor(props) {
                super(props);

                this.state = {
                    currentSearcherName:'',
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
                this.clearSearchBox = this.clearSearchBox.bind(this);
            }

            reset(){
                this.setState({
                    reset : true
                });
            }

            renderListOfSearchers(){
                let searcherNames = Object.keys(_searchers); 
                let searchLen = Object.keys(this.state.searchResults).length;
                if(searchLen > 0){ 
                    searcherNames = Object.keys(this.state.searchResults)
                                    .filter(name => {
                                       return this.state.searchResults[name].length > 0;
                                    });
                }
           
                if(this.state.searchTerm == ""){
                    searcherNames = Object.keys(_searchers);
                }
                return <SearchersList searchers={searcherNames} onAdd={this.selectSearcher}/>;
            }

            getInitialView(){
                return <div className="res">
                    {this.renderListOfSearchers()}
                </div>;
            }

            clearSearchBox(e){
                this.setState({searchTerm :""});
                this.doSearch(this.state.currentSearcherName,'');
            }

            handleSearcherClick(e){
                this.setState({
                    currentSearcherName : '',
                 //   searchTerm: '',
                    searchDetailReady: false
                  //  reset : true
                });
                cloud.get().map.fitBounds(_lastBounds);
                this.doSearch('', this.state.searchTerm);
                
            }


            handleClick(id, e){
                let me = this;
                let _searcher, searchTerm;

                _lastBounds = cloud.get().map.getBounds();

                [_searcher,searchTerm] = id.split(':');
                let searcher = this.searchers[_searcher]['searcher'];
                me.setState({searchTerm : searchTerm});
                /* 
                    set the currentSearcher. From now on, only this searcher will be called 
                    when the user writes in the input box.
                */
               
                me.setState({currentSearcherName : _searcher});
                
                currentSearcher[_searcher] = this.searchers[_searcher];
                searcher.handleSearch(searchTerm).then((res) => {
                    me.setState({searchRes : res});
                    me.setState({searchReady : false});
                    me.setState({searchDetailReady: true});
                })


            }


            selectSearcher(s,e){ 
                var me = this;
                let _searcher = s;
                let searcher = {}; 
                searcher[_searcher] = _searchers[_searcher];
                me.setState({currentSearcherName : _searcher});
                me.doSearch(_searcher, me.state.searchTerm);
            }

            handleChange(e){
                var me = this;
                let val = e.target.value; 
                let _res = {}; 
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

            noResults(){ 
                return this.state.searchReady == false && this.state.searchDetailReady == false;
            }

            resultsFromSearch(){
                return this.state.searchReady;
            }

            renderResultsFromSearch(){
                let listOfSearchers = (this.state.currentSearcherName)? '' : this.renderListOfSearchers();

                let comps = this.getComponentsToRender();
                return <div className="res">
                                    {comps}
                                    {listOfSearchers}
                                </div>;
            }

            resultsFromHandleSearch(){
                return this.state.searchDetailReady;
            }

            renderResultsFromHandleSearch(){

            }


            getComponentsToRender(){ 
                let searcherNames = Object.keys(this.state.searchResults);
                let _length = searcherNames.length;
                let comps = '';
                if(_length == 0) return [];
                if(_length == 1){
                    let name = searcherNames[0];
                    let items = this.state.searchResults[name]; 
                    comps = <SearchList items={items} 
                                searcher={name}
                                onAdd={this.handleClick}  
                            />;
                }else{
                    let items = this.state.searchResults['Adresser'] ? this.state.searchResults['Adresser'].slice(0,5) : [];
                    comps = <SearchList items={items} 
                                searcher="Adresser"
                                onAdd={this.handleClick}  
                            />;
                }
               
                return comps;
            }
            render(){
                /*
                TODO:
                1. Set icons in search results

                3. Set a primary searcher. preferably in config.js. Initially only show results
                   from the primary searcher and the list of searchers.

                   maybe by modifying getComponents to Render
                
                4. use debounce from master

                4 Use the componentInCharge instead of searchReady for readability.
                */
               /*
                DONE:
                - controlled input
                - clear searchTerm
                - 
               */
                let searchRes = this.state.searchRes;
                if(this.resultsFromSearch()){ 
                    searchRes = this.renderResultsFromSearch();                
                }else if(this.noResults()){ 
                    searchRes = this.getInitialView();
                }else if(this.resultsFromHandleSearch()){
                    searchRes = this.state.searchRes;
                }
                
                let searcherButton = '';
                let clearButton = '';
                if(this.state.currentSearcherName){
                   
                    searcherButton = <Chip 
                                        label={this.state.currentSearcherName}
                                        onDelete={this.handleSearcherClick}
                                />;
                }
               
               

                return (
                    <div role="tabpanel">
                        <div className="panel panel-default">
                            <div className="panel-body">

                                
                                <FormControl fullWidth>                              
                                    <InputLabel htmlFor="search-field">Søg</InputLabel>
                                    <Input
                                        id="search-field"
                                        type="text"
                                        
                                        value={this.state.searchTerm}
                                        onChange={this.handleChange}
                                        
                                        endAdornment={
                                            <InputAdornment position="end">
                                                <IconButton 
                                                    onClick={this.clearSearchBox}
                                                >
                                                   {this.state.searchTerm ? <HighlightOff/> : <Search/>} 
                                                </IconButton>
                                            </InputAdornment>
                                        }
                                    />

                                </FormControl>
                                {searcherButton} 
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