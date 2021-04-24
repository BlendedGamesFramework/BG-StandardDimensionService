const express = require('express');
const standard_attributes = express.Router();
import { testEnvironmentVariable } from '../settings.js';
import {postHost,getHost,sensorHost} from '../urls'

const fetch = require('node-fetch');

const wrap = fn => (...args) => fn(...args).catch(args[2])
const axios = require('axios').default;
var bodyParser =require('body-parser');

// create application/json parser
var jsonParser = bodyParser.json()


const math = require('mathjs')
const abc = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']

standard_attributes.get("/", (req,res) =>{
    res.status(200).json({ message: testEnvironmentVariable})
});
// PARA ESTE MICROSERVICIO SE NECESITA INGRESAR LOS DATOS DE LA SIGUIENTE MANERA:
/* Ejemplo de Json del Body para el POST
    {
    "id_player": 2,
    "nameat": "Resistencia",
    "namecategory": "Físico",
    "data": 1,
    "data_type": "in.off",
    "input_source": "xlr8_podometer",
    "date_time": "2019-05-16 13:17:17"
    }
*/
/*
Input:  
  var dataChanges ={  
        "id_player": getJob.id_player,   
        "sensor_endpoint_id_online_sensor": getJob.sensor_endpoint_id_online_sensor,
        "id_sensor_endpoint": getJob.id_sensor_endpoint,
        "watch_parameters":getJob.watch_parameters,                                             
        "data_changes": arrayChanges
    }
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
standard_attributes.post('/standard_attributes_apis', jsonParser, wrap(async(req,res,next) => { 
    var id_player = req.body.id_player
    var id_sensor_endpoint = req.body.id_sensor_endpoint
    // [2,20,4,0,0]
    var data_changes = req.body.data_changes
    // Ej: [['chess_blitz','records',win'], ['elo'],['puzzle_challenge','record'],['puzzle_rush'],['chess_rapid','record','win']]
    var watch_parameters = req.body.watch_parameters
    console.log(id_player)
    console.log(id_sensor_endpoint)
    console.log(data_changes)
    console.log(watch_parameters)
    console.log(typeof(id_player))
    console.log(typeof id_sensor_endpoint)
    console.log(typeof data_changes)
    console.log(typeof watch_parameters)
    var conversions_data = await getConversions(id_sensor_endpoint,data_changes,watch_parameters)
    
    //ids: Ej [2,5,8]
    var id_conversions = conversions_data.id_conversions

    //id_subattributes: Ej [1,4,7]
    var id_subattributes = conversions_data.id_subattributes

    //operations: Ej ['x+2','sqrt(x+5)','x/4']
    var operations = conversions_data.operations

    //new_data: Ej [2,20,4]
    var new_data = conversions_data.new_data

    console.log('conversions_data')
    console.log(conversions_data)
    //Ej [4,5,1]
    var results = conversionDataAttribute(operations,new_data)
    console.log('/n resultado del reemplazo')
    console.log(results)
    var adquired_subattributes ={  
        "id_player": id_player,        
        "id_sensor_endpoint": id_sensor_endpoint,
        "id_conversions": id_conversions,   
        "id_subattributes":id_subattributes,
        "new_data": results
    }

    postAdquiredSubattribute(adquired_subattributes)
    
    /*
    
     var actual_attributes_data ={  
        "id_attributes": Ej [1,1,2],        
        "new_data": Ej [4,5,1]
    }
    */

    var id_attributes = await getAttributesIds(id_subattributes)
    console.log("id_attributes")

    console.log(id_attributes)

    var new_attribute_experience = {
        "id_player":id_player,
        "id_attributes": id_attributes,       
        "new_data":results
    }


    putNewAttributesLevels(new_attribute_experience)
    res.status(200).json({ body: req.body })
}))
/*
Input:  Json of sensor data
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
async function postAdquiredSubattribute(adquired_subattributes){
    
    var options = {
        host : postHost,
        path: ('/adquired_subattribute_rt')       
    };
    var url = "http://"+options.host + options.path;
    console.log("URL "+url);
    // construct the URL to post to a publication
    const MEDIUM_POST_URL = url;
    
    var headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    };

    var options2 = {
        host : getHost,
        path: ('/subattribute_conversion_sensor_endpoint/'+adquired_subattributes.id_sensor_endpoint)     
    };
    var url2 = "http://"+options2.host + options2.path;
    console.log("URL "+url2);
    // construct the URL to post to a publication
    const MEDIUM_POST_URL2 = url2;

    var modifiedAdquired = {
        "id_conversions":adquired_subattributes.id_conversions,
        "id_subattributes":adquired_subattributes.id_subattributes
    }
    console.log("Im going to send this")
    console.log(JSON.stringify(modifiedAdquired))
    var subatt_conv_endpoint_relation;

    try {
        const response = await axios.post(MEDIUM_POST_URL2,modifiedAdquired)
        subatt_conv_endpoint_relation = response.data.id_subattributes_conversion_sensor_endpoint
        console.log("aqui va")
        console.log(subatt_conv_endpoint_relation)

    } catch (error) {
        console.log(error)
        
    }
    const adquired_subattribute_final = {
        "id_player":adquired_subattributes.id_player,
        "id_sensor_endpoint":adquired_subattributes.id_sensor_endpoint,
        "id_subattributes_conversion_sensor_endpoint":subatt_conv_endpoint_relation,
        "id_subattributes":adquired_subattributes.id_subattributes,
        "new_data":adquired_subattributes.new_data
    }
    console.log("Im going to post this")
    console.log(JSON.stringify(adquired_subattribute_final))
    try {
       
        const response = axios.post(MEDIUM_POST_URL, adquired_subattribute_final);
        console.log(response)
        
    } 
    catch (error) {
        console.error(error);
    } 
}

/*
Input:  

var new_attribute_experience = {
    "id_player":id_player,
    "id_attributes": actual_attributes_data.id_attributes,        
    "actual_data": actual_attributes_data.actual_data,
    "new_data":results
}

Ej:
var new_attribute_experience = {
        "id_player":1,
        "id_attributes": [1,1,2],        
        "actual_data": [20,20,40],
        "new_data":[4,5,1]
}
    
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
async function putNewAttributesLevels(new_attribute_experience){

    var updated_attributes = sumAttributeData(new_attribute_experience.id_attributes,new_attribute_experience.new_data)
    console.log('updated_attributes')
    console.log(updated_attributes)

    var options = {
        host : postHost,
        path: ('/player_attributes_rt')       
    };
    var url = "http://"+options.host + options.path;
    console.log("URL "+url);
    // construct the URL to post to a publication
    const MEDIUM_PUT_URL = url;
    let player_attributes = {
        "id_player":new_attribute_experience.id_player, //EJ: 1
        "id_attributes":updated_attributes.id_attributes// Ej: [1,4]
    }
    //Ej: [27,21]
    var updatedAttributes = await updateAttributeLevels(player_attributes,updated_attributes.new_data)
    console.log('updatedAttributes 2')
    console.log(updatedAttributes)
    var dataChanges ={  
        "id_player": new_attribute_experience.id_player,//[1]   
        //Ej: id_attributes = [3,4,6,7,10], distintos
        "id_attributes": updated_attributes.id_attributes,//[1]
        "new_data": updatedAttributes //[19]
    }
    console.log('last changes:')
    console.log(dataChanges)
    var headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    };

    try {
        const response = axios.put(MEDIUM_PUT_URL,dataChanges);
        console.log(response)
        
    } 
    catch (error) {
        console.error(error);
    } 
}

/*
Input:  Json of sensor data
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}
async function getConversions(id_sensor_endpoint,data_changes,watch_parameters){

    var changedParameters = []
    var new_data = []
    console.log('256')
    console.log(id_sensor_endpoint)
    console.log(data_changes)
    console.log(typeof(data_changes))
    data_changes.forEach((parameter,index) => {
            //Si no hubo cambio en el watch_parameter no se va a buscar su conversion
            if(parameter !== 0){
                let proper_watch_parameters = []
                if(watch_parameters[index].length === 1){
                        if(Number.isInteger(watch_parameters[index][0])){
                            proper_watch_parameters.push(watch_parameters[index][0].toString())
                        }
                        else if(isString(watch_parameters[index][0])){
                            proper_watch_parameters.push(watch_parameters[index][0])
                        }
                        else{
                            proper_watch_parameters.push('true')
                        }
                    }
                
                else{
                    for (const parameter of watch_parameters[index]) {
                        if(Number.isInteger(parameter)){
                            proper_watch_parameters.push(parameter.toString())
                        }
                        else if(isString(parameter)){
                            proper_watch_parameters.push(parameter)
                        }
                        else{
                            proper_watch_parameters.push('true')
                        }
                    }
                }
                
                changedParameters.push(proper_watch_parameters)
                new_data.push( data_changes[index])
              

            }
    });


    console.log(changedParameters);
    console.log(new_data);

    var options = {
        host : sensorHost,
        path: ('/conversions')       
    };
    var url = "http://"+options.host + options.path;
    console.log("URL "+url);
    // construct the URL to post to a publication
    const MEDIUM_POST_URL = url;
    try {
        const response = await axios.post(MEDIUM_POST_URL,{ id_sensor_endpoint:id_sensor_endpoint, parameters_watched: changedParameters})
        console.log('233')
        console.log(response.data)
        const data = response.data
        //Procesamiento de los rows entregados

        /*
         var results ={  
                "id_conversion": 2,   
                "id_subattributes": 2,
                "operations": 'x+2'
        } 
        */       
        
        //Procesar y result que se quiere: 
        var results = {

            "id_conversions":response.data.id_conversions,
            "id_subattributes": response.data.id_subattributes,
            "operations":  response.data.operations,
            "new_data": new_data

        }
        
        
        return results

        
    } 
    catch (error) {
        console.error(error);
    }
}
async function updateAttributeLevels(player_attributes,new_data){
   /*
   
   player_attributes = {id_player, id_attributes}
   */
    var options = {
        host : getHost,
        path: ('/player_attributes')       
    };
    var url = "http://"+options.host + options.path;
    const MEDIUM_GET_URL = url;
    
    var headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    };
    var dataChanges = {
        "id_player": player_attributes.id_player,
        "id_attributes": player_attributes.id_attributes
    }
    console.log('dataChanges in updateAttributeLevels')
    console.log(dataChanges)

    try {
        const response = await axios.post(MEDIUM_GET_URL,dataChanges)
        console.log('response')
        console.log(response.data)
         // Ej: attributes: [18,20]
         // EJ: new_data = [9,1]
        var attributes = response.data.attributes
        for (let i = 0; i < attributes.length; i++) {
            attributes[i]+= new_data[i]            
        }
        // => [27,21]
        return attributes
        
    } 
    catch (error) {
        console.error(error);
    }
}

