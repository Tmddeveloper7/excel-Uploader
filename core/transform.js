const db = require('../database/mysql-db')
const readExcel = require('simple-excel-to-json')
const camelcaseObjectDeep = require('camelcase-object-deep');
const _ = require('lodash')
var moment = require('moment')
var model = require('./foreignReferences')


const getTableSchema = async ($tableName) => {
    let $sql = {
        statement: `SELECT * FROM information_schema.columns WHERE table_name='${$tableName}'`
    }
    let $resultSet = await db.getResultSet($sql)
    // console.log(parser($resultSet.data, 'columns'),'resulttttttttttttt')
    return await parser($resultSet.data, 'columns')
}
const getId = async ($column, $referencedTable, $referencedColumnName, $value) => {
    let $sql = {
        statement: `SELECT * FROM ${$referencedTable} WHERE ${$column}='${$value}'`
    }
    let $resultSet = await db.getResultSet($sql)
    if ($resultSet.data.length > 0) {
        $resultSet = await parser($resultSet.data, $referencedTable)
        return $resultSet[0][$referencedColumnName]
    } else {
        return false
    }
}
const checkDuplicates = async ($tableName, $columnName, $value) => {
    let $sql = {
        statement: `SELECT * FROM ${$tableName} WHERE ${$columnName}='${$value}'`
    }
    let $resultSet = await db.getResultSet($sql)

    if ($resultSet.data.length > 0) {
        return true
    } else {
        return false
    }
}

const getForeignKeys = async ($tableName) => {
    let $sql = {
        statement: `SELECT * FROM information_schema.KEY_COLUMN_USAGE WHERE table_name='${$tableName}'`
    }
    let $resultSet = await db.getResultSet($sql)
    return await parser($resultSet.data, 'KEY_COLUMN_USAGE')
}

const getExcel = ($fileName) => {

    //console.log($fileName)
    let $data = readExcel.parseXls2Json($fileName);
    return $data[0]
}

