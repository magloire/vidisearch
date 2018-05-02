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

var mainSearch = require('../../mainSearch/browser/index.js');

var crss = {
    "from" : "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs",
    "to"   : "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
};

class AdresseItem extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        let liStyle= {
            padding:'4px 16px'
        }; 
       return <a id={this.props.hrf} style={liStyle} href="#" className="list-group-item">
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
        let map = cloud.get().map;
       // console.log(this.state.items);
        let items = this.state.items.filter((item) => {
           // console.log(item.hrf);
            return item.href === e.target.id;
        });
        this.setState({items : items});
        $.getJSON(e.target.id, function(data){
            let coords = data.adgangspunkt.koordinater;
            coords = [coords[1],coords[0]];
          //  console.log(coords);
            var marker = L.marker(coords).addTo(mapObj);
            mapObj.setView(coords,17);
        });
    }

    render(){
        const items = this.state.items;
        let me = this;
        const searchItems = items.map((item) => {
            return <AdresseItem key={item.tekst.toString()} hrf={item.href} value={item.tekst}/>
        });

        return (
            <div onClick={this.handleClk} className="list-group">{searchItems}</div>
        );
    }
}

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        backboneEvents = o.backboneEvents;
        mapObj = cloud.get().map;

    },

    init: function(){
        let me = this;
        mainSearch.registerSearcher({
            key: 'dawa',
            obj: {'searcher': this,'title':'Adresser'}
        });
    },
    test: function(){
        console.log('hello from dawaSearcher');
    },

    search: function(searchTerm){
        if(searchTerm){
            searchTerm = searchTerm + '*';
        }
        let url = `https://dawa.aws.dk/vejnavne?q=${searchTerm}&side=1&per_side=100&kommunekode=151|159|163|240|161`;
       
       return new Promise(function(resolve, reject){
           $.getJSON(url, function(data){
                let res = data.map((item, index) => {
                    let it = item.navn + " " 
                    + ((item.postnumre[0]/* && item.postnumre[0]['nr']*/)? item.postnumre[0]['nr']:'') 
                    + " " 
                    + ((item.postnumre[0]/* && item.postnumre[0]['navn']*/)? item.postnumre[0]['navn']: '');
               return {'title' : it, 'id': it};
                });
                resolve([...new Set(res)]);
           });
        })
    },

    handleSearch: function(searchTerm){
        let temp,postnr = '', navn = '';
        temp = searchTerm.split(" ").slice(0,-1);
        postnr = temp.pop();
        navn = temp.join(" ");
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
}