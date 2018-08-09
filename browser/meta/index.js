'use strict';

/**
 *
 * @type {*|exports|module.exports}
 */
var urlparser = require('../../../../browser/modules/urlparser');

/**
 * @type {string}
 */
var db = urlparser.db;

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');

var ReactDOM = require('react-dom');

import SvgIcon from '@material-ui/core/SvgIcon';
import Business from '@material-ui/icons/Business';

var cloud;

var layerGroup = L.layerGroup();

var utils;

var mapObj;

var legend;

var showdown = require('showdown');
var converter = new showdown.Converter();

var exId = "meta";

var config = require('../../../../config/config.js');

var mainSearch;

var items = {};

function LayerIcon(props){
    return <SvgIcon {...props}>
        <path fill="#000000" d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z" />
    </SvgIcon>;
}

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        legend = o.legend;
        mapObj = cloud.get().map;
        mainSearch = o.extensions.mainSearch.index;
        
        let me = this;
        mainSearch.registerSearcher({
            key: 'Temaer',
            obj: {'searcher': this, 'title': 'Temaer','icon':<LayerIcon/>}
        });
    },

    init: function () {
    },

    search: function (searchTerm) {
        let url = config.gc2.host + '/api/v2/elasticsearch/search/' + db + '/settings/geometry_columns_view';
        let query = {
            "size": 100,
            "query": {
                "bool": {
                    "should": [
                        {
                            "term": {
                                "properties.f_table_name": searchTerm
                            }
                        }, {
                            "term": {
                                "properties.f_table_title": searchTerm
                            }
                        }, {
                            "term": {
                                "properties.f_table_abstract": searchTerm
                            }
                        },
                        {
                            "term": {
                                "properties.tags": searchTerm
                            }
                        },
                        {
                            "term": {
                                "properties.meta.meta_desc": searchTerm
                            }
                        }
                    ],

                    "minimum_should_match": 1,

                    "filter": [{
                        "term": {
                            "properties.meta.layer_search_include": true
                        }
                    }]
                }
            }
        };

        return new Promise(function (resolve, reject) {
            $.post(url, JSON.stringify(query), function (data) {
                let res = data.hits.hits.map((item) => {
                    let it = item['_source']['properties'];
                    items[it._key_] = item['_source'];
                    return {
                        'title': (it.f_table_title || it.f_table_name), 
                        'id': it._key_,
                        'icon': <LayerIcon/>
                    };
                });
                resolve(res);
            }, 'json');
        });

    },

    handleSearch: function (searchTerm) {

        return new Promise(function (resolve, reject) {

            let properties = items[searchTerm].properties, html, meta, name, title, abstract, layerId;

            meta = properties.meta;
            name = properties.f_table_name;
            title = properties.f_table_title || properties._key_;
            abstract = properties.f_table_abstract;
            html = (meta !== null
                && typeof meta.meta_desc !== "undefined"
                && meta.meta_desc !== "") ?
                converter.makeHtml(meta.meta_desc) : abstract;
            layerId = searchTerm.split(".")[0] + "." + searchTerm.split(".")[1];

            moment.locale('da');

            for (let key in properties) {
                if (properties.hasOwnProperty(key)) {
                    if (key === "lastmodified") {
                        properties[key] = moment(properties[key]).format('LLLL');
                    }
                }
            }

            html = html ? Mustache.render(html, properties) : "";

            let comp =
                <div>
                    <h3 className="content" dangerouslySetInnerHTML={{__html: title || name}}></h3>
                    <div className="content" dangerouslySetInnerHTML={{__html: html}}></div>
                    <div>
                        <li className='list-group-item'>
                            <div className='checkbox'><label><input type='checkbox' data-gc2-id={layerId}/>{title}
                            </label></div>
                        </li>
                    </div>
                </div>

            resolve(comp);
        });
    }
};

class Tags extends React.Component {
    render() {
        var items = this.props.items.map((item, index) => {
            return (
                <li key={index.toString()} style={{
                    color: "white",
                    background: "#03a9f4",
                    display: "inline-block",
                    padding: "2px",
                    margin: "2px"
                }}> {item} </li>
            );
        });
        return (
            <ul style={{listStyleType: "none"}} className="list-group"> {items} </ul>
        );
    }
}