const insertTable = async ($tableName, $data) => {
    let $sql = {
        statement: `Insert into ${$tableName} SET ? `,
        options: { "values": $data, "data": {} }
    }
    let $resultSet = await db.insert($sql)
    return $resultSet
}
const parser = async ($rawData, $group) => {
    let $data = [];
    let $total = 0;
    let $i;
    let $keys = [];
    if (!$group) { $group = '#' }
    if ($rawData) {
        $total = $rawData.length;
        for ($i = 0; $i < $total; $i++) {
            let $row = {};
            $keys = Object.keys($rawData[$i]);
            //console.log($keys)
            for (let $k = 0; $k < $keys.length; $k++) {
                let key = $keys[$k]
                if (key == $group) {
                    $row = $rawData[$i][key]
                } else if (key == $group) {
                    $row = $rawData[$i][key]
                } else if (key == '') {
                    $row = Object.assign($row, $rawData[$i][key])
                } else {
                    $row[key] = $rawData[$i][key];
                }
            };

            $data.push(camelcaseObjectDeep($row));
            //  console.log($row)
        }
    }
    //console.log('After Parsing',$data)
    return $data
}
const transformData = async ($tableName, $columnList, $foreignKeys, $excelData, $index) => {
    let $data = {}
    let $columns = _.map($columnList, 'columnName')
    let $foreignKeyColumns = _.map($foreignKeys, 'columnName')
    let $keys = Object.keys($excelData)
    let $duplicateKey = false
    let $errors = []
    console.log($keys,'keysssssss')
    for (let $key of $keys) {
        if ($columns.indexOf($key) >= 0) {
            if ($foreignKeyColumns.indexOf($key) >= 0) {
                // console.log('Foreign key found', $key)
                let $constraints = _.filter($foreignKeys, { "columnName": $key })
                // console.log($constraints)
                for (let $constraint of $constraints) {
                    if ($constraint.constraintName == 'PRIMARY') {
                        let $duplicate = await checkDuplicates($tableName, $key, $excelData[$key])
                        if ($duplicate) {
                            $duplicateKey = true
                            $errors.push('Duplicate value')
                        }
                        $data[$key] = $excelData[$key]
                    } else if ($constraint.referencedTableName) {
                        console.log(model[$key],$key,'keyyyyyyyyyyyyyy')
                        $excelData[$key] =  typeof $excelData[$key] === 'string' ? $excelData[$key] : JSON.stringify($excelData[$key])
                        if ($excelData[$key] instanceof String || typeof $excelData[$key] == 'string') {
                            let $id = await getId(model[$key], $constraint.referencedTableName, $constraint.referencedColumnName, $excelData[$key])
                            if (!$id) {
                                $errors.push(`Missing Reference Column value '${$excelData[$key]}' in ${$constraint.referencedTableName}.${$constraint.referencedColumnName} @ rownum=${$index}`)
                            } else {
                                $data[$key] = $id
                            }
                        } else {
                            let $found = await checkExistence($tableName, $key, $excelData[$key])
                            if (!$found) {
                                $errors.push('Missing Reference Column id')
                            }
                        }
                    }
                }
            } else {
                //  console.log($key,$excelData[$key],'jdfjjdddddddddddd')
                if ($key == 'created_by') {
                    $data[$key] = $excelData[$key] ? $excelData[$key] : 0
                }
                else if ($key == 'modified_by') {
                    $data[$key] = $excelData[$key] ? $excelData[$key] : 0
                }
               
                else if ($key == 'po_date') {
                    const secondsInADay = 86400; // 60 seconds * 60 minutes * 24 hours
                    const date = new Date(($excelData[$key]- 25569) * secondsInADay * 1000);
                    $data[$key] = moment(date).format('YYYY/MM/DD')
                }
                else if ($key == 'start_date') {
                    const secondsInADay = 86400; 
                    const date = new Date(($excelData[$key]- 25569) * secondsInADay * 1000);
                    $data[$key] = moment(date).format('YYYY/MM/DD')
                }
                else if ($key == 'end_date') {
                    const secondsInADay = 86400; 
                    const date = new Date(($excelData[$key]- 25569) * secondsInADay * 1000);
                    $data[$key] = moment(date).format('YYYY/MM/DD')
                }
                else if ($key == 'deleted_by') {
                    $data[$key] = $excelData[$key] ? $excelData[$key] : null
                }
                else if ($key == 'created_at') {
                    $data[$key] = $excelData[$key] ? $excelData[$key] : new Date()
                }
                else if ($key == 'modified_at') {
                    $data[$key] = $excelData[$key] ? $excelData[$key] : new Date()
                }
                else if ($key == 'deleted_at') {
                    $data[$key] = $excelData[$key] ? $excelData[$key] : null
                }
                else {
                    $data[$key] = $excelData[$key] ? $excelData[$key] : null
                }
            }
        }
    }
    return { data: $data, errors: $errors }
}
const uploadData = async ($args) => {
    const $schema = await getTableSchema($args.tableName)
    const $foreignKeys = await getForeignKeys($args.tableName)
    console.log($foreignKeys,'foreifgnnnnnnnn')
    const $excelData = await getExcel(`${process.env.DATAFILES}/${$args.fileName}.xlsx`)
    console.log($excelData,'excelllllll')
    let $index = 1
    for (let $row of $excelData) {
        let $response = await transformData($args.tableName, $schema, $foreignKeys, $row, $index)
        if ($response.errors.length > 0) {
            console.log($response.errors)
            break;
        }
        else {
            console.log($response,'resss')
            const res = await insertTable($args.tableName, $response.data)
            console.log(res, 'dataaaaaaaaaaaaaa')
        }
        $index++
        //  console.log($data)
    }
    return 'done'
}

module.exports = { uploadData }