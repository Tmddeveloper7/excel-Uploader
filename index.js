require('dotenv').config()
const {validateInput} = require('./core/preProcessor')
const processor = require('./core/transform')

let $arguments = validateInput(process.argv)
if(!$arguments ) {
    return 
} else {
    processor.uploadData($arguments).then($output =>{
        console.log($output)
    }).catch(error=>{
        console.log(error)
    })
}











