require('dotenv').config()
const {validateInput} = require('./core/preProcessor')
const processor = require('./core/transform')

let $arguments = validateInput(process.argv)
if(!$arguments ) {
    console.log('') 
} else {
    processor.uploadData($arguments).then(($output:any) =>{
        console.log($output)
    }).catch((error:any)=>{
        console.log(error)
    })
}











