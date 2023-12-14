const fs = require('fs')
const validateInput = ($arguments) =>{

    const tableName =$arguments[2]
    const fileName = $arguments[3]
    let $success=true
    if(!tableName || !fileName) {
        console.error('Missing arguments.. Please give TableName and FileName')
        $success=false
    }
    console.log(`Checking file in the path..${process.env.DATAFILES}/${fileName}`)
    if(!fs.existsSync(`${process.env.DATAFILES}/${fileName}.xlsx`)) {
        console.log('Missing file in the path..')
        $success=false
    }
    if($success) {
        return {tableName,fileName}
    } else {
        return null
    }
}

module.exports = {validateInput}