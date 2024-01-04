const got = require('got');
const path = require('path');
const csv = require('csv-parser');
const { fakerTH : faker} = require('@faker-js/faker');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvStringifier;


// Function to generate fake data using faker.js
function generateFakeData(targets) {
    let data = {};
    for (var i = 0; i < targets.length; i++) {
        switch (targets[i]){
            case '$avatar':
                data[i] = faker.internet.avatar();
                break;
            case '$domainName':
                data[i] = faker.internet.domainName();
                break;
            case '$domainWord':
                data[i] = faker.internet.domainWord();
                break;
            case '$domainSuffix':
                data[i] = faker.internet.domainSuffix();
                break;
            case '$prefix':
                data[i] = faker.person.prefix();
                break;
            case '$fullname':
                data[i] = faker.person.fullName();
                break;
            case '$firstName':
                data[i] = faker.person.firstName();
                break;
            case '$lastName':
                data[i] = faker.person.lastName();
                break;
            case '$sex':
                data[i] = faker.person.sex();
                break;
            case '$gender':
                data[i] = faker.person.gender();
                break;
            case '$jobArea':
                data[i] = faker.person.jobArea();
                break;
            case '$jobDescriptor':
                data[i] = faker.person.jobDescriptor();
                break;
            case '$jobTitle':
                data[i] = faker.person.jobTitle();
                break;
            case '$jobType':
                data[i] = faker.person.jobType();
                break;
            case '$displayName':
                data[i] = faker.internet.displayName();
                break;
            case '$emoji':
                data[i] = faker.internet.emoji();
                break;
            case '$email':
                data[i] = faker.internet.email();
                break;
            case '$exampleEmail':
                data[i] = faker.internet.exampleEmail();
                break;
            case '$phoneImei':
                data[i] = faker.phone.imei();
                break;
            case '$phoneNumber':
                data[i] = faker.phone.number();
                break;
            case '$userName':
                data[i] = faker.internet.userName();
                break;
            case '$password':
                data[i] = faker.internet.password();
                break;
            case '$streetAddress':
                data[i] = faker.location.streetAddress();
                break;
            case '$street':
                data[i] = faker.location.street();
                break;
            case '$streetName':
                data[i] = faker.location.streetName();
                break;
            case '$cityName':
                data[i] = faker.location.cityName();
                break;
            case '$city':
                data[i] = faker.location.city();
                break;
            case '$country':
                data[i] = faker.location.country();
                break;
            case '$state':
                data[i] = faker.location.state();
                break;
            case '$zipCode':
                data[i] = faker.location.zipCode();
                break;
            case '$timeZone':
                data[i] = faker.location.timeZone();
                break;
            case '$latitude':
                data[i] = faker.longitude.latitude();
                break;
            case '$longitude':
                data[i] = faker.longitude.latitude();
                break;
            case '$ip':
                data[i] = faker.internet.ip();
                break;
            case '$ipv4':
                data[i] = faker.internet.ipv4();
                break;
            case '$ipv6':
                data[i] = faker.internet.ipv6();
                break;
            case '$macAddress':
                data[i] = faker.internet.mac();
                break;
            case '$port':
                data[i] = faker.internet.port();
                break;
            case '$protocol':
                data[i] = faker.internet.protocol();
                break;
            case '$url':
                data[i] = faker.internet.url();
                break;
            case '$userAgent':
                data[i] = faker.internet.userAgent();
                break;
            case '$nearbyGPSCoordinate':
                data[i] = faker.internet.nearbyGPSCoordinate();
                break;
            case '$ordinalDirection':
                data[i] = faker.internet.ordinalDirection();// 'Northeast'
                break;
            case '$lines':
                data[i] = faker.lorem.lines();// 'Soluta deserunt eos quam reiciendis libero autem enim nam ut.
                break;
            case '$paragraph':
                data[i] = faker.lorem.paragraph();// Non architecto nam unde sint. Ex tenetur dolor facere optio aut consequatur. Ea laudantium reiciendis repellendus.'
                break;
            case '$slug':
                data[i] = faker.lorem.slug();// 'dolores-illo-est'
                break;
            case '$text':
                data[i] = faker.lorem.text();// 'Doloribus autem non quis vero quia.'
                break;
            case '$word':
                data[i] = faker.lorem.word();// 'temporibus'
                break;
            case '$words':
                data[i] = faker.lorem.words();// 'qui praesentium pariatur'
                break;
            case '$bigInt':
                data[i] = faker.number.bigInt();// 55422n
                break;
            case '$binary':
                data[i] = faker.number.binary(255);// '110101'
                break;
            case '$float':
                data[i] = faker.number.float();// 0.5688541042618454
                break;
            case '$hex':
                data[i] = faker.number.hex(255);// '9d'
                break;
            case '$int':
                data[i] = faker.number.int(255);// '2900970162509863'
                break;
            case '$alpha(10)':
                data[i] = faker.random.alpha(10);// 'qccrabobaf'
                break;
            case '$alphaNumeric(10)':
                data[i] = faker.random.alphaNumeric(10);// '3e5v7h5o6'
                break;
            case '$numeric(10)':
                data[i] = faker.random.numeric(10);// '3150731507'
                break;
            case '$randomWords':
                data[i] = faker.random.words();
                break;
            case '$unit':
                data[i] = faker.science.unit();
                break;
            case '$cron':
                data[i] = faker.system.cron();
                break;
            case '$directoryPath':
                data[i] = faker.system.directoryPath();
                break;
            case '$filePath':
                data[i] = faker.system.filePath();
                break;
            case '$fileName':
                data[i] = faker.system.fileName({ extensionCount: 2 });
                break;
            case '$fileExt':
                data[i] = faker.system.fileExt();
                break;
            case '$fileType':
                data[i] = faker.system.fileType();
                break;
            case '$mimeType':
                data[i] = faker.system.mimeType();
                break;
            case '$color':
                data[i] = faker.vehicle.color();
                break;
            case '$manufacturer':
                data[i] = faker.vehicle.manufacturer();
                break;
            case '$model':
                data[i] = faker.vehicle.model();// 'Explorer'
                break;
            case '$vehicleType':
                data[i] = faker.vehicle.type();// 'Coupe'
                break;
            case '$vehicle':
                data[i] = faker.vehicle.vehicle();// 'BMW Explorer'
                break;
            case '$vin':
                data[i] = faker.vehicle.vin();// 'YV1MH682762184654' (vehicle identification number)
                break;
            case '$vrm':
                data[i] = faker.vehicle.vrm();// 'MF56UPA' (vehicle registration number)
                break;
            default:
                faker.helpers.fake(targets[i]);// 'Hi, my name is {{person.firstName}} {{person.lastName}}!
        }
    }
    return data;
}

