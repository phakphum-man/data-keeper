const splitFile = require('split-file');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

let rmdir = async (dirPath, options = {}) => {
    const
      { removeContentOnly = false, drillDownSymlinks = false } = options,
      { promisify } = require('util'),
      readdirAsync = promisify(fs.readdir),
      unlinkAsync = promisify(fs.unlink),
      rmdirAsync = promisify(fs.rmdir),
      lstatAsync = promisify(fs.lstat) // fs.lstat can detect symlinks, fs.stat can't
    let
      files
  
    try {
      files = await readdirAsync(dirPath)
    } catch (e) {
      throw new Error(e)
    }
  
    if (files.length) {
      for (let fileName of files) {
        let
          filePath = path.join(dirPath, fileName),
          fileStat = await lstatAsync(filePath),
          isSymlink = fileStat.isSymbolicLink(),
          isDir = fileStat.isDirectory()
  
        if (isDir || (isSymlink && drillDownSymlinks)) {
          await rmdir(filePath)
        } else {
          await unlinkAsync(filePath)
        }
      }
    }
  
    if (!removeContentOnly)
      await rmdirAsync(dirPath)
};

module.exports = function (app) {
	app.get('/file/split/:filename', (req, res, next) => {
        // #swagger.tags = ['File']
        // #swagger.description = 'split file.'

        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");
        const pathFile = `${rootPath}/servicefiles/`;

        if(fs.existsSync(`${pathFile}${req.params.filename}`)){
            
            const newPath = `${pathFile}${uuidv4()}`;
            if (!fs.existsSync(newPath)){
                fs.mkdirSync(newPath);
            }

            fs.rename(`${pathFile}${req.params.filename}`, `${newPath}/${req.params.filename}`, (error) => 
                splitFile.splitFileBySize(`${newPath}/${req.params.filename}`, 5120)
                .then((names) => {

                    fs.unlink(`${newPath}/${req.params.filename}`, (err) => {
                        if (err) throw err;
                    });

                    const data = Array.from(names).map((pathDownload) => ({ download : pathDownload.replace(pathFile,""), filename : req.params.filename}));
                    return res.status(200).send(data);
                })
                .catch(next)
            );
        }
        else
        {
            return res.status(404).send({ data: "File Not found!"});
        }
        /* #swagger.responses[200] = { 
               schema: { type: 'array' },
               description: 'expected result.' 
        } 
            #swagger.responses[404] = { 
               schema: { data: 'string' },
               description: 'File not found.' 
        }
        */
    });

    app.get('/file/:name', (req, res) => {
        // #swagger.tags = ['File']
        // #swagger.description = 'Endpoint download file.'
        // #swagger.parameters['name'] = { type: 'string', description: 'name is required.' }

        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");

        const sourcefile = `${rootPath}/servicefiles/${req.params.name}`;

        /* #swagger.responses[200] = { 
               description: 'File Content.' 
        } */
        return res.download(sourcefile);
    });
    
    app.get('/file/delete/:pathfile', async (req, res) => {
        // #swagger.tags = ['File']
        // #swagger.description = 'clear temp files.'

        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");
        const pathFile = `${rootPath}/servicefiles/`;

        const filename = path.basename(req.params.pathfile);
        const dirTarget = req.params.pathfile.replace(`/${filename}`, "");
        await rmdir(`${pathFile}${dirTarget}`)

        return res.status(200).send({message: "success"});
        /* #swagger.responses[200] = { 
               schema: { message: 'success' },
               description: 'expected result.' 
        } */
    });
}