/*
Input:  

"id_subattributes": Ej [5,2,1],   


Output: 

"id_attributes": [1,1,2] Ordenado de menor a mayor
Description: Calls the b-Games-ApirestPostAtt service 
*/
async function getAttributesIds(id_subattributes){
   
    var options = {
        host : getHost,
        path: ('/attributes_by_subattributes')       
    };
    var url = "http://"+options.host + options.path;
    const MEDIUM_GET_URL = url;
    
    var headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    };
    console.log('Esto es lo que me entro: ')
    console.log(id_subattributes)

    var dataChanges = {
        "id_subattributes": id_subattributes
    }

    try {
        const response = await axios.post(MEDIUM_GET_URL,dataChanges)
        // Ej: id_attributes: [1,1,2]
        var id_attributes = response.data.id_attributes
        console.log(`estos son los atributos`)
        console.log(id_attributes)
        return id_attributes
        
    } 
    catch (error) {
        console.error(error);
    }
}


function conversionDataAttribute(operations,data_changes){
    // operations Ej: ['x+2','sqrt(x+5)','x/4']
    // data_changes Ej: [2,20,4]
    var operation,data,node,code, eval_data, single_result;
    var results = []
    for (let i = 0; i < operations.length; i++) {
        operation = operations[i];
        data = data_changes[i];
        node = math.parse(operation)   // returns the root Node of an expression tree
        code = node.compile()        // returns {evaluate: function (scope) {...}}
        eval_data = {}

        if(Array.isArray(data)){
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                eval_data[abc[index]] = element
            }
        }
        else{
            eval_data['a'] = data
        }
        single_result = code.evaluate(eval_data)

        results.push(single_result) // returns result
    }
    //Ej [4,5,1]
    return results
}

