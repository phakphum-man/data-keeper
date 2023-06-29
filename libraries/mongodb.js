require('dotenv').config();
const { MongoClient, MongoServerError } = require('mongodb');

let client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true })

const getFields = (select = []) =>{
    let fields = select.reduce((field,name)=> (field[name] = 1,field),{});
    if(select.indexOf("_id") < 0){
        fields["_id"] = 0;
    }
    return fields;
}

async function get(collectionName, select = [], filter = {}){
    let findResult = null;
    try
    {
        await client.connect();
        const collection = client.db().collection(collectionName);

        if(select.length == 0){
            findResult = await collection.findOne(filter).toArray();
        }else{
            findResult = await collection.findOne(filter).project(getFields(select)).toArray();
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    finally
    {
        await client.close();
    }
    return findResult;
}

async function getAll(collectionName, select = [], filter = {}){
    let findResult = null;
    try
    {
        await client.connect();
        const collection = client.db().collection(collectionName);

        if(select.length == 0){
            findResult = await collection.find(filter).toArray();
        }else{
            findResult = await collection.find(filter).project(getFields(select)).toArray();
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    finally
    {
        await client.close();
    }
    return findResult;
}

async function getAllWithSort(collectionName, sort = {}, select = [], filter = {}, limit = null){
    let findResult = null;
    try
    {
        await client.connect();
        const collection = client.db().collection(collectionName);

        if(limit == null){
            if(select.length == 0){
                findResult = await collection.find(filter).sort(sort).toArray();
            }else{
                findResult = await collection.find(filter).sort(sort).project(getFields(select)).toArray();
            }
        }else{
            if(select.length == 0){
                findResult = await collection.find(filter).sort(sort).limit(limit).toArray();
            }else{
                findResult = await collection.find(filter).sort(sort).limit(limit).project(getFields(select)).toArray();
            }
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    finally
    {
        await client.close();
    }
    return findResult;
}

async function getAggregate(collectionName, document = []){
    let findResult = null;
    try
    {
        await client.connect();
        const collection = client.db().collection(collectionName);

        if(document.length > 0){
            findResult = await collection.aggregate(document).toArray();
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    finally
    {
        await client.close();
    }
    return findResult;
}

async function insert(collectionName = "", data = { _id : "4bcb9ac3-8de1-4330-9f08-f0046774f7ad", message : "test message"}){
    let insertResult = null;
    try
    {
        await client.connect();
        const collection = client.db().collection(collectionName);
        insertResult = await collection.insertOne(data);
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    finally
    {
        await client.close();
    }
    return insertResult;
}

async function insertArray(collectionName, data = [{ _id : "4bcb9ac3-8de1-4330-9f08-f0046774f7ad", message : "test message"}]){
    let insertResult = null;
    try
    {
        await client.connect();
        const collection = client.db().collection(collectionName);
        insertResult = await collection.insertMany(data);
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    finally
    {
        await client.close();
    }
    return insertResult;
}

async function update(collectionName = "", filter = { _id : "4bcb9ac3-8de1-4330-9f08-f0046774f7ad"}, data = { message : "test message"}){
    let updateResult = null;
    try
    {
        await client.connect();
        const collection = client.db().collection(collectionName);
        updateResult = await collection.updateOne(filter, { $set: data });
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    finally
    {
        await client.close();
    }
    return updateResult;
}

async function updateMany(collectionName = "", filter = { _id : "4bcb9ac3-8de1-4330-9f08-f0046774f7ad"}, data = { message : "test message"}){
    let updateResult = null;
    try
    {
        await client.connect();
        const collection = client.db().collection(collectionName);
        updateResult = await collection.updateMany(filter, { $set: data });
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    finally
    {
        await client.close();
    }
    return updateResult;
}

async function deleteOne(collectionName = "", filter = { _id : "4bcb9ac3-8de1-4330-9f08-f0046774f7ad"}){
    let deleteResult = null;
    try
    {
        await client.connect();
        const collection = client.db().collection(collectionName);
        deleteResult = await collection.deleteOne(filter);
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    finally
    {
        await client.close();
    }
    return deleteResult;
}

async function deleteMany(collectionName = "", filter = { _id : "4bcb9ac3-8de1-4330-9f08-f0046774f7ad"}){
    let deleteResult = null;
    try
    {
        await client.connect();
        const collection = client.db().collection(collectionName);
        deleteResult = await collection.deleteMany(filter);
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    finally
    {
        await client.close();
    }
    return deleteResult;
}

module.exports = {
    get,
    getAll,
    getAllWithSort,
    getAggregate,
    insert,
    insertArray,
    update,
    updateMany,
    deleteOne,
    deleteMany
};