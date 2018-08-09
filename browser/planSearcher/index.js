'use strict';

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');;

var ReactDOM = require('react-dom');

import Business from '@material-ui/icons/Business';
var cloud;

var layerGroup = L.layerGroup();

var utils;

var mapObj;

var exId = "planSearch";

var config = require('../../../../config/config.js');

var mainSearch;


class SearchItem extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        let liStyle= {
            padding:'4px 16px'
        };
        return <a style={liStyle} id={this.props.searcher+':'+this.props.value} href="#" className="list-group-item">                           
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

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        mapObj = cloud.get().map;
        mainSearch = o.extensions.mainSearch.index;

         mainSearch.registerSearcher({
           key: 'Lokalplaner',
           obj: {'searcher': this,'title':'Lokalplaner', 'icon':<Business/>}
       });  
    },

    init: function(){
        let me = this;
    },


    search: function(searchTerm){
        let url = 'https://ballerup.mapcentia.com/api/v2/elasticsearch/search/collector/snit_plansearch/lokalplan';
        let query = `{
            "_source":{
              "excludes":[
                "properties.document"
              ]
            },
            "size":100,
            "query":{
              "match":{
                "properties.document": "${searchTerm}"
              }
            }
          }`;
        return new Promise(function(resolve, reject){
            $.post(url, query,function(data){
                let res = data.hits.hits.map((item) => {
                    let it = item['_source']['properties']; 
                    return {'title': it.plannavn, 
                            'id': it.planid, 
                            'icon': <Business/>
                        };
                });
                resolve(res);
                },'json'); 
        });
        
    },

    handleSearch: function(searchTerm){
        let url = `https://ballerup.mapcentia.com/api/v1/sql/collector?q=SELECT plannr, plannavn, doklink, anvendelsegenerel, 
                   the_geom from snit_plansearch.lokalplan_geom where planid =${searchTerm}&srs=4326`;
        return new Promise(function(resolve, reject){

            $.getJSON(url,function(data){
                let geom = data.features[0].geometry;
                console.log(geom);
                let properties = data.features[0].properties;
                let layer = L.geoJson(geom,{
                    "color": "blue",
                    "weight": 1,
                    "opacity": 1,
                    "fillOpacity": 0.1,
                    "dashArray": '5,3'
                });
    
                layerGroup.clearLayers();
                console.log(layer);
                layerGroup.addLayer(layer).addTo(mapObj);
                mapObj.fitBounds(layer.getBounds());
               let comp = <div>
                   <ul className="list-group">
                    <li className="list-group-item">Plannavn : {properties.plannavn}</li>
                    <li className="list-group-item">Plannr   : {properties.plannr}</li>
                    <li className="list-group-item">Anvendelse: {properties.anvendelsegenerel}</li>
                    <li className="list-group-item">
                        <a href={properties.doklink} target="_blank" >Plandokument</a>
                    </li>
                 </ul>
               </div>;
               resolve(comp);
            })
        });
     //   console.log(searchTerm);
    }
}