/*

    "id_attributes": [1,1,2],        
    "new_data":[4,5,1]

     =>

    "new_data": [9,1]
 */
function sumAttributeData(id_attributes,new_data){

    let original_length = new_data.length
   
    //new_data e id_attributes poseen el mismo largo
    console.log('esto es lo que me entro de datos: ',new_data )
    console.log('Estos son los atributos: ',id_attributes )

    const distinct_ids = [...new Set(id_attributes)] // [1,1,1,2,3,3] => [1,2,3], distinct values (only primitive types)
    console.log('Este es el arreglo distinto de datos: ',distinct_ids )

    console.log('el largo de los resultados:', id_attributes.length)

    var id_aux = id_attributes[0]
    var index = 0

    var almost_results = new Array(id_attributes.length).fill(0);
    console.log('Este es el arreglo de almost_results: ', almost_results)

    for (let i = 0; i < id_attributes.length; i++) {
        if(id_aux !== id_attributes[i]){
            index++
            id_aux = id_attributes[i]
        }
        almost_results[index] += new_data[i];
        
    }

    console.log('este es el almost results: ',almost_results)
    let result = almost_results.filter(data => data !== 0)

    if(result.length === 0){
        //No hubo ningun cambio... (puede pasar con datos externos obtenidos desde dispositivos en ciertos casos)
        result = new Array(original_length).fill(0);
    }
    console.log('Este es el resultado final ',result )

    let result_object = {
        "id_attributes": distinct_ids,
        "new_data":result
    }
    return result_object
    
}


