'use strict';

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');;

var ReactDOM = require('react-dom');

var reproject = require('reproject');

var cloud;

var utils;

var mapObj;

var exId = "mainSearch";

var backboneEvents;

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        backboneEvents = o.backboneEvents;

    },

    init: function(){
        utils.createMainTab(exId, __("Main Search!"), __("Search prototype...."), require('./../../../browser/modules/height')().max); 

        var DawaSearcher = {
            search: function(searchTerm){
                if(searchTerm){
                    searchTerm = searchTerm + '*';
                }
                let url = `https://dawa.aws.dk/vejnavne?q=${searchTerm}&side=1&per_side=10&kommunekode=151|159|163|240|161`;
               
               return new Promise(function(resolve, reject){
                   $.getJSON(url, function(data){
                        let res = data.map((item) => {
                            let it = item.navn + " " 
                            + item.postnumre[0]['nr'] 
                            + " " 
                            + item.postnumre[0]['navn'];
                        return it;
                        });
                        resolve(res);
                   });
                })
            },

            handleSearch: function(searchTerm){
                let temp,postnr = '', navn = '';
                temp = searchTerm.split(" ").slice(0,-1);
                postnr = temp.pop();
                navn = temp.join(" ");
              //  let url = `https://dawa.aws.dk/vejstykker?postnr=${postnr}&navn=${navn}&kommunekode=151|159|163|240|161&srid=25832&format=geojson`;
                let url = `https://dawa.aws.dk/adgangsadresser/autocomplete?q=${searchTerm}&type=adgangsadresse&side=1&per_side=105&noformat=1&kommunekode=151|159|163|240|161`
                return new Promise(function(resolve, reject){
                    $.getJSON(url, function(data){
                        let res = data.map((item) => {
                            let it = {tekst: item.tekst, href: item.adgangsadresse.href};
                            return it;
                        });

                        let _res = res.map((i) => {
                            return i.tekst;
                        });
                      //  console.log(_res);
                        let comp = <div>
                            <h3>Adresser</h3>
                            <AdresseList items={res}/>
                            </div>;
                        resolve(comp);
                    });
                 })
            }
        };

        
        var MatrikelSearcher = {
            search: function(searchTerm){
                if(!searchTerm){
                    searchTerm = "a b c d e f g h i j k l m 1 2 3 4 5 6";
                }
                let url = "https://kortforsyningen.kms.dk/Geosearch?service=GEO&limit=20&resources=matrikelnumre"+
                           "&area=muncode0173%2Cmuncode0157%2Cmuncode0230%2Cmuncode0159%2Cmuncode0151%2Cmuncode0163"+
                           "&search="+ searchTerm +
                           "&login=magloire&password=Kort_1234";

                return new Promise(function(resolve, reject){
                $.getJSON(url, function(data){
                        let res = data.data.map((item) => {
                            let it = item.matrnr + ", " + item.elavsnavn ;
                        return it;
                        });
                        resolve(res);
                });
                })
                
            },

            handleSearch: function(searchTerm){
                return new Promise(function(resolve, reject){
                    let data = [searchTerm];
                    let comp = <div> 
                        <h3>Matrikler</h3>
                        <SearchList items={data} searcher='matrikel'/>
                    </div>;

                    let resultLayer = new L.FeatureGroup();

                    resolve(comp);
                });
            }
        };
        
        
        
        var searchers = {
            dawa: DawaSearcher,
            matrikel: MatrikelSearcher
        };

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

        SearchItem.propTypes = {
            value: React.PropTypes.string,
        };
        
        class AdresseItem extends React.Component{
            constructor(props){
                super(props);
            }

            render(){
              //  console.log(this.props.value, this.props.hrf);
               return <a id={this.props.hrf} href="#" className="list-group-item">
                    {this.props.value}
                </a>
            }
        }

        class AdresseList extends React.Component{
            constructor(props){
                super(props);
                this.handleClk = this.handleClk.bind(this);
                this.state = {
                    items: this.props.items
                }
            }

            handleClk(e){
                //console.log(e.target.id);
                let map = cloud.get().map;
                $.getJSON(e.target.id, function(data){
                   // console.log(data.adgangspunkt.koordinater);
                    let coords = data.adgangspunkt.koordinater;
                    coords = [coords[1],coords[0]];
                    console.log(coords);
                    var marker = L.marker(coords).addTo(map);
                    map.setView(coords,17);
                });
            }

            render(){
                const items = this.props.items;
                let me = this;
                //console.log(items);
                const searchItems = items.map((item) => {
                    //console.log(item);
                    return <AdresseItem key={item.tekst.toString()} hrf={item.href} value={item.tekst}/>
                });

                return (
                    <div onClick={this.handleClk} className="list-group">{searchItems}</div>
                );
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

                this.searchers = {
                    dawa: DawaSearcher,
                    matrikel: MatrikelSearcher
                };
               
                this.handleChange = this.handleChange.bind(this);
                this.handleClick = this.handleClick.bind(this);
            }

            handleClick(e){
               // console.log('handleClick =>',e.target.id);
                let me = this;
                let _searcher, searchTerm;
                [_searcher,searchTerm] = e.target.id.split(':');
                let searcher = this.searchers[_searcher];

                searcher.handleSearch(searchTerm).then((res) => {
                  //  console.log('Details');
                  //  console.log(res);
                    me.setState({searchRes : res});
                    me.setState({searchReady : false});
                    me.setState({searchDetailReady: true});
                })


            }

            handleChange(e){
                var me = this;
               let val = e.target.value;
               Object.keys(me.searchers).map((key) => {
                   me.searchers[key].search(val).then(function(fulfilled){
                    let _res = Object.assign({}, me.state.searchResults);
                    _res[key] = fulfilled;
                    me.setState({searchResults : _res});
                    me.setState({searchReady: true});
                   });
               }); 
            }

            
            /**
             *
             * @returns {XML}
             */
            render() {
               
                let k = ['matrikelnr']
               
                let searchRes = this.state.searchRes;

                if(this.state.searchReady){
                   // console.log('number > 0');
                   // console.log(this.state.searchResults);
                    //searchRes = <ul></ul>;
                    
                    // Move this part to search()
                    searchRes = <div>
                                  <h3>Adresser</h3> 
                                  <SearchList items={this.state.searchResults['dawa']}
                                              searcher = 'dawa'
                                              onAdd={this.handleClick}
                                   />
                                  <h3> Matrikler</h3>
                                  <SearchList items={this.state.searchResults['matrikel']}
                                              searcher = 'matrikel'
                                              onAdd={this.handleClick}
                                  />
                                </div>;  
                }

                return (
                    <div role="tabpanel">
                        <div className="panel panel-default">
                            <div className="panel-body">

                                <div className="form-group">

                                    <div className="btn-group">
                                        <input id="my-search" className="custom-search typeahead" type="text"
                                            placeholder="search" onChange={this.handleChange} onMouseEnter={this.handleChange}>
                                            
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