// Function to parse the parameters and generate the data
async function generateAndWriteCSV(numRecords, url, filename) {

    let results = [];
    const sourcefile = new Promise((resolve, reject) => {
        got.stream(url).pipe(csv())
            .on('data', (data) => results.push(data))
            .on('error', (error) => reject(error))
            .on('end', () => {
                if (results.length > 0) {
                    let records = [];
                    const headers = Object.keys(results[0]).map(header => ({ id: header, title: header }));
                    const fields = Object.values(results[0]);

                    for (let i = 0; i < numRecords; i++) {
                        const record = {};
                        const fake = generateFakeData(fields);
                        headers.forEach((header, i) => {
                            record[header.id] = fake[i];
                        });
                        records.push(record);
                    }

                    const csvStringifier = createCsvWriter({
                        header: headers
                    });

                    const h = csvStringifier.getHeaderString();
                    const c = csvStringifier.stringifyRecords(records);
                    const data = `${h}${c}`;
                    const fileOutput = path.join((process.env.NODE_ENV !== 'production')?'./mnt':'/mnt','servicefiles', `${filename}`);
                    fs.writeFileSync(`${fileOutput}`, data, 'utf8');
                    resolve(fileOutput);
                }
            });
    });
    return await sourcefile;
}

module.exports = { generateAndWriteCSV };