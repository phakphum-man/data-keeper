module.exports = function (app) {
	
    app.get('/users/:id', (req, res) => {
        // #swagger.tags = ['User']
        // #swagger.description = 'Endpoint get User.'
        // #swagger.parameters['id'] = { description: 'ID is required.' }

        /* #swagger.parameters['filtro'] = {
               in: 'query',
               description: 'filtro optional.',
               type: 'string'
        } */
        const filtro = req.query.filtro;
  
        if(false)
            return res.status(404).send(false);
      
        /* #swagger.responses[200] = { 
               schema: { $ref: "#/definitions/User" },
               description: 'expected result.' 
        } */
        return res.status(200).send(data);

    })

    app.post('/users', (req, res) => {
        /* #swagger.tags = ['User']
           #swagger.description = 'Create new user' */

        /* #swagger.parameters['newUser'] = {
               in: 'body',
               description: 'new data user information',
               required: true,
               schema: { $ref: "#/definitions/AddUser" }
        } */

        const newUser = req.body;

        if (true) {
            // #swagger.responses[201] = { description: 'Save success!' }
            return res.status(201).send(data);
        }
        return res.status(500);    // #swagger.responses[500]
    });

}