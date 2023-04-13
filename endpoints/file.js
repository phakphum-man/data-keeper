const splitFile = require('split-file');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

module.exports = function (app) {
	app.get('/file/split/:filename', (req, res, next) => {
        // #swagger.tags = ['File']
        // #swagger.description = 'split file.'
        const path = `${__dirname}/../servicefiles/`;
        const newPath = `${path}${uuidv4()}`;
        if (!fs.existsSync(newPath)){
            fs.mkdirSync(newPath);
        }

        fs.rename(`${path}${req.params.filename}`, `${newPath}/${req.params.filename}`, (error) => 
            splitFile.splitFileBySize(`${newPath}/${req.params.filename}`, 5120)
            .then((names) => {

                fs.unlink(`${newPath}/${req.params.filename}`, (err) => {
                    if (err) throw err;
                });


                const data = Array.from(names).map((element) => element.replace(`${path}/`,""));
                return res.status(200).send(data);
            })
            .catch(next)
        );

        
        /* #swagger.responses[200] = { 
               schema: { type: 'array' },
               description: 'expected result.' 
        } */
    });

    app.get('/file/:name', (req, res) => {
        // #swagger.tags = ['File']
        // #swagger.description = 'Endpoint download file.'
        // #swagger.parameters['name'] = { type: 'string', description: 'name is required.' }
        const sourcefile = `${__dirname}/../servicefiles/${req.params.name}`;

        /* #swagger.responses[200] = { 
               description: 'File Content.' 
        } */
        return res.download(sourcefile);
    });
    /*
    [
        "29571a25-9bf0-476c-a3f5-6eeadb91c38c/krungsriproperty_home2023-04-13.xlsx.sf-part1",
        "29571a25-9bf0-476c-a3f5-6eeadb91c38c/krungsriproperty_home2023-04-13.xlsx.sf-part2",
        "29571a25-9bf0-476c-a3f5-6eeadb91c38c/krungsriproperty_home2023-04-13.xlsx.sf-part3",
        "29571a25-9bf0-476c-a3f5-6eeadb91c38c/krungsriproperty_home2023-04-13.xlsx.sf-part4",
        "29571a25-9bf0-476c-a3f5-6eeadb91c38c/krungsriproperty_home2023-04-13.xlsx.sf-part5",
        "29571a25-9bf0-476c-a3f5-6eeadb91c38c/krungsriproperty_home2023-04-13.xlsx.sf-part6",
        "29571a25-9bf0-476c-a3f5-6eeadb91c38c/krungsriproperty_home2023-04-13.xlsx.sf-part7",
        "29571a25-9bf0-476c-a3f5-6eeadb91c38c/krungsriproperty_home2023-04-13.xlsx.sf-part8"
    ]
    */
}