/*
Input:  Json of sensor data
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
standard_attributes.post('/StandardAttributes/', (req,res,next)=>{

    try {
        var post_data = req.body;
        if(!req.body.id_player || !req.body.id_player|| !req.body.nameat|| !req.body.namecategory|| !req.body.data|| !req.body.data_type|| !req.body.input_source|| !req.body.date_time){
            return res.sendStatus(400).json({
                error: 'Missing data'
            })
        }
        console.log(post_data);
        var id_player = Number(post_data.id_player);
        var nameat = post_data.nameat;
        var namecategory = post_data.namecategory;
        var dat = Number(post_data.data);
        var data_type = post_data.data_type;
        var input_source = post_data.input_source;
        var date_time = post_data.date_time;

        
        const data2 = JSON.stringify({
            id_player: id_player,
            nameat:nameat,
            namecategory:namecategory,
            data:dat,
            data_type:data_type,
            input_source:input_source,
            date_time:date_time
        })

        console.log(data2);

        var options = {
            host : postHost,
            path: ('/attributes/'),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data2),
            }
        };

        var data = 
        {
                id_player: Number(post_data.id_player),
                nameat: post_data.nameat,
                namecategory: post_data.namecategory,
                dat: Number(post_data.data),
                data_type: post_data.data_type,
                input_source: post_data.input_source,
                date_time:post_data.date_time
        };

        var url = "http://"+options.host + options.path;
        console.log("URL "+url);
        // construct the URL to post to a publication
        const MEDIUM_POST_URL = url;

        const response = fetch(MEDIUM_POST_URL, {
            method: "post",
            headers: {
                "Content-type": "application/json",
                "Accept": "application/json",
                "Accept-Charset": "utf-8"
                },
                body: JSON.stringify({
                    id_player: id_player,
                    nameat:nameat,
                    namecategory:namecategory,
                    data:dat,
                    data_type:data_type,
                    input_source:input_source,
                    date_time:date_time
                })
        })
        .then(res => res.json('Success'))
        .then(json => console.log("Response of API: "+json));

        const messageData = response;

        // the API frequently returns 201
        if ((response.status !== 200) && (response.status !== 201)) {
            console.error(`Invalid response status ${ response.status }.`);
            throw messageData;
        }else{

        }
    } catch (error) {
        next(error)
    }
    

})



export default standard_attributes;

